import { NextResponse } from "next/server";

import { pgPool } from "@/lib/pg";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(_: Request, { params }: any) {
  try {
    const slug = params?.slug?.toString();
    if (!slug) {
      return NextResponse.json({ error: "Missing category." }, { status: 400 });
    }

    const client = await pgPool.connect();
    try {
      const categoryRes = await client.query(
        `SELECT * FROM "ProductCategory" WHERE slug = $1 LIMIT 1`,
        [slug],
      );
      const category = categoryRes.rows[0];
      if (!category) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const productsRes = await client.query(
        `SELECT * FROM "Product" WHERE "categoryId" = $1 ORDER BY "createdAt" ASC`,
        [category.id],
      );
      const ids = productsRes.rows.map((p) => p.id);
      const imagesRes = ids.length
        ? await client.query(
            `SELECT "productId", url, alt, position FROM "ProductImage" WHERE "productId" = ANY($1::text[]) ORDER BY "position" ASC`,
            [ids],
          )
        : { rows: [] };

      return NextResponse.json({
        category,
        products: productsRes.rows.map((p) => ({
          ...p,
          price: Number(p.price),
          images: imagesRes.rows.filter((img) => img.productid === p.id),
        })),
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Failed to load category products", error);
    return NextResponse.json({ error: "Неуспешно зареждане на продуктите." }, { status: 500 });
  }
}
