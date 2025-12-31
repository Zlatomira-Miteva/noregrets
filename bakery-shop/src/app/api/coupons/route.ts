import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { isActiveAdmin } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { pgPool } from "@/lib/pg";

const couponSchema = z.object({
  code: z.string().min(2),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.number(),
  minimumOrderAmount: z.number().optional(),
  maximumDiscountAmount: z.number().nullable().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isActiveAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await pgPool.query(`SELECT * FROM "Coupon" ORDER BY "createdAt" DESC`);
  return NextResponse.json({ coupons: res.rows });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isActiveAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = couponSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
    }
    const data = parsed.data;

    const couponId = randomUUID();
    const insert = await pgPool.query(
      `INSERT INTO "Coupon"
       (id, code, description, "discountType", "discountValue", "minimumOrderAmount", "maximumDiscountAmount", "validFrom", "validUntil", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, NOW())
       RETURNING *`,
      [
        couponId,
        data.code,
        json.description ?? null,
        data.discountType,
        data.discountValue,
        data.minimumOrderAmount ?? 0,
        data.maximumDiscountAmount ?? null,
        data.validFrom ? new Date(data.validFrom) : null,
        data.validUntil ? new Date(data.validUntil) : null,
      ],
    );

    const coupon = insert.rows[0];
    await logAudit({
      entity: "coupon",
      entityId: coupon.id,
      action: "coupon_created",
      newValue: coupon,
      operatorCode: session?.user?.operatorCode ?? session?.user?.email ?? null,
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    console.error("Failed to create coupon", error);
    return NextResponse.json({ error: "Неуспешно създаване на купон." }, { status: 500 });
  }
}
