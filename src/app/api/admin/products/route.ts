import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/db";
import { authOptions } from "@/auth";

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

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  const payload = products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Number(product.price),
    status: product.status,
    categoryName: product.category?.name ?? "",
  }));

  return NextResponse.json({ products: payload });
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

  try {
    const product = await prisma.product.create({
      data: {
        name,
        slug: finalSlug,
        shortDescription,
        description,
        price,
        status: status ?? "PUBLISHED",
        categoryId,
        images: {
          create: [{ url: image, alt: name, position: 0 }],
        },
        variants: {
          create: [
            {
              name: variantName || name,
              price,
              isDefault: true,
            },
          ],
        },
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Продуктът вече съществува." }, { status: 409 });
    }
    console.error("Failed to create product", error);
    return NextResponse.json({ error: "Неуспешно създаване на продукт." }, { status: 500 });
  }
}
