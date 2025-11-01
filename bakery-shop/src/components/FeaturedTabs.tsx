"use client";

import { useMemo, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";

type FeaturedTabsProps = {
  products: Array<{
    id: number;
    name: string;
    price: string;
    leadTime: string;
    weight: string;
    image: string | StaticImageData;
    category: "cookies" | "cakes" | "mochi";
    href?: string;
  }>;
};

const CATEGORIES: Array<{ label: string; value: "cookies" | "cakes" | "mochi" }> = [
  { label: "Кукита", value: "cookies" },
  { label: "Торти", value: "cakes" },
  { label: "Мочи", value: "mochi" },
];

const FeaturedTabs = ({ products }: FeaturedTabsProps) => {
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]["value"]>(
    CATEGORIES[0].value,
  );

  const filteredProducts = useMemo(
    () => products.filter((product) => product.category === activeCategory),
    [activeCategory, products],
  );

  return (
    <section
      id="cookies"
      className="mx-auto w-full px-[clamp(1rem,3vw,3rem)] py-12"
    >
      <div className="flex flex-wrap items-center gap-4 border-b border-[#dcb1b1] pb-4">
        {CATEGORIES.map((category) => {
          const isActive = category.value === activeCategory;
          return (
            <button
              key={category.value}
              type="button"
              onClick={() => setActiveCategory(category.value)}
              className={`text-lg font-semibold transition ${
                isActive
                  ? "text-[#9d0012] underline decoration-4 underline-offset-8"
                  : "text-[#8c4a2f]/60 hover:text-[#8c4a2f]"
              }`}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {filteredProducts.length === 0 ? (
          <p className="col-span-full text-sm text-[#8c4a2f]/80">
            Скоро ще добавим продукти в тази категория. Следете ни за новости!
          </p>
        ) : (
          filteredProducts.map((product) => {
            const card = (
              <article className="group flex h-full flex-col overflow-hidden rounded-sm bg-white shadow-card transition hover:-translate-y-1 hover:shadow-xl">
                <div className="relative aspect-[1/1]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 px-5 pb-6 pt-5 text-[#2f1b16]">
                  <h6 className="text-lg leading-snug">{product.name}</h6>
                  <div className="flex flex-col gap-1 text-sm text-[#8c4a2f]">
                    <span>{product.leadTime}</span>
                    <span>{product.weight}</span>
                  </div>
                  <div className="mt-auto text-base font-semibold text-[#9d0012]">
                    {product.price}
                  </div>
                </div>
              </article>
            );

            return product.href ? (
              <Link
                key={product.id}
                href={product.href}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9d0012] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcd9d9]"
              >
                {card}
              </Link>
            ) : (
              <div key={product.id} className="block">
                {card}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default FeaturedTabs;
