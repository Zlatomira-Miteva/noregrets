import { NextResponse } from "next/server";
import { z } from "zod";
import { createMyposCheckout } from "@/lib/mypos";
import { saveOrderWithAudit } from "@/lib/orders";

export const runtime = "nodejs";

const schema = z.object({
  reference: z.string().min(1),
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
  deliveryLabel: z.string().min(1),
  items: z
    .array(
      z.object({
        name: z.string(),
        price: z.coerce.number(),
        quantity: z.coerce.number().positive(),
      }),
    )
    .min(1),
  totalQuantity: z.coerce.number().int().positive(),
  totalAmount: z.coerce.number().positive(),
  createdAt: z.string().optional(),
  customer: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email(),
    phone: z.string().min(3),
    country: z.string().optional(),
    city: z.string().optional(),
    zip: z.string().optional(),
    address: z.string().optional(),
  }),
  consents: z
    .object({
      termsAccepted: z.boolean(),
      marketing: z.boolean().optional(),
    })
    .optional(),
  cart: z
    .object({
      items: z.array(
        z.object({
          name: z.string(),
          qty: z.coerce.number(),
          price: z.coerce.number(),
          currency: z.string(),
        }),
      ),
    })
    .optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());

    await saveOrderWithAudit(body, body.customer.email);

    const redirect = createMyposCheckout(body);
    return NextResponse.json({ form: redirect });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed.";
    console.error("Checkout error:", message, error);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
