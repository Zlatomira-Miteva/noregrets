"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/price";
const allergenNote =
  "Всички торти в буркан съдържат пшеница, яйца и млечни продукти. Някои вкусове съдържат ядки.";

type CakeJarResponse = {
  id: string;
  slug: string;
  name: string;
  description: string;
  layers: string[];
  price: number;
  weight: string;
  leadTime: string;
  heroImage: string;
  galleryImages: string[];
  categoryImages: string[];
};

type CakeJar = CakeJarResponse & {
  imageSrc: string;
  heroImageSrc: string;
  priceLabel: string;
};

const normalizeImage = (value: string) => {
  if (!value) return "/red-velvet-cake-jar.png";
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
    return value;
  }
  return `/${value.replace(/^\/+/, "")}`;
};

export default function CakeJarsPage() {
  const { addItem } = useCart();
  const [cakeJars, setCakeJars] = useState<CakeJar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCakeJars = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/cake-jars");
        if (!response.ok) {
          throw new Error("Не успяхме да заредим тортите в буркан.");
        }
        const data: CakeJarResponse[] = await response.json();
        const normalized = data.map((jar) => ({
          ...jar,
          imageSrc: normalizeImage(jar.galleryImages[0] || jar.heroImage),
          heroImageSrc: normalizeImage(jar.heroImage || jar.categoryImages[0] || jar.galleryImages[0]),
          priceLabel: formatPrice(jar.price ?? 0),
        }));
        setCakeJars(normalized);
        setError(null);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : "Възникна грешка. Моля, опитайте отново.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCakeJars();
  }, []);

  const handleAddToCart = (jar: CakeJar) => {
    addItem({
      productId: jar.id,
      name: `Торта в буркан – ${jar.name}`,
      price: jar.price ?? 0,
      quantity: 1,
      options: [jar.name],
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fff6f1]">
      <SiteHeader />
      <main className="flex-1">
        <section className="px-[clamp(1rem,4vw,4rem)] py-16 text-center">
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">Торти в буркан</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg">
            Любимите ни кремове и блатове, подредени на слоеве в елегантни буркани. Изберете вкус,
            добавете към количката и получете персонална торта, готова за подарък или сладък момент
            само за вас.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/products/cake-jar"
              className="cta rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#781e21]"
            >
              Поръчай торта в буркан
            </Link>
            <Link
              href="/cart"
              className="rounded-full border border-[#5f000b] px-6 py-3 text-sm font-semibold uppercase transition hover:bg-white/60"
            >
              Виж количката
            </Link>
          </div>
        </section>

        <section className="space-y-16 px-[clamp(1rem,4vw,4rem)] pb-24">
          {isLoading && <p className="text-center text-sm text-[#5f000b]">Зареждаме тортите в буркан...</p>}
          {!isLoading && error && <p className="text-center text-sm text-red-600">{error}</p>}
          {!isLoading && !error && (
            <>
              {cakeJars.map((jar, index) => (
                <article
                  key={jar.id}
                  className={`flex flex-col gap-10 rounded-3xl p-8 shadow-card ${
                    index % 2 ? "lg:flex-row-reverse" : "lg:flex-row"
                  }`}
            >
              <div className="flex w-full items-center justify-center lg:w-1/2">
                <div className="group relative h-72 w-72 sm:h-96 sm:w-96">
                  <div className="pointer-events-none absolute inset-0 scale-125 rounded-full bg-gradient-to-b from-[#f3c8c8] to-transparent opacity-60 blur-3xl" />
                  <Image
                    src={jar.heroImageSrc}
                    alt={jar.name}
                    fill
                    className="object-contain transition-transform duration-500 ease-out group-hover:-rotate-2 group-hover:scale-105"
                    sizes="(min-width: 1024px) 25rem, 60vw"
                    priority={index === 0}
                  />
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-center gap-6 lg:w-1/2">
                <header>
                  <h2 className="mt-3 text-3xl font-bold text-[#5f000b]">{jar.name}</h2>
                </header>
                <div className="space-y-3 text-base leading-relaxed text-[#3e1b20]">
                  <p>{jar.description}</p>
                  <p className="text-sm uppercase text-[#5f000b]/60">Какво има вътре</p>
                  <p>{jar.layers.join(", ")}</p>
                  <p className="text-sm uppercase text-[#5f000b]/60">Грамаж</p>
                  <p>{jar.weight}</p>
                  <p className="text-sm uppercase text-[#5f000b]/60">Срок за доставка</p>
                  <p>{jar.leadTime}</p>
                  <p className="text-lg font-semibold text-[#5f000b]">{jar.priceLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddToCart(jar)}
                  className="cta inline-flex items-center justify-center rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#781e21]"
                >
                  Добави в количката
                </button>
                <p className="text-sm italic text-[#5f000b]/70">{allergenNote}</p>
                  </div>
                </article>
              ))}
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
