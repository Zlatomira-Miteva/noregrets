import Image, { type StaticImageData } from "next/image";
import Link from "next/link";

import ProductImage from "./small-box-cookies.webp";
import CookieBoxImage from "./cookie-box.jpg";
import StorefrontImage from "./cookie-box-hero.jpg";
import Marquee from "@/components/Marquee";
import HeroCarousel from "@/components/HeroCarousel";
import FeaturedTabs from "@/components/FeaturedTabs";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

type Product = {
  id: number;
  name: string;
  price: string;
  leadTime: string;
  weight: string;
  image: string | StaticImageData;
  category: "cookies" | "mochi" | "cakes";
  href?: string;
};

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Best Sellers кутия",
    price: "52.00 лв",
    leadTime: "Безплатна доставка до 3 дни",
    weight: "900 гр.",
    image: ProductImage,
    category: "cookies",
    href: "/products/best-sellers",
  },
  {
    id: 2,
    name: "Направи сам кутия от 6 кукита",
    price: "52.00 лв",
    leadTime: "Безплатна доставка до 3 дни",
    weight: "900 гр.",
    image: ProductImage,
    category: "cookies",
    href: "/products/custom-box/6",
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
    href: "/products/custom-box/12",
  },
  {
    id: 5,
    name: "Мини кукита с течен шоколад",
    price: "12.00 лв",
    leadTime: "Безплатна доставка до 3 дни",
    weight: "240 гр.",
    image: CookieBoxImage,
    category: "cookies",
    href: "/products/mini-cookies",
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
    href: "/products/cake-jar",
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
    href: "/products/custom-box/mochi",
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

const SERVICE_HIGHLIGHTS = [
  { id: 1, icon: "\u{1F381}", label: "Персонализирани кутии" },
  { id: 2, icon: "\u{1F69A}", label: "Експресна доставка" },
  { id: 3, icon: "\u{2B50}", label: "Потвърдени отзиви" },
  { id: 4, icon: "\u267B", label: "Рециклируеми опаковки" },
];

const MERCH_ITEMS = [
  {
    id: 1,
    name: "Фартук No Regrets",
    price: "45.00 лв",
    image: ProductImage,
    bestSeller: true,
  },
  {
    id: 2,
    name: "Кепка No Regrets",
    price: "32.00 лв",
    image: CookieBoxImage,
    bestSeller: true,
  },
  {
    id: 3,
    name: "Чанта за пазар No Regrets",
    price: "38.00 лв",
    image: ProductImage,
    bestSeller: false,
  },
  {
    id: 4,
    name: "Подложка за печене",
    price: "24.00 лв",
    image: CookieBoxImage,
    bestSeller: false,
  },
];

const STORE_INFO = {
  label: "Магазин No Regrets",
  heading: "Вашето уютно място за сладки срещи",
  description:
    "Заповядайте в нашия физически магазин и опитайте любимите кукита и торти направо от фурната. Можем да ви помогнем с избор на подарък, пакетиране и персонализация на място.",
  address: "ул. „Граф Игнатиев“ 25, София",
  hours: [
    "Понеделник – Петък: 08:00 – 19:30",
    "Събота – Неделя: 09:00 – 18:00",
  ],
  phone: "+359 88 123 4567",
};

const REVIEWS = [
  {
    id: 1,
    author: "Николета Тодорова",
    content:
      "Живея на 200 км от София и се чудех колко бързо ще пристигне поръчката. Направих я в петък и в понеделник вече се наслаждавахме на прясно изпечените кукита. Децата ги изядоха за една вечер!",
    productName: "Мини кукита",
    productImage: CookieBoxImage,
  },
  {
    id: 2,
    author: "Александър Петров",
    content:
      "Взех Best Sellers кутията за офисно парти и всички останаха очаровани. Дори след подгряване кукитата останаха меки и ароматни. Определено ще поръчам отново.",
    productName: "Best Sellers кутия",
    productImage: ProductImage,
  },
  {
    id: 3,
    author: "Мария Иванова",
    content:
      "Тортата по поръчка беше точно както си я представях – лек крем, богата украса и страхотен вкус. Екипът беше изключително отзивчив и помогна с всички детайли.",
    productName: "Торта по поръчка",
    productImage: ProductImage,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fcd9d9] text-[#2f1b16]">
      <Marquee />

      <SiteHeader />

      <main>
        <HeroCarousel />
        <FeaturedTabs products={PRODUCTS} />

        <section id="cakes" className="mt-16 border-y border-[#dcb1b1]">
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
                    <div className="mt-auto flex items-center justify-between text-base font-semibold text-[#2f1b16]">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4b9b9] text-[#2f1b16] transition group-hover:bg-[#2f1b16] group-hover:text-white">
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

        <section id="other" className=" py-16">
          <div className="mx-auto flex w-full  flex-col items-center gap-12 px-[clamp(1rem,3vw,3rem)]">
            <div className="flex flex-wrap justify-center gap-4">
              {SERVICE_HIGHLIGHTS.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-3 rounded-full bg-[#e4b4c3] px-6 py-3 text-sm font-semibold text-[#2f1b16] transition hover:-translate-y-1 hover:bg-[#d892a8]"
                >
                  <span aria-hidden="true" className="text-lg">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Marquee
          message="ПОСЕТЕТЕ НИ НА ЖИВО · NO REGRETS · СЛАДКА СРЕЩА В МАГАЗИНА"
          repeat={10}
          className="marquee--visit"
        />

        <section id="visit" className="bg-[#f6eae3] py-20">
          <div className="mx-auto flex w-full flex-col gap-12 px-[clamp(1rem,3vw,3rem)] lg:max-w-[clamp(0px,80vw,70rem)] lg:flex-row lg:items-center">
            <div className="w-full overflow-hidden rounded-[1rem] bg-[#fce9df] shadow-card lg:max-w-[36rem]">
              <div className="relative aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5]">
                <Image
                  src={StorefrontImage}
                  alt="Нашият магазин No Regrets отвън"
                  fill
                  sizes="(min-width: 1024px) 36rem, (min-width: 640px) 60vw, 90vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="w-full max-w-xl space-y-6 text-[#2f1b16]">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8c4a2f]/80">
                {STORE_INFO.label}
              </p>
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
                {STORE_INFO.heading}
              </h2>
              <p className="text-base leading-relaxed text-[#8c4a2f]/90">
                {STORE_INFO.description}
              </p>

              <div className="space-y-5 rounded-3xl bg-white p-6 shadow-card">
                <div>
                  <h3 className="text-lg font-semibold text-[#2f1b16]">
                    No Regrets Bakery
                  </h3>
                  <p className="mt-2 text-sm text-[#8c4a2f]/90">
                    {STORE_INFO.address}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8c4a2f]/70">
                    Работно време
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-[#2f1b16]">
                    {STORE_INFO.hours.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <p className="text-sm text-[#8c4a2f]/90">
                  Телефон:{" "}
                  <a
                    href={`tel:${STORE_INFO.phone.replace(/\s+/g, "")}`}
                    className="font-semibold text-[#2f1b16] transition hover:underline"
                  >
                    {STORE_INFO.phone}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="merch" className="bg-[#fcd9d9] pb-20 pt-8">
          <div className="mx-auto flex w-full flex-col gap-10 px-[clamp(1rem,3vw,3rem)]">
            <div className="text-center text-[#2f1b16]">
              <p className="text-sm font-semibold uppercase text-[#8c4a2f]/80">
                Разгледайте нашия мърч
              </p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                Добавете сладки аксесоари
              </h2>
              <p className="mt-3 text-base text-[#8c4a2f]/90">
                Създадени за феновете на No Regrets и всички, които обичат уют в
                кухнята.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {MERCH_ITEMS.map((item) => (
                <article
                  key={item.id}
                  className="group relative flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-card transition hover:-translate-y-1 hover:shadow-xl"
                >
                  {item.bestSeller ? (
                    <span className="absolute left-4 top-4 rounded-full bg-[#2f1b16] px-3 py-1 text-xs font-semibold uppercase text-white">
                      Хит продукт
                    </span>
                  ) : null}
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 px-5 pb-6 pt-5 text-[#2f1b16]">
                    <h3 className="text-lg leading-snug">{item.name}</h3>
                    <div className="mt-auto text-base font-semibold text-[#2f1b16]">
                      {item.price}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="story" className="bg-[#fbe0d6] py-20">
          <div className="mx-auto w-full overflow-hidden rounded-3xl bg-[#f7e4da] shadow-card">
            <div className="grid gap-0 lg:grid-cols-2">
              <div className="flex flex-col justify-center gap-6 px-[clamp(1.5rem,4vw,3.5rem)] py-12 text-[#2f1b16]">
                <p className="text-sm font-semibold uppercase text-[#8c4a2f]/80">
                  Нашата история
                </p>
                <h2 className="text-3xl font-bold sm:text-4xl">
                  No Regrets Bakery
                </h2>
                <p className="text-base leading-relaxed text-[#8c4a2f]/90">
                  От 2022 г. печем нашите емблематични кукита, торти и мочи
                  десерти, които стоплят сърцата и създават мигове за споделяне.
                  Всеки продукт се приготвя с подбрани съставки и много любов
                  към детайла.
                </p>
                <Link
                  href="#"
                  className="inline-flex w-fit items-center justify-center rounded-full bg-[#2f1b16] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#561c19]"
                >
                  Научете повече
                </Link>
              </div>
              <div className="relative h-72 overflow-hidden bg-[#f3d2c4] sm:h-96 lg:h-full">
                <Image
                  src={CookieBoxImage}
                  alt="Пекар в нашето ателие подготвя свежи печива"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f4e7e2] py-20">
          <div className="mx-auto w-full max-w-[clamp(0px,80vw,72rem)] px-[clamp(1rem,3vw,3rem)]">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[#2f1b16]">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8c4a2f]/80">
                  Потвърдени отзиви
                </p>
                <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                  Истории от нашите клиенти
                </h2>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  aria-label="Предишен отзив"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dcb1b1] bg-white text-[#2f1b16] transition hover:-translate-y-0.5 hover:bg-[#fbe0d6]"
                >
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12.5 5l-5 5 5 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Следващ отзив"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dcb1b1] bg-white text-[#2f1b16] transition hover:-translate-y-0.5 hover:bg-[#fbe0d6]"
                >
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.5 5l5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {REVIEWS.map((review) => (
                <article
                  key={review.id}
                  className="flex h-full flex-col justify-between rounded-3xl bg-white p-8 text-[#2f1b16] shadow-card"
                >
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold">{review.author}</h3>
                    <p className="text-sm leading-relaxed text-[#8c4a2f]/90">
                      {review.content}
                    </p>
                  </div>
                  <div className="mt-6 border-t border-[#f3d2c4] pt-4">
                    <div className="flex items-center gap-3">
                      <Image
                        src={review.productImage}
                        alt={review.productName}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <span className="text-sm font-semibold text-[#2f1b16]">
                        {review.productName}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <SiteFooter />
      </main>
    </div>
  );
}
