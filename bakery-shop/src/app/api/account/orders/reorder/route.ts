import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { pgPool } from "@/lib/pg";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  if (!orderId) {
    return NextResponse.json({ error: "orderId е задължителен" }, { status: 400 });
  }

  const res = await pgPool.query(
    `SELECT items,"customerEmail","userId" FROM "Order" WHERE id=$1 AND ("userId" = $2 OR LOWER("customerEmail") = LOWER($3)) LIMIT 1`,
    [orderId, session.user.id, session.user.email ?? ""],
  );
  if (!res.rows.length) {
    return NextResponse.json({ error: "Поръчката не е намерена" }, { status: 404 });
  }
  const items = Array.isArray(res.rows[0].items) ? res.rows[0].items : [];

  // Fetch current product prices to avoid reusing discounted prices.
  const slugs = items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((it: any) => (typeof it.slug === "string" ? it.slug : typeof it.productId === "string" ? it.productId : null))
    .filter(Boolean) as string[];
  const uniqueSlugs = Array.from(new Set(slugs));
  const priceMap = new Map<string, number>();
  if (uniqueSlugs.length) {
    const prodRes = await pgPool.query(
      `SELECT id, slug, price FROM "Product" WHERE slug = ANY($1) OR id = ANY($1)`,
      [uniqueSlugs],
    );
    for (const row of prodRes.rows) {
      if (row.slug) priceMap.set(row.slug, Number(row.price ?? 0));
      if (row.id) priceMap.set(row.id, Number(row.price ?? 0));
    }
  }

  return NextResponse.json({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: items.map((it: any) => ({
      productId: it.slug ?? it.productId ?? it.name,
      name: it.name,
      qty: Number(it.quantity ?? it.qty ?? 1),
      price:
        priceMap.get(it.slug) ??
        priceMap.get(it.productId) ??
        Number(it.price ?? 0),
      currency: "EUR",
      options: Array.isArray(it.options) ? it.options : [],
    })),
  });
}
