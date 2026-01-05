import { NextResponse } from "next/server";

import { getOrderByReference } from "@/lib/orders";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference") ?? "";
  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const order = await getOrderByReference(reference);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Expose only what we need for the success screen.
  const items = Array.isArray(order.items) ? order.items : [];
  return NextResponse.json({
    reference: order.reference,
    status: order.status,
    totalAmount: order.totalAmount,
    deliveryLabel: order.deliveryLabel,
    customerName: order.customerName,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: items.map((it: any) => ({
      name: it?.name ?? "",
      quantity: Number(it?.quantity ?? it?.qty ?? 1),
      price: Number(it?.price ?? 0),
      total: Number(it?.price ?? 0) * Number(it?.quantity ?? it?.qty ?? 1),
    })),
  });
}
