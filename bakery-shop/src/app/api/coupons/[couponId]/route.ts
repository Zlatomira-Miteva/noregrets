import { NextResponse } from "next/server";
import { z } from "zod";

import { pgPool } from "@/lib/pg";

const couponUpdateSchema = z.object({
  code: z.string().min(2).optional(),
  discountType: z.enum(["PERCENT", "FIXED"]).optional(),
  discountValue: z.number().optional(),
  minimumOrderAmount: z.number().optional(),
  maximumDiscountAmount: z.number().nullable().optional(),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: { params: any },
) {
  const couponId = params?.couponId;
  if (!couponId) {
    return NextResponse.json({ error: "Липсва ID на купона." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = couponUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Невалидни данни." }, { status: 400 });
    }
    const updates = parsed.data;
    const fields: string[] = [];
    const values: unknown[] = [couponId];
    let idx = 1;

    if (updates.code !== undefined) {
      fields.push(`code=$${++idx}`);
      values.push(updates.code);
    }
    if (updates.discountType !== undefined) {
      fields.push(`"discountType"=$${++idx}`);
      values.push(updates.discountType);
    }
    if (updates.discountValue !== undefined) {
      fields.push(`"discountValue"=$${++idx}`);
      values.push(updates.discountValue);
    }
    if (updates.minimumOrderAmount !== undefined) {
      fields.push(`"minimumOrderAmount"=$${++idx}`);
      values.push(updates.minimumOrderAmount);
    }
    if (updates.maximumDiscountAmount !== undefined) {
      fields.push(`"maximumDiscountAmount"=$${++idx}`);
      values.push(updates.maximumDiscountAmount);
    }
    if (updates.validFrom !== undefined) {
      fields.push(`"validFrom"=$${++idx}`);
      values.push(updates.validFrom ? new Date(updates.validFrom) : null);
    }
    if (updates.validUntil !== undefined) {
      fields.push(`"validUntil"=$${++idx}`);
      values.push(updates.validUntil ? new Date(updates.validUntil) : null);
    }
    if (updates.isActive !== undefined) {
      fields.push(`"isActive"=$${++idx}`);
      values.push(updates.isActive);
    }

    if (!fields.length) {
      return NextResponse.json({ error: "Няма данни за обновяване." }, { status: 400 });
    }

    const query = `UPDATE "Coupon" SET ${fields.join(",")}, "updatedAt"=NOW() WHERE id=$1 RETURNING *`;
    const result = await pgPool.query(query, values);
    if (!result.rows.length) {
      return NextResponse.json({ error: "Купонът не е намерен." }, { status: 404 });
    }

    return NextResponse.json({ coupon: result.rows[0] });
  } catch (error) {
    console.error("[coupon.patch]", error);
    return NextResponse.json({ error: "Неуспешно обновяване на купон." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: { params: any },
) {
  const couponId = params?.couponId;
  if (!couponId) {
    return NextResponse.json({ error: "Липсва ID на купона." }, { status: 400 });
  }

  try {
    const result = await pgPool.query(`DELETE FROM "Coupon" WHERE id=$1`, [couponId]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Купонът не е намерен." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[coupon.delete]", error);
    return NextResponse.json({ error: "Неуспешно изтриване на купон." }, { status: 500 });
  }
}
