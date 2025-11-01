'use client';

import Image, { type StaticImageData } from "next/image";
import { notFound } from "next/navigation";
import { useMemo, useState } from "react";

import Marquee from "@/components/Marquee";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

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
};

type CookieOption = {
  id: string;
  name: string;
  description: string;
  image: StaticImageData;
};

const COOKIE_OPTIONS: CookieOption[] = [
  {
    id: "nutella-bueno",
    name: "Нутела Буено",
    description: "Тъмно шоколадово тесто с нутела крем и лешници.",
    image: NutellaCookie,
  },
  {
    id: "red-velvet",
    name: "Ред Велвет",
    description: "Кадифено тесто с бял шоколад и крема сирене.",
    image: SmallBoxCookies,
  },
  {
    id: "salted-caramel",
    name: "Солен карамел",
    description: "Карамелизиран център и морска сол за финален акцент.",
    image: CookieBoxHero,
  },
  {
    id: "pistachio-rose",
    name: "Шамфъстък и роза",
    description: "Богат шамфъстъчено тесто, овкусено с розова вода.",
    image: SmallBoxCookies,
  },
  {
    id: "double-choc",
    name: "Двоен шоколад",
    description: "Шоколадово кукито със солени какаови нибс.",
    image: NutellaCookie,
  },
  {
    id: "white-choc-matcha",
    name: "Матча и бял шоколад",
    description: "Леко горчив матча вкус с балансиращ бял шоколад.",
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

  const totalImages = GALLERY_IMAGES.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [selection, setSelection] = useState<Record<string, number>>(() =>
    Object.fromEntries(COOKIE_OPTIONS.map((cookie) => [cookie.id, 0])),
  );

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
    [selection],
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

  return (
    <div className="flex min-h-screen flex-col bg-[#fcd9d9] text-[#2f1b16]">
      <Marquee />
      <SiteHeader />

      <main className="flex-1 bg-[#f7c8cf]">
        <div className="mx-auto w-full max-w-6xl px-[clamp(1rem,3vw,3rem)] py-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-2">
              <div className="overflow-hidden rounded-[0.5rem] bg-[#fbe2e5] p-4 shadow-card">
                <div className="group relative aspect-square overflow-hidden rounded-[0.25rem] bg-[#fcd9d9]">
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
                        onClick={handleNextImage}
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
                      type="button"
                      key={`${image.src}-${position}`}
                      onClick={() => goToImage(imageIndex)}
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-3xl font-bold leading-tight sm:text-4xl">
                    {config.name}
                  </h3>
                  <span className="text-2xl font-semibold text-[#9d0012]">
                    {config.price}
                  </span>
                </div>
                <p className="text-base text-[#8c4a2f]/90">{config.description}</p>
                <ul className="space-y-2 text-sm text-[#8c4a2f]">
                  {config.highlights.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                  <li>{config.weight}</li>
                </ul>
                <p className="text-xs uppercase tracking-[0.2em] text-[#9d0012]">
                  {config.allergenNote}
                </p>
              </header>

              <section className="space-y-6 rounded-3xl bg-[#fce3e7] p-6 shadow-card">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold">Изберете бисквитки</h2>
                  <p className="text-sm text-[#8c4a2f]/90">
                    Изберете точно {requiredCount} кукита. Остават{" "}
                    <span className="font-semibold text-[#9d0012]">
                      {Math.max(remainingSlots, 0)}
                    </span>{" "}
                    за добавяне.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {COOKIE_OPTIONS.map((cookie) => {
                    const count = selection[cookie.id] ?? 0;
                    return (
                      <article
                        key={cookie.id}
                        className="flex flex-col gap-4 rounded-2xl bg-white/90 p-4 shadow-card"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative h-16 w-16 overflow-hidden rounded-full bg-[#fbe2e5]">
                            <Image
                              src={cookie.image}
                              alt={cookie.name}
                              fill
                              className="object-cover"
                              sizes="120px"
                            />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold">{cookie.name}</h3>
                            <p className="text-xs text-[#8c4a2f]/80">
                              {cookie.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => updateSelection(cookie.id, -1)}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f1b8c4] text-lg font-semibold text-[#9d0012] transition hover:bg-[#fce3e7]"
                            aria-label={`Премахни ${cookie.name}`}
                          >
                            –
                          </button>
                          <span className="min-w-[3rem] text-center text-lg font-semibold">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateSelection(cookie.id, 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#9d0012] text-lg font-semibold text-white transition hover:bg-[#7a0010]"
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

                <div className="flex flex-col gap-3 rounded-2xl bg-white/80 p-4 text-sm text-[#8c4a2f]">
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

                <button
                  type="button"
                  className={`w-full rounded-full px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition ${
                    canAddToCart
                      ? "bg-[#2f1b16] text-white hover:bg-[#561c19]"
                      : "bg-[#bfa3aa] text-white/70 cursor-not-allowed"
                  }`}
                  disabled={!canAddToCart}
                >
                  Добави кутията в количката
                </button>
                {!canAddToCart ? (
                  <p className="text-center text-xs text-[#8c4a2f]/80">
                    Изберете точно {requiredCount} кукита, за да продължите.
                  </p>
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
