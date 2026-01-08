"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import CookieShowcase from "@/components/CookieShowcase";
import FavoriteButton from "@/components/FavoriteButton";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { useCart } from "@/context/CartContext";
import { formatPrice, parsePrice } from "@/utils/price";
import type { CookieOptionRecord, ProductRecord } from "@/lib/products";
import type { FavoritePayload } from "@/lib/favorites";

const absImage = (value?: string) => {
  if (!value) return "";
  const raw = decodeURI(value);
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");
  const full = base ? `${base}${normalized}` : normalized;
  return encodeURI(full);
};

type BoxConfig = {
  size: number;
  name: string;
  price: string;
  description: string;
  highlights: string[];

  allergenNote: string;
};

const BOX_CONFIG: Record<string, BoxConfig> = {
  "3": {
    size: 3,
    name: "Направи сам кутия с 3 кукита",
    price: formatPrice(21),
    description:
      "Създайте персонална селекция от три любими вкуса – перфектни за подарък или дегустация.",
    highlights: [
      "Доставка до 4 работни дни",
      "Всяко куки е опаковано индивидуално за максимална свежест",
    ],

    allergenNote:
      "Всички кукита съдържат глутен, яйца и млечни продукти. Възможни са следи от ядки и фъстъци.",
  },
  "6": {
    size: 6,
    name: "Направи сам кутия с 6 кукита",
    price: formatPrice(50),
    description:
      "Създайте своята мечтана селекция с шест любими вкуса, изпечени по ваша поръчка и доставени до дома ви.",
    highlights: [
      "Доставка до 4 работни дни",
      "Всяко куки е опаковано индивидуално за максимална свежест",
    ],

    allergenNote:
      "Всички кукита съдържат глутен, яйца и млечни продукти. Възможни са следи от ядки и фъстъци.",
  },
  "mochi-4": {
    size: 4,
    name: "Направи сам кутия от 4 мочи",
    price: formatPrice(20),
    description:
      "Селекция от четири ръчно приготвени мочита – идеални за подарък или следобеден десерт.",
    highlights: [
      "Доставка до 4 работни дни",
      "Свежо приготвени и шоково замразени за транспорт",
      "Включена картичка с инструкции за сервиране",
    ],

    allergenNote: "Съдържа глутен, млечни продукти и следи от ядки.",
  },
  mochi: {
    size: 4,
    name: "Направи сам кутия от 4 мочи",
    price: formatPrice(20),
    description:
      "Селекция от четири ръчно приготвени мочита – идеални за подарък или следобеден десерт.",
    highlights: [
      "Доставка до 4 работни дни",
      "Свежо приготвени и шоково замразени за транспорт",
      "Включена картичка с инструкции за сервиране",
    ],

    allergenNote: "Съдържа глутен, млечни продукти и следи от ядки.",
  },
  "mochi-9": {
    size: 9,
    name: "Направи сам кутия от 9 мочи",
    price: formatPrice(45),
    description:
      "Максимум удоволствие – девет любими вкуса, комбинирани в голяма кутия за споделяне.",
    highlights: [
      "Доставка до 4 работни дни",
      "Възможност за комбиниране на до девет вкуса",
      "Сладко изживяване за парти или офис",
    ],

    allergenNote: "Съдържа глутен, млечни продукти и следи от ядки.",
  },
};

type CookieOption = {
  id: string;
  name: string;
  image: string;
  price: number;
};

const MOCHI_OPTIONS: CookieOption[] = [
  {
    id: "white-choc-mochi",
    name: "Бяло шоколадово мочи",
    image: "/white-choc-mochi.png",
    price: 0,
  },
  {
    id: "dark-choc-mochi",
    name: "Тъмно шоколадово мочи",
    image: "/dark-choc-mochi.png",
    price: 0,
  },
];

const MAX_SELECTION = 12;
const DEFAULT_SIZE = "6";

type CustomBoxClientProps = {
  requestedSize: string;
  initialProduct?: ProductRecord | null;
  cookieOptions?: CookieOptionRecord[];
};

export default function CustomBoxClient({
  requestedSize,
  initialProduct,
  cookieOptions,
}: CustomBoxClientProps) {
  const hasConfig = Boolean(BOX_CONFIG[requestedSize]);
  const normalizedSize = hasConfig ? requestedSize : DEFAULT_SIZE;
  const config = BOX_CONFIG[normalizedSize];
  const isMochiBox = normalizedSize.startsWith("mochi");
  const resolvedCookieOptions =
    cookieOptions?.map((option) => ({
      id: option.slug,
      name: option.name,
      image: option.image,
      price: option.price ?? 0,
    })) ?? [];
  const options = isMochiBox ? MOCHI_OPTIONS : resolvedCookieOptions;
  const galleryImages = useMemo(() => {
    const fromProduct = initialProduct?.galleryImages?.map(absImage).filter(Boolean) ?? [];
    const hero = initialProduct?.heroImage ? [absImage(initialProduct.heroImage)] : [];
    const combined = [...fromProduct, ...hero].filter(Boolean);
    return Array.from(new Set(combined));
  }, [initialProduct]);
  const [activeIndex, setActiveIndex] = useState(0);
  const basePrice = parsePrice(config.price);
  const resolvedPrice = isMochiBox ? initialProduct?.price ?? basePrice : 0;
  const [selection, setSelection] = useState<Record<string, number>>({});

  // Prefill selection from favorites (saved in sessionStorage before navigation).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem("favoriteBoxSelection");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.type === "custom-box" && parsed?.size === normalizedSize && Array.isArray(parsed.items)) {
        const next: Record<string, number> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parsed.items.forEach((it: any) => {
          if (it?.id && it?.quantity) {
            next[it.id] = Number(it.quantity) || 0;
          }
        });
        setSelection(next);
      }
    } catch {
      /* ignore */
    } finally {
      try {
        window.sessionStorage.removeItem("favoriteBoxSelection");
      } catch {
        /* ignore */
      }
    }
  }, [normalizedSize]);
  const computedBoxPrice = useMemo(
    () =>
      options.reduce(
        (sum, cookie) =>
          sum + (selection[cookie.id] ?? 0) * (cookie.price ?? 0),
        0
      ),
    [options, selection]
  );
  const priceValue = isMochiBox ? resolvedPrice : computedBoxPrice;
  const productDetails = useMemo(
    () => ({
      name: initialProduct?.name ?? config.name,
      description: initialProduct?.description ?? config.description,

      price: priceValue > 0 ? formatPrice(priceValue) : "—",
      highlights: config.highlights,
      allergenNote: config.allergenNote,
    }),
    [initialProduct, config, priceValue]
  );
  const totalImages = galleryImages.length;
  const { addItem } = useCart();

  const wrapIndex = (index: number) => {
    if (totalImages === 0) return 0;
    return (index + totalImages) % totalImages;
  };

  const visibleIndices =
    totalImages >= 3
      ? [wrapIndex(activeIndex - 1), activeIndex, wrapIndex(activeIndex + 1)]
      : Array.from({ length: totalImages }, (_, idx) => idx);

  const handlePrevImage = () => setActiveIndex((prev) => wrapIndex(prev - 1));
  const handleNextImage = () => setActiveIndex((prev) => wrapIndex(prev + 1));
  const goToImage = (index: number) => setActiveIndex(wrapIndex(index));

  const totalSelected = useMemo(
    () => options.reduce((sum, cookie) => sum + (selection[cookie.id] ?? 0), 0),
    [selection, options]
  );
  const requiredCount = config.size;
  const remainingSlots = requiredCount - totalSelected;
  const canAddToCart = totalSelected === requiredCount;

  const getCookieWeight = (id: string) =>
    id.includes("red-velvet") ? "140 г" : "150 г";

  const updateSelection = (id: string, delta: number) => {
    setSelection((prev) => {
      const currentCount = prev[id] ?? 0;
      const nextCount = currentCount + delta;
      if (nextCount < 0) return prev;

      const currentTotal = options.reduce(
        (sum, cookie) => sum + (prev[cookie.id] ?? 0),
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
      productId: `custom-box-${normalizedSize}`,
      name: productDetails.name,
      price: priceValue,
      quantity: 1,
      options: summary,
      image: galleryImages[activeIndex] ?? galleryImages[0] ?? "",
    });
  };

  const favoritePayload: FavoritePayload = useMemo(
    () => ({
      type: "custom-box",
      size: normalizedSize,
      items: options
        .map((cookie) => {
          const count = selection[cookie.id] ?? 0;
          return count > 0 ? { id: cookie.id, name: cookie.name, quantity: count } : null;
        })
        .filter(Boolean) as Array<{ id: string; name: string; quantity: number }>,
    }),
    [normalizedSize, options, selection],
  );

  if (!hasConfig) {
    return (
      <div className="flex min-h-screen flex-col">
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
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto w-full px-[clamp(1rem,4vw,4rem)] py-16">
          <div className="grid gap-12 xl:grid-cols-[40%_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-[1rem] bg-white p-1 shadow-card">
                <div className="group relative aspect-square overflow-hidden rounded-[0.75rem]">
                  {galleryImages[activeIndex] ? (
                    <Image
                      src={galleryImages[activeIndex]}
                      alt="Кутия с кукита"
                      fill
                      className="object-cover transition duration-500"
                      sizes="(min-width: 1024px) 512px, 100vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#fff5f7] text-sm text-[#5f000b]/60">
                      Няма изображение
                    </div>
                  )}
                  {totalImages > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevImage}
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
                        onClick={handleNextImage}
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
                  const imageKey = image;
                  const isActive = imageIndex === activeIndex;
                  return (
                    <button
                      type="button"
                      key={`${imageKey}-${position}`}
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

            <div className="space-y-10">
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
                  {config.highlights.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
                <p className="uppercase ">{config.allergenNote}</p>
              </header>

              <section className="space-y-6 rounded-s shadow-card">
                <div className="flex flex-col gap-1">
                  <h4 className="text-lg">Изберете бисквитки</h4>
                  {options.length ? (
                    <p>
                      Изберете точно {requiredCount} кукита. Остават{" "}
                      <span className="font-semibold ">
                        {Math.max(remainingSlots, 0)}
                      </span>{" "}
                      за добавяне.
                    </p>
                  ) : (
                    <p>
                      В момента няма налични бисквитки. Моля, опитайте отново
                      по-късно.
                    </p>
                  )}
                </div>

                {options.length ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {options.map((cookie) => {
                      const count = selection[cookie.id] ?? 0;
                      return (
                        <article
                          key={cookie.id}
                          className="rounded-s bg-[#ffeef1] p-1 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
                        >
                          <div className="flex flex-col gap-6 rounded-s border border-[#f4b9c2] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-2 sm:max-w-[60%]">
                              <h6 className="text-xl font-semibold text-[#5f000b]">
                                {cookie.name}
                              </h6>
                              {!isMochiBox ? (
                                <p className="text-sm font-semibold text-[#5f000b]/80">
                                  {getCookieWeight(cookie.id)}
                                </p>
                              ) : null}
                              {!isMochiBox ? (
                                <p className="text-sm font-semibold text-[#5f000b]">
                                  {formatPrice(cookie.price)}
                                </p>
                              ) : null}

                              <div className="flex items-center gap-4 text-[#5f000b]">
                                <button
                                  type="button"
                                  onClick={() => updateSelection(cookie.id, -1)}
                                  className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f4b9c2] text-lg font-semibold transition hover:bg-[#fff5f7] disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label={`Премахни ${cookie.name}`}
                                  disabled={count === 0}
                                >
                                  –
                                </button>
                                <span className="flex h-12 min-w-[3.5rem] items-center justify-center rounded-full border border-[#f4b9c2] bg-white text-lg font-semibold">
                                  {count}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateSelection(cookie.id, 1)}
                                  className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f4b9c2] text-lg font-semibold transition hover:bg-[#fff5f7] disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label={`Добави ${cookie.name}`}
                                  disabled={!remainingSlots}
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <div className="relative h-24 w-24 overflow-hidden rounded-s bg-white">
                              <Image
                                src={cookie.image}
                                alt={cookie.name}
                                fill
                                className="object-cover"
                                sizes="96px"
                              />
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : null}

                <div className="flex items-center justify-between rounded-s bg-white p-4 text-[#5f000b] shadow-card">
                  <div>
                    <p className="text-sm uppercase tracking-wide">Обща цена</p>
                    <p className="text-xs">
                      Формира се по избраните кукита
                    </p>
                  </div>
                  <p className="text-2xl font-semibold">
                    {priceValue > 0 ? formatPrice(priceValue) : "—"}
                  </p>
                </div>

                <button
                  type="button"
                  className={`cta w-full rounded-full px-6 py-4 text-sm font-semibold uppercase transition ${
                    canAddToCart && options.length
                      ? "bg-[#5f000b]  hover:bg-[#561c19]"
                      : "bg-[#bfa3aa]  cursor-not-allowed"
                  }`}
                  disabled={!canAddToCart || !options.length}
                  onClick={handleAddToCart}
                >
                  Добави кутията в количката
                </button>
                <div className="flex flex-col items-center gap-2">
                  <FavoriteButton
                    productId={`custom-box-${normalizedSize}`}
                    payload={favoritePayload}
                    disabled={!canAddToCart || !options.length}
                    className={!canAddToCart || !options.length ? "opacity-60" : ""}
                  />
                  {!canAddToCart && options.length ? (
                    <p className="text-sm text-[#5f000b]/70">Изберете всички {requiredCount} кукита, за да запазите кутията в любими.</p>
                  ) : null}
                </div>
                {!canAddToCart && options.length ? (
                  <p className="text-center">
                    Изберете точно {requiredCount} кукита, за да продължите.
                  </p>
                ) : null}
              </section>

              <div className="space-y-6 rounded-2xl bg-white/80 p-6 text-sm ">
                <div className="space-y-3">
                  <strong className="text-base font-semibold ">
                    Грижа за кукитата
                  </strong>
                  <p>
                    Печем всичко в деня на изпращане и пакетираме бисквитките за
                    максимална свежест. Кукитата остават най-вкусни до 10
                    дни, ако се съхраняват на стайна температура.
                  </p>
                  <p>
                    Ако предпочитате да ги запазите за по-късно, приберете ги
                    във фризер до един месец и ги затоплете за няколко минути
                    преди сервиране.
                  </p>
                </div>

                <div className="space-y-3">
                  <strong className="text-base font-semibold ">
                    Информация за доставка
                  </strong>
                  <p>
                    Моля, предвидете 4 работни дни за доставка. Изпращаме от
                    понеделник до четвъртък. Ако поръчката ви е направена след
                    15:00 ч. в четвъртък, тя ще бъде изпратена следващия
                    понеделник.
                  </p>
                </div>

                <div className="space-y-3">
                  <strong className="text-base font-semibold ">
                    Алергени и съставки
                  </strong>
                  <p>
                    Всички бисквитки съдържат глутен и яйца. Някои бисквитки съдържат
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
