import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { isActiveAdmin } from "@/lib/authz";
import { pgPool } from "@/lib/pg";

const toIso = (value: unknown) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const asDate = new Date(value as string);
  return Number.isNaN(asDate.getTime()) ? null : asDate.toISOString();
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isActiveAdmin(session)) {
    return NextResponse.json({ error: "Неупълномощен достъп." }, { status: 401 });
  }

  const res = await pgPool.query(`SELECT * FROM "Order" ORDER BY "createdAt" DESC`);
  const payload = res.rows.map((order) => ({
    id: order.id,
    reference: order.reference,
    customerName: order.customerName ?? order.customername,
    customerEmail: order.customerEmail ?? order.customeremail,
    customerPhone: order.customerPhone ?? order.customerphone,
    deliveryLabel: order.deliveryLabel ?? order.deliverylabel,
    items: order.items,
    totalAmount: Number(order.totalAmount ?? order.totalamount),
    status: order.status,
    metadata: order.metadata,
    refundAmount: order.refundAmount ?? order.refundamount ?? null,
    refundMethod: order.refundMethod ?? order.refundmethod ?? null,
    refundAt: toIso(order.refundAt ?? order.refundat),
    createdAt: toIso(order.createdAt ?? order.createdat) ?? "",
    updatedAt: toIso(order.updatedAt ?? order.updatedat) ?? "",
  }));

  return NextResponse.json({ orders: payload });
}
