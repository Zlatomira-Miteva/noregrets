import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const runtime = "nodejs";

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
  const token = process.env.ADMIN_EXPORT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "ADMIN_EXPORT_TOKEN is not configured." },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const providedToken = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "").trim() : "";

  if (providedToken !== token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      auditLogs: { orderBy: { createdAt: "asc" } },
    },
  });

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

  const rows = orders.map((order) => {
    const auditLogs = order.auditLogs.map((log) => ({
      action: log.action,
      oldValue: log.oldValue,
      newValue: log.newValue,
      performedBy: log.performedBy,
      createdAt: log.createdAt.toISOString(),
    }));

    return [
      order.reference,
      order.status,
      order.totalAmount.toFixed(2),
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.deliveryLabel,
      JSON.stringify(order.items),
      JSON.stringify(order.metadata ?? {}),
      order.createdAt.toISOString(),
      order.updatedAt.toISOString(),
      JSON.stringify(auditLogs),
    ];
  });

  const csv = [header, ...rows].map((line) => line.map(escapeCsv).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="orders-export.csv"',
    },
  });
}
