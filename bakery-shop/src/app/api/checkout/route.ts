import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { createMyposCheckout } from "@/lib/mypos";
import { saveOrderWithAudit } from "@/lib/orders";
import { pgPool } from "@/lib/pg";
import { ensureCustomerSchema } from "@/lib/customer-schema";

export const runtime = "nodejs";
const PAYMENT_CURRENCY = (process.env.MY_POS_CURRENCY ?? "EUR").toUpperCase();

// Money helpers (EUR <-> cents)
const eurToCents = (value: number | string) => {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error("Invalid money value");
  return Math.round(n * 100);
};
const centsToEurString = (cents: number) => {
  if (!Number.isFinite(cents)) throw new Error("Invalid cents value");
  return (cents / 100).toFixed(2);
};

const schema = z.object({
  reference: z.string().min(1),
  amount: z.coerce.number().positive(), // client provided, ignored for totals
  description: z.string().optional(),
  deliveryLabel: z.string().min(1),
  couponCode: z.string().trim().toUpperCase().optional(),
  items: z
    .array(
      z.object({
        name: z.string(),
        price: z.coerce.number().optional(), // client provided, ignored
        productId: z.string().optional(),
        quantity: z.coerce.number().positive(),
        options: z.array(z.string()).optional(),
      }),
    )
    .min(1),
  totalQuantity: z.coerce.number().int().positive(),
  totalAmount: z.coerce.number().positive(), // client provided, ignored for totals
  createdAt: z.string().optional(),
  customer: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email(),
    phone: z.string().min(3),
    country: z.string().optional(),
    city: z.string().optional(),
    zip: z.string().optional(),
    address: z.string().optional(),
  }),
  consents: z
    .object({
      termsAccepted: z.boolean(),
      marketing: z.boolean().optional(),
    })
    .optional(),
  cart: z
    .object({
      items: z.array(
        z.object({
          productId: z.string().optional(),
          name: z.string(),
          qty: z.coerce.number(),
          price: z.coerce.number().optional(),
          currency: z.string(),
          options: z.array(z.string()).optional(),
        }),
      ),
    })
    .optional(),
});

const normalizeSlug = (value?: string | null) => {
  if (!value) return null;
  let slug = value.trim();
  if (!slug) return null;
  if (slug.startsWith("cake-")) {
    const rest = slug.slice(5);
    if (rest.startsWith("cake-")) slug = rest;
  }
  if (slug.startsWith("tiramisu-")) {
    const rest = slug.slice("tiramisu-".length);
    if (rest.startsWith("tiramisu-")) slug = rest;
  }
  return slug;
};

async function fetchProduct(slugOrId: string) {
  const client = await pgPool.connect();
  try {
    const slug = normalizeSlug(slugOrId);
    const res = await client.query(
      `SELECT id, slug, name, price FROM "Product" WHERE slug = $1 OR id = $1 LIMIT 1`,
      [slugOrId],
    );
    if (res.rows[0]) return res.rows[0];
    if (slug && slug !== slugOrId) {
      const res2 = await client.query(
        `SELECT id, slug, name, price FROM "Product" WHERE slug = $1 LIMIT 1`,
        [slug],
      );
      return res2.rows[0] ?? null;
    }
    return null;
  } finally {
    client.release();
  }
}

async function validateCoupon(code: string, subtotalCents: number) {
  const res = await pgPool.query(`SELECT * FROM "Coupon" WHERE code = $1 LIMIT 1`, [code]);
  const coupon = res.rows[0];
  if (!coupon) throw new Error("Кодът не е валиден.");

  // ✅ FIX: normalize discountType
  const discountTypeRaw = coupon.discountType ?? coupon.discounttype ?? "";
  const discountType = String(discountTypeRaw).trim().toUpperCase();

  const discountValue = Number(coupon.discountValue ?? coupon.discountvalue ?? 0);
  const minimumOrderAmount = Number(coupon.minimumOrderAmount ?? coupon.minimumorderamount ?? 0);
  const rawMaximum = coupon.maximumDiscountAmount ?? coupon.maximumdiscountamount;
  const maximumDiscountAmount =
    rawMaximum === null || rawMaximum === undefined ? null : Number(rawMaximum);

  const validFrom = coupon.validFrom ?? coupon.validfrom ?? null;
  const validUntil = coupon.validUntil ?? coupon.validuntil ?? null;
  const isActive = coupon.isActive ?? coupon.isactive ?? true;
  const maxRedemptions = coupon.maxRedemptions ?? coupon.maxredemptions ?? null;
  const timesRedeemed = coupon.timesRedeemed ?? coupon.timesredeemed ?? 0;

  const now = new Date();
  if (validFrom && now < new Date(validFrom)) throw new Error("Кодът още не е активен.");
  if (validUntil && now > new Date(validUntil)) throw new Error("Кодът е изтекъл.");
  if (!isActive) throw new Error("Кодът е деактивиран.");

  const minimumOrderAmountCents = eurToCents(minimumOrderAmount);
  if (subtotalCents < minimumOrderAmountCents) throw new Error("Сумата е под минималната за този код.");
  if (maxRedemptions && timesRedeemed >= maxRedemptions) throw new Error("Кодът е изчерпан.");

  let discountAmountCents = 0;

  if (discountType === "PERCENT") {
    discountAmountCents = Math.round((subtotalCents * discountValue) / 100);
    if (maximumDiscountAmount !== null) {
      const maxCents = eurToCents(maximumDiscountAmount);
      discountAmountCents = Math.min(discountAmountCents, maxCents);
    }
  } else if (discountType === "FIXED") {
    discountAmountCents = eurToCents(discountValue);
  } else {
    throw new Error("Невалиден тип на отстъпка (discountType).");
  }

  discountAmountCents = Math.min(discountAmountCents, subtotalCents);

  return {
    code: coupon.code,
    discountType,
    discountValue,
    maximumDiscountAmount: maximumDiscountAmount ?? null,
    minimumOrderAmount,
    discountAmountCents,
  };
}

/**
 * Allocate discount (in cents) across lines proportionally.
 * Ensures Σ lineDiscountCents == discountCents and Σ lineTotalCents == totalCents.
 */
function allocateDiscountAcrossLines(params: {
  lines: Array<{
    idx: number;
    productId: string;
    name: string;
    qty: number;
    unitPriceCents: number;
    lineSubtotalCents: number;
    options?: string[];
  }>;
  discountCents: number;
}) {
  const { lines, discountCents } = params;
  const subtotalSum = lines.reduce((s, l) => s + l.lineSubtotalCents, 0);

  if (subtotalSum <= 0 || discountCents <= 0) {
    return lines.map((l) => ({
      ...l,
      lineDiscountCents: 0,
      lineTotalCents: l.lineSubtotalCents,
    }));
  }

  const work = lines.map((l) => {
    const raw = (discountCents * l.lineSubtotalCents) / subtotalSum;
    const floored = Math.floor(raw);
    return {
      ...l,
      lineDiscountCents: floored,
      remainder: raw - floored,
    };
  });

  const allocated = work.reduce((s, l) => s + l.lineDiscountCents, 0);
  let remaining = discountCents - allocated;

  work.sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; i < work.length && remaining > 0; i++) {
    work[i].lineDiscountCents += 1;
    remaining -= 1;
  }

  work.sort((a, b) => a.idx - b.idx);

  const out = work.map((l) => ({
    ...l,
    lineTotalCents: l.lineSubtotalCents - l.lineDiscountCents,
  }));

  const sumDiscount = out.reduce((s, l) => s + l.lineDiscountCents, 0);
  if (sumDiscount !== discountCents) {
    throw new Error(`Discount allocation mismatch: expected ${discountCents}, got ${sumDiscount}`);
  }

  return out;
}

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const session = await getServerSession(authOptions);
    await ensureCustomerSchema();

    // Normalize items: ALWAYS take price from DB
    const normalizedItems = await Promise.all(
      body.items.map(async (item) => {
        const candidateId = item.productId ?? item.name;
        const productRow = candidateId ? await fetchProduct(candidateId) : null;
        if (!productRow) throw new Error(`Продуктът не е намерен: ${item.name}`);

        const unitPriceCents = eurToCents(productRow.price);
        const quantity = Number(item.quantity);

        return {
          productId: String(productRow.slug ?? productRow.id),
          name: String(productRow.name ?? item.name),
          quantity,
          unitPriceCents,
          options: item.options,
        };
      }),
    );

    const subtotalCents = normalizedItems.reduce(
      (sum, it) => sum + it.unitPriceCents * it.quantity,
      0,
    );
    if (!Number.isFinite(subtotalCents) || subtotalCents <= 0) {
      throw new Error("Невалидна сума на поръчката.");
    }

    const computedQuantity = normalizedItems.reduce((sum, it) => sum + it.quantity, 0);
    if (computedQuantity !== body.totalQuantity) {
      console.warn("[checkout] quantity mismatch", {
        computedQuantity,
        clientTotalQuantity: body.totalQuantity,
      });
    }

    // Coupon
    let discountAmountCents = 0;
    let couponInfo:
      | {
          code: string;
          discountType: string;
          discountValue: number;
          maximumDiscountAmount: number | null;
          minimumOrderAmount: number;
          discountAmountCents: number;
        }
      | undefined;
    if (body.couponCode) {
      couponInfo = await validateCoupon(body.couponCode, subtotalCents);
      discountAmountCents = couponInfo.discountAmountCents;
      console.info("[checkout.coupon]", {
        code: couponInfo.code,
        subtotalCents,
        discountAmountCents,
        totalCents: subtotalCents - discountAmountCents,
      });
    }
    const hasCoupon = !!couponInfo;

    const totalCents = Math.max(0, subtotalCents - discountAmountCents);
    const amountStr = centsToEurString(totalCents);

    // Allocate discount across lines (for audit)
    const lines = normalizedItems.map((it, idx) => ({
      idx,
      productId: it.productId,
      name: it.name,
      qty: it.quantity,
      unitPriceCents: it.unitPriceCents,
      lineSubtotalCents: it.unitPriceCents * it.quantity,
      options: it.options,
    }));

    const allocatedLines = allocateDiscountAcrossLines({
      lines,
      discountCents: discountAmountCents,
    });

    const sumLineTotals = allocatedLines.reduce((s, l) => s + l.lineTotalCents, 0);
    if (sumLineTotals !== totalCents) {
      throw new Error(`Line totals mismatch: expected ${totalCents}, got ${sumLineTotals}`);
    }

    const itemsWithPaid = allocatedLines.map((l) => {
      const effectiveUnitPaidCents = Math.round(l.lineTotalCents / (l.qty || 1)); // display only
      return {
        productId: l.productId,
        name: l.name,
        quantity: l.qty,
        options: l.options,
        originalUnitPrice: centsToEurString(l.unitPriceCents),
        unitPriceCents: l.unitPriceCents,
        pricePaid: centsToEurString(effectiveUnitPaidCents), // display only
        unitPriceCentsPaid: effectiveUnitPaidCents, // display only
        lineSubtotal: centsToEurString(l.lineSubtotalCents),
        lineDiscount: centsToEurString(l.lineDiscountCents),
        lineTotal: centsToEurString(l.lineTotalCents),
        lineTotalCents: l.lineTotalCents,
      };
    });

    const safePayload = {
      ...body,
      amount: amountStr,
      totalAmount: amountStr,
      subtotal: centsToEurString(subtotalCents),
      discountAmount: centsToEurString(discountAmountCents),
      coupon: couponInfo
        ? { ...couponInfo, discountAmount: centsToEurString(couponInfo.discountAmountCents) }
        : undefined,
      items: itemsWithPaid.map((it) => ({
        productId: it.productId,
        name: it.name,
        price: it.pricePaid, // display only
        quantity: it.quantity,
        options: it.options,
        lineTotal: it.lineTotal,
        lineSubtotal: it.lineSubtotal,
        lineDiscount: it.lineDiscount,
        originalPrice: it.originalUnitPrice,
      })),
      cart: undefined
        // !hasCoupon && body.cart
        //   ? {
        //       ...body.cart,
        //       items: itemsWithPaid.map((it) => ({
        //         productId: it.productId,
        //         name: it.name,
        //         qty: it.quantity,
        //         price: Number(it.pricePaid),
        //         currency: PAYMENT_CURRENCY,
        //         options: it.options,
        //       })),
        //     }
        //   : undefined,
    };

    const dbPayload = {
      ...safePayload,
      amount: totalCents / 100,
      totalAmount: totalCents / 100,
      subtotal: subtotalCents / 100,
      discountAmount: discountAmountCents / 100,
      coupon: couponInfo ? { ...couponInfo, discountAmount: discountAmountCents / 100 } : undefined,
      items: itemsWithPaid.map((it) => ({
        productId: it.productId,
        name: it.name,
        price: Number(it.pricePaid),
        quantity: it.quantity,
        options: it.options,
        lineTotal: Number(it.lineTotal),
        lineSubtotal: Number(it.lineSubtotal),
        lineDiscount: Number(it.lineDiscount),
        originalPrice: Number(it.originalUnitPrice),
      })),
    };

    await saveOrderWithAudit(
      {
        ...dbPayload,
        userId: session?.user?.id ?? undefined,
      },
      body.customer.email,
    );

    // Free order => no myPOS
    if (totalCents === 0) {
      return NextResponse.json({
        ok: true,
        paymentRequired: false,
        reference: safePayload.reference,
      });
    }

    // ✅ FIX: If coupon -> DO NOT send cart to myPOS (amount-only).
    // Otherwise, you may send cart unless there are tiny prices.
    const hasTinyPrice = itemsWithPaid.some((it) => Number(it.pricePaid) < 0.01);
    const paymentCart = hasCoupon || hasTinyPrice ? undefined : safePayload.cart;

    const redirect = createMyposCheckout({
      reference: safePayload.reference,
      amount: amountStr, // "0.00" string
      couponCode: couponInfo?.code,
      description: safePayload.description,
      customer: safePayload.customer,
      cart: undefined,
    });

    return NextResponse.json({ form: redirect, amount: amountStr });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed.";
    console.error("Checkout error:", message, error);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
