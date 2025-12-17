"use client";

import Image from "next/image";
import { useState } from "react";

import Marquee from "@/components/Marquee";
import CookieShowcase from "@/components/CookieShowcase";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/price";
import type { ProductRecord } from "@/lib/products";

const FALLBACK_GALLERY: string[] = ["/cookie-box.jpg", "/mini-cookies-falling.png"];
const FALLBACK_DETAILS = {
  name: "Мини кукита с течен шоколад",
  description:
    "Най-обичаните ни мини кукита, сервирани с кутийка с Nutella. Перфектни за споделяне, подарък или сладко изкушение у дома.",
  highlights: [
    "Доставка до 3 работни дни",
    "Включена кутийка с Nutella за топене",
  ],
  weight: "Нетно тегло: 240 гр.",
  allergenNote: "Съдържа глутен, яйца, млечни продукти и следи от ядки.",
};

type MiniCookiesClientProps = {
  initialProduct?: ProductRecord | null;
};

export default function MiniCookiesClient({ initialProduct }: MiniCookiesClientProps) {
  const galleryImages =
    initialProduct?.galleryImages?.length ? initialProduct.galleryImages : FALLBACK_GALLERY;

  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const priceValue = initialProduct?.price ?? 12;
  const productDetails = {
    ...FALLBACK_DETAILS,
    name: initialProduct?.name ?? FALLBACK_DETAILS.name,
    description: initialProduct?.description ?? FALLBACK_DETAILS.description,
    weight: initialProduct?.weight || FALLBACK_DETAILS.weight,
  };

  const wrapIndex = (index: number) => {
    const total = galleryImages.length;
    if (total === 0) return 0;
    return (index + total) % total;
  };

  const visibleIndices =
    galleryImages.length >= 3
      ? [wrapIndex(activeIndex - 1), activeIndex, wrapIndex(activeIndex + 1)]
      : Array.from({ length: galleryImages.length }, (_, idx) => idx);

  const handlePrev = () => setActiveIndex((prev) => wrapIndex(prev - 1));
  const handleNext = () => setActiveIndex((prev) => wrapIndex(prev + 1));
  const goToImage = (index: number) => setActiveIndex(wrapIndex(index));
  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));

  const handleAddToCart = () => {
    addItem({
      productId: "mini-cookies",
      name: productDetails.name,
      price: priceValue,
      quantity,
      image: galleryImages[activeIndex] ?? galleryImages[0],
    });
  };

  return (
    <div className="flex min-h-screen flex-col ">
      <Marquee /> <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full px-[clamp(1rem,4vw,4rem)] py-16">
          <div className="grid gap-12 xl:grid-cols-[40%_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-[1rem] bg-white p-1 shadow-card">
                <div className="group relative aspect-square overflow-hidden rounded-[0.75rem]">
                  <Image
                    src={galleryImages[activeIndex]}
                    alt={productDetails.name}
                    fill
                    className="object-cover transition duration-500"
                    sizes="(min-width: 1024px) 512px, 100vw"
                  />
                  {galleryImages.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 opacity-0 shadow-card transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f000b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcd9d9] pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
                        aria-label="Предишно изображение"
                      >
                        <svg viewBox="0 0 16 16" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 opacity-0 shadow-card transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f000b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcd9d9] pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
                        aria-label="Следващо изображение"
                      >
                        <svg viewBox="0 0 16 16" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {visibleIndices.map((imageIndex, position) => {
                  const image = galleryImages[imageIndex];
                  const imageKey = image;
                  const isActive = imageIndex === activeIndex;
                  return (
                    <button
                      key={`${imageKey}-${position}`}
                      type="button"
                      onClick={() => goToImage(imageIndex)}
                      className={`relative aspect-square overflow-hidden rounded-2xl border transition ${
                        isActive ? "border-[#5f000b] ring-2 ring-[#5f000b]" : "border-white/40 hover:border-[#f1b8c4]"
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
                  <h3 className="text-3xl leading-tight sm:text-4xl ">{productDetails.name}</h3>
                  <span className="text-2xl font-semibold sm:pt-1">{formatPrice(priceValue)}</span>
                </div>
                <p>{productDetails.description}</p>
                <ul className="space-y-2 ">
                  {productDetails.highlights.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                  <li>{productDetails.weight}</li>
                </ul>
                <p className="uppercase ">{productDetails.allergenNote}</p>
              </header>
              <section className="space-y-6 rounded-s  shadow-card">
                <div className="flex flex-col gap-1">
                  <h4 className="text-lg">Изберете количество</h4>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 rounded-full p-3">
                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f1b8c4] text-lg font-semibold transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Намали количеството"
                      disabled={quantity === 1}
                    >
                      –
                    </button>
                    <span className="flex h-12 min-w-[3rem] items-center justify-center rounded-full border border-[#f1b8c4] bg-white text-base font-semibold">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={increaseQuantity}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f1b8c4] bg-white text-lg font-semibold transition hover:bg-white"
                      aria-label="Увеличи количеството"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="cta rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#561c19]"
                >
                  Добави в количката
                </button>
                <p className="text-sm italic text-[#5f000b]/70">{productDetails.allergenNote}</p>
              </section>
            </div>
          </div>
        </div>
        <CookieShowcase />
      </main>
      <SiteFooter />
    </div>
  );
}
