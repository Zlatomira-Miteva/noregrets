import { NextResponse } from "next/server";
import { z } from "zod";
import { createMyposCheckout } from "@/lib/mypos";

export const runtime = "nodejs";

const schema = z.object({
  reference: z.string().min(1),
  amount: z.coerce.number(),
  description: z.string().optional(),
  customer: z
    .object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      country: z.string().optional(),
      city: z.string().optional(),
      zip: z.string().optional(),
      address: z.string().optional(),
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
    const redirect = createMyposCheckout(body);
    return NextResponse.json({ form: redirect });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed.";
    console.error("Checkout error:", message, error);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
