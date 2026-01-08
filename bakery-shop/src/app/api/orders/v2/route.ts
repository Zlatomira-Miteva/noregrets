import { NextResponse } from "next/server";
import { z } from "zod";

import { upsertOrderSnapshot } from "@/lib/n18";

export const runtime = "nodejs";

const schema = z.object({
  reference: z.string().min(1),
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  customer_phone: z.string().min(3),
  delivery_address: z.string().min(1),
  total_amount: z.coerce.number().positive(),
  currency: z.string().length(3).default("EUR"),
  payment_method: z.enum(["card", "cod"]).default("card"),
  payment_status: z.enum(["pending", "authorized", "paid", "failed", "refunded"]).default("pending"),
  items: z
    .array(
      z.object({
        product_name: z.string(),
        tax_group: z.string().default("20%"),
        quantity: z.coerce.number().positive(),
        unit_price: z.coerce.number().nonnegative(),
        total_price: z.coerce.number().nonnegative(),
      }),
    )
    .min(1),
  created_at: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const orderId = await upsertOrderSnapshot({
      reference: body.reference,
      customerName: body.customer_name,
      customerEmail: body.customer_email,
      customerPhone: body.customer_phone,
      deliveryAddress: body.delivery_address,
      totalAmount: body.total_amount,
      currency: body.currency,
      paymentMethod: body.payment_method,
      paymentStatus: body.payment_status,
      items: body.items.map((it) => ({
        name: it.product_name,
        quantity: it.quantity,
        price: it.unit_price,
        taxGroup: it.tax_group,
      })),
      createdAt: body.created_at ? new Date(body.created_at) : undefined,
    });
    return NextResponse.json({ ok: true, orderId });
  } catch (error) {
    console.error("[orders.v2] error", error);
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
}
