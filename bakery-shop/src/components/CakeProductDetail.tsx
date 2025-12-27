"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { useCart } from "@/context/CartContext";
import { parsePrice } from "@/utils/price";

const STORAGE_TEXT = "Съхранявайте тортата в хладилник до 48 часа.";
const DELIVERY_TEXT =
  "Изпращаме охладени торти от понеделник до четвъртък. Поръчки след 16:30 ч. се обработват на следващия работен ден.";
const ALLERGEN_TEXT =
  "Всички торти съдържат глутен, млечни продукти и яйца. Някои варианти включват ядки или следи от тях.";

type Props = {
  cake: {
    slug: string;
    name: string;
    price: string;
    weight?: string;
    leadTime?: string;
    description?: string;
    highlights?: string[];
    fillings?: string[];
    image: string;
  };
  productPrefix?: string;
};

const CakeProductDetail = ({ cake, productPrefix = "cake" }: Props) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const priceValue = useMemo(() => parsePrice(cake.price), [cake.price]);

  const increase = () => setQuantity((prev) => prev + 1);
  const decrease = () => setQuantity((prev) => Math.max(1, prev - 1));

  const handleAddToCart = () => {
    addItem({
      productId: `${productPrefix}-${cake.slug}`,
      name: cake.name,
      price: priceValue,
      quantity,
      options: cake.weight ? [cake.weight] : [],
      image: cake.image,
    });
  };

  return (
    <div className="mx-auto w-full px-[clamp(1rem,4vw,4rem)] py-16">
      <div className="grid gap-12 xl:grid-cols-[45%_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[1rem] bg-white p-4 shadow-card">
            <div className="relative aspect-square overflow-hidden rounded-[0.75rem]">
              <Image
                src={cake.image}
                alt={cake.name}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 480px, 100vw"
                priority
              />
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <header className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm uppercase text-[#5f000b]/70">
                  {cake.leadTime}
                </p>
                <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                  {cake.name}
                </h1>
              </div>
              <span className="text-2xl font-semibold sm:pt-1">
                {cake.price}
              </span>
            </div>
              {cake.description ? <p className="text-[#3d1b20]">{cake.description}</p> : null}
            <ul className="space-y-1 text-sm">
              {cake.weight ? <li>{cake.weight}</li> : null}
              {(cake.highlights ?? []).map((highlight) => (
                <li key={highlight}>• {highlight}</li>
              ))}
            </ul>
            <p className="uppercase text-sm text-[#5f000b]/70">
              {ALLERGEN_TEXT}
            </p>
          </header>

          <section className="space-y-6 rounded-3xl bg-white shadow-card">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Количество</h2>
              <p className="text-sm text-[#5f000b]/70">
                Всяка торта се доставя с хладилна кутия и е готова за сервиране.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={decrease}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f3bec8] text-lg font-semibold transition hover:bg-[#fff6f8] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Намали количеството"
                disabled={quantity === 1}
              >
                –
              </button>
              <span className="flex h-12 min-w-[3.5rem] items-center justify-center rounded-full border border-[#f3bec8] bg-white text-lg font-semibold">
                {quantity}
              </span>
              <button
                type="button"
                onClick={increase}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f3bec8] bg-white text-lg font-semibold transition hover:bg-[#fff6f8]"
                aria-label="Увеличи количеството"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className="cta w-full rounded-full bg-[#5f000b] px-6 py-4 text-sm font-semibold uppercase text-white transition hover:bg-[#561c19]"
            >
              Добави {quantity} в количката
            </button>
            <div className="space-y-3 rounded-2xl bg-[#fff8fa] p-4 text-sm text-[#5f000b]/80">
              <div>
                <p className="font-semibold text-[#5f000b]">Съхранение</p>
                <p className="mt-1">{STORAGE_TEXT}</p>
              </div>
              <div>
                <p className="font-semibold text-[#5f000b]">Доставка</p>
                <p className="mt-1">{DELIVERY_TEXT}</p>
              </div>
              <div>
                <p className="font-semibold text-[#5f000b]">Алергени</p>
                <p className="mt-1">{ALLERGEN_TEXT}</p>
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl bg-white/90 p-6 shadow-card">
            {(cake.fillings ?? []).length ? (
              <>
                <strong className="text-base font-semibold text-[#5f000b]">
                  Какво има вътре
                </strong>
                <div className="flex flex-wrap gap-2">
                  {(cake.fillings ?? []).map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-[#ffeef3] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[#7c1a6a]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
};

export default CakeProductDetail;
