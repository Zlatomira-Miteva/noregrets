const { randomUUID } = require("node:crypto");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

// Minimal env loader to avoid external deps
const loadEnvFile = (envPath) => {
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const value = line.slice(eqIdx + 1).trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
};

// Load env from .env.local then .env (if present)
const envPaths = [".env.local", ".env"].map((p) => path.resolve(process.cwd(), p));
envPaths.forEach(loadEnvFile);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set. Cannot seed products.");
  process.exit(1);
}

const pgPool = new Pool({
  connectionString,
  max: Number(process.env.PG_POOL_MAX ?? 5),
});

const categories = [
  { id: "cat-cookies", slug: "cookies", name: "Кукита", description: "Емблематичните кукита на No Regrets" },
  { id: "cat-cakes", slug: "cakes", name: "Торти", description: "Специалните торти на No Regrets" },
  { id: "cat-tiramisu", slug: "tiramisu", name: "Тирамису", description: "Тирамису вкусове" },
];

const cookies = [
  {
    slug: "cookie-red-velvet",
    name: "Red Velvet Cheesecake",
    description:
      "Любов от пръв залък - кадифена бисквитка с бял шоколад и нежно кремообразно сърце. Всеки залък е сладък контраст между смелост и нежност.",
    shortDescription:
      "Пшенично брашно, захар, кафява захар, масло, бял шоколад, крема сирене, яйца, набухватели, оцветител",
    price: 6.9,
    weight: "120 гр.",
    leadTime: "Доставка до 4 работни дни",
    heroImage: "/red-velvet-cookie-top.png",
    categorySlug: "cookies",
  },
  {
    slug: "cookie-oreo-white",
    name: "Oreo & White Choc",
    description:
      "Хрупкава, кремообразна и дръзка - бисквитка с бял шоколад и натрошени Oreo. Баланс между сладка плътност и хрупкав хаос.",
    shortDescription: "Пшенично брашно, захар, кафява захар, масло, яйца, Oreo, бял шоколад, набухватели",
    price: 6.9,
    weight: "120 гр.",
    leadTime: "Доставка до 4 работни дни",
    heroImage: "/oreo-cookie-top.png",
    categorySlug: "cookies",
  },
  {
    slug: "cookie-nutella-bueno",
    name: "Nutella Bueno",
    description:
      "Плътна и шоколадова – с млечен шоколад, хрупкаво Bueno парче и течен център от Nutella. Мека отвътре и леко карамелизирана по краищата.",
    shortDescription: "Пшенично брашно, захар, кафява захар, масло, яйца, млечен шоколад, Nutella, Bueno, набухватели",
    price: 5.0,
    weight: "120 гр.",
    leadTime: "Доставка до 4 работни дни",
    heroImage: "/nutella-bueno-top.png",
    categorySlug: "cookies",
  },
  {
    slug: "cookie-biscoff",
    name: "Biscoff & White Choc",
    description:
      "Маслена, карамелена и нежна – с бял шоколад, златисти Biscoff парченца и кремообразен център. Сладост без грам съжаление.",
    shortDescription: "Пшенично брашно, захар, кафява захар, масло, бял шоколад, бисквити Lotus, яйца, Lotus крем, набухватели",
    price: 6.9,
    weight: "120 гр.",
    leadTime: "Доставка до 4 работни дни",
    heroImage: "/biscoff-top.png",
    categorySlug: "cookies",
  },
  {
    slug: "cookie-new-york",
    name: "New York",
    description:
      "Мек център, хрупкав ръб и аромат на масло и шоколад. Орехите добавят дълбочина – като домашна класика, но още по-богата.",
    shortDescription: "Пшенично брашно, захар, кафява захар, масло, черен шоколад, яйца, орехи, набухватели",
    price: 6.8,
    weight: "120 гр.",
    leadTime: "Доставка до 4 работни дни",
    heroImage: "/new-york-top.png",
    categorySlug: "cookies",
  },
  {
    slug: "cookie-triple-choc",
    name: "Tripple Choc",
    description:
      "Мек център и наситено какао с парченца черен и млечен шоколад – шоколадово удоволствие във всеки залък.",
    shortDescription: "Пшенично брашно, захар, масло, яйца, черен и млечен шоколад, какао, царевично нишесте, набухватели",
    price: 6.9,
    weight: "120 гр.",
    leadTime: "Доставка до 4 работни дни",
    heroImage: "/tripple-choc-top.png",
    categorySlug: "cookies",
  },
];

const cakes = [
  {
    slug: "cake-red-velvet",
    name: "Червено Кадифе",
    description: "Нежни червени блатове, напоени с ванилов сироп, и богат крем.",
    shortDescription: "Ръчно приготвена, охладена преди сервиране 30 мин",
    price: 10,
    weight: "220 гр.",
    leadTime: "Доставка до 4 работни дни",
    heroImage: "/red-velvet-present-cake.png",
    categorySlug: "cakes",
  },
  {
    slug: "cake-mascarpone-raspberry",
    name: "Маскарпоне и малина",
    description: "Въздушен ванилов блат, маскарпоне и малиново сладко.",
    shortDescription: "Ръчно приготвена, охладена преди сервиране 30 мин",
    price: 10,
    weight: "240 гр.",
    leadTime: "Доставка до 4 работни дни",
    heroImage: "/mascarpone-raspberry-present-cake.png",
    categorySlug: "cakes",
  },
  {
    slug: "cake-nutella-biscoff",
    name: "Nutella Biscoff",
    description:
      "Шоколадови блатове с крем Nutella и карамелен Lotus слой. Декорирана с мини бисквитки и глазура от млечен шоколад.",
    shortDescription: "Ръчно приготвена, охладена преди сервиране 30 мин",
    price: 12,
    weight: "220 гр.",
    leadTime: "Доставка до 4 работни дни",
    heroImage: "/nutella-biscoff-present-cake.png",
    categorySlug: "cakes",
  },
];

const tiramisu = [
  {
    slug: "tiramisu-classic",
    name: "Класическо тирамису",
    description: "Тирамису крем, еспресо и какао върху напоени бишкоти – класическа рецепта с No Regrets почерк.",
    shortDescription: "Тирамису крем, еспресо сироп, бишкоти Savoiardi, какао",
    price: 6.9,
    weight: "180 гр.",
    leadTime: "Доставка до 4 работни дни",
    heroImage: "/regular-tiramisu.png",
    categorySlug: "tiramisu",
  },
  {
    slug: "tiramisu-strawberry",
    name: "Ягодово тирамису",
    description: "Леко плодово тирамису с ягодов конфитюр и тирамису крем – свеж контраст между крем, плод и какао.",
    shortDescription: "Тирамису крем, ягодово сладко, бишкоти Savoiardi, какао",
    price: 7.2,
    weight: "180 гр.",
    leadTime: "Доставка до 4 работни дни",
    heroImage: "/strawberry-tiramisu.png",
    categorySlug: "tiramisu",
  },
  {
    slug: "tiramisu-pistachio",
    name: "Тирамису с шамфъстък",
    description: "Кремообразно тирамису с шамфъстък и фин еспресо вкус за любителите на ядковите десерти.",
    shortDescription: "Тирамису крем, шамфъстък паста, еспресо сироп, бишкоти Savoiardi",
    price: 7.6,
    weight: "180 гр.",
    leadTime: "Доставка до 4 работни дни",
    heroImage: "/regular-tiramisu.png",
    categorySlug: "tiramisu",
  },
];

const upsertCategory = async (client, cat) => {
  await client.query(
    `INSERT INTO "ProductCategory" (id, slug, name, description, "heroImage", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,NOW())
     ON CONFLICT ("slug") DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, "heroImage" = EXCLUDED."heroImage", "updatedAt" = NOW()`,
    [cat.id, cat.slug, cat.name, cat.description ?? null, cat.heroImage ?? null],
  );
};

const upsertProduct = async (client, product, categoryId) => {
  const productId = randomUUID();
  const res = await client.query(
    `INSERT INTO "Product" (id, slug, name, "shortDescription", description, weight, "leadTime", "heroImage", price, status, "categoryId", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'PUBLISHED',$10,NOW())
     ON CONFLICT ("slug") DO UPDATE SET name = EXCLUDED.name, "shortDescription" = EXCLUDED."shortDescription", description = EXCLUDED.description, weight = EXCLUDED.weight, "leadTime" = EXCLUDED."leadTime", "heroImage" = EXCLUDED."heroImage", price = EXCLUDED.price, status='PUBLISHED', "categoryId" = EXCLUDED."categoryId", "updatedAt" = NOW()
     RETURNING id`,
    [
      productId,
      product.slug,
      product.name,
      product.shortDescription ?? null,
      product.description ?? null,
      product.weight ?? null,
      product.leadTime ?? null,
      product.heroImage ?? null,
      product.price,
      categoryId,
    ],
  );

  const id = res.rows[0]?.id ?? productId;

  if (product.heroImage) {
    await client.query(`DELETE FROM "ProductImage" WHERE "productId" = $1`, [id]);
    await client.query(
      `INSERT INTO "ProductImage" (id, "productId", url, alt, position) VALUES ($1,$2,$3,$4,0)
       ON CONFLICT DO NOTHING`,
      [randomUUID(), id, product.heroImage, product.name],
    );
  }
};

async function seed() {
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");

    const categoryIdMap = new Map();
    for (const cat of categories) {
      await upsertCategory(client, cat);
      const res = await client.query(`SELECT id FROM "ProductCategory" WHERE slug = $1 LIMIT 1`, [cat.slug]);
      const id = res.rows[0]?.id ?? cat.id;
      categoryIdMap.set(cat.slug, id);
    }

    const allProducts = [...cookies, ...cakes, ...tiramisu];
    for (const prod of allProducts) {
      const categoryId = categoryIdMap.get(prod.categorySlug);
      if (!categoryId) throw new Error(`Missing category id for ${prod.categorySlug}`);
      await upsertProduct(client, prod, categoryId);
    }

    await client.query("COMMIT");
    console.info("[seed] Products and categories seeded successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[seed] Failed", error);
    throw error;
  } finally {
    client.release();
    await pgPool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
