import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { pgPool } from "@/lib/pg";
import { ensureCustomerSchema } from "@/lib/customer-schema";
import { computeVariantKey } from "@/lib/favorites";

export const dynamic = "force-dynamic";
const ALLOW_DDL = process.env.ALLOW_SCHEMA_DDL === "1";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ensureFavoritesSchema = async (client: any) => {
  if (!ALLOW_DDL) return;
  try {
    await client.query(
      `DO $$
       BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'UserFavorite' AND column_name = 'variantKey'
         ) THEN
           ALTER TABLE "UserFavorite" ADD COLUMN "variantKey" text;
         END IF;
       END$$;`,
    );

    const legacyConstraint = await client.query(
      `SELECT tc.constraint_name
         FROM information_schema.table_constraints tc
        WHERE tc.table_name = 'UserFavorite'
          AND tc.constraint_type = 'UNIQUE'
          AND tc.constraint_name LIKE 'UserFavorite_userId_productId%'`,
    );
    for (const row of legacyConstraint.rows) {
      await client.query(`ALTER TABLE "UserFavorite" DROP CONSTRAINT IF EXISTS "${row.constraint_name}"`);
    }

    await client.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UserFavorite_user_product_variant_idx"
         ON "UserFavorite" ("userId","productId","variantKey")`,
    );
  } catch (schemaErr) {
    console.warn("[favorites] ensureFavoritesSchema skipped", schemaErr);
  }
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureFavoritesSchema(pgPool);

  const res = await pgPool.query(
    `SELECT f."productId", f."createdAt", f.payload, f."variantKey", p.name, p.slug, p.price, p."heroImage", p."status"
     FROM "UserFavorite" f
     LEFT JOIN "Product" p
       ON p.id = f."productId" OR p.slug = f."productId"
     WHERE f."userId" = $1
     ORDER BY f."createdAt" DESC`,
    [session.user.id],
  );

  return NextResponse.json({
    favorites: res.rows.map((row) => ({
      productId: row.productId,
      name: row.name,
      slug: row.slug,
      price: row.price ? Number(row.price) : null,
      heroImage: row.heroImage,
      status: row.status,
      createdAt: row.createdAt,
      payload: row.payload,
      variantKey: row.variantKey ?? "",
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const payload = typeof body?.payload === "object" && body?.payload !== null ? body.payload : null;
  const variantKey = computeVariantKey(payload);
  if (!productId) {
    return NextResponse.json({ error: "productId е задължителен." }, { status: 400 });
  }

  // Allow only valid products and block single cookie flavors from being favorited.
  const productRes = await pgPool.query(
    `SELECT p.id,
            p.slug,
            p.status,
            c.slug AS "categorySlug"
       FROM "Product" p
       JOIN "ProductCategory" c ON p."categoryId" = c.id
      WHERE p.id = $1 OR p.slug = $1
      LIMIT 1`,
    [productId],
  );

  const product = productRes.rows[0];
  if (!product) {
    return NextResponse.json({ error: "Невалиден продукт." }, { status: 404 });
  }

  if (product.categorySlug === "cookies") {
    return NextResponse.json({ error: "Можеш да запазваш само конфигурирани кутии, не отделни вкусове." }, { status: 400 });
  }

  if (product.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Продуктът не е наличен за запазване." }, { status: 400 });
  }

  const client = await pgPool.connect();
  try {
    await ensureCustomerSchema(client);
    await ensureFavoritesSchema(client);
    const insert = async () =>
      client.query(
        `INSERT INTO "UserFavorite" (id,"userId","productId",payload,"variantKey") VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT ("userId","productId","variantKey") DO UPDATE SET payload = EXCLUDED.payload, "createdAt" = NOW()`,
        [randomUUID(), session.user.id, productId, payload, variantKey],
      );
    try {
      await insert();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // Column missing in prod? Try to create and retry once.
      if (err?.code === "42703") {
        await ensureFavoritesSchema(client);
        await insert();
      } else {
        throw err;
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[favorites] add error", error);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = (error as any)?.code;
    if (code === "23505") {
      return NextResponse.json({ error: "Вече е запазено този вариант." }, { status: 409 });
    }
    return NextResponse.json({ error: "Неуспешно запазване" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const variantKey = typeof body?.variantKey === "string" ? body.variantKey : undefined;
  if (!productId) {
    return NextResponse.json({ error: "productId е задължителен." }, { status: 400 });
  }

  await ensureFavoritesSchema(pgPool);

  if (variantKey) {
    await pgPool.query(
      `DELETE FROM "UserFavorite" WHERE "userId"=$1 AND "productId"=$2 AND "variantKey"=$3`,
      [session.user.id, productId, variantKey],
    );
  } else {
    await pgPool.query(`DELETE FROM "UserFavorite" WHERE "userId"=$1 AND "productId"=$2`, [
      session.user.id,
      productId,
    ]);
  }
  return NextResponse.json({ ok: true });
}
