import Image from "next/image";
import Link from "next/link";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { formatPrice } from "@/utils/price";
import { getProductBySlug, getProductsByCategorySlug } from "@/lib/products";

export const dynamic = "force-dynamic";

const allergenNote =
  "Всички кукита съдържат пшеница, яйца и млечни продукти. Възможни са следи от ядки и фъстъци.";

const FEATURED_COOKIE_SLUGS = [
  { slug: "best-sellers", fallback: "/best-sellers-cookie-box.png", href: "/products/best-sellers" },
  { slug: "custom-box-3", fallback: "/cooke-box-3-open.png", href: "/products/custom-box/3" },
  { slug: "custom-box-6", fallback: "/box-six-cookies-open.png", href: "/products/custom-box/6" },
  { slug: "mini-cookies", fallback: "/cookie-box.jpg", href: "/products/mini-cookies" },
];

const absImage = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://noregrets.bg").replace(/\/+$/, "");
  return `${base}${normalized}`;
};

async function loadFeaturedCookies() {
  const cards = await Promise.all(
    FEATURED_COOKIE_SLUGS.map(async ({ slug, fallback, href }) => {
      const product = await getProductBySlug(slug);
      if (!product) return null;
      const isCustomBox = slug.startsWith("custom-box");
      // Prefer the known-good local fallback image to avoid broken remote assets.
      const imageSrc = absImage(fallback);
      return {
        id: product.slug,
        name: product.name,
        priceLabel: isCustomBox ? undefined : formatPrice(product.price ?? 0),
        leadTime: product.leadTime || "Доставка до 4 работни дни",
        weight: product.weight || undefined,
        imageSrc,
        href,
      };
    })
  );

  return cards.filter(Boolean) as Array<{
    id: string;
    name: string;
    priceLabel?: string;
    leadTime: string;
    weight?: string;
    imageSrc: string;
    href: string;
  }>;
}

export default async function CookiesPage() {
  const featuredBoxes = await loadFeaturedCookies();
  const cookiesFromDb = await getProductsByCategorySlug("cookies");

  return (
    <div className="flex min-h-screen flex-col bg-[#ffefed]">
      <SiteHeader />
      <main className="flex-1">
        <section className="px-[clamp(1rem,4vw,4rem)] py-16 text-center">
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
            Разгледайте нашите кукита
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg">
            Шест емблематични вкуса, изпечени специално за вас по предварителна поръчка. Изберете
            любимите си и поръчайте кутия, която да споделите или да пазите само
            за себе си.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/products/custom-box/6"
              className="cta rounded-full bg-[#5f000b] px-6 py-3 text-l font-semibold uppercase text-white transition hover:bg-[#781e21]"
            >
              Направи си кутия с 6 кукита
            </Link>
          </div>
        </section>

        {featuredBoxes.length > 0 ? (
          <section className="px-[clamp(1rem,4vw,4rem)] pb-12">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredBoxes.map((product) => (
                <article
                  key={product.id}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-card transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <Link
                    href={product.href}
                    className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f000b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcd9d9]"
                  >
                    <div className="relative aspect-[1/1] overflow-hidden bg-[#fff4f1]">
                      <img
                        src={product.imageSrc}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 px-6 pb-6 pt-5 text-left">
                      <h6 className="text-lg font-semibold">{product.name}</h6>
                      <div className="text-sm text-[#5f000b]/80">
                        <p>{product.leadTime}</p>
                        {product.weight ? <p>{product.weight}</p> : null}
                      </div>
                      {product.priceLabel ? (
                        <div className="mt-auto text-base font-semibold">{product.priceLabel}</div>
                      ) : (
                        <div className="mt-auto flex items-center justify-between text-base font-semibold">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full transition group-hover:bg-[#5f000b] group-hover:text-white">
                            <svg
                              aria-hidden="true"
                              focusable="false"
                              className="h-4 w-4"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M5 3l5 5-5 5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                          <span>Детайли</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-16 px-[clamp(1rem,4vw,4rem)] pb-24">
          {cookiesFromDb.map((cookie, index) => {
            const ingredients = cookie.shortDescription
              ? cookie.shortDescription.split(",").map((s) => s.trim()).filter(Boolean)
              : [];
            return (
              <article
                key={cookie.slug}
                className={`flex flex-col gap-10 rounded-3xl p-8 shadow-card ${
                  index % 2 ? "lg:flex-row-reverse" : "lg:flex-row"
                }`}
              >
                <div className="flex w-full items-center justify-center lg:w-1/2">
                  <div className="group relative h-72 w-72 sm:h-96 sm:w-96">
                    <div className="pointer-events-none absolute inset-0 scale-125 rounded-full bg-gradient-to-b from-[#f1b8c4] to-transparent opacity-60 blur-3xl" />
                    <Image
                      src={cookie.heroImage}
                      alt={cookie.name}
                      fill
                      className="object-contain transition-transform duration-500 ease-out group-hover:scale-105 group-hover:-rotate-3"
                      sizes="(min-width: 1024px) 25rem, 60vw"
                    />
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-center gap-6 lg:w-1/2">
                  <header>
                    <h2 className="mt-3 text-3xl font-bold">{cookie.name}</h2>
                  </header>
                  <div className="space-y-3">
                    {ingredients.length ? (
                      <>
                        <p className="text-sm uppercase text-[#5f000b]/60">Съставки</p>
                        <p className="text-base leading-relaxed">{ingredients.join(", ")}</p>
                      </>
                    ) : null}
                    <p className="text-base text-[#5f000b]/80">{cookie.description}</p>
                  </div>
                  <Link
                    href="/products/custom-box/6"
                    className="cta inline-flex items-center justify-center rounded-full bg-[#5f000b] px-6 py-3 text-l font-semibold uppercase text-white transition hover:bg-[#781e21]"
                  >
                    Направи кутия с 6 кукита
                  </Link>
                  <p className="text-sm italic text-[#5f000b]/70">{allergenNote}</p>
                </div>
              </article>
            );
          })}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
