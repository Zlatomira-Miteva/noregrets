"use client";

import Link from "next/link";
import { useMemo } from "react";

import Marquee from "@/components/Marquee";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/price";

type CakeJar = {
  id: string;
  slug: string;
  name: string;
  description: string;
  layers: string[];
  price: number;
  weight: string;
  leadTime: string;
  heroImage: string;
  galleryImages: string[];
};

type CakeJarsClientProps = {
  initialJars: CakeJar[];
};

const allergenNote =
  "Всички торти в буркан съдържат пшеница, яйца и млечни продукти. Някои вкусове съдържат ядки.";

export default function CakeJarsClient({ initialJars }: CakeJarsClientProps) {
  const { addItem } = useCart();
  const cakeJars = initialJars;

  const handleAddToCart = (jar: CakeJar) => {
    addItem({
      productId: jar.id,
      name: `Торта в буркан – ${jar.name}`,
      price: jar.price ?? 0,
      quantity: 1,
      options: [jar.name],
    });
  };

  const hasProducts = cakeJars.length > 0;
  const firstPrice = useMemo(() => (cakeJars[0] ? formatPrice(cakeJars[0].price ?? 0) : ""), [cakeJars]);

  return (
    <div className="flex min-h-screen flex-col bg-[#fff6f1]">
      <Marquee />
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto w-full px-[clamp(1rem,4vw,4rem)] py-16 space-y-16">
          <section className="text-center">
            <h1 className="mt-4 text-4xl font-bold text-[#5f000b] sm:text-5xl">Торти в буркан</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#3e1b20]">
              Любимите ни кремове и блатове, подредени на слоеве в елегантни буркани.
              Изберете вкус, добавете към количката и получете вкусна торта,
              готова за подарък или сладък момент само за вас.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/products/cake-jar"
                className="cta rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#781e21]"
              >
                Поръчай торта в буркан
              </Link>
            </div>
          </section>

          <section className="space-y-10">
            {!hasProducts && (
              <p className="text-center text-sm text-[#5f000b]">Скоро ще добавим нови предложения. Следете ни!</p>
            )}

            {hasProducts && (
              <div className="space-y-10">
                {cakeJars.map((jar, index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <article
                      key={jar.id}
                      className={`grid gap-10 rounded-[1.5rem] bg-white/80 p-8 shadow-card lg:grid-cols-[40%_minmax(0,1fr)] lg:items-center ${
                        isEven ? "" : "lg:[&>.image-col]:order-2 lg:[&>.text-col]:order-1"
                      }`}
                    >
                      <div className="image-col flex items-center justify-center">
                        <div className="w-full max-w-[480px] overflow-hidden rounded-[1rem] bg-white p-1 shadow-card">
                          <div className="group relative aspect-square overflow-hidden rounded-[0.75rem]">
                            <div className="pointer-events-none absolute inset-0 scale-125 rounded-full bg-gradient-to-b from-[#f3c8c8] to-transparent opacity-60 blur-3xl" />
                            <img
                              src={jar.heroImage}
                              alt={jar.name}
                              loading={index === 0 ? "eager" : "lazy"}
                              className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:-rotate-2 group-hover:scale-105"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-col space-y-6">
                        <header className="space-y-2">
                          <h2 className="text-3xl font-bold text-[#5f000b]">{jar.name}</h2>
                          <p className="text-base leading-relaxed text-[#3e1b20]">{jar.description}</p>
                        </header>

                        <div className="space-y-3 text-sm leading-relaxed text-[#3e1b20]">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#5f000b]/60">
                              Какво има вътре
                            </p>
                            <p>{jar.layers.join(", ")}</p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#5f000b]/60">Грамаж</p>
                            <p>{jar.weight || "220 гр."}</p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#5f000b]/60">
                              Срок за доставка
                            </p>
                            <p>{jar.leadTime || "Доставка до 3 дни"}</p>
                          </div>

                          <p className="text-xs text-[#5f000b]/60">{allergenNote}</p>

                          <p className="pt-2 text-lg font-semibold text-[#5f000b]">{formatPrice(jar.price ?? 0)}</p>
                        </div>

                        <div className="space-y-3">
                          <button
                            type="button"
                            onClick={() => handleAddToCart(jar)}
                            className="cta inline-flex w-full items-center justify-center rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#781e21] sm:w-auto"
                          >
                            Добави в количката
                          </button>
                          <Link
                            href={`/products/cake-jar?flavor=${encodeURIComponent(jar.slug)}`}
                            className="inline-flex items-center text-sm font-semibold text-[#5f000b] underline-offset-4 hover:underline"
                          >
                            Виж детайли
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
