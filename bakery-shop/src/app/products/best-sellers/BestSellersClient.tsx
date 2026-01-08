"use client";

import { useMemo, useState } from "react";

import CookieShowcase from "@/components/CookieShowcase";
import FavoriteButton from "@/components/FavoriteButton";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/price";
import type { ProductRecord } from "@/lib/products";

const INCLUDED_COOKIES: Array<{ name: string; image: string }> = [
  { name: "Nutella Bueno", image: "/nutella-bueno-cookie-top.png" },
  { name: "Biscoff", image: "/biscoff-cookie-top.png" },
  { name: "Red Velvet Cheesecake", image: "/red-velvet-cookie-top.png" },
];

type BestSellersClientProps = {
  initialProduct?: ProductRecord | null;
};

export default function BestSellersClient({ initialProduct }: BestSellersClientProps) {
  const absImage = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://noregrets.bg").replace(/\/+$/, "");
    return `${base}${normalized}`;
  };

  const galleryImages = useMemo(() => {
    const base = initialProduct?.galleryImages?.filter(Boolean).map(absImage) ?? [];
    return Array.from(new Set(base));
  }, [initialProduct?.galleryImages]);

  const cookiesWithImages = INCLUDED_COOKIES;

  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const priceValue = Number(initialProduct?.price ?? 0);
  const formattedPrice = priceValue > 0 ? formatPrice(priceValue) : "";

  const productDetails = {
    name: initialProduct?.name ?? "",
    description: initialProduct?.description ?? "",
    weight: initialProduct?.weight ?? "",
    highlights: [] as string[],
    allergenNote: "",
  };

  const wrapIndex = (index: number) => {
    const length = galleryImages.length;
    if (length === 0) return 0;
    return (index + length) % length;
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
      productId: "best-sellers",
      name: productDetails.name,
      price: priceValue,
      quantity,
      options: cookiesWithImages.map((cookie) => cookie.name),
      image: galleryImages[activeIndex] ?? galleryImages[0],
    });
  };

  const quantityLabel = quantity === 1 ? "кутия" : `${quantity} кутии`;

  return (
    <div className="flex min-h-screen flex-col ">
      
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto w-full px-[clamp(1rem,4vw,4rem)] py-16">
          <div className="grid gap-12 xl:grid-cols-[40%_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-[1rem] bg-white p-1 shadow-card">
                <div className="group relative aspect-square overflow-hidden rounded-[0.75rem]">
                  <img
                    src={galleryImages[activeIndex]}
                    alt={productDetails.name}
                    className="h-full w-full object-cover transition duration-500"
                    loading="lazy"
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
                  const isActive = imageIndex === activeIndex;
                  return (
                    <button
                      key={`${image}-${position}`}
                      type="button"
                      onClick={() => goToImage(imageIndex)}
                      className={`relative aspect-square overflow-hidden rounded-2xl border transition ${
                        isActive ? "border-[#5f000b] ring-2 ring-[#5f000b]" : "border-white/40 hover:border-[#f1b8c4]"
                      }`}
                      aria-label={`Преглед на изображение ${position + 1}`}
                    >
                      <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-10">
              <header className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-3xl leading-tight sm:text-4xl ">{productDetails.name}</h3>
                  <span className="text-2xl font-semibold sm:pt-1">{formattedPrice}</span>
                </div>
                <p>{productDetails.description}</p>
                <ul className="space-y-2 ">
                  {productDetails.highlights.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                  {productDetails.weight ? <li>{productDetails.weight}</li> : null}
                </ul>
                <p className="uppercase ">{productDetails.allergenNote}</p>
              </header>

              <section className="space-y-6 rounded-s shadow-card">
                <div className="flex flex-col gap-1">
                  <h4 className="text-lg">Количество</h4>
                  <p>Кутията включва шест различни кукита. Минимум една кутия в поръчка.</p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4 text-[#5f000b]">
                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f4b9c2] text-lg font-semibold transition hover:bg-[#fff5f7] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Намали количеството"
                      disabled={quantity === 1}
                    >
                      –
                    </button>
                    <span className="flex h-12 min-w-[3.5rem] items-center justify-center rounded-full border border-[#f4b9c2] bg-white text-lg font-semibold">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={increaseQuantity}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f4b9c2] text-lg font-semibold transition hover:bg-[#fff5f7]"
                      aria-label="Увеличи количеството"
                    >
                      +
                    </button>
                  </div>

                  <p className="text-center sm:text-left">Добавете повече кутии за големи поводи и подаръци.</p>
                </div>

                <div className="space-y-3 rounded-2xl bg-white/80 p-4 text-sm ">
                  <strong className="text-base font-semibold ">Какво е включено</strong>
                  <ul className="space-y-3">
                    {cookiesWithImages.map((cookie) => (
                      <li key={cookie.name} className="flex items-center gap-3">
                        <span className="relative h-12 w-12 overflow-hidden rounded-full bg-white">
                          <img
                            src={cookie.image}
                            alt={cookie.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </span>
                        <span className="text-sm font-medium ">{cookie.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="cta w-full rounded-full bg-[#5f000b] px-6 py-4 text-sm font-semibold uppercase transition hover:bg-[#561c19]"
                >
                  Добави {quantityLabel} в количката
                </button>
                <FavoriteButton productId={initialProduct?.slug ?? "best-sellers"} className="w-full justify-center" />
              </section>

              <div className="space-y-6 rounded-2xl bg-white/80 p-6 text-sm ">
                <div className="space-y-3">
                  <strong className="text-base font-semibold ">Грижа за кукитата</strong>
                  <p>
                    Печем всичко в деня на изпращане и пакетираме бисквитките за максимална свежест. Кукитата остават най-вкусни до 10
                    дни, ако се съхраняват на стайна температура.
                  </p>
                  <p>
                    Ако предпочитате да ги запазите за по-късно, приберете ги във фризер до един месец и ги затоплете за няколко минути преди
                    сервиране.
                  </p>
                </div>

                <div className="space-y-3">
                  <strong className="text-base font-semibold ">Информация за доставка</strong>
                  <p>
                  Моля, предвидете 4 работни дни за доставка. Изпращаме от понеделник до четвъртък. Ако поръчката ви е направена след 15:00
                    ч. в четвъртък, тя ще бъде изпратена следващия понеделник.
                  </p>
                </div>

                <div className="space-y-3">
                  <strong className="text-base font-semibold ">Алергени и съставки</strong>
                  <p>
                    Всички бисквитки съдържат глутен и яйца. Някои бисквитки съдържат ядки. Ако имате алергии, моля, прочетете внимателно
                    съставките, преди да поръчате.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CookieShowcase />
      </main>

      <SiteFooter />
    </div>
  );
}
