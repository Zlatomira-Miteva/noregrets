"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import FavoriteButton from "@/components/FavoriteButton";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/price";

type CakeJar = {
  id: string;
  slug: string;
  name: string;
  description: string;
  layers: string[];
  heroImage: string;
  galleryImages: string[];
  categoryImages: string[];
  price: number;
  weight?: string;
  leadTime: string;
};

const CAKE_ALLERGEN_NOTE =
  "Всички торти в буркан съдържат пшеница, яйца и млечни продукти. Възможни са следи от ядки и фъстъци.";

const normalizeImage = (value?: string) => {
  if (!value) return "/red-velvet-cake-jar.png";
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
    return value;
  }
  return `/${value.replace(/^\/+/, "")}`;
};

function CakeJarContent() {
  const searchParams = useSearchParams();
  const { addItem } = useCart();

  const [cakeJars, setCakeJars] = useState<CakeJar[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJars = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/cake-jars");
        if (!response.ok) {
          throw new Error("Не успяхме да заредим тортите в буркан.");
        }
        const data: CakeJar[] = await response.json();
        setCakeJars(data);
        const preferred = searchParams?.get("flavor");
        if (preferred && data.some((jar) => jar.slug === preferred)) {
          setActiveSlug(preferred);
        } else {
          setActiveSlug(data[0]?.slug ?? null);
        }
        setError(null);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : "Възникна неочаквана грешка. Моля, опитайте отново.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadJars();
  }, [searchParams]);

  useEffect(() => {
    setActiveIndex(0);
  }, [activeSlug]);

  const activeJar = useMemo(
    () => cakeJars.find((jar) => jar.slug === activeSlug) ?? cakeJars[0],
    [cakeJars, activeSlug],
  );

  const galleryImages = useMemo(() => {
    if (!activeJar) return [];
    const normalized = activeJar.galleryImages?.length
      ? activeJar.galleryImages.map(normalizeImage)
      : [normalizeImage(activeJar.heroImage)];
    return normalized;
  }, [activeJar]);

  const visibleImages = galleryImages.map((_, idx) => idx);

  const handlePrev = () => {
    setActiveIndex((prev) => {
      const total = galleryImages.length || 1;
      return (prev - 1 + total) % total;
    });
  };

  const handleNext = () => {
    setActiveIndex((prev) => {
      const total = galleryImages.length || 1;
      return (prev + 1) % total;
    });
  };

  const handleAddToCart = () => {
    if (!activeJar) return;
    addItem({
      productId: activeJar.id,
      name: `Торта в буркан – ${activeJar.name}`,
      price: activeJar.price,
      quantity,
      options: [activeJar.name],
      image: activeJar.heroImage,
    });
    setQuantity(1);
  };

  return (
    <div className="flex min-h-screen flex-col">
      
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full px-[clamp(1rem,4vw,4rem)] py-16">
          <div className="mb-10 flex flex-wrap items-center gap-3">
            {isLoading && <span className="text-sm text-[#5f000b]/70">Зареждаме...</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>

          {activeJar ? (
            <div className="grid gap-12 xl:grid-cols-[45%_minmax(0,1fr)]">
              <div className="space-y-6">
                <div className="overflow-hidden rounded-[1rem] bg-white p-4 shadow-card">
                  <div className="group relative aspect-square overflow-hidden rounded-[0.75rem]">
                    <Image
                      src={galleryImages[activeIndex]}
                      alt={activeJar.name}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="(min-width: 1024px) 480px, 100vw"
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
                  {visibleImages.map((imageIndex, position) => {
                    const image = galleryImages[imageIndex];
                    const isActive = imageIndex === activeIndex;
                    return (
                      <button
                        key={`${image}-${position}`}
                        type="button"
                        onClick={() => setActiveIndex(imageIndex)}
                        className={`relative aspect-square overflow-hidden rounded-2xl border transition ${
                          isActive ? "border-[#5f000b] ring-2 ring-[#5f000b]" : "border-white/40 hover:border-[#f1b8c4]"
                        }`}
                        aria-label={`Преглед на изображение ${position + 1}`}
                      >
                        <Image src={image} alt="" fill className="object-cover" sizes="200px" unoptimized />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-10">
                <header className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">{activeJar.name}</h1>
                    <span className="text-2xl font-semibold sm:pt-1">{formatPrice(activeJar.price)}</span>
                  </div>
                  <p className="text-[#5f000b]/80">{activeJar.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-[#5f000b]/80">
                  <span>{activeJar.leadTime || "Доставка до 4 работни дни"}</span>
                    {activeJar.weight ? <span>{activeJar.weight}</span> : null}
                  </div>
                  <p className="text-sm text-[#5f000b]/70">{CAKE_ALLERGEN_NOTE}</p>
                </header>

                <div className="rounded-[1rem] bg-white p-5 shadow-card">
                  <p className="text-sm uppercase text-[#5f000b]/60">Избери вкус</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {cakeJars.map((jar) => {
                      const isActive = jar.slug === activeJar.slug;
                      return (
                        <button
                          key={jar.slug}
                          type="button"
                          onClick={() => setActiveSlug(jar.slug)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            isActive ? "bg-[#5f000b] text-white" : "border border-[#5f000b] text-[#5f000b]"
                          }`}
                        >
                          {jar.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <section className="space-y-3">
                  <p className="text-sm uppercase text-[#5f000b]/60">Какво има вътре</p>
                  <p>{activeJar.layers?.join(", ") || "Сезонни слоеве крем и блатове."}</p>
                </section>

                <div className="space-y-4 rounded-[1rem] bg-white/80 p-5 shadow-card">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Количество</p>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f3bec8] text-lg font-semibold transition hover:bg-[#fff6f8]"
                        aria-label="Намали количеството"
                      >
                        –
                      </button>
                      <span className="flex h-10 min-w-[3rem] items-center justify-center rounded-full border border-[#f3bec8] bg-white text-lg font-semibold">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((prev) => prev + 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f3bec8] bg-white text-lg font-semibold transition hover:bg-[#fff6f8]"
                        aria-label="Увеличи количеството"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#781e21]"
                  >
                    Добави {quantity} в количката
                  </button>
                  <div className="flex justify-center">
                    <FavoriteButton productId={activeJar.slug ?? activeJar.id} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-white/80 p-8 text-center shadow-card">
              {error ? <p className="text-[#5f000b]">{error}</p> : <p className="text-[#5f000b]">Зареждаме...</p>}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function CakeJarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-[#5f000b]">
          Зареждаме…
        </div>
      }
    >
      <CakeJarContent />
    </Suspense>
  );
}
