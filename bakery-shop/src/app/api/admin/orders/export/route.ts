import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { pgPool } from "@/lib/pg";

export const runtime = "nodejs";

const toIso = (value: unknown) =>
  value instanceof Date ? value.toISOString() : new Date(value as string | number | Date).toISOString();

const escapeCsv = (value: unknown) => {
  const str =
    typeof value === "string"
      ? value
      : value === null || value === undefined
        ? ""
        : typeof value === "number" || typeof value === "boolean"
          ? String(value)
          : JSON.stringify(value);

  return `"${str.replace(/"/g, '""')}"`;
};

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const startParam = url.searchParams.get("start");
  const endParam = url.searchParams.get("end");

  const startDate = startParam ? new Date(startParam) : null;
  const endDate = endParam ? new Date(endParam) : null;

  if (startParam && isNaN(startDate!.getTime())) {
    return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
  }
  if (endParam && isNaN(endDate!.getTime())) {
    return NextResponse.json({ error: "Invalid end date" }, { status: 400 });
  }

  const conditions: string[] = [`status='PAID'`];
  const values: unknown[] = [];
  if (startDate) {
    conditions.push(`"createdAt" >= $${values.length + 1}`);
    values.push(startDate);
  }
  if (endDate) {
    conditions.push(`"createdAt" <= $${values.length + 1}`);
    values.push(endDate);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const ordersRes = await pgPool.query(
    `SELECT * FROM "Order" ${where} ORDER BY "createdAt" DESC`,
    values,
  );

  const logsRes = await pgPool.query(`SELECT * FROM "OrderAuditLog" ORDER BY "createdAt" ASC`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logsByOrder = logsRes.rows.reduce<Record<string, any[]>>((acc, log) => {
    const key = log.orderid;
    acc[key] = acc[key] ?? [];
    acc[key].push(log);
    return acc;
  }, {});

  const header = [
    "reference",
    "status",
    "totalAmount",
    "customerName",
    "customerEmail",
    "customerPhone",
    "deliveryLabel",
    "items",
    "metadata",
    "createdAt",
    "updatedAt",
    "auditLogs",
  ];

  const rows = ordersRes.rows.map((order) => {
    const auditLogs =
      logsByOrder[order.id]?.map((log) => ({
        action: log.action,
        oldValue: log.oldValue ?? log.oldvalue,
        newValue: log.newValue ?? log.newvalue,
        performedBy: log.performedBy ?? log.performedby,
        createdAt: toIso(log.createdAt ?? log.createdat),
      })) ?? [];

    return [
      order.reference,
      order.status,
      Number(order.totalAmount ?? order.totalamount).toFixed(2),
      order.customerName ?? order.customername,
      order.customerEmail ?? order.customeremail,
      order.customerPhone ?? order.customerphone,
      order.deliveryLabel ?? order.deliverylabel,
      JSON.stringify(order.items),
      JSON.stringify(order.metadata ?? {}),
      toIso(order.createdAt ?? order.createdat),
      toIso(order.updatedAt ?? order.updatedat),
      JSON.stringify(auditLogs),
    ];
  });

  const csv = [header, ...rows]
    .map((line) => line.map(escapeCsv).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="orders-paid.csv"',
    },
  });
}
