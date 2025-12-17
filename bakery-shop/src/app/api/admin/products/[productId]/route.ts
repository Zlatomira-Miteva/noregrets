import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { pgPool } from "@/lib/pg";

const updateSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  weight: z.string().optional(),
  leadTime: z.string().optional(),
  heroImage: z.string().optional(),
  price: z.number().optional(),
  status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]).optional(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(_: Request, { params }: { params: any }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await pgPool.connect();
  try {
    const productRes = await client.query(`SELECT * FROM "Product" WHERE id=$1 LIMIT 1`, [params.productId]);
    if (!productRes.rows.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const product = productRes.rows[0];

    const images = await client.query(
      `SELECT * FROM "ProductImage" WHERE "productId"=$1 ORDER BY "position" ASC`,
      [product.id],
    );
    const categoryImages = await client.query(
      `SELECT * FROM "ProductCategoryImage" WHERE "productId"=$1 ORDER BY "position" ASC`,
      [product.id],
    );
    const variants = await client.query(
      `SELECT * FROM "ProductVariant" WHERE "productId"=$1 ORDER BY "isDefault" DESC, name ASC`,
      [product.id],
    );

    return NextResponse.json({
      product: {
        ...product,
        price: Number(product.price),
        images: images.rows,
        categoryImages: categoryImages.rows,
        variants: variants.rows.map((v) => ({ ...v, price: Number(v.price) })),
      },
    });
  } catch (error) {
    console.error("Failed to load product", error);
    return NextResponse.json({ error: "Неуспешно зареждане." }, { status: 500 });
  } finally {
    client.release();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(request: Request, { params }: { params: any }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
  }

  const fields: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const values: any[] = [];
  let idx = 1;
  Object.entries(parsed.data).forEach(([key, value]) => {
    if (value !== undefined) {
      if (key === "price") {
        fields.push(`${key}=$${++idx}`);
        values.push(Number(value));
      } else {
        fields.push(`"${key}"=$${++idx}`);
        values.push(value);
      }
    }
  });

  if (!fields.length) {
    return NextResponse.json({ error: "Няма промени." }, { status: 400 });
  }

  const query = `UPDATE "Product" SET ${fields.join(",")}, "updatedAt"=NOW() WHERE id=$1 RETURNING *`;
  const res = await pgPool.query(query, [params.productId, ...values]);
  if (!res.rows.length) {
    return NextResponse.json({ error: "Поръчката не е намерена." }, { status: 404 });
  }

  return NextResponse.json({ product: res.rows[0] });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(_: Request, { params }: { params: any }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await pgPool.query(`DELETE FROM "Product" WHERE id=$1`, [params.productId]);
  return NextResponse.json({ ok: true });
}
