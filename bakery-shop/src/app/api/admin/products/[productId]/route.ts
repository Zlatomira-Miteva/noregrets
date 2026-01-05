import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { logAudit } from "@/lib/audit";
import { isActiveAdmin } from "@/lib/authz";
import { pgPool } from "@/lib/pg";
import { ensureProductSchema } from "@/lib/product-schema";

const updateSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  weight: z.string().nullable().optional(),
  weightSmall: z.string().nullable().optional(),
  weightLarge: z.string().nullable().optional(),
  leadTime: z.string().optional(),
  heroImage: z.string().optional(),
  price: z.number().optional(),
  priceSmall: z.number().nullable().optional(),
  priceLarge: z.number().nullable().optional(),
  status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]).optional(),
  galleryImages: z.array(z.string().min(1)).optional(),
  categoryImages: z.array(z.string().min(1)).optional(),
  variantName: z.string().optional(),
  categoryId: z
    .preprocess(
      (val) => (typeof val === "string" ? val.trim() : val),
      z.string().min(1),
    )
    .optional(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(_: Request, { params }: { params: any }) {
  const session = await getServerSession(authOptions);
  if (!isActiveAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureProductSchema();
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
        priceSmall: product.priceSmall != null ? Number(product.priceSmall) : null,
        priceLarge: product.priceLarge != null ? Number(product.priceLarge) : null,
        weightSmall: product.weightSmall,
        weightLarge: product.weightLarge,
        heroImage: product.heroImage ?? null,
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
  if (!isActiveAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
  }

  await ensureProductSchema();
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    const existingRes = await client.query(`SELECT * FROM "Product" WHERE id=$1 LIMIT 1`, [params.productId]);
    if (!existingRes.rows.length) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const existing = existingRes.rows[0];

    const gallery = parsed.data.galleryImages;
    const categoryImages = parsed.data.categoryImages;

    const finalHero = (parsed.data.heroImage ?? existing.heroimage ?? null) ?? (gallery?.[0] ?? null);
    const pickProvided = <T,>(incoming: T | undefined, existingValue: T) =>
      incoming === undefined ? existingValue : incoming;

    const nextProduct = {
      name: parsed.data.name ?? existing.name,
      slug: parsed.data.slug ?? existing.slug,
      shortDescription: parsed.data.shortDescription ?? existing.shortDescription ?? existing.shortdescription ?? null,
      description: parsed.data.description ?? existing.description ?? null,
      weight: pickProvided(parsed.data.weight, existing.weight ?? null),
      weightSmall: pickProvided(parsed.data.weightSmall, existing.weightSmall ?? existing.weightsmall ?? null),
      weightLarge: pickProvided(parsed.data.weightLarge, existing.weightLarge ?? existing.weightlarge ?? null),
      leadTime: pickProvided(parsed.data.leadTime, existing.leadTime ?? existing.leadtime ?? null),
      heroImage: finalHero,
      price: pickProvided(parsed.data.price, Number(existing.price)),
      priceSmall: pickProvided(
        parsed.data.priceSmall,
        existing.priceSmall != null ? Number(existing.priceSmall) : null,
      ),
      priceLarge: pickProvided(
        parsed.data.priceLarge,
        existing.priceLarge != null ? Number(existing.priceLarge) : null,
      ),
      status: parsed.data.status ?? existing.status,
      categoryId: parsed.data.categoryId ?? existing.categoryId ?? existing.categoryid,
    };

    const updateRes = await client.query(
      `UPDATE "Product"
       SET name=$1, slug=$2, "shortDescription"=$3, description=$4, weight=$5, "weightSmall"=$6, "weightLarge"=$7, "leadTime"=$8, "heroImage"=$9, price=$10, "priceSmall"=$11, "priceLarge"=$12, status=$13, "categoryId"=$14, "updatedAt"=NOW()
       WHERE id=$15
       RETURNING *`,
      [
        nextProduct.name,
        nextProduct.slug,
        nextProduct.shortDescription,
        nextProduct.description,
        nextProduct.weight,
        nextProduct.weightSmall,
        nextProduct.weightLarge,
        nextProduct.leadTime,
        nextProduct.heroImage,
        nextProduct.price,
        nextProduct.priceSmall,
        nextProduct.priceLarge,
        nextProduct.status,
        nextProduct.categoryId,
        params.productId,
      ],
    );
    const product = updateRes.rows[0];

    if (gallery) {
      await client.query(`DELETE FROM "ProductImage" WHERE "productId" = $1`, [product.id]);
      const ids = gallery.map(() => randomUUID());
      const productIds = gallery.map(() => product.id);
      const alts = gallery.map(() => product.name);
      const positions = gallery.map((_, idx) => idx);
      await client.query(
        `INSERT INTO "ProductImage" (id,"productId",url,alt,"position")
         SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::int[]) AS t(id, "productId", url, alt, "position")`,
        [ids, productIds, gallery, alts, positions],
      );
    }

    if (categoryImages) {
      await client.query(`DELETE FROM "ProductCategoryImage" WHERE "productId" = $1`, [product.id]);
      const ids = categoryImages.map(() => randomUUID());
      const productIds = categoryImages.map(() => product.id);
      const alts = categoryImages.map(() => product.name);
      const positions = categoryImages.map((_, idx) => idx);
      await client.query(
        `INSERT INTO "ProductCategoryImage" (id,"productId",url,alt,"position")
         SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::int[]) AS t(id, "productId", url, alt, "position")`,
        [ids, productIds, categoryImages, alts, positions],
      );
    }

    if (parsed.data.variantName || parsed.data.price !== undefined || parsed.data.priceSmall !== undefined) {
      const variantsRes = await client.query(
        `SELECT * FROM "ProductVariant" WHERE "productId"=$1 ORDER BY "isDefault" DESC, name ASC LIMIT 1`,
        [product.id],
      );
      const variant = variantsRes.rows[0];
      const nextVariantPrice =
        parsed.data.priceSmall ??
        parsed.data.price ??
        (variant ? Number(variant.price) : nextProduct.price ?? 0);
      if (variant) {
        await client.query(
          `UPDATE "ProductVariant" SET name=$1, price=$2 WHERE id=$3`,
          [parsed.data.variantName ?? variant.name, nextVariantPrice, variant.id],
        );
      } else {
        await client.query(
          `INSERT INTO "ProductVariant" (id,"productId",name,price,"isDefault") VALUES ($1,$2,$3,$4,true)`,
          [randomUUID(), product.id, parsed.data.variantName ?? product.name, nextVariantPrice],
        );
      }
    }

    await client.query("COMMIT");
    await logAudit({
      entity: "product",
      entityId: product.id,
      action: "product_updated",
      oldValue: existing,
      newValue: { ...product, heroImage: nextProduct.heroImage ?? product.heroimage },
      operatorCode: session?.user?.operatorCode ?? session?.user?.email ?? null,
    });
    return NextResponse.json({ product: { ...product, heroImage: nextProduct.heroImage ?? product.heroimage } });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to update product", error);
    return NextResponse.json({ error: "Неуспешно обновяване." }, { status: 500 });
  } finally {
    client.release();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(_: Request, { params }: { params: any }) {
  const session = await getServerSession(authOptions);
  if (!isActiveAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await pgPool.query(`SELECT * FROM "Product" WHERE id=$1 LIMIT 1`, [params.productId]);
  if (!res.rows.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const product = res.rows[0];
  await pgPool.query(`UPDATE "Product" SET status='ARCHIVED', "updatedAt"=NOW() WHERE id=$1`, [params.productId]);
  await logAudit({
    entity: "product",
    entityId: params.productId,
    action: "product_archived_instead_of_delete",
    oldValue: product,
    newValue: { ...product, status: "ARCHIVED" },
    operatorCode: session?.user?.operatorCode ?? session?.user?.email ?? null,
  });

  return NextResponse.json({ ok: true, status: "ARCHIVED" });
}
