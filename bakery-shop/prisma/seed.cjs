/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@noregrets.bg";
  const password = process.env.ADMIN_SEED_PASSWORD || "changeme";
  const name = process.env.ADMIN_NAME || "Admin";

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      password: hashed,
    },
  });

  console.log(`Admin account ready: ${user.email}`);
  console.log(`Seed password: ${password}`);

  const cakeJars = [
    {
      slug: "red-velvet",
      name: "Торта червено кадифе",
      description:
        "Ред Велвет блатове, напоени с ванилов сироп и покрити с нежен крем сирене с бял шоколад. Всеки буркан е кадифено сладък и изненадващо лек.",
      layers: ["Ред Велвет блат", "Крема сирене", "Швейцарски крем"],
      image: "red-velvet-cake-jar.png",
      price: 20.0,
    },
    {
      slug: "nutella-biscoff",
      name: "Торта Nutella & Biscoff",
      description:
        "Шоколадов мус с белгийско какао, хрупкави парченца Lotus и сърце от течна Nutella. Комбинация между дълбок шоколад и карамелен хрупкав слой.",
      layers: ["Шоколадов блат", "Nutella", "Biscoff крем", "Швейцарски крем"],
      image: "nutella-biscoff-cake-jar.png",
      price: 20.0,
    },
    {
      slug: "mascarpone-raspberry",
      name: "Торта с маскарпоне и малина",
      description:
        "Въздушен маскарпоне крем, малинов конфитюр и ванилови блатове. Баланс между свежест, леко кисела малина и копринен крем.",
      layers: ["Ванилов блат", "Малиново сладко", "Маскарпоне и сметана"],
      image: "mascarpone-raspberry-cake-jar.png",
      price: 20.0,
    },
  ];

  for (const jar of cakeJars) {
    await prisma.cakeJar.upsert({
      where: { slug: jar.slug },
      update: {
        name: jar.name,
        description: jar.description,
        layers: jar.layers,
        image: jar.image,
        price: jar.price,
      },
      create: jar,
    });
  }

  const categories = [
    {
      slug: "cookies",
      name: "Кукита",
      description: "Ръчно изработени кукита по заявка.",
      heroImage: "cookies-hero.jpg",
    },
    {
      slug: "cookie-boxes",
      name: "Кутии с кукита",
      description: "Най-поръчваните ни кутии с любимите вкусове No Regrets.",
      heroImage: "cookie-box-hero.jpg",
    },
    {
      slug: "cakes",
      name: "Торти",
      description: "Торти за всеки повод.",
      heroImage: "cake-jars-hero.jpg",
    },
    {
      slug: "mochi",
      name: "Мочи десерти",
      description: "Меки оризови сладки със сезонни вкусове.",
      heroImage: "mochi-hero.jpg",
    },
  ];

  const categoryMap = {};
  for (const category of categories) {
    const record = await prisma.productCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
    categoryMap[record.slug] = record;
  }

  const products = [
    {
      slug: "best-sellers",
      name: "Best Sellers кутия от 3 кукита",
      shortDescription: "Кутия с най-поръчваните ни вкусове.",
      description:
        "Три емблематични вкуса, селектирани от нас и опаковани в подаръчна кутия – готови за споделяне или сладък жест към любим човек.",
      weight: "450 гр.",
      leadTime: "Доставка до 3 дни",
      heroImage: "best-sellers.png",
      galleryImages: ["best-sellers.png", "cookie-box.jpg"],
      categoryImages: ["cookie-box-hero.jpg"],
      categorySlug: "cookie-boxes",
      price: 21,
      status: "PUBLISHED",
      variantName: "Best Sellers кутия (3 кукита)",
    },
    {
      slug: "custom-box-3",
      name: "Направи сам кутия от 3 кукита",
      shortDescription: "Персонализирана кутия с три любими вкуса.",
      description: "Изберете три любими кукита и ги получете в елегантна кутия, готова за подарък.",
      weight: "3 бр. кукита",
      leadTime: "Доставка до 3 дни",
      heroImage: "cooke-box-3-open.png",
      galleryImages: ["cooke-box-3-open.png", "cookie-box.jpg"],
      categoryImages: ["cookie-box-hero.jpg"],
      categorySlug: "cookie-boxes",
      price: 21,
      status: "PUBLISHED",
      variantName: "Кутия от 3 кукита",
    },
    {
      slug: "custom-box-6",
      name: "Направи сам кутия от 6 кукита",
      shortDescription: "Класическата ни кутия с шест вкуса.",
      description: "Създайте мечтаната селекция с шест любими вкуса и доставете радост у дома.",
      weight: "6 бр. кукита",
      leadTime: "Доставка до 3 дни",
      heroImage: "box-six-cookies-open.png",
      galleryImages: ["box-six-cookies-open.png", "cookie-box.jpg"],
      categoryImages: ["cookie-box-hero.jpg"],
      categorySlug: "cookie-boxes",
      price: 42,
      status: "PUBLISHED",
      image: "box-six-cookies-open.png",
      variantName: "Кутия от 6 кукита",
    },
    {
      slug: "mini-cookies",
      name: "Мини кукита с течен шоколад",
      shortDescription: "Дребни кукита със сос от Nutella.",
      description: "Перфектни за споделяне – мини кукита, сервирани с купичка Nutella за потапяне.",
      weight: "20 мини кукита + сос",
      leadTime: "Доставка до 3 дни",
      heroImage: "mini-cookies-falling.png",
      galleryImages: ["cookie-box.jpg", "mini-cookies-falling.png"],
      categoryImages: ["cookie-box.jpg"],
      categorySlug: "cookie-boxes",
      price: 12,
      status: "PUBLISHED",
      image: "cookie-box.jpg",
      variantName: "Мини кукита",
    },
    {
      slug: "custom-box-mochi-4",
      name: "Направи сам кутия от 4 мочи",
      shortDescription: "Селекция от четири свежи мочита.",
      description:
        "Създайте своята кутия с четири ръчно приготвени мочита. Перфектни за подарък или следобедно изкушение.",
      weight: "4 бр. свежи мочита",
      leadTime: "Доставка до 3 дни",
      heroImage: "mochi-hero.jpg",
      galleryImages: ["mochi-hero.jpg", "dark-choc-mochi.png"],
      categoryImages: ["mochi-hero.jpg"],
      categorySlug: "mochi",
      price: 20,
      status: "PUBLISHED",
      variantName: "Кутия от 4 мочи",
    },
    {
      slug: "custom-box-mochi-9",
      name: "Направи сам кутия от 9 мочи",
      shortDescription: "Голяма кутия от девет ръчно приготвени мочита.",
      description: "Максимално удоволствие – девет любими вкуса в една голяма кутия, готова за споделяне.",
      weight: "9 бр. свежи мочита",
      leadTime: "Доставка до 3 дни",
      heroImage: "mochi-hero.jpg",
      galleryImages: ["mochi-hero.jpg", "white-choc-mochi.png"],
      categoryImages: ["mochi-hero.jpg"],
      categorySlug: "mochi",
      price: 45,
      status: "PUBLISHED",
      variantName: "Кутия от 9 мочи",
    },
  ];

  for (const product of products) {
    const category = categoryMap[product.categorySlug];
    if (!category) continue;

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        shortDescription: product.shortDescription,
        description: product.description,
        weight: product.weight,
        leadTime: product.leadTime,
        heroImage: product.heroImage,
        price: product.price,
        status: product.status,
        categoryId: category.id,
        images: {
          deleteMany: {},
          create: product.galleryImages.map((url, index) => ({ url, alt: product.name, position: index })),
        },
        categoryImages: {
          deleteMany: {},
          create: product.categoryImages.map((url, index) => ({ url, alt: product.name, position: index })),
        },
        variants: {
          deleteMany: {},
          create: [
            {
              name: product.variantName ?? product.name,
              price: product.price,
              isDefault: true,
            },
          ],
        },
      },
      create: {
        slug: product.slug,
        name: product.name,
        shortDescription: product.shortDescription,
        description: product.description,
        weight: product.weight,
        leadTime: product.leadTime,
        heroImage: product.heroImage,
        price: product.price,
        status: product.status,
        categoryId: category.id,
        images: {
          create: product.galleryImages.map((url, index) => ({ url, alt: product.name, position: index })),
        },
        categoryImages: {
          create: product.categoryImages.map((url, index) => ({ url, alt: product.name, position: index })),
        },
        variants: {
          create: [
            {
              name: product.variantName ?? product.name,
              price: product.price,
              isDefault: true,
            },
          ],
        },
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
