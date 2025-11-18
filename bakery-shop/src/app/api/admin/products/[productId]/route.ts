import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/db";
import { authOptions } from "@/auth";

const updateSchema = z
  .object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    weight: z.string().optional(),
    leadTime: z.string().optional(),
    heroImage: z.string().optional(),
    galleryImages: z.array(z.string().min(1)).optional(),
    categoryImages: z.array(z.string().min(1)).optional(),
    price: z.number().positive().optional(),
    categoryId: z.string().min(1).optional(),
    image: z.string().min(1).optional(),
    status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]).optional(),
    variantName: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Няма подадени полета за промяна.",
  });

const slugify = (value: string) =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-я]+/gi, "-")
    .replace(/^-+|-+$/g, "");

export async function GET(_: Request, { params }: { params: { productId: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    include: {
      category: true,
      images: { orderBy: { position: "asc" } },
      categoryImages: { orderBy: { position: "asc" } },
      variants: { orderBy: [{ isDefault: "desc" }, { name: "asc" }] },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Продуктът не е намерен." }, { status: 404 });
  }

  return NextResponse.json({
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      description: product.description,
      weight: product.weight,
      leadTime: product.leadTime,
      heroImage: product.heroImage,
      galleryImages: product.images.map((img) => img.url),
      categoryImages: product.categoryImages.map((img) => img.url),
      price: Number(product.price),
      status: product.status,
      categoryId: product.categoryId,
      categoryName: product.category.name,
      variantName: product.variants[0]?.name ?? "",
    },
  });
}

export async function PATCH(request: Request, { params }: { params: { productId: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    include: {
      images: { orderBy: { position: "asc" } },
      categoryImages: { orderBy: { position: "asc" } },
      variants: { orderBy: [{ isDefault: "desc" }, { name: "asc" }] },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Продуктът не е намерен." }, { status: 404 });
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
  const finalSlug = slug ? slugify(slug) : undefined;
  const data: Prisma.ProductUpdateInput = {};

  if (name) data.name = name;
  if (finalSlug) data.slug = finalSlug;
  if (shortDescription !== undefined) data.shortDescription = shortDescription;
  if (description !== undefined) data.description = description;
  if (weight !== undefined) data.weight = weight;
  if (leadTime !== undefined) data.leadTime = leadTime;
  if (heroImage !== undefined) data.heroImage = heroImage;
  if (categoryId) data.category = { connect: { id: categoryId } };
  if (status) data.status = status;
  if (price !== undefined) {
    data.price = new Prisma.Decimal(price);
  }

  if (galleryImages) {
    data.images = {
      deleteMany: {},
      create: galleryImages.map((url, index) => ({
        url,
        alt: name ?? product.name,
        position: index,
      })),
    };
  }

  if (categoryImages) {
    data.categoryImages = {
      deleteMany: {},
      create: categoryImages.map((url, index) => ({
        url,
        alt: name ?? product.name,
        position: index,
      })),
    };
  }

  if (variantName || price !== undefined) {
    if (product.variants[0]) {
      data.variants = {
        update: {
          where: { id: product.variants[0].id },
          data: {
            name: variantName ?? product.variants[0].name,
            ...(price !== undefined ? { price: new Prisma.Decimal(price) } : {}),
          },
        },
      };
    } else if (variantName || price !== undefined) {
      data.variants = {
        create: [
          {
            name: variantName || product.name,
            price: new Prisma.Decimal(price ?? Number(product.price)),
            isDefault: true,
          },
        ],
      };
    }
  }

  const updated = await prisma.product.update({
    where: { id: params.productId },
    data,
  });

  return NextResponse.json({ product: updated });
}

export async function DELETE(_: Request, { params }: { params: { productId: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.product.delete({
      where: { id: params.productId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product", error);
    return NextResponse.json({ error: "Неуспешно изтриване на продукта." }, { status: 500 });
  }
}
