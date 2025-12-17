import { pgPool } from "@/lib/pg";

const normalizeImagePath = (value?: string | null) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
    return value;
  }
  return `/${value.replace(/^\/+/, "")}`;
};

export async function getCakeJars() {
  const client = await pgPool.connect();
  try {
    const productsRes = await client.query(
      `SELECT p.* FROM "Product" p
       JOIN "ProductCategory" c ON p."categoryId" = c.id
       WHERE c.slug = $1
       ORDER BY p."createdAt" ASC`,
      ["cake-jars"],
    );

    const ids = productsRes.rows.map((row) => row.id);
    const imagesRes = ids.length
      ? await client.query(
          `SELECT "productId", url, "position" FROM "ProductImage" WHERE "productId" = ANY($1::text[]) ORDER BY "position" ASC`,
          [ids],
        )
      : { rows: [] };
    const catImagesRes = ids.length
      ? await client.query(
          `SELECT "productId", url, "position" FROM "ProductCategoryImage" WHERE "productId" = ANY($1::text[]) ORDER BY "position" ASC`,
          [ids],
        )
      : { rows: [] };

    const jarsRes = await client.query(`SELECT * FROM "CakeJar"`);
    const jarMap = new Map(jarsRes.rows.map((jar) => [jar.slug, jar]));

    return productsRes.rows.map((product) => {
      const productImages = imagesRes.rows.filter((img) => img.productid === product.id);
      const categoryImages = catImagesRes.rows.filter((img) => img.productid === product.id);
      const baseSlug = product.slug.replace(/^cake-jar-/, "");
      const jar = jarMap.get(baseSlug);
      const normalizedHero = normalizeImagePath(product.heroimage ?? jar?.image ?? "");
      const gallery = productImages.map((img) => normalizeImagePath(img.url));
      const primaryImage = normalizedHero || gallery[0] || "/red-velvet-cake-jar.png";

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description ?? jar?.description ?? "",
        layers: jar?.layers ?? [],
        price: Number(product.price),
        weight: product.weight ?? "",
        leadTime: product.leadtime ?? "",
        heroImage: primaryImage,
        galleryImages: [primaryImage, ...gallery.filter((img) => img !== primaryImage)],
        categoryImages: categoryImages.map((img) => normalizeImagePath(img.url)),
      };
    });
  } finally {
    client.release();
  }
}
