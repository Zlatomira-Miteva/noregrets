"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useMemo, useState } from "react";

import Marquee from "@/components/Marquee";
import CookieShowcase from "@/components/CookieShowcase";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { useCart } from "@/context/CartContext";
import { formatPrice, parsePrice } from "@/utils/price";

import BestSellersCookieBox from "@/app/best sellers cookie box.png";
import CookieBoxHero from "@/app/cookie-box-hero.jpg";
import SmallBoxCookies from "@/app/small-box-cookies.webp";
import NutellaCookie from "@/app/nutella-bueno-cookie.png";

type GalleryImage = StaticImageData | string;

const FALLBACK_GALLERY: GalleryImage[] = [
  BestSellersCookieBox,
  CookieBoxHero,
  SmallBoxCookies,
];

const INCLUDED_COOKIES: Array<{ name: string; image: StaticImageData }> = [
  { name: "Nutella Bueno", image: NutellaCookie },
  { name: "Biscoff", image: SmallBoxCookies },
  { name: "Red Velvet Cheesecake", image: CookieBoxHero },
];

const FALLBACK_DETAILS = {
  name: "Best Sellers кутия",
  price: formatPrice(52),
  description:
    "Нашата най-популярна селекция от шест емблематични кукита – внимателно опаковани и готови за подарък или споделяне.",
  highlights: [
    "Доставка до 3 дни",
    "Включени 6 различни вкуса",
    "Подходяща за подарък",
  ],
  weight: "Нетно тегло: 900 гр.",
  allergenNote: "Съдържа глутен, яйца, млечни продукти и следи от ядки.",
};

export default function BestSellersPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [productDetails, setProductDetails] =
    useState<typeof FALLBACK_DETAILS>(FALLBACK_DETAILS);
  const [galleryImages, setGalleryImages] =
    useState<GalleryImage[]>(FALLBACK_GALLERY);

  const { addItem } = useCart();
  useEffect(() => {
    let isMounted = true;
    const loadProduct = async () => {
      try {
        const response = await fetch("/api/products/best-sellers");
        if (!response.ok) {
          throw new Error("Неуспешно зареждане на продукта.");
        }
        const data: {
          name?: string;
          price?: number;
          description?: string;
          weight?: string;
        } = await response.json();
        if (!isMounted) return;
        setProductDetails((prev) => ({
          ...prev,
          name: data.name || prev.name,
          description: data.description || prev.description,
          weight: data.weight || prev.weight,
          price:
            typeof data.price === "number"
              ? formatPrice(data.price)
              : prev.price,
        }));
      } catch (error) {
        console.error(error);
      }
    };
    loadProduct();
    return () => {
      isMounted = false;
    };
  }, []);
  const priceValue = useMemo(
    () => parsePrice(productDetails.price),
    [productDetails.price]
  );

  useEffect(() => {
    let isMounted = true;

    const loadGallery = async () => {
      try {
        const response = await fetch("/api/products/best-sellers");
        if (!response.ok) {
          return;
        }
        const data: { galleryImages?: string[] } = await response.json();
        if (isMounted && data.galleryImages?.length) {
          setGalleryImages(data.galleryImages);
          setActiveIndex(0);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadGallery();

    return () => {
      isMounted = false;
    };
  }, []);

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
      options: INCLUDED_COOKIES.map((cookie) => cookie.name),
    });
  };

  const quantityLabel = quantity === 1 ? "кутия" : `${quantity} кутии`;

  return (
    <div className="flex min-h-screen flex-col ">
      <Marquee />
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto w-full px-[clamp(1rem,4vw,4rem)] py-16">
          <div className="grid gap-12 xl:grid-cols-[40%_minmax(0,1fr)]">
            {/* LEFT COLUMN – IMAGE GALLERY */}
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
                        <svg
                          viewBox="0 0 16 16"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="M10 4l-4 4 4 4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 opacity-0 shadow-card transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f000b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcd9d9] pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
                        aria-label="Следващо изображение"
                      >
                        <svg
                          viewBox="0 0 16 16"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="M6 4l4 4-4 4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {visibleIndices.map((imageIndex, position) => {
                  const image = galleryImages[imageIndex];
                  const imageKey =
                    typeof image === "string" ? image : image.src;
                  const isActive = imageIndex === activeIndex;

                  return (
                    <button
                      key={`${imageKey}-${position}`}
                      type="button"
                      onClick={() => goToImage(imageIndex)}
                      className={`relative aspect-square overflow-hidden rounded-2xl border transition ${
                        isActive
                          ? "border-[#5f000b] ring-2 ring-[#5f000b]"
                          : "border-white/40 hover:border-[#f1b8c4]"
                      }`}
                      aria-label={`Преглед на изображение ${position + 1}`}
                    >
                      <Image
                        src={image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN – PRODUCT CONTENT */}
            <div className="space-y-10">
              {/* HEADER (same structure as custom box page) */}
              <header className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-3xl leading-tight sm:text-4xl ">
                    {productDetails.name}
                  </h3>
                  <span className="text-2xl font-semibold sm:pt-1">
                    {productDetails.price}
                  </span>
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

              {/* MAIN CARD – matches section styling of custom box (but for quantity instead of cookie selection) */}
              <section className="space-y-6 rounded-s shadow-card">
                <div className="flex flex-col gap-1">
                  <h4 className="text-lg">Количество</h4>
                  <p>
                    Кутията включва шест различни кукита. Минимум една кутия в
                    поръчка.
                  </p>
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

                  <p className="text-center sm:text-left">
                    Добавете повече кутии за големи поводи и подаръци.
                  </p>
                </div>

                <div className="space-y-3 rounded-2xl bg-white/80 p-4 text-sm ">
                  <strong className="text-base font-semibold ">
                    Какво е включено
                  </strong>
                  <ul className="space-y-3">
                    {INCLUDED_COOKIES.map((cookie) => (
                      <li key={cookie.name} className="flex items-center gap-3">
                        <span className="relative h-12 w-12 overflow-hidden rounded-full border border-[#fbd0d9] bg-white">
                          <Image
                            src={cookie.image}
                            alt={cookie.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </span>
                        <span className="text-sm font-medium ">
                          {cookie.name}
                        </span>
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
              </section>

              {/* BOTTOM INFO – copied structure from custom box page */}
              <div className="space-y-6 rounded-2xl bg-white/80 p-6 text-sm ">
                <div className="space-y-3">
                  <strong className="text-base font-semibold ">
                    Грижа за кукитата
                  </strong>
                  <p>
                    Печем всичко в деня на изпращане и пакетираме бисквитките за
                    максимална свежест. Кукитата остават най-вкусни до две
                    седмици, ако се съхраняват на стайна температура.
                  </p>
                  <p>
                    Ако предпочитате да ги запазите за по-късно, поставете ги
                    във фризер до един месец и ги затоплете за няколко минути
                    преди сервиране.
                  </p>
                </div>

                <div className="space-y-3">
                  <strong className="text-base font-semibold ">
                    Информация за доставка
                  </strong>
                  <p>
                    Моля, предвидете 3 работни дни за доставка. Изпращаме от
                    понеделник до четвъртък. Ако поръчката ви е направена след
                    16:30 ч. в четвъртък, тя ще бъде изпратена следващия
                    понеделник.
                  </p>
                </div>

                <div className="space-y-3">
                  <strong className="text-base font-semibold ">
                    Алергени и съставки
                  </strong>
                  <p>
                    Всички бисквитки съдържат глутен. Някои бисквитки съдържат
                    ядки. Ако имате алергии, моля, прочетете внимателно
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
