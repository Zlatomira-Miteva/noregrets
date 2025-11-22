import { prisma } from "@/lib/db";

export type ProductRecord = {
  slug: string;
  name: string;
  description: string;
  weight: string;
  leadTime: string;
  price: number;
  heroImage: string;
  galleryImages: string[];
};

export type CookieOptionRecord = {
  id: string;
  slug: string;
  name: string;
  image: string;
};

const normalizeImagePath = (value?: string | null) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
    return encodeURI(value);
  }
  return encodeURI(`/${value}`);
};

export const getProductBySlug = async (slug: string): Promise<ProductRecord | null> => {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
    },
  });

  if (!product) {
    return null;
  }

  const gallery = product.images.length ? product.images.map((img) => normalizeImagePath(img.url)) : [];

  return {
    slug: product.slug,
    name: product.name,
    description: product.description ?? product.shortDescription ?? "",
    weight: product.weight ?? "",
    leadTime: product.leadTime ?? "",
    price: Number(product.price),
    heroImage: normalizeImagePath(product.heroImage ?? product.images[0]?.url),
    galleryImages: gallery.length ? gallery : [normalizeImagePath(product.heroImage ?? product.images[0]?.url)],
  };
};

export const getCookieOptions = async (): Promise<CookieOptionRecord[]> => {
  const options = await prisma.cookieOption.findMany({
    orderBy: { createdAt: "asc" },
  });

  return options.map((option) => ({
    id: option.id,
    slug: option.slug,
    name: option.name,
    image: normalizeImagePath(option.image),
  }));
};
