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
  const [productRows, jars] = await Promise.all([
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
  let products = productRows;

  const desiredImages: Record<string, string> = {
    "cake-jar-red-velvet": "red-velvet-cake-jar.png",
    "cake-jar-mascarpone-raspberry": "mascarpone-raspberry-cake-jar.png",
  };

  for (const [slug, heroImage] of Object.entries(desiredImages)) {
    const product = products.find((entry) => entry.slug === slug);
    if (product && product.heroImage !== heroImage) {
      await prisma.product.update({
        where: { id: product.id },
        data: { heroImage },
      });
      product.heroImage = heroImage;
    }
  }

  const jarMap = new Map(jars.map((jar) => [jar.slug, jar]));

  const response = products.map((product) => {
    const baseSlug = product.slug.replace(/^cake-jar-/, "");
    const jar = jarMap.get(baseSlug);
    const gallery = product.images.map((img) => img.url);
    const categoryImages = product.categoryImages.map((img) => img.url);
    const normalizedHero = normalizeImagePath(product.heroImage ?? jar?.image ?? "");
    const primaryImage = normalizedHero || normalizeImagePath(gallery[0] ?? jar?.image ?? "");

    const normalizedGallery = [
      primaryImage,
      ...gallery.map(normalizeImagePath).filter((img) => img !== primaryImage),
    ];

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description ?? jar?.description ?? "",
      layers: jar?.layers ?? [],
      image: primaryImage,
      price: Number(product.price),
      weight: product.weight ?? "",
      leadTime: product.leadTime ?? "",
      heroImage: primaryImage,
      galleryImages: normalizedGallery,
      categoryImages: categoryImages.map(normalizeImagePath),
    };
  });

  return NextResponse.json(response);
}
