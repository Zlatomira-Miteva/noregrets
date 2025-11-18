"use client";
import Image, { type StaticImageData } from "next/image";
import { useEffect, useMemo, useState } from "react";
import Marquee from "@/components/Marquee";
import CookieShowcase from "@/components/CookieShowcase";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { useCart } from "@/context/CartContext";
import { formatPrice, parsePrice } from "@/utils/price";
import CookieBoxImage from "@/app/cookie-box.jpg";
import MiniCookiesFalling from "@/app/mini-cookies-falling.png";

type GalleryImage = StaticImageData | string;

const FALLBACK_GALLERY: GalleryImage[] = [CookieBoxImage, MiniCookiesFalling];
const FALLBACK_DETAILS = {
  name: "Мини кукита с течен шоколад",
  price: "12.00 лв",
  description:
    "Най-обичаните ни мини кукита, сервирани с кутийка с Nutella. Перфектни за споделяне, подарък или сладко изкушение у дома.",
  highlights: [
    "Доставка до 3 дни",
    "Включена кутийка с Nutella за топене",
  ],
  weight: "Нетно тегло: 240 гр.",
  allergenNote: "Съдържа глутен, яйца, млечни продукти и следи от ядки.",
};
export default function MiniCookiesPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [productDetails, setProductDetails] =
    useState<typeof FALLBACK_DETAILS>(FALLBACK_DETAILS);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(FALLBACK_GALLERY);
  const { addItem } = useCart();
  useEffect(() => {
    let isMounted = true;
    const loadProduct = async () => {
      try {
        const response = await fetch("/api/products/mini-cookies");
        if (!response.ok) {
          throw new Error("Неуспешно зареждане на продукта.");
        }
        const data: { name?: string; price?: number; description?: string; weight?: string } = await response.json();
        if (!isMounted) return;
        setProductDetails((prev) => ({
          ...prev,
          name: data.name || prev.name,
          description: data.description || prev.description,
          weight: data.weight || prev.weight,
          price: typeof data.price === "number" ? formatPrice(data.price) : prev.price,
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
  const priceValue = useMemo(() => parsePrice(productDetails.price), [productDetails.price]);
  useEffect(() => {
    let isMounted = true;
    const loadGallery = async () => {
      try {
        const response = await fetch("/api/products/mini-cookies");
        if (!response.ok) {
          throw new Error("Неуспешно зареждане на продукта.");
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
  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));
  const handleAddToCart = () => {
    addItem({
      productId: "mini-cookies",
      name: productDetails.name,
      price: priceValue,
      quantity,
    });
  };
  return (
    <div className="flex min-h-screen flex-col ">
      {" "}
      <Marquee /> <SiteHeader />{" "}
      <main className="flex-1">
        {" "}
        <div className="mx-auto w-full px-[clamp(1rem,4vw,4rem)] py-16">
          {" "}
          <div className="grid gap-12 xl:grid-cols-[40%_minmax(0,1fr)]">
            {" "}
            {/* LEFT: gallery */}{" "}
            <div className="space-y-6">
              {" "}
              <div className="overflow-hidden rounded-[1rem] bg-white p-1 shadow-card">
                {" "}
                <div className="group relative aspect-square overflow-hidden rounded-[0.75rem]">
                  {" "}
                  <Image
                    src={galleryImages[activeIndex]}
                    alt={productDetails.name}
                    fill
                    className="object-cover transition duration-500"
                    sizes="(min-width: 1024px) 512px, 100vw"
                  />{" "}
                  {galleryImages.length > 1 ? (
                    <>
                      {" "}
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 opacity-0 shadow-card transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f000b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcd9d9] pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
                        aria-label="Предишно изображение"
                      >
                        {" "}
                        <svg
                          viewBox="0 0 16 16"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          {" "}
                          <path
                            d="M10 4l-4 4 4 4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />{" "}
                        </svg>{" "}
                      </button>{" "}
                      <button
                        type="button"
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 opacity-0 shadow-card transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f000b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcd9d9] pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
                        aria-label="Следващо изображение"
                      >
                        {" "}
                        <svg
                          viewBox="0 0 16 16"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          {" "}
                          <path
                            d="M6 4l4 4-4 4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />{" "}
                        </svg>{" "}
                      </button>{" "}
                    </>
                  ) : null}{" "}
                </div>{" "}
              </div>{" "}
              <div className="grid grid-cols-3 gap-4">
                {" "}
                {visibleIndices.map((imageIndex, position) => {
                  const image = galleryImages[imageIndex];
                  const imageKey = typeof image === "string" ? image : image.src;
                  const isActive = imageIndex === activeIndex;
                  return (
                    <button
                      key={`${imageKey}-${position}`}
                      type="button"
                      onClick={() => setActiveIndex(imageIndex)}
                      className={`relative aspect-square overflow-hidden rounded-2xl border transition ${
                        isActive
                          ? "border-[#5f000b] ring-2 ring-[#5f000b]"
                          : "border-white/40 hover:border-[#f1b8c4]"
                      }`}
                      aria-label={`Преглед на изображение ${position + 1}`}
                    >
                      {" "}
                      <Image
                        src={image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="200px"
                      />{" "}
                    </button>
                  );
                })}{" "}
              </div>{" "}
            </div>{" "}
            {/* RIGHT: content */}{" "}
            <div className="space-y-10">
              {" "}
              <header className="space-y-4">
                {" "}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {" "}
                  <h3 className="text-3xl leading-tight sm:text-4xl ">
                    {" "}
                    {productDetails.name}{" "}
                  </h3>{" "}
                  <span className="text-2xl font-semibold sm:pt-1">
                    {" "}
                    {productDetails.price}{" "}
                  </span>{" "}
                </div>{" "}
                <p className="/90"> {productDetails.description} </p>{" "}
                <ul className="space-y-2 ">
                  {" "}
                  {productDetails.highlights.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}{" "}
                  <li>{productDetails.weight}</li>{" "}
                </ul>{" "}
                <p className="uppercase "> {productDetails.allergenNote} </p>{" "}
              </header>{" "}
              <section className="space-y-6 rounded-s  shadow-card">
                {" "}
                <div className="flex flex-col gap-1">
                  {" "}
                  <h4 className="text-lg">Изберете количество</h4>{" "}
                  <p className="/90">
                    {" "}
                    Всяка кутия съдържа приблизително 20 мини кукита и кутийка
                    течен шоколад.{" "}
                  </p>{" "}
                </div>{" "}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {" "}
                  <div className="flex items-center justify-center gap-3 rounded-full p-3">
                    {" "}
                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f1b8c4] text-lg font-semibold transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Намали количеството"
                      disabled={quantity === 1}
                    >
                      {" "}
                      –{" "}
                    </button>{" "}
                    <span className="flex h-12 min-w-[3.5rem] items-center justify-center rounded-full border border-[#f1b8c4] bg-white text-lg font-semibold ">
                      {" "}
                      {quantity}{" "}
                    </span>{" "}
                    <button
                      type="button"
                      onClick={increaseQuantity}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f1b8c4] bg-white text-lg font-semibold transition hover:"
                      aria-label="Увеличи количеството"
                    >
                      {" "}
                      +{" "}
                    </button>{" "}
                  </div>{" "}
                  <div className="text-center text-sm">
                    {" "}
                    <p>Минимум 1 кутия на поръчка.</p>{" "}
                  </div>{" "}
                </div>{" "}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="cta w-full rounded-full bg-[#5f000b] px-6 py-4 text-sm font-semibold uppercase  transition hover:bg-[#561c19]"
                >
                  {" "}
                  Добави {quantity} в количката{" "}
                </button>{" "}

                <div className="space-y-6 rounded-2xl bg-white/80 p-6 text-sm ">
                  <div className="space-y-3">
                    <strong className="text-base font-semibold ">Грижа за кукитата</strong>
                    <p>
                      Печем всичко в деня на изпращане и пакетираме бисквитките за максимална свежест. Кукитата остават най-вкусни до две седмици, ако се
                      съхраняват на стайна температура.
                    </p>
                    <p>
                      Ако предпочитате да ги запазите за по-късно, поставете ги във фризер до един месец и ги затоплете за няколко минути преди сервиране.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <strong className="text-base font-semibold ">Информация за доставка</strong>
                    <p>
                      Моля, предвидете 3 работни дни за доставка. Изпращаме от понеделник до четвъртък. Ако поръчката ви е направена след 16:30 ч. в четвъртък, тя
                      ще бъде изпратена следващия понеделник.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <strong className="text-base font-semibold ">Алергени и съставки</strong>
                    <p>
                      Всички бисквитки съдържат глутен. Някои бисквитки съдържат ядки. Ако имате алергии, моля, прочетете внимателно съставките, преди да
                      поръчате.
                    </p>
                  </div>
                </div>
              </section>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <CookieShowcase />{" "}
      </main>{" "}
      <SiteFooter />{" "}
    </div>
  );
}
