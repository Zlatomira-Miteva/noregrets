import { prisma } from "@/lib/db";

const normalizeImagePath = (value?: string | null) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
    return value;
  }
  return `/${value.replace(/^\/+/, "")}`;
};

export async function getCakeJars() {
  const products = await prisma.product.findMany({
    where: {
      category: { slug: "cake-jars" },
    },
    include: {
      images: { orderBy: { position: "asc" } },
      categoryImages: { orderBy: { position: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  const jars = await prisma.cakeJar.findMany();
  const jarMap = new Map(jars.map((jar) => [jar.slug, jar]));

  return products.map((product) => {
    const baseSlug = product.slug.replace(/^cake-jar-/, "");
    const jar = jarMap.get(baseSlug);
    const normalizedHero = normalizeImagePath(product.heroImage ?? jar?.image ?? "");
    const gallery = product.images.map((img) => normalizeImagePath(img.url));
    const primaryImage = normalizedHero || gallery[0] || "/red-velvet-cake-jar.png";

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description ?? jar?.description ?? "",
      layers: jar?.layers ?? [],
      price: Number(product.price),
      weight: product.weight ?? "",
      leadTime: product.leadTime ?? "",
      heroImage: primaryImage,
      galleryImages: [primaryImage, ...gallery.filter((img) => img !== primaryImage)],
      categoryImages: product.categoryImages.map((img) => normalizeImagePath(img.url)),
    };
  });
}
