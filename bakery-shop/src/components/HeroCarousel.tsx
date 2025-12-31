"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image, { type StaticImageData } from "next/image";

import CookieBoxPink from "../../public/cookie-box-hero.jpg";
// import MochiePink from "../../public/mochi-hero.jpg";
import CookiesPink from "../../public/cookies-hero.jpg";
import CakeJars from "../../public/cake-jars-hero.jpg";
import TiramisuHero from "../../public/tiramisu-hero.png";

type Slide = {
  id: number;
  image: StaticImageData;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
};

const SLIDES: Slide[] = [
  {
    id: 1,
    image: CookiesPink,
    title:"Малки удоволствия. Големи вкусове.",
    description:"Ръчно изпечени 150 грамови кукита с подбрани съставки и дръзки комбинации. Създадени за хора, които ценят вкуса, момента и свободата да се насладиш на всичко истинско.",
    ctaLabel:"Виж кукитата",
    href: "/cookies",
  },
  {
    id: 2,
    image: CookieBoxPink,
    title:"Няма малки изкушения.",
    description:"Ароматни мини кукита и нутела - сладка симфония, която стопля сърцето. Сподели я с любимите си или запази за себе си. Няма грешен избор.",
    ctaLabel:"Виж мини кукитата",
    href: "/products/mini-cookies",
  },
  // {
  //   id: 3,
  //   image: MochiePink,
  //   title:"Меки. Кремообразни. Невъзможни за споделяне.",
  //   description:"Фино мочи с ароматен крем, скрит под деликатна обвивка от оризово тесто. Сладък баланс между мекота, вкус и изкушение.",
  //   ctaLabel:"Открий десертите",
  // },
  {
    id: 4,
    image: CakeJars,
    title:"Торта в буркан",
    description:"Разнообразие от вкусове, доставени до теб.",
    ctaLabel:"Поръчай торта",
    href: "/products/cake-jar",
  },
  {
    id: 5,
    image: TiramisuHero,
    title: "Тирамису, но по нашия начин.",
    description:
      "Класика с италиански бишкоти, крем маскарпоне и какао, плюс ягодов или шамфъстък вариант за любителите на нови вкусове.",
    ctaLabel: "Виж тирамису",
    href: "/products/tiramisu/tiramisu-classic",
  },
];

const AUTO_ROTATE_MS = 10000;

const HeroCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
    }, AUTO_ROTATE_MS);

    return () => clearTimeout(timer);
  }, [activeIndex]);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <section className="relative isolate h-[40rem] overflow-hidden md:h-[46rem]">
      {SLIDES.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            index === activeIndex ?"opacity-100" :"opacity-0"
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority={index === activeIndex}
            className="pointer-events-none object-cover"
          />
          <div className="absolute inset-0 bg-[#40060D]/55 lg:bg-transparent" />
          <div className="relative z-10 mx-auto flex h-full w-full flex-col justify-center gap-4 px-[clamp(1rem,3vw,3rem)] text-left">
            <div className="max-w-xl space-y-3">
              <h1 className="text-4xl font-semibold leading-tight text-white md:text-6xl lg:text-[#5f000b]">
                {slide.title}
              </h1>
              <p className="text-white md:text-lg lg:text-[#5f000b]/80">{slide.description}</p>
            </div>
            <Link
              href={slide.href}
              className="cta inline-flex w-fit items-center justify-center rounded-full px-6 py-2 text-sm font-semibold shadow-lg transition hover:-translate-y-0.5"
            >
              {slide.ctaLabel}
            </Link>
          </div>
        </div>
      ))}

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => goToSlide(index)}
            className={`hero-index h-2.5 w-8 rounded-full transition ${
              index === activeIndex
                ?"bg-white"
                :"bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Покажи слайд ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
