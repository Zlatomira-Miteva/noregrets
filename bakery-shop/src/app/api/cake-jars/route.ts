import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

const normalizeImagePath = (value: string | null | undefined) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
    return value;
  }
  return `/${value.replace(/^\/+/, "")}`;
};

export async function GET() {
  const [products, jars] = await Promise.all([
    prisma.product.findMany({
      where: {
        category: {
          slug: "cake-jars",
        },
      },
      include: {
        images: { orderBy: { position: "asc" } },
        categoryImages: { orderBy: { position: "asc" } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.cakeJar.findMany(),
  ]);

  const jarMap = new Map(jars.map((jar) => [jar.slug, jar]));

  const response = products.map((product) => {
    const baseSlug = product.slug.replace(/^cake-jar-/, "");
    const jar = jarMap.get(baseSlug);
    const gallery = product.images.map((img) => img.url);
    const categoryImages = product.categoryImages.map((img) => img.url);
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description ?? jar?.description ?? "",
      layers: jar?.layers ?? [],
      image: normalizeImagePath(gallery[0] ?? jar?.image ?? ""),
      price: Number(product.price),
      weight: product.weight ?? "",
      leadTime: product.leadTime ?? "",
      heroImage: normalizeImagePath(product.heroImage ?? jar?.image ?? ""),
      galleryImages: gallery.map(normalizeImagePath),
      categoryImages: categoryImages.map(normalizeImagePath),
    };
  });

  return NextResponse.json(response);
}
