"use client";

import Image, { type StaticImageData } from "next/image";
import { notFound } from "next/navigation";
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
  SmallBoxCookies,
  NutellaCookie,
];

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
    description:
      "Създайте своята мечтана селекция с шест любими вкуса, изпечени по ваша поръчка и доставени до дома ви.",
    highlights: [
      "Безплатна доставка до 3 дни",
      "Всяко кукито е опаковано индивидуално за максимална свежест",
    ],
    weight: "Нетно тегло: 900 гр.",
    allergenNote:
      "Всички кукита съдържат глутен, яйца и млечни продукти. Възможни са следи от ядки и фъстъци.",
  },
  "12": {
    size: 12,
    name: "Направи сам кутия с 12 кукита",
    price: "92.00 лв",
    description:
      "Дванадесет кукита за големи поводи и още по-големи усмивки – комбинирайте най-добрите вкусове на No Regrets.",
    highlights: [
      "Безплатна доставка до 3 дни",
      "Перфектна за споделяне на партита или в офиса",
    ],
    weight: "Нетно тегло: 1800 гр.",
    allergenNote:
      "Всички кукита съдържат глутен, яйца и млечни продукти. Възможни са следи от ядки и фъстъци.",
  },
  mochi: {
    size: 4,
    name: "Кутия с 4 бр. мочи",
    price: "20.00 лв",
    description:
      "Създайте собствена селекция от японски мочи десерти – четири аромата по ваш избор в елегантна кутия.",
    highlights: [
      "Безплатна доставка до 3 дни",
      "Свежо приготвени и шоково замразени за доставка",
      "Включен лист с инструкции за сервиране",
    ],
    weight: "Нетно тегло: 240 гр.",
    allergenNote:
      "Съдържа глутен, млечни продукти и следи от ядки.",
  },
};

type CookieOption = {
  id: string;
  name: string;
  image: StaticImageData;
};

const COOKIE_OPTIONS: CookieOption[] = [
  {
    id: "nutella-bueno",
    name: "Нутела Буено",
    image: NutellaCookie,
  },
  {
    id: "red-velvet",
    name: "Ред Велвет",
    image: SmallBoxCookies,
  },
  {
    id: "salted-caramel",
    name: "Солен карамел",
    image: CookieBoxHero,
  },
  {
    id: "pistachio-rose",
    name: "Шамфъстък и роза",
    image: SmallBoxCookies,
  },
  {
    id: "double-choc",
    name: "Двоен шоколад",
    image: NutellaCookie,
  },
  {
    id: "white-choc-matcha",
    name: "Матча и бял шоколад",
    image: CookieBoxHero,
  },
];

const MOCHI_OPTIONS: CookieOption[] = [
  {
    id: "strawberry-mochi",
    name: "Ягодово мочи",
    image: SmallBoxCookies,
  },
  {
    id: "matcha-mochi",
    name: "Матча мочи",
    image: CookieBoxHero,
  },
  {
    id: "mango-mochi",
    name: "Манго мочи",
    image: NutellaCookie,
  },
  {
    id: "black-sesame-mochi",
    name: "Черен сусам",
    image: CookieBoxImage,
  },
  {
    id: "taro-mochi",
    name: "Таро крем",
    image: SmallBoxCookies,
  },
  {
    id: "ube-mochi",
    name: "Убе",
    image: CookieBoxHero,
  },
];

type PageProps = {
  params: { size: string };
};

const MAX_SELECTION = 12;

export default function CustomBoxPage({ params }: PageProps) {
  const config = BOX_CONFIG[params.size];

  if (!config) {
    notFound();
  }

  const options = params.size === "mochi" ? MOCHI_OPTIONS : COOKIE_OPTIONS;

  const totalImages = GALLERY_IMAGES.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [selection, setSelection] = useState<Record<string, number>>(() =>
    Object.fromEntries(options.map((cookie) => [cookie.id, 0]))
  );
  const { addItem } = useCart();
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 2500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const priceValue = useMemo(() => parsePrice(config.price), [config.price]);

  const wrapIndex = (index: number) => {
    if (totalImages === 0) return 0;
    return (index + totalImages) % totalImages;
  };

  const visibleIndices =
    totalImages >= 3
      ? [wrapIndex(activeIndex - 1), activeIndex, wrapIndex(activeIndex + 1)]
      : Array.from({ length: totalImages }, (_, idx) => idx);

  const handlePrevImage = () => {
    setActiveIndex((prev) => wrapIndex(prev - 1));
  };

  const handleNextImage = () => {
    setActiveIndex((prev) => wrapIndex(prev + 1));
  };

  const goToImage = (index: number) => {
    setActiveIndex(wrapIndex(index));
  };

  const totalSelected = useMemo(
    () => Object.values(selection).reduce((sum, count) => sum + count, 0),
    [selection]
  );

  const requiredCount = config.size;
  const remainingSlots = requiredCount - totalSelected;
  const canAddToCart = totalSelected === requiredCount;

  const updateSelection = (id: string, delta: number) => {
    setSelection((prev) => {
      const nextCount = (prev[id] ?? 0) + delta;
      if (nextCount < 0) {
        return prev;
      }

      const currentTotal = Object.values(prev).reduce(
        (sum, value) => sum + value,
        0
      );
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
      productId: `custom-box-${params.size}`,
      name: config.name,
      price: priceValue,
      quantity: 1,
      options: summary,
    });

    setFeedback("Добавено в количката!");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fcd9d9] text-[#2f1b16]">
      <Marquee />
      <SiteHeader />

      <main className="flex-1 bg-[#f7c8cf]">
        <div className="mx-auto w-full px-[clamp(1rem,4vw,4rem)] py-16">
          <div className="grid gap-12 xl:grid-cols-[40%_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-[1rem] bg-white p-1 shadow-card">
                <div className="group relative aspect-square overflow-hidden rounded-[0.75rem] bg-[#fcd9d9]">
                  <Image
                    src={GALLERY_IMAGES[activeIndex]}
                    alt="Кутия с кукита, вързана с панделка"
                    fill
                    className="object-cover transition duration-500"
                    sizes="(min-width: 1024px) 512px, 100vw"
                  />

                  {totalImages > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevImage}
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
                          <path
                            d="M10 4l-4 4 4 4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={handleNextImage}
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
                  const image = GALLERY_IMAGES[imageIndex];
                  const isActive = imageIndex === activeIndex;
                  return (
                    <button
                      type="button"
                      key={`${image.src}-${position}`}
                      onClick={() => goToImage(imageIndex)}
                      className={`relative aspect-square overflow-hidden rounded-2xl border bg-[#fbdbe0] transition ${
                        isActive
                          ? "border-[#2f1b16] ring-2 ring-[#2f1b16]"
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

            <div className="space-y-10">
              <header className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-3xl leading-tight sm:text-4xl text-[#2f1b16]">
                    {config.name}
                  </h3>
                  <span className="text-2xl font-semibold text-[#2f1b16] sm:pt-1">
                    {config.price}
                  </span>
                </div>
                <p className="text-base text-[#2f1b16]/90">
                  {config.description}
                </p>
                <ul className="space-y-2 text-[#2f1b16]">
                  {config.highlights.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                  <li>{config.weight}</li>
                </ul>
                <p className="text-l uppercase text-[#2f1b16]">
                  {config.allergenNote}
                </p>
              </header>

              <section className="space-y-6 rounded-s bg-[#fce3e7] p-8 shadow-card">
                <div className="flex flex-col gap-1">
                  <h4 className="text-lg">Изберете бисквитки</h4>
                  <p className="text-sm text-[#2f1b16]/90">
                    Изберете точно {requiredCount} кукита. Остават{" "}
                    <span className="font-semibold text-[#2f1b16]">
                      {Math.max(remainingSlots, 0)}
                    </span>{" "}
                    за добавяне.
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
                            <h6 className="text-xl font-semibold text-[#2f1b16]">
                              {cookie.name}
                            </h6>
                          </div>
                          <div className="relative h-20 w-20 overflow-hidden rounded-full border border-[#fbd0d9] bg-[#fde9ec]">
                            <Image
                              src={cookie.image}
                              alt={cookie.name}
                              fill
                              className="object-cover"
                              sizes="120px"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-3 rounded-full bg-[#fde9ec] p-3">
                          <button
                            type="button"
                            onClick={() => updateSelection(cookie.id, -1)}
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f1b8c4] text-lg font-semibold text-[#2f1b16] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Премахни ${cookie.name}`}
                            disabled={count === 0}
                          >
                            –
                          </button>
                          <span className="flex h-12 min-w-[3.5rem] items-center justify-center rounded-full border border-[#f1b8c4] bg-white text-lg font-semibold text-[#2f1b16]">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateSelection(cookie.id, 1)}
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f1b8c4] bg-white text-lg font-semibold text-[#2f1b16] transition hover:bg-[#fce3e7] disabled:cursor-not-allowed disabled:opacity-40"
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
                    canAddToCart
                      ? "bg-[#2f1b16] text-white hover:bg-[#561c19]"
                      : "bg-[#bfa3aa] text-white/70 cursor-not-allowed"
                  }`}
                  disabled={!canAddToCart}
                  onClick={handleAddToCart}
                >
                  Добави кутията в количката
                </button>
                {!canAddToCart ? (
                  <p className="text-center text-xs text-[#8c4a2f]/80">
                    Изберете точно {requiredCount} кукита, за да продължите.
                  </p>
                ) : feedback ? (
                  <p className="text-center text-xs text-[#2f1b16]">{feedback}</p>
                ) : null}
              </section>
              <div className="space-y-6 rounded-2xl bg-white/80 p-6 text-sm text-[#8c4a2f]">
                <div className="space-y-3">
                  <strong className="text-base font-semibold text-[#2f1b16]">
                    Грижа за кукитата
                  </strong>
                  <p>
                    Печем всичко в деня на изпращане и използваме въздушно запечатване за
                    максимална свежест. Кукитата остават най-вкусни до две седмици, ако се
                    съхраняват на стайна температура.
                  </p>
                  <p>
                    Ако предпочитате да ги запазите за по-късно, поставете ги във фризер до
                    един месец и ги затоплете за няколко минути преди сервиране.
                  </p>
                </div>

                <div className="space-y-3">
                  <strong className="text-base font-semibold text-[#2f1b16]">
                  Информация за доставка
                  </strong>
                  <p>
                    Моля, предвидете 1-2 работни дни за изпращане и 1-2 работни дни за
                    доставка. Изпращаме от понеделник до четвъртък. Ако поръчката ви е
                    направена след 17:00 ч. в четвъртък, тя ще бъде изпратена следващия
                    понеделник.
                  </p>
                </div>

                <div className="space-y-3">
                  <strong className="text-base font-semibold text-[#2f1b16]">
                  Алергени и съставки
                  </strong>
                  <p>
                    Всички бисквитки съдържат глутен. Някои бисквитки съдържат ядки. Ако
                    имате алергии, моля, прочетете внимателно съставките, преди да поръчате.
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
