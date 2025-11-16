"use client";

import Image, { type StaticImageData } from "next/image";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import Marquee from "@/components/Marquee";
import CookieShowcase from "@/components/CookieShowcase";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { useCart } from "@/context/CartContext";
import { parsePrice } from "@/utils/price";
import CookieBoxHero from "@/app/cookie-box-hero.jpg";
import SmallBoxCookies from "@/app/small-box-cookies.webp";
import NutellaCookie from "@/app/nutella-bueno-cookie.png";

const GALLERY_IMAGES: StaticImageData[] = [CookieBoxHero, SmallBoxCookies, NutellaCookie];

type BoxConfig = {
  size: number;
  name: string;
  price: string;
  description: string;
  highlights: string[];
  weight: string;
  allergenNote: string;
};

const BOX_CONFIG: Record<string, BoxConfig> = {
  "6": {
    size: 6,
    name: "Направи сам кутия с 6 кукита",
    price: "50.00 лв",
    description: "Създайте своята мечтана селекция с шест любими вкуса, изпечени по ваша поръчка и доставени до дома ви.",
    highlights: ["Доставка до 3 дни", "Всяко кукито е опаковано индивидуално за максимална свежест"],
    weight: "Нетно тегло: 900 гр.",
    allergenNote: "Всички кукита съдържат глутен, яйца и млечни продукти. Възможни са следи от ядки и фъстъци.",
  },
  "mochi-4": {
    size: 4,
    name: "Направи сам кутия от 4 мочи",
    price: "20.00 лв",
    description: "Селекция от четири ръчно приготвени мочита – идеални за подарък или следобеден десерт.",
    highlights: [
      "Доставка до 3 дни",
      "Свежо приготвени и шоково замразени за транспорт",
      "Включена картичка с инструкции за сервиране",
    ],
    weight: "Нетно тегло: 240 гр.",
    allergenNote: "Съдържа глутен, млечни продукти и следи от ядки.",
  },
  mochi: {
    size: 4,
    name: "Направи сам кутия от 4 мочи",
    price: "20.00 лв",
    description: "Селекция от четири ръчно приготвени мочита – идеални за подарък или следобеден десерт.",
    highlights: [
      "Доставка до 3 дни",
      "Свежо приготвени и шоково замразени за транспорт",
      "Включена картичка с инструкции за сервиране",
    ],
    weight: "Нетно тегло: 240 гр.",
    allergenNote: "Съдържа глутен, млечни продукти и следи от ядки.",
  },
  "mochi-9": {
    size: 9,
    name: "Направи сам кутия от 9 мочи",
    price: "45.00 лв",
    description: "Максимум удоволствие – девет любими вкуса, комбинирани в голяма кутия за споделяне.",
    highlights: ["Доставка до 3 дни", "Възможност за комбиниране на до девет вкуса", "Сладко изживяване за парти или офис"],
    weight: "Нетно тегло: 540 гр.",
    allergenNote: "Съдържа глутен, млечни продукти и следи от ядки.",
  },
};

type CookieOption = {
  id: string;
  name: string;
  image: StaticImageData;
};

const COOKIE_OPTIONS: CookieOption[] = [
  { id: "nutella-bueno", name: "Nutella Bueno", image: "/nutella-bueno-top.png" },
  { id: "red-velvet", name: "Red Velvet Cheesecake", image: "/red-velvet-cookie-top.png" },
  { id: "biscoff", name: "Biskoff", image: "/biscoff-top.png" },
  { id: "tripple-choc", name: "Tripple Choc", image: "/tripple-choc-top.png" },
  { id: "new-york", name: "New York", image: "/new-york-top.png" },
  { id: "oreo", name: "Oreo & White Choc", image: "/oreo-cookie-top.png" },
];

const MOCHI_OPTIONS: CookieOption[] = [
  { id: "strawberry-mochi", name: "Ягодово мочи", image: SmallBoxCookies },
  { id: "matcha-mochi", name: "Матча мочи", image: CookieBoxHero },
];

const MAX_SELECTION = 12;
const DEFAULT_SIZE = "6";

export default function CustomBoxPage() {
  const params = useParams<{ size?: string }>();
  const requestedSize = params?.size ?? DEFAULT_SIZE;
  const hasConfig = Boolean(BOX_CONFIG[requestedSize]);
  const normalizedSize = hasConfig ? requestedSize : DEFAULT_SIZE;
  const config = BOX_CONFIG[normalizedSize];
  const isMochiBox = normalizedSize.startsWith("mochi");
  const options = isMochiBox ? MOCHI_OPTIONS : COOKIE_OPTIONS;
  const totalImages = GALLERY_IMAGES.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const [selection, setSelection] = useState<Record<string, number>>(() =>
    Object.fromEntries(options.map((cookie) => [cookie.id, 0])),
  );
  const { addItem } = useCart();
  const priceValue = useMemo(() => parsePrice(config.price), [config.price]);

  const wrapIndex = (index: number) => {
    if (totalImages === 0) return 0;
    return (index + totalImages) % totalImages;
  };

  const visibleIndices =
    totalImages >= 3 ? [wrapIndex(activeIndex - 1), activeIndex, wrapIndex(activeIndex + 1)] : Array.from({ length: totalImages }, (_, idx) => idx);

  const handlePrevImage = () => setActiveIndex((prev) => wrapIndex(prev - 1));
  const handleNextImage = () => setActiveIndex((prev) => wrapIndex(prev + 1));
  const goToImage = (index: number) => setActiveIndex(wrapIndex(index));

  const totalSelected = useMemo(() => Object.values(selection).reduce((sum, count) => sum + count, 0), [selection]);
  const requiredCount = config.size;
  const remainingSlots = requiredCount - totalSelected;
  const canAddToCart = totalSelected === requiredCount;

  const updateSelection = (id: string, delta: number) => {
    setSelection((prev) => {
      const nextCount = (prev[id] ?? 0) + delta;
      if (nextCount < 0) return prev;

      const currentTotal = Object.values(prev).reduce((sum, value) => sum + value, 0);
      const nextTotal = currentTotal + delta;
      if (delta > 0 && nextTotal > requiredCount) {
        return prev;
      }

      return {
        ...prev,
        [id]: Math.min(nextCount, MAX_SELECTION),
      };
    });
  };

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    const summary = options
      .map((cookie) => {
        const count = selection[cookie.id] ?? 0;
        return count > 0 ? `${cookie.name} × ${count}` : null;
      })
      .filter(Boolean) as string[];

    addItem({
      productId: `custom-box-${normalizedSize}`,
      name: config.name,
      price: priceValue,
      quantity: 1,
      options: summary,
    });
  };

  if (!hasConfig) {
    return (
      <div className="flex min-h-screen flex-col">
        <Marquee />
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-6 py-20 text-center">
          <div className="space-y-4">
            <p className="text-lg font-semibold">Тази кутия не съществува.</p>
            <p>Моля, изберете наличен вариант от страницата с продукти.</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col ">
      <Marquee />
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto w-full px-[clamp(1rem,4vw,4rem)] py-16">
          <div className="grid gap-12 xl:grid-cols-[40%_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-[1rem] bg-white p-1 shadow-card">
                <div className="group relative aspect-square overflow-hidden rounded-[0.75rem]">
                  <Image
                    src={GALLERY_IMAGES[activeIndex]}
                    alt="Кутия с кукита"
                    fill
                    className="object-cover transition duration-500"
                    sizes="(min-width: 1024px) 512px, 100vw"
                  />
                  {totalImages > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevImage}
                        className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 opacity-0 shadow-card transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f000b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcd9d9] pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
                        aria-label="Предишно изображение"
                      >
                        <svg viewBox="0 0 16 16" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={handleNextImage}
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
                  const image = GALLERY_IMAGES[imageIndex];
                  const isActive = imageIndex === activeIndex;
                  return (
                    <button
                      type="button"
                      key={`${image.src}-${position}`}
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
                  <h3 className="text-3xl leading-tight sm:text-4xl ">{config.name}</h3>
                  <span className="text-2xl font-semibold sm:pt-1">{config.price}</span>
                </div>
                <p>{config.description}</p>
                <ul className="space-y-2 ">
                  {config.highlights.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                  <li>{config.weight}</li>
                </ul>
                <p className="uppercase ">{config.allergenNote}</p>
              </header>

              <section className="space-y-6 rounded-s p-8 shadow-card">
                <div className="flex flex-col gap-1">
                  <h4 className="text-lg">Изберете бисквитки</h4>
                  <p>
                    Изберете точно {requiredCount} кукита. Остават{" "}
                    <span className="font-semibold ">{Math.max(remainingSlots, 0)}</span> за добавяне.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {options.map((cookie) => {
                    const count = selection[cookie.id] ?? 0;
                    return (
                      <article
                        key={cookie.id}
                        className="flex flex-col gap-5 overflow-hidden rounded-s border border-[#f4b9c2] bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <div className="flex items-center justify-between gap-6">
                          <div className="space-y-2">
                            <h6 className="text-xl font-semibold ">{cookie.name}</h6>
                          </div>
                          <div className="relative h-20 w-20 overflow-hidden rounded-full border border-[#fbd0d9]">
                            <Image src={cookie.image} alt={cookie.name} fill className="object-cover" sizes="120px" />
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-3 rounded-full p-3">
                          <button
                            type="button"
                            onClick={() => updateSelection(cookie.id, -1)}
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f1b8c4] text-lg font-semibold transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Премахни ${cookie.name}`}
                            disabled={count === 0}
                          >
                            –
                          </button>
                          <span className="flex h-12 min-w-[3.5rem] items-center justify-center rounded-full border border-[#f1b8c4] bg-white text-lg font-semibold ">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateSelection(cookie.id, 1)}
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f1b8c4] bg-white text-lg font-semibold transition hover: disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Добави ${cookie.name}`}
                            disabled={!remainingSlots}
                          >
                            +
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className={`cta w-full rounded-full px-6 py-4 text-sm font-semibold uppercase transition ${
                    canAddToCart ? "bg-[#5f000b]  hover:bg-[#561c19]" : "bg-[#bfa3aa]  cursor-not-allowed"
                  }`}
                  disabled={!canAddToCart}
                  onClick={handleAddToCart}
                >
                  Добави кутията в количката
                </button>
                {!canAddToCart ? (
                  <p className="text-center">Изберете точно {requiredCount} кукита, за да продължите.</p>
                ) : null}
              </section>

              <div className="space-y-6 rounded-2xl bg-white/80 p-6 text-sm ">
                <div className="space-y-3">
                  <strong className="text-base font-semibold ">Грижа за кукитата</strong>
                  <p>
                    Печем всичко в деня на изпращане и използваме въздушно запечатване за максимална свежест. Кукитата остават най-вкусни до две седмици, ако се
                    съхраняват на стайна температура.
                  </p>
                  <p>Ако предпочитате да ги запазите за по-късно, поставете ги във фризер до един месец и ги затоплете за няколко минути преди сервиране.</p>
                </div>

                <div className="space-y-3">
                  <strong className="text-base font-semibold ">Информация за доставка</strong>
                  <p>
                    Моля, предвидете 1-2 работни дни за изпращане и 1-2 работни дни за доставка. Изпращаме от понеделник до четвъртък. Ако поръчката ви е направена
                    след 17:00 ч. в четвъртък, тя ще бъде изпратена следващия понеделник.
                  </p>
                </div>

                <div className="space-y-3">
                  <strong className="text-base font-semibold ">Алергени и съставки</strong>
                  <p>Всички бисквитки съдържат глутен. Някои бисквитки съдържат ядки. Ако имате алергии, моля, прочетете внимателно съставките, преди да поръчате.</p>
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
