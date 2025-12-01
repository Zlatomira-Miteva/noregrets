import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

const normalizeImagePath = (value: string | null | undefined) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
    return value;
  }
  return `/${value.replace(/^\/+/, "")}`;
};

const extractSlug = (request: NextRequest) => {
  const parts = request.nextUrl.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1]?.toLowerCase();
};

export async function GET(request: NextRequest) {
  const slug = extractSlug(request);
  if (!slug) {
    return NextResponse.json({ error: "Липсва продукт." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      images: { orderBy: { position: "asc" } },
      categoryImages: { orderBy: { position: "asc" } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Продуктът не е намерен." }, { status: 404 });
  }

  const galleryImages = product.images.map((img) => normalizeImagePath(img.url));
  const categoryImages = product.categoryImages.map((img) => normalizeImagePath(img.url));

  return NextResponse.json({
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    weight: product.weight ?? "",
    leadTime: product.leadTime ?? "",
    heroImage: normalizeImagePath(product.heroImage ?? galleryImages[0] ?? ""),
    price: Number(product.price),
    status: product.status,
    galleryImages,
    categoryImages,
    category: product.category,
  });
}
