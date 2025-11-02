"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useMemo, useState } from "react";

import Marquee from "@/components/Marquee";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { useCart } from "@/context/CartContext";
import { parsePrice } from "@/utils/price";

import CookieBoxImage from "@/app/cookie-box.jpg";
import CookieBoxHero from "@/app/cookie-box-hero.jpg";
import SmallBoxCookies from "@/app/small-box-cookies.webp";

const GALLERY_IMAGES: StaticImageData[] = [
  CookieBoxImage,
  CookieBoxHero,
  SmallBoxCookies,
];

const PRODUCT_DETAILS = {
  name: "Мини кукита с течен шоколад",
  price: "12.00 лв",
  description:
    "Най-обичаните ни мини кукита, сервирани с щедър съд с течен шоколад. Перфектни за споделяне, подарък или сладко изкушение у дома.",
  highlights: [
    "Безплатна доставка до 3 дни",
    "Всяка кутия съдържа около 20 мини кукита",
    "Включен буркан с течен шоколад за топене",
  ],
  weight: "Нетно тегло: 240 гр.",
  allergenNote:
    "Съдържа глутен, яйца, млечни продукти и следи от ядки.",
};

export default function MiniCookiesPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 2500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const priceValue = useMemo(() => parsePrice(PRODUCT_DETAILS.price), []);

  const wrapIndex = (index: number) => {
    const total = GALLERY_IMAGES.length;
    if (total === 0) return 0;
    return (index + total) % total;
  };

  const visibleIndices =
    GALLERY_IMAGES.length >= 3
      ? [wrapIndex(activeIndex - 1), activeIndex, wrapIndex(activeIndex + 1)]
      : Array.from({ length: GALLERY_IMAGES.length }, (_, idx) => idx);

  const handlePrev = () => setActiveIndex((prev) => wrapIndex(prev - 1));
  const handleNext = () => setActiveIndex((prev) => wrapIndex(prev + 1));

  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));

  const handleAddToCart = () => {
    addItem({
      productId: "mini-cookies",
      name: PRODUCT_DETAILS.name,
      price: priceValue,
      quantity,
    });
    setFeedback("Добавено в количката!");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fcd9d9] text-[#2f1b16]">
      <Marquee />
      <SiteHeader />

      <main className="flex-1 bg-[#f7c8cf]">
        <div className="mx-auto w-full px-[clamp(1rem,4vw,4rem)] py-16">
          <div className="grid gap-12 xl:grid-cols-[35%_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-[2rem] bg-white p-4 shadow-card">
                <div className="group relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-[#fcd9d9]">
                  <Image
                    src={GALLERY_IMAGES[activeIndex]}
                    alt={PRODUCT_DETAILS.name}
                    fill
                    className="object-cover transition duration-500"
                    sizes="(min-width: 1024px) 512px, 100vw"
                  />

                  {GALLERY_IMAGES.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-[#9d0012] opacity-0 shadow-card transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9d0012] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcd9d9] pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
                        aria-label="Предишно изображение"
                      >
                        <svg
                          viewBox="0 0 16 16"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M10 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-[#9d0012] opacity-0 shadow-card transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9d0012] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcd9d9] pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
                        aria-label="Следващо изображение"
                      >
                        <svg
                          viewBox="0 0 16 16"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {visibleIndices.map((imageIndex, position) => {
                  const image = GALLERY_IMAGES[imageIndex];
                  const isActive = imageIndex === activeIndex;
                  return (
                    <button
                      key={`${image.src}-${position}`}
                      type="button"
                      onClick={() => setActiveIndex(imageIndex)}
                      className={`relative aspect-square overflow-hidden rounded-2xl border bg-[#fbdbe0] transition ${
                        isActive
                          ? "border-[#9d0012] ring-2 ring-[#9d0012]"
                          : "border-white/40 hover:border-[#f1b8c4]"
                      }`}
                      aria-label={`Преглед на изображение ${position + 1}`}
                    >
                      <Image src={image} alt="" fill className="object-cover" sizes="200px" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-10">
              <header className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                    {PRODUCT_DETAILS.name}
                  </h1>
                  <span className="text-2xl font-semibold text-[#9d0012] sm:pt-1">
                    {PRODUCT_DETAILS.price}
                  </span>
                </div>
                <p className="text-base text-[#8c4a2f]/90">{PRODUCT_DETAILS.description}</p>
                <ul className="space-y-2 text-sm text-[#9d0012]">
                  {PRODUCT_DETAILS.highlights.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                  <li>{PRODUCT_DETAILS.weight}</li>
                </ul>
                <p className="text-xs uppercase tracking-[0.24em] text-[#9d0012]">
                  {PRODUCT_DETAILS.allergenNote}
                </p>
              </header>

              <section className="space-y-6 rounded-3xl bg-[#fce3e7] p-8 shadow-card">
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">Изберете количество</h2>
                  <p className="text-sm text-[#9d0012]/90">
                    Всяка кутия съдържа приблизително 20 мини кукита и буркан течен шоколад.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center justify-center gap-3 rounded-full bg-[#fde9ec] p-3">
                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f1b8c4] text-xl font-semibold text-[#9d0012] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Намали количеството"
                      disabled={quantity === 1}
                    >
                      –
                    </button>
                    <span className="flex h-12 min-w-[3.5rem] items-center justify-center rounded-full border border-[#f1b8c4] bg-white text-lg font-semibold text-[#2f1b16]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={increaseQuantity}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f1b8c4] bg-white text-xl font-semibold text-[#9d0012] transition hover:bg-[#fce3e7]"
                      aria-label="Увеличи количеството"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-center text-sm text-[#8c4a2f]/80">
                    <p>Минимум 1 кутия на поръчка.</p>
                    <p>Добавете повече за по-сладка изненада!</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full rounded-full bg-[#2f1b16] px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#561c19]"
                >
                  Добави {quantity} в количката
                </button>
                {feedback ? (
                  <p className="text-center text-xs text-[#9d0012]">{feedback}</p>
                ) : null}
              </section>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
