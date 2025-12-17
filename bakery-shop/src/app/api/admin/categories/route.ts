import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { pgPool } from "@/lib/pg";

const categorySchema = z.object({
  name: z.string().min(2, "Въведете име."),
  slug: z.string().min(2).optional(),
  description: z.string().optional(),
  heroImage: z.string().optional(),
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

  const res = await pgPool.query(`SELECT * FROM "ProductCategory" ORDER BY "createdAt" DESC`);
  return NextResponse.json({ categories: res.rows });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = categorySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
  }

  const { name, slug, description, heroImage } = parsed.data;
  const finalSlug = slug?.trim() || slugify(name);

  try {
    const categoryId = randomUUID();
    const insert = await pgPool.query(
      `INSERT INTO "ProductCategory" (id, slug, name, description, "heroImage", "updatedAt")
       VALUES ($1,$2,$3,$4,$5, NOW())
       RETURNING *`,
      [categoryId, finalSlug, name, description ?? null, heroImage ?? null],
    );

    return NextResponse.json({ category: insert.rows[0] }, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Категорията вече съществува." }, { status: 409 });
    }
    console.error("Failed to create category", error);
    return NextResponse.json({ error: "Неуспешно създаване на категория." }, { status: 500 });
  }
}
