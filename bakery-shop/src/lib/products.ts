import { pgPool } from "@/lib/pg";

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
  price: number;
};

const normalizeImagePath = (value?: string | null) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
    return encodeURI(value);
  }
  return encodeURI(`/${value}`);
};

export const getProductBySlug = async (slug: string): Promise<ProductRecord | null> => {
  const client = await pgPool.connect();
  try {
    const productRes = await client.query(
      `SELECT * FROM "Product" WHERE slug = $1 LIMIT 1`,
      [slug],
    );
    const product = productRes.rows[0];
    if (!product) return null;

    const imagesRes = await client.query(
      `SELECT url FROM "ProductImage" WHERE "productId" = $1 ORDER BY "position" ASC`,
      [product.id],
    );
    const gallery = imagesRes.rows.map((row) => normalizeImagePath(row.url));

    const hero = normalizeImagePath(product.heroimage ?? imagesRes.rows[0]?.url);

    return {
      slug: product.slug,
      name: product.name,
      description: product.description ?? product.shortdescription ?? "",
      weight: product.weight ?? "",
      leadTime: product.leadtime ?? "",
      price: Number(product.price),
      heroImage: hero,
      galleryImages: gallery.length ? gallery : [hero],
    };
  } finally {
    client.release();
  }
};

export const getCookieOptions = async (): Promise<CookieOptionRecord[]> => {
  const res = await pgPool.query(
    `SELECT id, slug, name, image, price FROM "CookieOption" ORDER BY "createdAt" ASC`,
  );

  return res.rows.map((option) => ({
    id: option.id,
    slug: option.slug,
    name: option.name,
    image: normalizeImagePath(option.image),
    price: Number(option.price ?? 0),
  }));
};
