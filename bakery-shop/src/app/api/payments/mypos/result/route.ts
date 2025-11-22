import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const reference = formData.get("orderReference")?.toString();
    const status = formData.get("status")?.toString()?.toUpperCase();

    if (!reference) {
      return NextResponse.json({ error: "Missing reference." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { reference } });
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (status === "SUCCESS") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID" },
      });
    } else if (status === "FAILED" || status === "CANCELED") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("myPOS callback failed", error);
    return NextResponse.json({ error: "Callback error." }, { status: 500 });
  }
}
