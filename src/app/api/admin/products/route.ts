import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { pgPool } from "@/lib/pg";

const productSchema = z.object({
  name: z.string().min(2, "Въведете име."),
  slug: z.string().min(2).optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive("Цената трябва да е положително число."),
  categoryId: z.string().min(1, "Изберете категория."),
  image: z.string().min(1, "Добавете изображение."),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  variantName: z.string().optional(),
});

const slugify = (value: string) =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-я]+/gi, "-")
    .replace(/^-+|-+$/g, "");

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await pgPool.query(
      `SELECT p.id, p.name, p.slug, p.price, p.status, c.name AS category_name
       FROM "Product" p
       LEFT JOIN "ProductCategory" c ON p."categoryId" = c.id
       ORDER BY p."createdAt" DESC`,
    );
    const payload = res.rows.map((product: any) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      status: product.status,
      categoryName: product.category_name ?? "",
    }));
    return NextResponse.json({ products: payload });
  } catch (error) {
    console.error("Failed to load products", error);
    return NextResponse.json({ error: "Неуспешно зареждане на продуктите." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = productSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
  }

  const { name, slug, shortDescription, description, price, categoryId, image, status, variantName } = parsed.data;
  const finalSlug = slug?.trim() || slugify(name);

  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    const productInsert = await client.query(
      `INSERT INTO "Product" (id, slug, name, "shortDescription", description, price, status, "categoryId", "heroImage", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        finalSlug,
        name,
        shortDescription ?? null,
        description ?? null,
        price,
        status ?? "PUBLISHED",
        categoryId,
        image,
      ],
    );
    const product = productInsert.rows[0];

    await client.query(
      `INSERT INTO "ProductImage" (id,"productId",url,alt,"position")
       VALUES (gen_random_uuid()::text, $1, $2, $3, 0)`,
      [product.id, image, name],
    );

    await client.query(
      `INSERT INTO "ProductVariant" (id,"productId",name,price,"isDefault")
       VALUES (gen_random_uuid()::text, $1, $2, $3, true)`,
      [product.id, variantName || name, price],
    );

    await client.query("COMMIT");
    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    await client.query("ROLLBACK");
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Продуктът вече съществува." }, { status: 409 });
    }
    console.error("Failed to create product", error);
    return NextResponse.json({ error: "Неуспешно създаване на продукт." }, { status: 500 });
  } finally {
    client.release();
  }
}
