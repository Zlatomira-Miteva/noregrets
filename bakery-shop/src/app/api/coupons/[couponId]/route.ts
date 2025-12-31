import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { isActiveAdmin } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
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

  const session = await getServerSession(authOptions);
  if (!isActiveAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const coupon = result.rows[0];
    await logAudit({
      entity: "coupon",
      entityId: coupon.id,
      action: "coupon_updated",
      newValue: coupon,
      operatorCode: session?.user?.operatorCode ?? session?.user?.email ?? null,
    });

    return NextResponse.json({ coupon });
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

  const session = await getServerSession(authOptions);
  if (!isActiveAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const select = await pgPool.query(`SELECT * FROM "Coupon" WHERE id=$1 LIMIT 1`, [couponId]);
    if (!select.rows.length) {
      return NextResponse.json({ error: "Купонът не е намерен." }, { status: 404 });
    }
    const existing = select.rows[0];
    const update = await pgPool.query(
      `UPDATE "Coupon" SET "isActive"=false, "updatedAt"=NOW() WHERE id=$1 RETURNING *`,
      [couponId],
    );
    const coupon = update.rows[0];
    await logAudit({
      entity: "coupon",
      entityId: couponId,
      action: "coupon_archived_instead_of_delete",
      oldValue: existing,
      newValue: coupon,
      operatorCode: session?.user?.operatorCode ?? session?.user?.email ?? null,
    });
    return NextResponse.json({ ok: true, status: "ARCHIVED" });
  } catch (error) {
    console.error("[coupon.delete]", error);
    return NextResponse.json({ error: "Неуспешно изтриване на купон." }, { status: 500 });
  }
}
