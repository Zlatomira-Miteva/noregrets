"use client";

import { useEffect, useState } from "react";
import Image, { type StaticImageData } from "next/image";

import CookieBoxPink from "../app/cookie-box-hero.jpg";
import MochiePink from "../app/mochi-hero.jpg";
import CookiesPink from "../app/cookies-hero.jpg";
import CakeJars from "../app/cake-jars-hero.jpg";

type Slide = {
  id: number;
  image: string | StaticImageData;
  title: string;
  description: string;
  ctaLabel: string;
};

const SLIDES: Slide[] = [
  {
    id: 1,
    image: CookiesPink,
    title: "150 грама щастие",
    description: "Прясно избечени големи кукита, доставени до теб.",
    ctaLabel: "Виж бисквитите",
  },
  {
    id: 2,
    image: CookieBoxPink,
    title: "Кутия с любов",
    description:
      "Нашите най-заявани вкусове, подредени и готови да радват големи компании.",
    ctaLabel: "Избери кутия",
  },
  {
    id: 3,
    image: MochiePink,
    title: "Мочи, което се топи в устата",
    description: "Меки, нежни и пълни с крем",
    ctaLabel: "Открий десертите",
  },
  {
    id: 4,
    image: CakeJars,
    title: "Торта в буркан",
    description: "Разнообразие от вкусове, доставени до теб.",
    ctaLabel: "Поръчай торта",
  },
];

const HeroCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative isolate h-[28rem] overflow-hidden md:h-[34rem]">
      {SLIDES.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            index === activeIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority={index === activeIndex}
            className="object-cover"
          />
          {/* <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/10"></div> */}
          <div className="relative mx-auto flex h-full w-full flex-col justify-center gap-4 px-[clamp(1rem,3vw,3rem)] text-left">
            <div className="max-w-xl space-y-3">
              <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
                {slide.title}
              </h1>
              <p className="text-base md:text-lg">{slide.description}</p>
            </div>
            <button
              type="button"
              className="cta inline-flex w-fit items-center justify-center rounded-full px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
            >
              {slide.ctaLabel}
            </button>
          </div>
        </div>
      ))}

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`hero-index h-2.5 w-8 rounded-full transition ${
              index === activeIndex
                ? "bg-white"
                : "bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Покажи слайд ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
