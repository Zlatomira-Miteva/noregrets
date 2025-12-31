import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { pgPool } from "@/lib/pg";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const email = session.user.email.toLowerCase();

  const res = await pgPool.query(
    `SELECT id,"reference","customerName","customerEmail","customerPhone","deliveryLabel",items,"totalAmount",status,"createdAt","updatedAt"
     FROM "Order"
     WHERE (("userId" = $1) OR (LOWER("customerEmail") = $2))
       AND status IN ('PAID','IN_PROGRESS','COMPLETED')
     ORDER BY "createdAt" DESC
     LIMIT 200`,
    [userId, email],
  );

  return NextResponse.json({
    orders: res.rows.map((row) => ({
      id: row.id,
      reference: row.reference,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone,
      deliveryLabel: row.deliveryLabel,
      items: row.items,
      totalAmount: Number(row.totalAmount ?? 0),
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })),
  });
}
