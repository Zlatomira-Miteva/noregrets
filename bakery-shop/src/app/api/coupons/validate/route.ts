import { NextResponse } from "next/server";
import { z } from "zod";

import { pgPool } from "@/lib/pg";

// Accept both the old "total" key and the frontend's "cartTotal"
const schema = z
  .object({
    code: z.string().trim().toUpperCase(),
    total: z.number().positive().optional(),
    cartTotal: z.number().positive().optional(),
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
    const { code, total: totalFromBody, cartTotal } = parsed.data;
    const total = typeof totalFromBody === "number" ? totalFromBody : (cartTotal as number);

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
    if (total < minimumOrderAmount) {
      return NextResponse.json({ error: "Сумата е под минималната за този код." }, { status: 400 });
    }
    if (maxRedemptions && timesRedeemed >= maxRedemptions) {
      return NextResponse.json({ error: "Кодът е изчерпан." }, { status: 400 });
    }

    let discountAmount = 0;
    if (discountType === "PERCENT") {
      discountAmount = (discountValue / 100) * total;
      const max = maximumDiscountAmount ?? null;
      if (max !== null && discountAmount > max) discountAmount = max;
    } else {
      discountAmount = discountValue;
    }

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
