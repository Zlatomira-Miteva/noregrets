import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { logAudit } from "@/lib/audit";
import { isActiveAdmin } from "@/lib/authz";
import { pgPool } from "@/lib/pg";

const productSchema = z.object({
  name: z.string().min(2, "Въведете име."),
  slug: z.string().min(2).optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  weight: z.string().optional(),
  leadTime: z.string().optional(),
  heroImage: z.string().optional(),
  galleryImages: z.array(z.string().min(1)).optional(),
  categoryImages: z.array(z.string().min(1)).optional(),
  price: z.number().positive("Цената трябва да е положително число."),
  categoryId: z.string().min(1, "Изберете категория."),
  status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]).optional(),
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
  if (!isActiveAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const productsRes = await pgPool.query(
      `SELECT p.*, c.name as category_name FROM "Product" p
       LEFT JOIN "ProductCategory" c ON p."categoryId" = c.id
       ORDER BY p."createdAt" DESC`,
    );
    const ids = productsRes.rows.map((p) => p.id);
    const imagesRes = ids.length
      ? await pgPool.query(
          `SELECT * FROM "ProductImage" WHERE "productId" = ANY($1::text[]) ORDER BY "position" ASC`,
          [ids],
        )
      : { rows: [] };
    const catImagesRes = ids.length
      ? await pgPool.query(
          `SELECT * FROM "ProductCategoryImage" WHERE "productId" = ANY($1::text[]) ORDER BY "position" ASC`,
          [ids],
        )
      : { rows: [] };
    const variantsRes = ids.length
      ? await pgPool.query(
          `SELECT * FROM "ProductVariant" WHERE "productId" = ANY($1::text[]) ORDER BY "isDefault" DESC, name ASC`,
          [ids],
        )
      : { rows: [] };

    return NextResponse.json({
      products: productsRes.rows.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        status: product.status,
        categoryName: product.category_name,
        categoryId: product.categoryId,
        shortDescription: product.shortdescription,
        description: product.description,
        weight: product.weight,
        leadTime: product.leadtime,
        heroImage: product.heroimage ?? imagesRes.rows.find((img) => img.productid === product.id)?.url ?? null,
        galleryImages: imagesRes.rows.filter((img) => img.productid === product.id).map((img) => img.url),
        categoryImages: catImagesRes.rows.filter((img) => img.productid === product.id).map((img) => img.url),
        variantName: variantsRes.rows.find((v) => v.productid === product.id)?.name ?? "",
      })),
    });
  } catch (error) {
    console.error("Failed to load products", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Неуспешно зареждане на продуктите." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isActiveAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = productSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
  }

  const {
    name,
    slug,
    shortDescription,
    description,
    weight,
    leadTime,
    heroImage,
    galleryImages,
    categoryImages,
    price,
    categoryId,
    status,
    variantName,
  } = parsed.data;
  const finalSlug = slug?.trim() || slugify(name);

  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    const productId = randomUUID();
    const productInsert = await client.query(
      `INSERT INTO "Product" (id, slug, name, "shortDescription", description, weight, "leadTime", "heroImage", price, status, "categoryId", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, NOW())
       RETURNING *`,
      [
        productId,
        finalSlug,
        name,
        shortDescription ?? null,
        description ?? null,
        weight ?? null,
        leadTime ?? null,
        heroImage ?? null,
        price,
        status ?? "PUBLISHED",
        categoryId,
      ],
    );
    const product = productInsert.rows[0];

    if (galleryImages?.length) {
      const galleryIds = galleryImages.map(() => randomUUID());
      const galleryProductIds = galleryImages.map(() => product.id);
      const galleryAlt = galleryImages.map(() => name);
      const galleryPositions = galleryImages.map((_, idx) => idx);
      await client.query(
        `INSERT INTO "ProductImage" (id,"productId",url,alt,"position")
         SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::int[]) AS t(id, "productId", url, alt, "position")`,
        [galleryIds, galleryProductIds, galleryImages, galleryAlt, galleryPositions],
      );
    }

    if (categoryImages?.length) {
      const categoryImageIds = categoryImages.map(() => randomUUID());
      const categoryProductIds = categoryImages.map(() => product.id);
      const categoryAlts = categoryImages.map(() => name);
      const categoryPositions = categoryImages.map((_, idx) => idx);
      await client.query(
        `INSERT INTO "ProductCategoryImage" (id,"productId",url,alt,"position")
         SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::int[]) AS t(id, "productId", url, alt, "position")`,
        [categoryImageIds, categoryProductIds, categoryImages, categoryAlts, categoryPositions],
      );
    }

    await client.query(
      `INSERT INTO "ProductVariant" (id,"productId",name,price,"isDefault")
       VALUES ($1, $2, $3, $4, true)`,
      [randomUUID(), product.id, variantName || name, price],
    );

    await client.query("COMMIT");
    await logAudit({
      entity: "product",
      entityId: product.id,
      action: "product_created",
      newValue: product,
      operatorCode: session?.user?.operatorCode ?? session?.user?.email ?? null,
    });
    return NextResponse.json({ product }, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    await client.query("ROLLBACK");
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Продукт със същия slug вече съществува." }, { status: 409 });
    }
    console.error("Failed to create product", error);
    return NextResponse.json({ error: "Неуспешно създаване на продукт." }, { status: 500 });
  } finally {
    client.release();
  }
}
