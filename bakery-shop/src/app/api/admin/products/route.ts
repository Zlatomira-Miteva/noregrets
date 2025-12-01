import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/db";
import { authOptions } from "@/auth";

const productSchema = z.object({
  name: z.string().min(2, "Въведете име."),
  slug: z.string().min(2).optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  weight: z.string().min(1, "Въведете тегло."),
  leadTime: z.string().min(1, "Въведете време за доставка."),
  heroImage: z.string().min(1, "Въведете hero изображение."),
  galleryImages: z.array(z.string().min(1)).min(1, "Добавете поне едно изображение в галерията."),
  categoryImages: z.array(z.string().min(1)).optional(),
  price: z.number().positive("Цената трябва да е положително число."),
  categoryId: z.string().min(1, "Изберете категория."),
  status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]).optional(),
  variantName: z.string().optional(),
});

const slugify = (value: string) =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-я]+/gi, "-")
    .replace(/^-+|-+$/g, "");

const defaultCakeJarData = [
  {
    slug: "red-velvet",
    name: "Торта червено кадифе",
    description:
      "Ред Велвет блатове, напоени с ванилов сироп и покрити с нежен крем сирене с бял шоколад. Всеки буркан е кадифено сладък и изненадващо лек.",
    layers: ["Ред Велвет блат", "Крема сирене", "Швейцарски крем"],
    image: "red-velvet-cake-jar.png",
    price: 20,
    weight: "220 гр.",
    leadTime: "Доставка до 3 дни",
    heroImage: "red-velvet-cake-jar.png",
    galleryImages: ["red-velvet-cake-jar.png"],
    categoryImages: ["red-velvet-cake-jar.png"],
  },
  {
    slug: "nutella-biscoff",
    name: "Торта Nutella & Biscoff",
    description:
     "Какаови блатове, крем маскарпоне, хрупкави парченца Lotus, крем Lotus и Nutella. Комбинация между дълбок шоколад и карамелен хрупкав слой.",
    layers: ["Шоколадов блат", "Nutella", "Biscoff крем", "Швейцарски крем"],
    image: "nutella-biscoff-cake-jar.png",
    price: 20,
    weight: "220 гр.",
    leadTime: "Доставка до 3 дни",
    heroImage: "nutella-biscoff-cake-jar.png",
    galleryImages: ["nutella-biscoff-cake-jar.png"],
    categoryImages: ["nutella-biscoff-cake-jar.png"],
  },
  {
    slug: "mascarpone-raspberry",
    name: "Торта с маскарпоне и малина",
    description:
      "Въздушен маскарпоне крем, малинов конфитюр и ванилови блатове. Баланс между свежест, малина и копринен крем.",
    layers: ["Ванилов блат", "Малиново сладко", "Маскарпоне и сметана"],
    image: "mascarpone-raspberry-cake-jar.png",
    price: 20,
    weight: "240 гр.",
    leadTime: "Доставка до 3 дни",
    heroImage: "mascarpone-raspberry-cake-jar.png",
    galleryImages: ["mascarpone-raspberry-cake-jar.png"],
    categoryImages: ["mascarpone-raspberry-cake-jar.png"],
  },
];

const ensureProductMetaColumns = async () => {
  await prisma.$executeRaw`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "weight" TEXT`;
  await prisma.$executeRaw`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "leadTime" TEXT`;
  await prisma.$executeRaw`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "heroImage" TEXT`;
  const categoryTableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_name = 'ProductCategoryImage'
    ) as "exists";
  `;
  if (!categoryTableExists[0]?.exists) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "ProductCategoryImage" (
        "id" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "alt" TEXT,
        "position" INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "ProductCategoryImage_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "ProductCategoryImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
  }
};

const ensureCakeJarEntries = async () => {
  await Promise.all(
    defaultCakeJarData.map((jar) =>
      prisma.cakeJar.upsert({
        where: { slug: jar.slug },
        update: {
          name: jar.name,
          description: jar.description,
          layers: jar.layers,
          image: jar.image,
          price: new Prisma.Decimal(jar.price),
        },
        create: {
          slug: jar.slug,
          name: jar.name,
          description: jar.description,
          layers: jar.layers,
          image: jar.image,
          price: new Prisma.Decimal(jar.price),
        },
      })
    )
  );

  return prisma.cakeJar.findMany();
};

const ensureCakeJarCategoryAndProducts = async () => {
  await ensureProductMetaColumns();

  const cakeJars = await ensureCakeJarEntries();
  if (!cakeJars.length) {
    return;
  }

  const defaultJarMeta = new Map(
    defaultCakeJarData.map((jar) => [
      jar.slug,
      {
        weight: jar.weight,
        leadTime: jar.leadTime,
        heroImage: jar.heroImage,
        galleryImages: jar.galleryImages,
        categoryImages: jar.categoryImages,
      },
    ])
  );

  const category = await prisma.productCategory.upsert({
    where: { slug: "cake-jars" },
    update: {
      name: "Торти в буркан",
      description: "Ръчно подредени торти в буркан с най-популярните вкусове на No Regrets.",
      heroImage: "cake-jars-hero.jpg",
    },
    create: {
      slug: "cake-jars",
      name: "Торти в буркан",
      description: "Ръчно подредени торти в буркан с най-популярните вкусове на No Regrets.",
      heroImage: "cake-jars-hero.jpg",
    },
  });

  for (const jar of cakeJars) {
    const slug = `cake-jar-${jar.slug}`;
    const priceDecimal =
      jar.price instanceof Prisma.Decimal ? jar.price : new Prisma.Decimal(jar.price ?? 0);
    const defaults = defaultJarMeta.get(jar.slug);

    const existingProduct = await prisma.product.findUnique({ where: { slug } });
    if (existingProduct) {
      const updateData: Prisma.ProductUpdateInput = {};
      if (existingProduct.categoryId !== category.id) {
        updateData.category = { connect: { id: category.id } };
      }
      if (!existingProduct.weight && defaults?.weight) {
        updateData.weight = defaults.weight;
      }
      if (!existingProduct.leadTime && defaults?.leadTime) {
        updateData.leadTime = defaults.leadTime;
      }
      if (defaults?.heroImage && existingProduct.heroImage !== defaults.heroImage) {
        updateData.heroImage = defaults.heroImage;
      }
      if (Object.keys(updateData).length) {
        await prisma.product.update({
          where: { slug },
          data: updateData,
        });
      }
      continue;
    }

    await prisma.product.create({
      data: {
        slug,
        name: jar.name,
        shortDescription: jar.description,
        description: jar.description,
        weight: defaults?.weight,
        leadTime: defaults?.leadTime ?? "Доставка до 3 дни",
        heroImage: defaults?.heroImage ?? jar.image,
        price: priceDecimal,
        status: "PUBLISHED",
        categoryId: category.id,
        images: {
          create: (defaults?.galleryImages ?? [jar.image]).map((url, index) => ({
            url,
            alt: jar.name,
            position: index,
          })),
        },
        categoryImages: defaults?.categoryImages
          ? {
              create: defaults.categoryImages.map((url, index) => ({
                url,
                alt: jar.name,
                position: index,
              })),
            }
          : undefined,
        variants: {
          create: [
            {
              name: `Торта в буркан – ${jar.name}`,
              price: priceDecimal,
              isDefault: true,
            },
          ],
        },
      },
    });
  }
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureCakeJarCategoryAndProducts();

    const products = await prisma.product.findMany({
      include: {
        category: true,
        images: {
          orderBy: { position: "asc" },
        },
        categoryImages: {
          orderBy: { position: "asc" },
        },
        variants: {
          orderBy: [{ isDefault: "desc" }, { name: "asc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        status: product.status,
        categoryName: product.category.name,
        categoryId: product.categoryId,
        shortDescription: product.shortDescription,
        description: product.description,
        weight: product.weight,
        leadTime: product.leadTime,
        heroImage: product.heroImage,
        galleryImages: product.images.map((img) => img.url),
        categoryImages: product.categoryImages.map((img) => img.url),
        variantName: product.variants[0]?.name ?? "",
      })),
    });
  } catch (error) {
    console.error("Failed to load products", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Неуспешно зареждане на продуктите." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = productSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
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
  const finalSlug = slug?.trim() || slugify(name);
  const decimalPrice = new Prisma.Decimal(price);

  try {
    const product = await prisma.product.create({
      data: {
        name,
        slug: finalSlug,
        shortDescription,
        description,
        weight,
        leadTime,
        heroImage,
        price: decimalPrice,
        status: status ?? "PUBLISHED",
        categoryId,
        images: {
          create: galleryImages.map((url, index) => ({
            url,
            alt: name,
            position: index,
          })),
        },
        categoryImages: categoryImages
          ? {
              create: categoryImages.map((url, index) => ({
                url,
                alt: name,
                position: index,
              })),
            }
          : undefined,
        variants: {
          create: [
            {
              name: variantName || name,
              price: decimalPrice,
              isDefault: true,
            },
          ],
        },
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Продукт със същия slug вече съществува." }, { status: 409 });
    }
    console.error("Failed to create product", error);
    return NextResponse.json({ error: "Неуспешно създаване на продукт." }, { status: 500 });
  }
}
