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
import NutellaCookie from "@/app/nutella-bueno-cookie.png";

const GALLERY_IMAGES: StaticImageData[] = [
  CookieBoxImage,
  CookieBoxHero,
  SmallBoxCookies,
];

const INCLUDED_COOKIES: Array<{ name: string; image: StaticImageData }> = [
  { name: "Нутела Буено", image: NutellaCookie },
  { name: "Ред Велвет", image: SmallBoxCookies },
  { name: "Солен карамел", image: CookieBoxHero },
  { name: "Млечно бискотино", image: CookieBoxImage },
];

const PRODUCT_DETAILS = {
  name: "Best Sellers кутия",
  price: "52.00 лв",
  description:
    "Нашата най-популярна селекция от шест емблематични кукита - внимателно опаковани и готови за подарък или споделяне.",
  highlights: [
    "Безплатна доставка до 3 дни",
    "Включени 6 различни вкуса",
    "Подходяща за подарък",
  ],
  weight: "Нетно тегло: 900 гр.",
  allergenNote:
    "Съдържа глутен, яйца, млечни продукти и следи от ядки.",
};

export default function BestSellersPage() {
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
    const length = GALLERY_IMAGES.length;
    if (length === 0) return 0;
    return (index + length) % length;
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
      productId: "best-sellers",
      name: PRODUCT_DETAILS.name,
      price: priceValue,
      quantity,
      options: INCLUDED_COOKIES.map((cookie) => cookie.name),
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
              <div className="overflow-hidden rounded-[1rem] bg-white p-4 shadow-card">
                <div className="group relative aspect-square overflow-hidden rounded-[0.75rem] bg-[#fcd9d9]">
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
                        className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-[#2f1b16] opacity-0 shadow-card transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f1b16] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcd9d9] pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
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
                        className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-[#2f1b16] opacity-0 shadow-card transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f1b16] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcd9d9] pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
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
                          ? "border-[#2f1b16] ring-2 ring-[#2f1b16]"
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
                  <span className="text-2xl font-semibold text-[#2f1b16] sm:pt-1">
                    {PRODUCT_DETAILS.price}
                  </span>
                </div>
                <p className="text-sl text-[#2f1b16]/90">{PRODUCT_DETAILS.description}</p>
                <ul className="space-y-2 text-l text-[#2f1b16]">
                  {PRODUCT_DETAILS.highlights.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                  <li>{PRODUCT_DETAILS.weight}</li>
                </ul>
                <p className="text-l uppercase text-[#2f1b16]">
                  {PRODUCT_DETAILS.allergenNote}
                </p>
              </header>

              <section className="space-y-6 rounded-sm bg-[#fce3e7] p-8 shadow-card">
                <div className="space-y-3">
                  {/* <h2 className="text-lg font-semibold">Изберете количество</h2> */}
                  <p className="text-l text-[#2f1b16]/90">
                    Кутията включва шест различни кукита. Минимум една кутия в поръчка.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center justify-center gap-3 rounded-sm bg-[#fde9ec] p-3">
                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#f1b8c4] text-xl font-semibold text-[#2f1b16] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Намали количеството"
                      disabled={quantity === 1}
                    >
                      –
                    </button>
                    <span className="flex h-8 min-w-[3.5rem] items-center justify-center rounded-sm border border-[#f1b8c4] bg-white text-lg font-semibold text-[#2f1b16]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={increaseQuantity}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#f1b8c4] bg-white text-xl font-semibold text-[#2f1b16] transition hover:bg-[#fce3e7]"
                      aria-label="Увеличи количеството"
                    >
                      +
                    </button>
                  </div>

                  <p className="text-center text-sm text-[#8c4a2f]/80">
                    Добавете повече кутии за големи поводи и подаръци.
                  </p>
                </div>

                <div className="space-y-3 rounded-2xl bg-white/85 p-4 text-sm text-[#8c4a2f]">
                  <strong className="text-base font-semibold text-[#2f1b16]">
                    Какво е включено
                  </strong>
                  <ul className="space-y-3">
                    {INCLUDED_COOKIES.map((cookie) => (
                      <li key={cookie.name} className="flex items-center gap-3">
                        <span className="relative h-12 w-12 overflow-hidden rounded-full border border-[#fbd0d9] bg-[#fde9ec]">
                          <Image src={cookie.image} alt={cookie.name} fill className="object-cover" sizes="64px" />
                        </span>
                        <span className="text-sm font-medium text-[#2f1b16]">{cookie.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="cta w-full rounded-full bg-[#2f1b16] px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#561c19]"
                >
                  Добави {quantity} в количката
                </button>
                {feedback ? (
                  <p className="text-center text-xs text-[#2f1b16]">{feedback}</p>
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
