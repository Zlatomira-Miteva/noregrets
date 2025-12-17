"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useCart } from "@/context/CartContext";
import { formatPrice, parsePrice } from "@/utils/price";

type FeaturedProduct = {
  id: string;
  name: string;
  price?: string;
  leadTime: string;
  weight: string;
  image: string;
  category: "cookies" | "cakes";
  href?: string;
  slug?: string;
};

const CATEGORIES: Array<{ label: string; value: "cookies" | "cakes" }> = [
  { label: "Кукита", value: "cookies" },
  { label: "Торти", value: "cakes" },
];

const HASH_TO_CATEGORY: Record<string, (typeof CATEGORIES)[number]["value"]> = {
  "#cookies": "cookies",
  "#cakes": "cakes",
};

const FeaturedTabs = () => {
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]["value"]>(CATEGORIES[0].value);
  const [backendCakes, setBackendCakes] = useState<FeaturedProduct[]>([]);
  const [cakesError, setCakesError] = useState<string | null>(null);
  const [cookieBoxes, setCookieBoxes] = useState<FeaturedProduct[]>([]);
  const [cookiesError, setCookiesError] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const setCategoryFromHash = () => {
      const hash = window.location.hash?.toLowerCase();
      if (!hash) return;
      const category = HASH_TO_CATEGORY[hash as keyof typeof HASH_TO_CATEGORY];
      if (category) {
        setActiveCategory(category);
      }
    };

    setCategoryFromHash();
    window.addEventListener("hashchange", setCategoryFromHash);
    return () => window.removeEventListener("hashchange", setCategoryFromHash);
  }, []);

  useEffect(() => {
    const loadCakes = async () => {
      try {
        const response = await fetch("/api/cake-jars");
        if (!response.ok) {
          throw new Error("Неуспешно зареждане на тортите в буркан.");
        }
        const data: Array<{
          id: string;
          name: string;
          slug: string;
          price: number;
          weight: string;
          leadTime: string;
          heroImage: string;
        }> = await response.json();

        const mapped: FeaturedProduct[] = data.map((item) => ({
          id: item.id.toString(),
          name: item.name,
          price: formatPrice(item.price ?? 0),
          leadTime: item.leadTime || "Доставка до 3 работни дни",
          weight: item.weight || "220 гр.",
          image: item.heroImage || "",
          category: "cakes",
          slug: item.slug,
          href: `/products/cake-jar?flavor=${encodeURIComponent(item.slug)}`,
        }));
        setBackendCakes(mapped);
        setCakesError(null);
      } catch (error) {
        console.error(error);
        setCakesError(error instanceof Error ? error.message : "Неуспешно зареждане.");
      }
    };

    loadCakes();
  }, []);

  useEffect(() => {
    const loadCookieBoxes = async () => {
      try {
        const response = await fetch("/api/products/category/cookie-boxes");
        if (!response.ok) {
          throw new Error("Неуспешно зареждане на кутиите с кукита.");
        }
        const data: {
          products: Array<{
            id: string;
            slug: string;
            name: string;
            price: number;
            weight: string;
            leadTime: string;
            image: string;
            href?: string;
          }>;
        } = await response.json();
        const mapped: FeaturedProduct[] = data.products.map((product) => ({
          id: product.id.toString(),
          name: product.name,
          price: product.slug.startsWith("custom-box-") ? undefined : formatPrice(product.price ?? 0),
          leadTime: product.leadTime || "Доставка до 3 работни дни",
          weight: product.weight || "450 гр.",
          image: product.image,
          category: "cookies",
          href: product.href || `/products/${product.slug}`,
        }));
        setCookieBoxes(mapped);
        setCookiesError(null);
      } catch (error) {
        console.error(error);
        setCookiesError(error instanceof Error ? error.message : "Неуспешно зареждане на кутиите.");
      }
    };

    loadCookieBoxes();
  }, []);

  const mergedProducts = useMemo(() => {
    return [...cookieBoxes, ...backendCakes];
  }, [backendCakes, cookieBoxes]);

  const filteredProducts = useMemo(
    () => mergedProducts.filter((product) => product.category === activeCategory),
    [activeCategory, mergedProducts],
  );

  const handleCategoryChange = (category: (typeof CATEGORIES)[number]["value"]) => {
    setActiveCategory(category);
    if (typeof window !== "undefined") {
      const hash = Object.entries(HASH_TO_CATEGORY).find(([, value]) => value === category)?.[0] ?? "";
      if (hash) {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search ?? ""}${hash}`);
      }
    }
  };

  const handleQuickAdd = (product: FeaturedProduct) => {
    if (product.category !== "cakes") return;
    const slug = product.href?.split("/").pop() ?? product.id.toString();
    addItem({
      productId: slug,
      name: product.name,
      price: parsePrice(product.price!),
      quantity: 1,
      options: [product.weight],
      image: product.image,
    });
  };

  return (
    <>
      <span id="cookies" className="relative -top-24 block h-0" aria-hidden />
      <span id="cakes" className="relative -top-24 block h-0" aria-hidden />
      <section className="mx-auto w-full px-[clamp(1rem,3vw,3rem)] py-12">
        <div className="flex flex-wrap items-center gap-4 border-b border-[#dcb1b1] pb-4">
          {CATEGORIES.map((category) => {
            const isActive = category.value === activeCategory;
            return (
              <button
                key={category.value}
                type="button"
                onClick={() => handleCategoryChange(category.value)}
                className={`text-lg font-semibold transition ${
                  isActive ? "underline decoration-4 underline-offset-8" : "text-[#5f000b]/60 hover:text-[#5f000b]"
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.length === 0 ? (
            <p className="col-span-full">
              {activeCategory === "cakes" && cakesError
                ? "Не успяхме да заредим продуктите. Моля, опитайте отново."
                : activeCategory === "cookies" && cookiesError
                  ? "Не успяхме да заредим кутиите с кукита. Моля, опитайте пак."
                  : "Скоро ще добавим продукти в тази категория. Следете ни за новости!"}
            </p>
          ) : (
            filteredProducts.map((product) => {
              const isCake = product.category === "cakes";
              const hasPrice = Boolean(product.price);
              const content = (
                <>
                  <div className="relative aspect-[1/1]">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col gap-3 px-5 pb-6 pt-5">
                    <h6 className="text-lg leading-snug">{product.name}</h6>
                    <div className="flex flex-col gap-1 text-sm">
                      <span>{product.leadTime}</span>
                      <span>{product.weight}</span>
                    </div>
                    {hasPrice ? (
                      <div className="mt-auto text-base font-semibold">{product.price}</div>
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
                      </div>
                    )}
                  </div>
                </>
              );

              return (
                <article
                  key={product.id}
                  className="group flex h-full flex-col overflow-hidden rounded-sm bg-white shadow-card transition hover:-translate-y-1 hover:shadow-xl"
                >
                  {product.href ? (
                    <Link
                      href={product.href}
                      className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f000b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcd9d9]"
                    >
                      {content}
                    </Link>
                  ) : (
                    content
                  )}

                  {isCake && (
                    <div className="px-5 pb-5 pt-0">
                      <button
                        type="button"
                        onClick={handleQuickAdd.bind(null, product)}
                        className="w-full rounded-full border border-[#5f000b] px-4 py-2 text-sm font-semibold uppercase text-[#5f000b] transition hover:bg-[#5f000b] hover:text-white"
                      >
                        Добави в количката
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
    </>
  );
};

export default FeaturedTabs;
