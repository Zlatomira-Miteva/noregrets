"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { COOKIES } from "@/data/cookies";

const AUTO_ROTATE_INTERVAL = 5000;

const CookieShowcase = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const peekWidth = useMemo(() => {
    if (!viewportWidth) return 100;
    const desired = viewportWidth >= 1280 ? 240 : viewportWidth >= 1024 ? 200 : viewportWidth >= 768 ? 160 : 100;
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
    <section className="py-16">
      <div className="flex w-full flex-col gap-10 px-[clamp(1rem,4vw,4rem)]">
        <div className="space-y-2 text-left">
          <p className="font-semibold uppercase">Разгледайте нашите кукита</p>
          <h2 className="text-3xl sm:text-4xl">Всяка седмица печем нещо специално</h2>
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
                className="group flex flex-col rounded-[1rem] lg:flex-row"
                style={{
                  flex: `0 0 ${slideWidth ? `${slideWidth}px` : "100%"}`,
                  width: slideWidth ? `${slideWidth}px` : "100%",
                }}
              >
                <div className="flex items-center justify-center px-10 py-12 sm:px-14 sm:py-12">
                  <div className="relative h-84 w-84 sm:h-88 sm:w-88">
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
                      className="relative object-contain transition-transform duration-500 ease-out group-hover:scale-105 group-hover:-rotate-3"
                    />
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-6 px-6 py-8">
                  <div>
                    <h3 className="mt-2 text-2xl">{cookie.name}</h3>
                    <p className="mt-4">{cookie.description}</p>
                  </div>
                  <div>
                    <p className="uppercase">Съставки</p>
                    <p className="mt-3 text-sm leading-relaxed">{cookie.ingredients.join(", ")}</p>
                  </div>
                  <p className="text-sm italic">
                    *Всички кукита съдържат пшеница, яйца и могат да съдържат следи от ядки и фъстъци.
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
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-[#781e21] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#781e21]"
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
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-[#781e21] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#781e21]"
            aria-label="Следващо кукито"
          >
            <span aria-hidden>›</span>
          </button>
        </div>

        <div className="text-center">
          <Link
            href="/products/custom-box/6"
            className="cta inline-flex items-center justify-center rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#781e21]"
          >
            Направи си кутия с 6 кукита
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CookieShowcase;
