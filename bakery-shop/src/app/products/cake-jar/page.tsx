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
  CookieBoxHero,
  CookieBoxImage,
  SmallBoxCookies,
];

const PRODUCT_DETAILS = {
  name: "Торта в буркан",
  price: "20.00 лв",
  description:
    "Изберете любимия си крем и се насладете на персонализирана торта, сервирана в удобен буркан – идеална за подарък или сладко изкушение в движение.",
  highlights: [
    "Безплатна доставка до 3 дни",
    "Приготвена в деня на изпращане",
    "Изберете един от най-популярните ни кремове",
  ],
  weight: "Нетно тегло: 240 гр.",
  allergenNote:
    "Съдържа глутен, яйца, млечни продукти и следи от ядки.",
};

type FillingOption = {
  id: string;
  name: string;
  description: string;
  image: StaticImageData;
};

const FILLING_OPTIONS: FillingOption[] = [
  {
    id: "chocolate",
    name: "Шоколадов мус",
    description: "Плътен мус с белгийски шоколад и хрупкави перли.",
    image: NutellaCookie,
  },
  {
    id: "berry",
    name: "Боровинково сирене",
    description: "Лек крем чизкейк с боровинков сос и ванилова бисквита.",
    image: SmallBoxCookies,
  },
  {
    id: "tiramisu",
    name: "Тирамису",
    description: "Маскарпоне крем, еспресо сиироп и какаов прах.",
    image: CookieBoxImage,
  },
  {
    id: "pistachio",
    name: "Шамфъстък и малини",
    description: "Шамфъстъчен крем с конфитюр от малини и ванилов блат.",
    image: CookieBoxHero,
  },
];

export default function CakeJarPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedFilling, setSelectedFilling] = useState<string | null>(null);
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

  const handleAddToCart = () => {
    if (!selectedFilling) return;
    const filling = FILLING_OPTIONS.find((f) => f.id === selectedFilling);
    addItem({
      productId: "cake-jar",
      name: PRODUCT_DETAILS.name,
      price: priceValue,
      quantity: 1,
      options: filling ? [filling.name] : undefined,
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
                  <h2 className="text-lg font-semibold">Изберете пълнеж</h2>
                  <p className="text-sm text-[#9d0012]/80">
                    Кликнете върху любимото пълнежно предложение, за да персонализирате вашата торта в буркан.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {FILLING_OPTIONS.map((option) => {
                    const isActive = selectedFilling === option.id;
                    return (
                      <label
                        key={option.id}
                        className={`flex cursor-pointer flex-col gap-4 rounded-2xl border bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg ${
                          isActive ? "border-[#9d0012] ring-2 ring-[#9d0012]" : "border-[#f4b9c2]"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="relative h-16 w-16 overflow-hidden rounded-full border border-[#fbd0d9] bg-[#fde9ec]">
                            <Image src={option.image} alt={option.name} fill className="object-cover" sizes="80px" />
                          </span>
                          <div className="space-y-1">
                            <span className="text-base font-semibold text-[#9d0012]">{option.name}</span>
                            <p className="text-xs text-[#8c4a2f]/80">{option.description}</p>
                          </div>
                        </div>
                        <span className="flex items-center gap-2 text-sm text-[#8c4a2f]">
                          <input
                            type="radio"
                            name="filling"
                            value={option.id}
                            checked={isActive}
                            onChange={() => setSelectedFilling(option.id)}
                            className="h-4 w-4 border-[#f4b9c2] text-[#9d0012] focus:ring-[#9d0012]"
                          />
                          Избор на пълнеж
                        </span>
                      </label>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`w-full rounded-full px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition ${
                    selectedFilling
                      ? "bg-[#2f1b16] text-white hover:bg-[#561c19]"
                      : "bg-[#bfa3aa] text-white/70 cursor-not-allowed"
                  }`}
                  disabled={!selectedFilling}
                >
                  {selectedFilling ? "Добави в количката" : "Изберете пълнеж, за да продължите"}
                </button>
                {feedback ? (
                  <p className="text-center text-xs text-[#9d0012]">{feedback}</p>
                ) : null}
              </section>

              <div className="space-y-6 rounded-2xl bg-white/80 p-6 text-sm text-[#8c4a2f]">
                <div className="space-y-3">
                  <strong className="text-base font-semibold text-[#2f1b16]">
                    Съвети за съхранение
                  </strong>
                  <p>
                    Съхранявайте тортата в хладилник до три дни. За най-добър вкус извадете буркана 15 минути преди сервиране.
                  </p>
                </div>

                <div className="space-y-3">
                  <strong className="text-base font-semibold text-[#2f1b16]">
                    Информация за доставка
                  </strong>
                  <p>
                    Изпращаме от понеделник до четвъртък. Поръчките след 17:00 ч. в четвъртък се изпращат в понеделник.
                  </p>
                </div>

                <div className="space-y-3">
                  <strong className="text-base font-semibold text-[#2f1b16]">
                    Алергени
                  </strong>
                  <p>
                    Всички варианти съдържат глутен, млечни продукти и яйца. Някои пълнежи съдържат ядки.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
