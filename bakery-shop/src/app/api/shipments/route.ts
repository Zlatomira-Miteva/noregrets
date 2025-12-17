import { NextResponse } from "next/server";

import { recordShipmentByReference } from "@/lib/n18";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reference, courier, tracking_number, shipped_at } = body ?? {};
    if (!reference || !courier) {
      return NextResponse.json({ error: "reference and courier are required" }, { status: 400 });
    }
    const ok = await recordShipmentByReference({
      reference,
      courier,
      tracking: tracking_number,
      shippedAt: shipped_at ? new Date(shipped_at) : undefined,
    });
    if (!ok) return NextResponse.json({ error: "order not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[shipments] error", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
