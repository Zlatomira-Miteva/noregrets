"use server";

import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";

const requestSchema = z.object({
  code: z.string().min(1, "Кодът е задължителен."),
  cartTotal: z.number().min(0, "Стойността на количката трябва да е положителна."),
});

const normalizeCode = (code: string) => code.trim().toUpperCase();

const decimalToNumber = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === "object" && "toString" in value) {
    const parsed = Number.parseFloat((value as { toString: () => string }).toString());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
    }

    const { code, cartTotal } = parsed.data;

    const normalizedCode = normalizeCode(code);
    const couponRecord = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!couponRecord) {
      return NextResponse.json({ error: "Несъществуващ код или вече не е активен." }, { status: 404 });
    }

    if (!couponRecord.isActive) {
      return NextResponse.json({ error: "Този код не е активен." }, { status: 400 });
    }

    const now = new Date();
    if (couponRecord.validFrom && couponRecord.validFrom > now) {
      return NextResponse.json({ error: "Този код все още не е активен." }, { status: 400 });
    }

    if (couponRecord.validUntil && couponRecord.validUntil < now) {
      return NextResponse.json({ error: "Този код е изтекъл." }, { status: 400 });
    }

    if (couponRecord.maxRedemptions && couponRecord.timesRedeemed >= couponRecord.maxRedemptions) {
      return NextResponse.json({ error: "Този код е използван максималния брой пъти." }, { status: 400 });
    }

    const discountValue = decimalToNumber(couponRecord.discountValue);
    const minimumOrderAmount = decimalToNumber(couponRecord.minimumOrderAmount) ?? 0;
    const maximumDiscountAmount = decimalToNumber(couponRecord.maximumDiscountAmount);

    if (discountValue === null) {
      return NextResponse.json({ error: "Кодът не е конфигуриран правилно." }, { status: 500 });
    }

    const minAmount = minimumOrderAmount ?? 0;
    if (cartTotal < minAmount) {
      return NextResponse.json(
        { error: `Минималната стойност на поръчката за този код е ${minAmount.toFixed(2)} лв.` },
        { status: 400 }
      );
    }

    let discount = couponRecord.discountType === "PERCENT" ? (cartTotal * discountValue) / 100 : discountValue;
    if (maximumDiscountAmount !== null) {
      discount = Math.min(discount, maximumDiscountAmount);
    }
    discount = Math.min(discount, cartTotal);
    const finalTotal = Math.max(0, cartTotal - discount);

    return NextResponse.json({
      coupon: {
        code: couponRecord.code,
        description: couponRecord.description ?? null,
        discountType: couponRecord.discountType,
        discountValue,
        minimumOrderAmount,
        maximumDiscountAmount,
        maxRedemptions: couponRecord.maxRedemptions,
        timesRedeemed: couponRecord.timesRedeemed,
      },
      discountAmount: Number(discount.toFixed(2)),
      finalTotal: Number(finalTotal.toFixed(2)),
    });
  } catch (error) {
    console.error("Failed to validate coupon", error);
    return NextResponse.json({ error: "Възникна проблем при валидирането на кода." }, { status: 500 });
  }
}
