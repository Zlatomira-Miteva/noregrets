'use client';

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { CAKE_JARS } from "@/data/cakeJars";
import { useCart } from "@/context/CartContext";
import { parsePrice } from "@/utils/price";

const allergenNote =
  "Всички торти в буркан съдържат пшеница, яйца и млечни продукти. Някои вкусове съдържат ядки.";
const PRICE_LABEL = "20.00 лв";

export default function CakeJarsPage() {
  const { addItem } = useCart();
  const priceValue = useMemo(() => parsePrice(PRICE_LABEL), []);

  const handleAddToCart = (jarId: string, jarName: string) => {
    addItem({
      productId: `cake-jar-${jarId}`,
      name: `Торта в буркан – ${jarName}`,
      price: priceValue,
      quantity: 1,
      options: [jarName],
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fff6f1]">
      <SiteHeader />
      <main className="flex-1">
        <section className="px-[clamp(1rem,4vw,4rem)] py-16 text-center">
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">Торти в буркан</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg">
            Любимите ни кремове и блатове, подредени на слоеве в елегантни буркани. Изберете вкус,
            добавете към количката и получете персонална торта, готова за подарък или сладък момент
            само за вас.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/products/cake-jar"
              className="cta rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#781e21]"
            >
              Поръчай торта в буркан
            </Link>
            <Link
              href="/cart"
              className="rounded-full border border-[#5f000b] px-6 py-3 text-sm font-semibold uppercase transition hover:bg-white/60"
            >
              Виж количката
            </Link>
          </div>
        </section>

        <section className="space-y-16 px-[clamp(1rem,4vw,4rem)] pb-24">
          {CAKE_JARS.map((jar, index) => (
            <article
              key={jar.id}
              className={`flex flex-col gap-10 rounded-3xl p-8 shadow-card ${
                index % 2 ? "lg:flex-row-reverse" : "lg:flex-row"
              }`}
            >
              <div className="flex w-full items-center justify-center lg:w-1/2">
                <div className="group relative h-72 w-72 sm:h-96 sm:w-96">
                  <div className="pointer-events-none absolute inset-0 scale-125 rounded-full bg-gradient-to-b from-[#f3c8c8] to-transparent opacity-60 blur-3xl" />
                  <Image
                    src={jar.image}
                    alt={jar.name}
                    fill
                    className="object-contain transition-transform duration-500 ease-out group-hover:-rotate-2 group-hover:scale-105"
                    sizes="(min-width: 1024px) 25rem, 60vw"
                    priority={index === 0}
                  />
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-center gap-6 lg:w-1/2">
                <header>
                  <h2 className="mt-3 text-3xl font-bold text-[#5f000b]">{jar.name}</h2>
                </header>
                <div className="space-y-3 text-base leading-relaxed text-[#3e1b20]">
                  <p>{jar.description}</p>
                  <p className="text-sm uppercase text-[#5f000b]/60">Какво има вътре</p>
                  <p>{jar.layers.join(", ")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddToCart(jar.id, jar.name)}
                  className="cta inline-flex items-center justify-center rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#781e21]"
                >
                  Добави в количката
                </button>
                <p className="text-sm italic text-[#5f000b]/70">{allergenNote}</p>
              </div>
            </article>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
