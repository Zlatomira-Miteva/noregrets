import { pgPool } from "@/lib/pg";
import { ensureProductSchema } from "@/lib/product-schema";

export type ProductRecord = {
  slug: string;
  name: string;
  description: string;
  shortDescription?: string;
  weight: string;
  weightSmall?: string;
  weightLarge?: string;
  leadTime: string;
  price: number;
  priceSmall?: number | null;
  priceLarge?: number | null;
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
    await ensureProductSchema(client);
    const productRes = await client.query(
      `SELECT id,
              slug,
              name,
              "shortDescription" AS "shortDescription",
              description,
              weight,
              "leadTime" AS "leadTime",
              "heroImage" AS "heroImage",
              price,
              "priceSmall" AS "priceSmall",
              "priceLarge" AS "priceLarge",
              "weightSmall" AS "weightSmall",
              "weightLarge" AS "weightLarge"
       FROM "Product"
       WHERE slug = $1
       LIMIT 1`,
      [slug],
    );
    const product = productRes.rows[0] as
      | {
          id: string;
          slug: string;
          name: string;
          shortDescription?: string | null;
          description?: string | null;
          weight?: string | null;
          weightSmall?: string | null;
          weightLarge?: string | null;
          leadTime?: string | null;
          heroImage?: string | null;
          price: number;
          priceSmall?: number | null;
          priceLarge?: number | null;
        }
      | undefined;
    if (!product) return null;

    const imagesRes = await client.query(
      `SELECT url FROM "ProductImage" WHERE "productId" = $1 ORDER BY "position" ASC`,
      [product.id],
    );
    const gallery = imagesRes.rows.map((row) => normalizeImagePath(row.url));

    const hero = normalizeImagePath(product.heroImage ?? imagesRes.rows[0]?.url);

    return {
      slug: product.slug,
      name: product.name,
      description: product.description ?? product.shortDescription ?? "",
      shortDescription: product.shortDescription ?? undefined,
      weight: product.weight ?? "",
      weightSmall: product.weightSmall ?? undefined,
      weightLarge: product.weightLarge ?? undefined,
      leadTime: product.leadTime ?? "",
      price: Number(product.price),
      priceSmall: product.priceSmall != null ? Number(product.priceSmall) : null,
      priceLarge: product.priceLarge != null ? Number(product.priceLarge) : null,
      heroImage: hero,
      galleryImages: gallery.length ? gallery : [hero],
    };
  } finally {
    client.release();
  }
};

export const getProductsByCategorySlug = async (categorySlug: string): Promise<ProductRecord[]> => {
  await ensureProductSchema();
  const res = await pgPool.query(
    `SELECT p.slug,
            p.name,
            p.description,
            p."shortDescription" AS "shortDescription",
            p.weight,
            p."weightSmall",
            p."weightLarge",
            p."leadTime" AS "leadTime",
            p."heroImage" AS "heroImage",
            p.price,
            p."priceSmall",
            p."priceLarge",
            p."createdAt"
     FROM "Product" p
     JOIN "ProductCategory" c ON p."categoryId" = c.id
     WHERE c.slug = $1 AND p.status = 'PUBLISHED'
     ORDER BY p."createdAt" ASC`,
    [categorySlug],
  );

  return res.rows.map((product) => {
    const hero = normalizeImagePath(product.heroImage);
    return {
      slug: product.slug as string,
      name: product.name as string,
      description: (product.description as string | null) ?? (product.shortDescription as string | null) ?? "",
      shortDescription: (product.shortDescription as string | null) ?? undefined,
      weight: (product.weight as string | null) ?? "",
      weightSmall: (product.weightSmall as string | null) ?? undefined,
      weightLarge: (product.weightLarge as string | null) ?? undefined,
      leadTime: (product.leadTime as string | null) ?? "",
      price: Number(product.price),
      priceSmall: product.priceSmall != null ? Number(product.priceSmall) : null,
      priceLarge: product.priceLarge != null ? Number(product.priceLarge) : null,
      heroImage: hero,
      galleryImages: hero ? [hero] : [],
    };
  });
};

export const getCookieOptions = async (): Promise<CookieOptionRecord[]> => {
  // Source cookie options directly from the Product table to avoid duplication with CookieOption.
  const res = await pgPool.query(
    `SELECT p.id,
            p.slug,
            p.name,
            p.price,
            COALESCE(p."heroImage", pi.url) AS image
     FROM "Product" p
     JOIN "ProductCategory" c ON p."categoryId" = c.id
     LEFT JOIN LATERAL (
       SELECT url FROM "ProductImage" WHERE "productId" = p.id ORDER BY position ASC LIMIT 1
     ) pi ON true
     WHERE c.slug = 'cookies' AND p.status = 'PUBLISHED'
     ORDER BY p."createdAt" ASC`,
  );

  return res.rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    image: normalizeImagePath(row.image),
    price: Number(row.price ?? 0),
  }));
};
