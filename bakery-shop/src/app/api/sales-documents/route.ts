import { NextResponse } from "next/server";

import { createSalesDocumentByReference } from "@/lib/n18";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reference, document_type } = body ?? {};
    if (!reference) return NextResponse.json({ error: "reference is required" }, { status: 400 });

    const docNumber = await createSalesDocumentByReference({
      reference,
      documentType: document_type ?? "N18_CH52O",
    });
    if (!docNumber) return NextResponse.json({ error: "order not found" }, { status: 404 });
    return NextResponse.json({ ok: true, documentNumber: docNumber });
  } catch (error) {
    console.error("[sales-documents] error", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
