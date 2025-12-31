import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { ensureCustomerSchema } from "@/lib/customer-schema";
import { pgPool } from "@/lib/pg";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await pgPool.query(
    `SELECT f."productId", f."createdAt", p.name, p.slug, p.price, p."heroImage", p."status"
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
  if (!productId) {
    return NextResponse.json({ error: "productId е задължителен." }, { status: 400 });
  }

  const client = await pgPool.connect();
  try {
    await ensureCustomerSchema(client);
    await client.query(
      `INSERT INTO "UserFavorite" (id,"userId","productId") VALUES ($1,$2,$3)
       ON CONFLICT ("userId","productId") DO NOTHING`,
      [randomUUID(), session.user.id, productId],
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[favorites] add error", error);
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
  if (!productId) {
    return NextResponse.json({ error: "productId е задължителен." }, { status: 400 });
  }

  await pgPool.query(`DELETE FROM "UserFavorite" WHERE "userId"=$1 AND "productId"=$2`, [
    session.user.id,
    productId,
  ]);
  return NextResponse.json({ ok: true });
}
