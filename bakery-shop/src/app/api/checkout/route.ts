import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { createMyposCheckout } from "@/lib/mypos";
import { saveOrderWithAudit } from "@/lib/orders";
import { pgPool } from "@/lib/pg";
import { ensureCustomerSchema } from "@/lib/customer-schema";

export const runtime = "nodejs";

const schema = z.object({
  reference: z.string().min(1),
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
  deliveryLabel: z.string().min(1),
  couponCode: z.string().trim().toUpperCase().optional(),
  items: z
    .array(
      z.object({
        name: z.string(),
        price: z.coerce.number().optional(),
        productId: z.string().optional(),
        quantity: z.coerce.number().positive(),
        options: z.array(z.string()).optional(),
      }),
    )
    .min(1),
  totalQuantity: z.coerce.number().int().positive(),
  totalAmount: z.coerce.number().positive(),
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

async function validateCoupon(code: string, total: number) {
  const res = await pgPool.query(`SELECT * FROM "Coupon" WHERE code = $1 LIMIT 1`, [code]);
  const coupon = res.rows[0];
  if (!coupon) {
    throw new Error("Кодът не е валиден.");
  }

  const discountType = coupon.discountType ?? coupon.discounttype;
  const discountValue = Number(coupon.discountValue ?? coupon.discountvalue ?? 0);
  const minimumOrderAmount = Number(coupon.minimumOrderAmount ?? coupon.minimumorderamount ?? 0);
  const rawMaximum = coupon.maximumDiscountAmount ?? coupon.maximumdiscountamount;
  const maximumDiscountAmount = rawMaximum === null || rawMaximum === undefined ? null : Number(rawMaximum);
  const validFrom = coupon.validFrom ?? coupon.validfrom ?? null;
  const validUntil = coupon.validUntil ?? coupon.validuntil ?? null;
  const isActive = coupon.isActive ?? coupon.isactive ?? true;
  const maxRedemptions = coupon.maxRedemptions ?? coupon.maxredemptions ?? null;
  const timesRedeemed = coupon.timesRedeemed ?? coupon.timesredeemed ?? 0;

  const now = new Date();
  if (validFrom && now < new Date(validFrom)) throw new Error("Кодът още не е активен.");
  if (validUntil && now > new Date(validUntil)) throw new Error("Кодът е изтекъл.");
  if (!isActive) throw new Error("Кодът е деактивиран.");
  if (total < minimumOrderAmount) throw new Error("Сумата е под минималната за този код.");
  if (maxRedemptions && timesRedeemed >= maxRedemptions) throw new Error("Кодът е изчерпан.");

  let discountAmount = 0;
  if (discountType === "PERCENT") {
    discountAmount = (discountValue / 100) * total;
    const max = maximumDiscountAmount ?? null;
    if (max !== null && discountAmount > max) discountAmount = max;
  } else {
    discountAmount = discountValue;
  }

  return {
    code: coupon.code,
    discountType,
    discountValue,
    maximumDiscountAmount: maximumDiscountAmount ?? null,
    minimumOrderAmount,
    discountAmount,
  };
}

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const session = await getServerSession(authOptions);
    await ensureCustomerSchema();

    const normalizedItems = await Promise.all(
      body.items.map(async (item) => {
        const candidateId = item.productId ?? item.name;
        const productRow = candidateId ? await fetchProduct(candidateId) : null;
        if (!productRow) {
          throw new Error(`Продуктът не е намерен: ${item.name}`);
        }
        const unitPrice = Number(productRow.price);
        const quantity = Number(item.quantity);
        return {
          name: productRow.name ?? item.name,
          price: unitPrice,
          quantity,
          options: item.options,
          productId: productRow.slug ?? productRow.id,
        };
      }),
    );

    const subtotal = normalizedItems.reduce(
      (sum, it) => sum + Number(it.price) * Number(it.quantity),
      0,
    );
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      throw new Error("Невалидна сума на поръчката.");
    }
    const computedQuantity = normalizedItems.reduce(
      (sum, it) => sum + Number(it.quantity),
      0,
    );

    let discountAmount = 0;
    let couponInfo:
      | {
          code: string;
          discountType: string;
          discountValue: number;
          maximumDiscountAmount: number | null;
          minimumOrderAmount: number;
          discountAmount: number;
        }
      | undefined;
    if (body.couponCode) {
      couponInfo = await validateCoupon(body.couponCode, subtotal);
      discountAmount = couponInfo.discountAmount;
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);
    const roundedTotal = Number(totalAmount.toFixed(2));

    const safePayload = {
      ...body,
      amount: roundedTotal,
      totalAmount: roundedTotal,
      subtotal: Number(subtotal.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      coupon: couponInfo,
      items: normalizedItems,
      cart: body.cart
        ? {
            ...body.cart,
            items: normalizedItems.map((it) => ({
              productId: it.productId,
              name: it.name,
              qty: it.quantity,
              price: it.price,
              currency: "BGN",
              options: it.options,
            })),
          }
        : undefined,
    };

    await saveOrderWithAudit(
      {
        ...safePayload,
        userId: session?.user?.id ?? undefined,
      },
      body.customer.email,
    );

    const redirect = createMyposCheckout({
      ...safePayload,
      amount: safePayload.amount,
      cart: safePayload.cart,
    });
    return NextResponse.json({ form: redirect });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed.";
    console.error("Checkout error:", message, error);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
