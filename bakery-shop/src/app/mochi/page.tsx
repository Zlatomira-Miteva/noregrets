'use client';

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { MOCHIS } from "@/data/mochis";
import { useCart } from "@/context/CartContext";
import { formatPrice, parsePrice } from "@/utils/price";

const PRICE_LABEL = formatPrice(20);
const allergenNote =
  "Мочитата съдържат оризово брашно, млечни продукти и могат да имат следи от ядки и глутен.";

export default function MochiPage() {
  const { addItem } = useCart();
  const priceValue = useMemo(() => parsePrice(PRICE_LABEL), []);

  const handleAdd = (mochiId: string, name: string) => {
    addItem({
      productId: `mochi-${mochiId}`,
      name: `Кутия мочи – ${name}`,
      price: priceValue,
      quantity: 1,
      options: [name],
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fff5fb]">
      <SiteHeader />
      <main className="flex-1">
        <section className="px-[clamp(1rem,4vw,4rem)] py-16 text-center">
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">Мочи</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg">
            Меки оризови облаци, пълни с копринени шоколадови кремове. Изберете любимия си вкус
            и си подарете кутия с 4 или 9 мочита - идеални за изненада или малък момент на удоволствие.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/products/custom-box/mochi-4"
              className="cta rounded-full bg-[#5f004f] px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#7c1a6a]"
            >
              Кутия от 4 мочи
            </Link>
            <Link
              href="/products/custom-box/mochi-9"
              className="rounded-full border border-[#5f004f] px-6 py-3 text-sm font-semibold uppercase transition hover:bg-white/60"
            >
              Кутия от 9 мочи
            </Link>
            <Link
              href="/cart"
              className="rounded-full border border-transparent bg-white/20 px-6 py-3 text-sm font-semibold uppercase text-[#5f004f] transition hover:bg-white/40"
            >
              Виж количката
            </Link>
          </div>
        </section>

        <section className="space-y-16 px-[clamp(1rem,4vw,4rem)] pb-24">
          {MOCHIS.map((mochi, index) => (
            <article
              key={mochi.id}
              className={`flex flex-col gap-10 p-8 shadow-card ${
                index % 2 ? "lg:flex-row-reverse" : "lg:flex-row"
              }`}
            >
              <div className="flex w-full items-center justify-center lg:w-1/2">
                <div className="group relative h-72 w-72 sm:h-96 sm:w-96">
                  <div className="pointer-events-none absolute inset-0 scale-125 rounded-full bg-gradient-to-b from-[#ffc5dc] to-transparent opacity-60 blur-3xl" />
                  <Image
                    src={mochi.image}
                    alt={mochi.name}
                    fill
                    className="object-contain transition-transform duration-500 ease-out group-hover:-rotate-2 group-hover:scale-105"
                    sizes="(min-width: 1024px) 25rem, 60vw"
                    priority={index === 0}
                  />
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-center gap-6 lg:w-1/2">
                <header>
                  <p className="text-sm uppercase ">С вкус на</p>
                  <h2 className="mt-3 text-3xl font-bold ">{mochi.name}</h2>
                </header>
                <p className="text-base leading-relaxed">{mochi.description}</p>
                <div className="flex flex-wrap gap-2">
                  {mochi.filling.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-[#ffe6f1] px-4 py-1 text-xs font-semibold uppercase tracking-wide"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleAdd(mochi.id, mochi.name)}
                  className="cta inline-flex items-center justify-center rounded-full bg-[#5f004f] px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#7c1a6a]"
                >
                  Добави в количката
                </button>
                <p className="text-sm italic">{allergenNote}</p>
              </div>
            </article>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
