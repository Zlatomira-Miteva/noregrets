import Image, { type StaticImageData } from "next/image";
import Link from "next/link";

import Logo from "./logo.svg";
import ShoppingCartIcon from "./shopping_cart.png";
import ProductImage from "./small-box-cookies.webp";
import CookieBoxImage from "./cookie-box.jpg";
import Marquee from "../components/Marquee";
import HeroCarousel from "@/components/HeroCarousel";
import FeaturedTabs from "@/components/FeaturedTabs";

type Product = {
  id: number;
  name: string;
  price: string;
  leadTime: string;
  weight: string;
  image: string | StaticImageData;
  category: "cookies" | "mochi" | "cakes";
};

const NAVIGATION = [
  { href: "#cookies", label: "Кукита" },
  { href: "#cakes", label: "Торти" },
  { href: "#other", label: "Други" },
];

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Best Sellers кутия",
    price: "52.00 лв",
    leadTime: "Безплатна доставка до 3 дни",
    weight: "900 гр.",
    image: ProductImage,
    category: "cookies",
  },
  {
    id: 2,
    name: "Направи сам кутия от 6 кукита",
    price: "52.00 лв",
    leadTime: "Безплатна доставка до 3 дни",
    weight: "900 гр.",
    image: ProductImage,
    category: "cookies",
  },
  {
    id: 3,
    name: "Направи сам кутия от 3 кукита",
    price: "30.00 лв",
    leadTime: "Безплатна доставка до 3 дни",
    weight: "450 гр.",
    image: ProductImage,
    category: "cookies",
  },
  {
    id: 4,
    name: "Направи сам кутия от 12 кукита",
    price: "90.00 лв",
    leadTime: "Безплатна доставка до 3 дни",
    weight: "1800 гр.",
    image: ProductImage,
    category: "cookies",
  },
  {
    id: 5,
    name: "Мини кукита с течен шоколад",
    price: "12.00 лв",
    leadTime: "Безплатна доставка до 3 дни",
    weight: "240 гр.",
    image: CookieBoxImage,
    category: "cookies",
  },
  // {
  //   id: 6,
  //   name: "Кутия с Къп кейкове",
  //   price: "20.00 лв",
  //   leadTime: "Взимане от място",
  //   weight: "240 гр.",
  //   image: ProductImage,
  //   category: "cakes",
  // },
  {
    id: 7,
    name: "Торта в буркан",
    price: "20.00 лв",
    leadTime: "Безплатна доставка до 3 дни",
    weight: "240 гр.",
    image: ProductImage,
    category: "cakes",
  },
  {
    id: 8,
    name: "Торта по поръчка",
    price: "20.00 лв",
    leadTime: "Взимане от място",
    weight: "240 гр.",
    image: ProductImage,
    category: "cakes",
  },
  {
    id: 9,
    name: "Кутия с 4 бр. мочи",
    price: "20.00 лв",
    leadTime: "Безплатна доставка до 3 дни",
    weight: "240 гр.",
    image: ProductImage,
    category: "mochi",
  },
];

const BEST_SELLERS = [
  {
    id: 1,
    name: "Кукита",
    image: ProductImage,
  },
  {
    id: 2,
    name: "Торти",
    image: ProductImage,
  },
  {
    id: 3,
    name: "Мочита",
    image: ProductImage,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fcd9d9] text-[#2f1b16]">
      <Marquee />

      <header className="sticky top-0 z-20 bg-[#f4b9b9]/80 backdrop-blur">
        <div className="mx-auto flex w-full items-center justify-between px-[clamp(1rem,3vw,3rem)] py-3">
          <Link href="/" className="block flex-shrink-0">
            <span className="relative block h-12 w-[9.5rem] md:w-[12rem]">
              <Image
                src={Logo}
                alt="No Regrets"
                fill
                priority
                sizes="(max-width: 768px) 152px, 192px"
                className="object-contain"
              />
            </span>
          </Link>
          <nav className="hidden gap-8 text-sm font-medium md:flex">
            {NAVIGATION.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-[#d64862]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            aria-label="Преглед на количката"
            className="rounded-full bg-white/90 p-2 shadow-card transition hover:bg-white"
          >
            <Image src={ShoppingCartIcon} alt="" className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main>
        <HeroCarousel />
        <FeaturedTabs products={PRODUCTS} />

        <section className="mt-16 border-y border-[#dcb1b1] bg-[#f1b8c4]/50">
          <div className="mx-auto grid w-full gap-12 px-[clamp(1rem,3vw,3rem)] py-12 lg:grid-cols-[minmax(0,0.5fr)_minmax(0,1.1fr)] lg:items-center">
            <div className="space-y-4 text-[#2f1b16]">
              <p className="text-sm font-semibold uppercase text-[#8c4a2f]/80">
                Какво е популярно сега
              </p>
              <h2 className="text-3xl font-bold leading-tight text-[#2f1b16] sm:text-4xl">
                Любими предложения
              </h2>
              <p className="text-base text-[#8c4a2f]/90">
                Разгледайте най-търсените ни продукти и подарете сладка радост
                на близките си.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {BEST_SELLERS.map((product) => (
                <article
                  key={product.id}
                  className="group flex h-full flex-col overflow-hidden rounded-sm bg-white shadow-card transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-[1/1]">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 px-5 pb-6 pt-5 text-[#2f1b16]">
                    <h6 className="text-lg leading-snug">{product.name}</h6>
                    <div className="mt-auto flex items-center justify-between text-base font-semibold text-[#9d0012]">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4b9b9] text-[#9d0012] transition group-hover:bg-[#9d0012] group-hover:text-white">
                        <svg
                          aria-hidden="true"
                          focusable="false"
                          className="h-4 w-4"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M5 3l5 5-5 5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
