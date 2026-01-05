import { NextResponse } from "next/server";

import { pgPool } from "@/lib/pg";
import { ensureProductSchema } from "@/lib/product-schema";

export async function GET(_: Request, context: { params: Promise<{ slug?: string }> }) {
  try {
    const { slug } = await context.params;
    const normalizedSlug = slug?.toString();
    if (!normalizedSlug) {
      return NextResponse.json({ error: "Missing product." }, { status: 400 });
    }

    const client = await pgPool.connect();
    try {
      await ensureProductSchema(client);
      const productRes = await client.query(
        `SELECT p.*, c.name as category_name FROM "Product" p
         LEFT JOIN "ProductCategory" c ON p."categoryId" = c.id
         WHERE p.slug = $1 LIMIT 1`,
        [normalizedSlug],
      );
      const product = productRes.rows[0];
      if (!product) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const imagesRes = await client.query(
        `SELECT url, alt, position FROM "ProductImage" WHERE "productId" = $1 ORDER BY "position" ASC`,
        [product.id],
      );
      const categoryImagesRes = await client.query(
        `SELECT url, alt, position FROM "ProductCategoryImage" WHERE "productId" = $1 ORDER BY "position" ASC`,
        [product.id],
      );
      const variantsRes = await client.query(
        `SELECT * FROM "ProductVariant" WHERE "productId" = $1 ORDER BY "isDefault" DESC, name ASC`,
        [product.id],
      );

      return NextResponse.json({
        product: {
          ...product,
          price: Number(product.price),
          priceSmall: product.priceSmall != null ? Number(product.priceSmall) : null,
          priceLarge: product.priceLarge != null ? Number(product.priceLarge) : null,
          weightSmall: product.weightSmall ?? null,
          weightLarge: product.weightLarge ?? null,
          images: imagesRes.rows,
          categoryImages: categoryImagesRes.rows,
          variants: variantsRes.rows.map((v) => ({ ...v, price: Number(v.price) })),
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Failed to load product", error);
    return NextResponse.json({ error: "Неуспешно зареждане на продукта." }, { status: 500 });
  }
}
