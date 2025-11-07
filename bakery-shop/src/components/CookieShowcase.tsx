"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type Cookie = {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  image: string;
};

const COOKIES: Cookie[] = [
  {
    id: "red-velvet",
    name: "Red Velvet Cheesecake",
    description:
      "Най-обичаното ни червено кукито с крема сирене и бял шоколад.",
    ingredients: [
      "Пшенично брашно и какао",
      "Бял шоколад и крема сирене",
      "Яйца, масло, набухватели",
    ],
    image: "/red-velvet-cookie-top.png",
  },
  {
    id: "oreo",
    name: "Oreo Madness",
    description: "Меко тесто с натрошени Oreo и тъмен шоколад.",
    ingredients: [
      "Пшенично брашно и кафява захар",
      "Трохи Oreo и парченца шоколад",
      "Яйца, масло, ванилия",
    ],
    image: "/oreo-cookie-top.png",
  },
  {
    id: "nutella-bueno",
    name: "Nutella Bueno",
    description: "Пълнеж от течен шоколад, лешници и хрупкава вафла.",
    ingredients: [
      "Пшенично брашно и кафява захар",
      "Nutella и карамелизирани лешници",
      "Хрупкави вафлени парченца",
    ],
    image: "/nutella-bueno-top.png",
  },
  {
    id: "biscoff",
    name: "Lotus Biscoff",
    description: "Карамелено тесто с Lotus бисквитки и бял шоколад.",
    ingredients: [
      "Пшенично брашно и Lotus крем",
      "Бял шоколад и канела",
      "Яйца, масло, захар",
    ],
    image: "/biscoff-top.png",
  },
  {
    id: "new-york",
    name: "New York Classic",
    description: "Дебело ванилово кукито с млечен шоколад и ядки.",
    ingredients: [
      "Пшенично брашно и ванилов екстракт",
      "Млечен шоколад",
      "Печени пекан и масло",
    ],
    image: "/new-york-top.png",
  },
  {
    id: "triple-choc",
    name: "Triple Chocolate",
    description: "Какаово тесто с тъмен, млечен и бял шоколад.",
    ingredients: [
      "Пшенично брашно и какао",
      "Микс от три вида шоколад",
      "Яйца, масло, солен карамел",
    ],
    image: "/tripple-choc-top.png",
  },
];

const AUTO_ROTATE_INTERVAL = 5000;

const CookieShowcase = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const peekWidth = useMemo(() => {
    if (!viewportWidth) return 100;
    const desired =
      viewportWidth >= 1280
        ? 240
        : viewportWidth >= 1024
        ? 200
        : viewportWidth >= 768
        ? 160
        : 100;
    return Math.min(desired, Math.max(60, Math.floor(viewportWidth * 0.25)));
  }, [viewportWidth]);

  const gap = useMemo(() => (viewportWidth >= 768 ? 32 : 20), [viewportWidth]);
  const slideWidth = useMemo(() => {
    if (!viewportWidth) return 0;
    const width = viewportWidth - peekWidth;
    return width > 0 ? width : viewportWidth;
  }, [viewportWidth, peekWidth]);
  const trackOffset = useMemo(() => {
    if (!slideWidth) return 0;
    return activeIndex * (slideWidth + gap);
  }, [activeIndex, slideWidth, gap]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % COOKIES.length);
    }, AUTO_ROTATE_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const updateWidth = () => {
      setViewportWidth(node.clientWidth);
    };

    updateWidth();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => updateWidth());
      observer.observe(node);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const goToIndex = (index: number) => {
    setActiveIndex((prev) => {
      if (prev === index) {
        return prev;
      }
      return (index + COOKIES.length) % COOKIES.length;
    });
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % COOKIES.length);
    }, AUTO_ROTATE_INTERVAL);
  };

  const handlePrev = () => {
    goToIndex((activeIndex - 1 + COOKIES.length) % COOKIES.length);
  };

  const handleNext = () => {
    goToIndex((activeIndex + 1) % COOKIES.length);
  };

  return (
    <section className="py-16 text-[#5f000b]">
      <div className="flex w-full flex-col gap-10 px-[clamp(1rem,4vw,4rem)]">
        <div className="space-y-2 text-left">
          <p className="text-sm font-semibold uppercase text-[#781e21]">
            Разгледайте нашите кукита
          </p>
          <h2 className="text-3xl text-[#781e21] sm:text-4xl">
            Всяка седмица печем нещо специално
          </h2>
        </div>

        <div className="relative overflow-hidden" ref={viewportRef}>
          <div
            className="flex transition-transform duration-800 ease-out"
            style={{
              gap: `${gap}px`,
              transform: `translate3d(${-trackOffset}px, 0, 0)`,
            }}
          >
            {COOKIES.map((cookie) => (
              <article
                key={cookie.id}
                className="flex flex-col rounded-[1rem] lg:flex-row"
                style={{
                  flex: `0 0 ${slideWidth ? `${slideWidth}px` : "100%"}`,
                  width: slideWidth ? `${slideWidth}px` : "100%",
                }}
              >
                <div className="flex items-center justify-center px-14py-14 sm:px-14 sm:py-12">
                  <div className="relative h-60 w-60 sm:h-72 sm:w-72">
                    <div className="pointer-events-none absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2">
                      <Image
                        src="/bg-blur.svg"
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 30rem, 90vw"
                        aria-hidden="true"
                        className="object-contain opacity-80 blur-2xl"
                      />
                    </div>
                    <Image
                      src={cookie.image}
                      alt={cookie.name}
                      fill
                      sizes="(min-width: 1024px) 20rem, 60vw"
                      className="relative object-contain"
                    />
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-6 px-6 py-8 text-[#5f000b]">
                  <div>
                    <h3 className="mt-2 text-2xl  text-[#781e21]">
                      {cookie.name}
                    </h3>
                    <p className="mt-4 text-sm text-[#8c4a2f]/90">
                      {cookie.description}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs  uppercase  text-[#b33c3a]">
                      Съставки
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-[#5f000b]">
                      {cookie.ingredients.map((ingredient) => (
                        <li
                          key={`${cookie.id}-${ingredient}`}
                          className="flex items-start gap-2"
                        >
                          <span
                            aria-hidden
                            className="mt-1 h-2 w-2 rounded-full bg-[#b33c3a]"
                          />
                          <span>{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-[#8c4a2f]/70">
                    Всички кукита съдържат пшеница, яйца и могат да съдържат
                    следи от ядки и фъстъци.
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={handlePrev}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#781e21] shadow-md transition hover:bg-[#781e21] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#781e21]"
            aria-label="Предишно кукито"
          >
            <span aria-hidden>‹</span>
          </button>
          <div className="flex items-center gap-3">
            {COOKIES.map((cookie, index) => (
              <button
                key={cookie.id}
                type="button"
                aria-label={`Покажи ${cookie.name}`}
                className={`h-3 w-3 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  index === activeIndex ? "bg-[#781e21]" : "bg-white/70"
                }`}
                onClick={() => goToIndex(index)}
                onFocus={() => goToIndex(index)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#781e21] shadow-md transition hover:bg-[#781e21] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#781e21]"
            aria-label="Следващо кукито"
          >
            <span aria-hidden>›</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default CookieShowcase;
