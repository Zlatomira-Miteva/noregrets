import { NextResponse } from "next/server";
import { z } from "zod";

import { appendRow } from "@/lib/sheets";

const orderSchema = z.object({
  customer: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().min(1),
    phone: z.string().min(3),
  }),
  deliveryLabel: z.string().min(1),
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().int().nonnegative(),
    })
  ),
  totalQuantity: z.number().int().positive(),
  createdAt: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    console.log("[sheets] config", {
      sheetId: process.env.GOOGLE_SHEET_ID,
      clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      hasKey: Boolean(process.env.GOOGLE_SHEETS_PRIVATE_KEY),
    });
    const json = await request.json();
    const parsed = orderSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Невалидни данни." },
        { status: 400 }
      );
    }

    const { customer, deliveryLabel, items, totalQuantity, createdAt } = parsed.data;
    const productSummary = items.map((item) => `${item.name} × ${item.quantity}`).join("\n");
    const timestamp = createdAt ? new Date(createdAt) : new Date();
    const formattedDate = timestamp.toLocaleString("bg-BG");
    const row = [
      formattedDate,
      deliveryLabel,
      productSummary,
      totalQuantity,
      `${customer.firstName} ${customer.lastName}`,
      customer.email,
      customer.phone,
    ];

    await appendRow(row);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to append order row", error);
    return NextResponse.json({ error: "Грешка при записа в таблицата." }, { status: 500 });
  }
}
