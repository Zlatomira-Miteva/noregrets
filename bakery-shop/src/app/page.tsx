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
  category: "cookies" | "brownies" | "cakes";
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
    leadTime: "Доставка до 3 дни",
    weight: "900 гр.",
    image: ProductImage,
    category: "cookies",
  },
  {
    id: 2,
    name: "Направи сам кутия от 6 кукита",
    price: "52.00 лв",
    leadTime: "Доставка до 3 дни",
    weight: "900 гр.",
    image: ProductImage,
    category: "cookies",
  },
  {
    id: 3,
    name: "Направи сам кутия от 3 кукита",
    price: "30.00 лв",
    leadTime: "Доставка до 3 дни",
    weight: "450 гр.",
    image: ProductImage,
    category: "cookies",
  },
  {
    id: 4,
    name: "Направи сам кутия от 12 кукита",
    price: "90.00 лв",
    leadTime: "Доставка до 3 дни",
    weight: "1800 гр.",
    image: ProductImage,
    category: "cookies",
  },
  {
    id: 5,
    name: "Мини кукита с течен шоколад",
    price: "12.00 лв",
    leadTime: "Доставка до 3 дни",
    weight: "240 гр.",
    image: CookieBoxImage,
    category: "cookies",
  },
  {
    id: 6,
    name: "Кутия с Къп кейкове",
    price: "20.00 лв",
    leadTime: "Взимане от място",
    weight: "240 гр.",
    image: ProductImage,
    category: "cakes",
  },
  {
    id: 7,
    name: "Торта в буркан",
    price: "20.00 лв",
    leadTime: "Доставка до 3 дни",
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
    leadTime: "Доставка до 3 дни",
    weight: "240 гр.",
    image: ProductImage,
    category: "brownies",
  },

];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fcd9d9] text-[#2f1b16]">
      <Marquee />

      <header className="sticky top-0 z-20 bg-[#f4b9b9]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-[clamp(1rem,3vw,3rem)] py-3">
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
            <Image
              src={ShoppingCartIcon}
              alt=""
              className="h-5 w-5"
            />
          </button>
        </div>
      </header>

      <main>
        <HeroCarousel />
        <FeaturedTabs products={PRODUCTS} />

        <section>
          <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden bg-[#ffe3e3]"
              >
                <div className="relative aspect-[4/5]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 flex h-12 w-12 items-center justify-center bg-white shadow-md">
                    <Image src={ShoppingCartIcon} alt="" className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex flex-col gap-3 bg-[#f5cec7] px-4 pb-5 pt-4 text-sm text-[#2f1b16]">
  
                  <div className="flex items-center justify-between text-base text-[#2f1b16]">
                    <h6 className="max-w-[100%] text-base ">
                      {product.name}
                    </h6>
                    <span>{product.price}</span>
                  </div>
                  <p className="text-xs text-[#8c4a2f]">{product.leadTime}</p>
                  <p className="text-xs font-semibold text-[#9d0012]">{product.weight}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
