"use server";

import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/db";
import { authOptions } from "@/auth";

const createSchema = z.object({
  code: z.string().min(3, "Кодът трябва да е поне 3 символа."),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.number().positive("Отстъпката трябва да е положително число."),
  minimumOrderAmount: z.number().nonnegative().default(0),
  maximumDiscountAmount: z.number().nonnegative().optional().nullable(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("Failed to list coupons", error);
    return NextResponse.json({ error: "Неуспешно зареждане на купоните." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const json = await request.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
    }

    const { code, discountType, discountValue, minimumOrderAmount, maximumDiscountAmount } = parsed.data;
    const normalizedCode = code.trim().toUpperCase();
    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setMonth(validUntil.getMonth() + 1);

    const coupon = await prisma.coupon.create({
      data: {
        code: normalizedCode,
        discountType,
        discountValue,
        minimumOrderAmount,
        maximumDiscountAmount: maximumDiscountAmount ?? null,
        validFrom: now,
        validUntil,
        maxRedemptions: 1,
        timesRedeemed: 0,
        isActive: true,
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Вече съществува купон с този код." }, { status: 409 });
    }
    console.error("Failed to create coupon", error);
    return NextResponse.json({ error: "Неуспешно създаване на купон." }, { status: 500 });
  }
}
