import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

const normalizeImagePath = (value: string | null | undefined) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
    return value;
  }
  return `/${value.replace(/^\/+/, "")}`;
};

const buildProductHref = (slug: string) => {
  if (slug.startsWith("custom-box-")) {
    const size = slug.replace("custom-box-", "");
    return `/products/custom-box/${size}`;
  }
  return `/products/${slug}`;
};

const extractSlug = (request: NextRequest) => {
  const parts = request.nextUrl.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1]?.toLowerCase();
};

export async function GET(request: NextRequest) {
  const slug = extractSlug(request);
  if (!slug) {
    return NextResponse.json({ error: "Липсва категория." }, { status: 400 });
  }

  const category = await prisma.productCategory.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  if (!category) {
    return NextResponse.json({ error: "Категорията не е намерена." }, { status: 404 });
  }

  const products = await prisma.product.findMany({
    where: { categoryId: category.id, status: "PUBLISHED" },
    include: {
      images: { orderBy: { position: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  const response = products.map((product) => {
    const galleryImages = product.images.map((img) => normalizeImagePath(img.url));
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      shortDescription: product.shortDescription ?? "",
      price: Number(product.price),
      weight: product.weight ?? "",
      leadTime: product.leadTime ?? "",
      image: normalizeImagePath(product.heroImage ?? galleryImages[0] ?? ""),
      galleryImages,
      href: buildProductHref(product.slug),
    };
  });

  return NextResponse.json({
    category,
    products: response,
  });
}
