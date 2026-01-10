import { NextResponse } from "next/server";
import { z } from "zod";

import { pgPool } from "@/lib/pg";

// Accept both the old "total" key and the frontend's "cartTotal"
const schema = z
  .object({
    code: z.string().trim().toUpperCase(),
    total: z.number().positive().optional(),
    cartTotal: z.number().positive().optional(),
    items: z.array(
      z.object({
        price: z.number(),
        quantity: z.number(),
      }),
    ),
  })
  .refine((data) => typeof data.total === "number" || typeof data.cartTotal === "number", {
    message: "Missing total amount.",
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Невалиден код." }, { status: 400 });
    }
    const { code, total: totalFromBody, cartTotal, items } = parsed.data;
    const totalInput = typeof totalFromBody === "number" ? totalFromBody : (cartTotal as number);
    const toCents = (v: number) => Math.round(Number(v) * 100);
    const centsToAmount = (c: number) => Number((c / 100).toFixed(2));
    const subtotalCents =
      Array.isArray(items) && items.length
        ? items.reduce((acc, it) => acc + toCents(it.price) * Number(it.quantity ?? 0), 0)
        : toCents(totalInput);

    const res = await pgPool.query(`SELECT * FROM "Coupon" WHERE code = $1 LIMIT 1`, [code]);
    const coupon = res.rows[0];
    if (!coupon) {
      return NextResponse.json({ error: "Кодът не е валиден." }, { status: 404 });
    }

    // Normalize DB fields (quoted columns preserve case).
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
    if (validFrom && now < new Date(validFrom)) {
      return NextResponse.json({ error: "Кодът още не е активен." }, { status: 400 });
    }
    if (validUntil && now > new Date(validUntil)) {
      return NextResponse.json({ error: "Кодът е изтекъл." }, { status: 400 });
    }
    if (!isActive) {
      return NextResponse.json({ error: "Кодът е деактивиран." }, { status: 400 });
    }
    if (subtotalCents < toCents(minimumOrderAmount)) {
      return NextResponse.json({ error: "Сумата е под минималната за този код." }, { status: 400 });
    }
    if (maxRedemptions && timesRedeemed >= maxRedemptions) {
      return NextResponse.json({ error: "Кодът е изчерпан." }, { status: 400 });
    }

    let discountCents = 0;
    if (discountType === "PERCENT") {
      if (Array.isArray(items) && items.length) {
        const pct = discountValue / 100;
        discountCents = items.reduce((acc, it) => {
          const qty = Number(it.quantity ?? 0);
          const unitCents = toCents(it.price);
          const unitAfter = Math.max(0, Math.round(unitCents * (1 - pct)));
          const lineTotal = unitAfter * qty;
          const lineOriginal = unitCents * qty;
          const lineDiscount = Math.max(0, lineOriginal - lineTotal);
          return acc + lineDiscount;
        }, 0);
      } else {
        discountCents = Math.round((subtotalCents * discountValue) / 100);
      }
      const max = maximumDiscountAmount ?? null;
      if (max !== null) discountCents = Math.min(discountCents, toCents(max));
    } else {
      discountCents = toCents(discountValue);
    }
    discountCents = Math.min(discountCents, subtotalCents);
    const discountAmount = centsToAmount(discountCents);

    return NextResponse.json({
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType,
        discountValue,
        maximumDiscountAmount: maximumDiscountAmount ?? null,
        minimumOrderAmount,
        validFrom,
        validUntil,
      },
      discountAmount,
    });
  } catch (error) {
    console.error("Coupon validate failed", error);
    return NextResponse.json({ error: "Неуспешно валидиране на кода." }, { status: 500 });
  }
}
