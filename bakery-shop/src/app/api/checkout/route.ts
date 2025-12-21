import { NextResponse } from "next/server";
import { z } from "zod";
import { createMyposCheckout } from "@/lib/mypos";
import { saveOrderWithAudit } from "@/lib/orders";
import { pgPool } from "@/lib/pg";

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
        price: z.coerce.number().optional(),
        productId: z.string().optional(),
        quantity: z.coerce.number().positive(),
        options: z.array(z.string()).optional(),
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
          productId: z.string().optional(),
          name: z.string(),
          qty: z.coerce.number(),
          price: z.coerce.number().optional(),
          currency: z.string(),
          options: z.array(z.string()).optional(),
        }),
      ),
    })
    .optional(),
});

const normalizeSlug = (value?: string | null) => {
  if (!value) return null;
  let slug = value.trim();
  if (!slug) return null;
  if (slug.startsWith("cake-")) {
    const rest = slug.slice(5);
    if (rest.startsWith("cake-")) slug = rest;
  }
  if (slug.startsWith("tiramisu-")) {
    const rest = slug.slice("tiramisu-".length);
    if (rest.startsWith("tiramisu-")) slug = rest;
  }
  return slug;
};

async function fetchProduct(slugOrId: string) {
  const client = await pgPool.connect();
  try {
    const slug = normalizeSlug(slugOrId);
    const res = await client.query(
      `SELECT id, slug, name, price FROM "Product" WHERE slug = $1 OR id = $1 LIMIT 1`,
      [slugOrId],
    );
    if (res.rows[0]) return res.rows[0];
    if (slug && slug !== slugOrId) {
      const res2 = await client.query(
        `SELECT id, slug, name, price FROM "Product" WHERE slug = $1 LIMIT 1`,
        [slug],
      );
      return res2.rows[0] ?? null;
    }
    return null;
  } finally {
    client.release();
  }
}

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());

    const normalizedItems = await Promise.all(
      body.items.map(async (item) => {
        const candidateId = item.productId ?? item.name;
        const productRow = candidateId ? await fetchProduct(candidateId) : null;
        if (!productRow) {
          throw new Error(`Продуктът не е намерен: ${item.name}`);
        }
        const unitPrice = Number(productRow.price);
        const quantity = Number(item.quantity);
        return {
          name: productRow.name ?? item.name,
          price: unitPrice,
          quantity,
          options: item.options,
          productId: productRow.slug ?? productRow.id,
        };
      }),
    );

    const totalAmount = normalizedItems.reduce(
      (sum, it) => sum + Number(it.price) * Number(it.quantity),
      0,
    );
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      throw new Error("Невалидна сума на поръчката.");
    }

    const safePayload = {
      ...body,
      amount: Number(totalAmount.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      items: normalizedItems,
      cart: body.cart
        ? {
            ...body.cart,
            items: normalizedItems.map((it) => ({
              productId: it.productId,
              name: it.name,
              qty: it.quantity,
              price: it.price,
              currency: "BGN",
              options: it.options,
            })),
          }
        : undefined,
    };

    await saveOrderWithAudit(safePayload, body.customer.email);

    const redirect = createMyposCheckout({
      ...safePayload,
      amount: safePayload.amount,
      cart: safePayload.cart,
    });
    return NextResponse.json({ form: redirect });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed.";
    console.error("Checkout error:", message, error);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
