import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import ProductImage from "./small-box-cookies.webp";
import CookieBoxImage from "./cookie-box-closed.png";
import CookieBoxHeroImage from "./cookie-box.jpg";
import AtelieImage from "./atelie-no-regrets.png";
import BoxSixCookiesOpen from "./box-six-cookies-open.png";
import CookieBoxThreeOpen from "./cooke-box-3-open.png";
import BestSellersCookieBox from "./best sellers cookie box.png";
import StorefrontImage from "./cookie-box-hero.jpg";
import MascarponeRaspberryPresentCake from "./mascarpone-raspberry-present-cake.png";
import NutellaBiscoffPresentCake from "./nutella-biscoff-present-cake.png";
import RedVelvetPresentCake from "./red-velvet-present-cake.png";
import Marquee from "@/components/Marquee";
import HeroCarousel from "@/components/HeroCarousel";
import CookieShowcase from "@/components/CookieShowcase";
import FeaturedTabs from "@/components/FeaturedTabs";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { formatPrice } from "@/utils/price";
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
    name: "Best Sellers кутия от 3 кукита",
    price: formatPrice(21),
    leadTime: "Доставка до 3 дни",
    weight: "450 гр.",
    image: BestSellersCookieBox,
    category: "cookies",
    href: "/products/best-sellers",
  },
  {
    id: 2,
    name: "Направи сам кутия от 6 кукита",
    price: formatPrice(42),
    leadTime: "Доставка до 3 дни",
    weight: "900 гр.",
    image: BoxSixCookiesOpen,
    category: "cookies",
    href: "/products/custom-box/6",
  },
  {
    id: 3,
    name: "Направи сам кутия от 3 кукита",
    price: formatPrice(21),
    leadTime: "Доставка до 3 дни",
    weight: "450 гр.",
    image: CookieBoxThreeOpen,
    category: "cookies",
    href: "/products/custom-box/3",
  },
  {
    id: 4,
    name: "Мини кукита с течен шоколад",
    price: formatPrice(10),
    leadTime: "Доставка до 3 дни",
    weight: "240 гр.",
    image: CookieBoxHeroImage,
    category: "cookies",
    href: "/products/mini-cookies",
  },
  {
    id: 5,
    name: "Червено кадифе",
    price: formatPrice(10),
    leadTime: "Доставка до 3 дни",
    weight: "220 гр.",
    image: RedVelvetPresentCake,
    category: "cakes",
    href: "/products/cakes/red-velvet",
  },
  {
    id: 6,
    name: "Маскарпоне и малина",
    price: formatPrice(10),
    leadTime: "Доставка до 3 дни",
    weight: "240 гр.",
    image: MascarponeRaspberryPresentCake,
    category: "cakes",
    href: "/products/cakes/mascarpone-raspberry",
  },
  {
    id: 7,
    name: "Nutella Biscoff",
    price: formatPrice(12),
    leadTime: "Доставка до 3 дни",
    weight: "220 гр.",
    image: NutellaBiscoffPresentCake,
    category: "cakes",
    href: "/products/cakes/nutella-biscoff",
  },
  {
    id: 9,
    name: "Направи сам кутия от 4 мочи",
    price: formatPrice(20),
    leadTime: "Доставка до 3 дни",
    weight: "4 бр. свежи мочита",
    image: CookieBoxImage,
    category: "mochi",
    href: "/products/custom-box/mochi-4",
  },
  {
    id: 10,
    name: "Направи сам кутия от 9 мочи",
    price: formatPrice(45),
    leadTime: "Доставка до 3 дни",
    weight: "9 бр. свежи мочита",
    image: ProductImage,
    category: "mochi",
    href: "/products/custom-box/mochi-9",
  },
];
const BEST_SELLERS = [
  { id: 1, name: "Кукита", image: ProductImage },
  { id: 2, name: "Торти", image: ProductImage },
  { id: 3, name: "Мочита", image: ProductImage },
];
const SERVICE_HIGHLIGHTS = [
  { id: 1, icon: "\u{1F381}", label: "Ръчно приготвени" },
  { id: 2, icon: "\u{2B50}", label: "Избрани продукти" },
  { id: 3, icon: "\u267B", label: "Невероятен вкус" },
  { id: 4, icon: "\u{1F69A}", label: "Експресна доставка" },
];
const MERCH_ITEMS = [
  {
    id: 1,
    name: "Фартук No Regrets",
    price: formatPrice(45),
    image: ProductImage,
    bestSeller: true,
  },
  {
    id: 2,
    name: "Кепка No Regrets",
    price: formatPrice(32),
    image: CookieBoxImage,
    bestSeller: true,
  },
  {
    id: 3,
    name: "Чанта за пазар No Regrets",
    price: formatPrice(38),
    image: ProductImage,
    bestSeller: false,
  },
  {
    id: 4,
    name: "Подложка за печене",
    price: formatPrice(24),
    image: CookieBoxImage,
    bestSeller: false,
  },
];
const STORE_INFO = {
  heading: "Сладкарско ателие No Regrets",
  description:
    "Поръчайте и вземете от място в нашия физически магазин и опитайте любимите кукита и торти направо от фурната.",
  address: "ул. „Богомил“ 48, Пловдив",
  email: "zlati@noregrets.bg",
};
const REVIEWS = [
  {
    id: 1,
    author: "Илиана Узунова",
    content:
      "Бисквитките са уникално вкусни! Не искам да свършват! Любими са ми Бискоф, червено кадифе и Нутела Буено ❤️",
    productName: "Направи сам кутия с 6 кукита",
    productImage: ProductImage,
  },
  {
    id: 2,
    author: "Марина Пеева",
    content:
      "Уникални вкусотии! Имам фаворити в бисквитките и тортите. Бисквитките Бискоф и троен шоколад са с уникален вкус, гъделичкат и най-фините сетива. Торта Нутела-Бискоф с нейния вкус е уникална и запомняща.",
    productName: "Направи сам кутия с 6 кукита и Торта в буркан",
    productImage: ProductImage,
  },
  {
    id: 3,
    author: "Каролина Емилова",
    content:
      "Просто невероятна торта! Опитах тортата с маскарпоне и бисквитки с Нутела и останах очарована! Кремът е толкова нежен и лек, а вкусът Нутела се усеща точно толкова колкото трябва - не прекалено сладък, но напълно пристрастяващ. Нисквитките придават чудесна текстура, която прави всяка хапка оше по- вълшебна. Истинксо удоволствие за сетивата - усеща се, че е направена с внимание и любов. Определено бих си я взела пак - една от най- вкусните, които съм опитвала.",
    productName: "Торта в буркан",
    productImage: ProductImage,
  },
  {
    id: 4,
    author: "Ивелина Милкова",
    content:
      "Всяко нейно сладко изкушение е направено с любов и внимание към детайла! Вкусът е уникален, а визията - като от списание! Определено личи, че това е повече от работа - това е страст! Препоръчвам с две ръце!",
    productName: "Торта в буркан",
    productImage: ProductImage,
  },
];
export default function Home() {
  return (
    <div className="min-h-screen ">
      <Marquee />
      <SiteHeader />
      <main>
        <HeroCarousel />
        <FeaturedTabs products={PRODUCTS} />
        <CookieShowcase />

        <section id="cakes" className="mt-16">
          <div className="mx-auto grid w-full gap-12 px-[clamp(1rem,3vw,3rem)] py-12 lg:grid-cols-[minmax(0,0.5fr)_minmax(0,1.1fr)] lg:items-center">
            <div className="space-y-4 ">
              <p className="font-semibold uppercase">
                {" "}
                Какво е популярно сега{" "}
              </p>
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
                {" "}
                Любими предложения{" "}
              </h2>
              <p className="/90">
                {" "}
                Разгледайте най-търсените ни продукти и подарете сладка радост
                на близките си.{" "}
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {" "}
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
                  <div className="flex flex-1 flex-col gap-3 px-5 pb-6 pt-5 ">
                    <h6 className="text-lg leading-snug">{product.name}</h6>
                    <div className="mt-auto flex items-center justify-between text-base font-semibold ">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full transition group-hover:bg-[#5f000b] group-hover:">
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
              ))}{" "}
            </div>
          </div>
        </section>
        <section id="other" className="py-32">
          <div className="mx-auto flex w-full flex-col items-center gap-12 px-[clamp(1rem,3vw,3rem)]">
            <div className="flex flex-wrap justify-center gap-4">
              {" "}
              {SERVICE_HIGHLIGHTS.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-3 rounded-full bg-[#e4b4c3] px-6 py-3 text-sm font-semibold transition hover:-translate-y-1 hover:bg-[#d892a8]"
                >
                  <span aria-hidden="true" className="text-lg">
                    {" "}
                    {item.icon}{" "}
                  </span>
                  <span>{item.label}</span>
                </div>
              ))}{" "}
            </div>
          </div>
        </section>
        <Marquee
          message="Вземете от място · No Regrets"
          repeat={10}
          className="marquee--visit"
        />
        <section id="visit" className="w-full py-20">
          <div className="flex w-full flex-col gap-24 px-[clamp(1rem,3vw,3rem)] lg:flex-row lg:items-center">
            <div className="w-full overflow-hidden rounded-[0.75rem] shadow-card lg:max-w-[36rem]">
              <div className="relative aspect-[16/9]">
                <Image
                  src={StorefrontImage}
                  alt="Нашият магазин No Regrets отвън"
                  fill
                  sizes="(min-width: 1024px) 36rem, (min-width: 640px) 60vw, 90vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="w-full max-w-xl space-y-6 ">
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
                {" "}
                {STORE_INFO.heading}{" "}
              </h2>
              <p className="leading-relaxed "> {STORE_INFO.description} </p>
              <div>
                <div>
                  <p className="mt-2"> {STORE_INFO.address} </p>
                </div>
                <p className="/90">
                  {" "}
                  Имейл:{""}{" "}
                  <a
                    href={`tel:${STORE_INFO.email.replace(/\s+/g, "")}`}
                    className="font-semibold transition hover:underline"
                  >
                    {" "}
                    {STORE_INFO.email}{" "}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* <section id="merch" className=" pb-20 pt-8">
          <div className="mx-auto flex w-full flex-col gap-10 px-[clamp(1rem,3vw,3rem)]">
            <div className="text-center ">
              <p className="font-semibold uppercase">
                {" "}
                Разгледайте нашия мърч{" "}
              </p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                {" "}
                Добавете сладки аксесоари{" "}
              </h2>
              <p className="mt-3">
                {" "}
                Създадени за феновете на No Regrets и всички, които обичат уют в
                кухнята.{" "}
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {" "}
              {MERCH_ITEMS.map((item) => (
                <article
                  key={item.id}
                  className="group relative flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-card transition hover:-translate-y-1 hover:shadow-xl"
                >
                  {" "}
                  {item.bestSeller ? (
                    <span className="absolute left-4 top-4 rounded-full bg-[#5f000b] px-3 py-1 text-xs font-semibold uppercase ">
                      {" "}
                      Хит продукт{" "}
                    </span>
                  ) : null}{" "}
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 px-5 pb-6 pt-5 ">
                    <h3 className="text-lg leading-snug">{item.name}</h3>
                    <div className="mt-auto text-base font-semibold ">
                      {" "}
                      {item.price}{" "}
                    </div>
                  </div>
                </article>
              ))}{" "}
            </div>
          </div>
        </section> */}
        <section id="story" className=" py-20">
          <div className="mx-auto w-full overflow-hidden rounded-3xl shadow-card">
            <div className="grid gap-0 lg:grid-cols-2">
              <div className="flex flex-col justify-center gap-6 px-[clamp(1.5rem,4vw,3.5rem)] py-12 ">
                <h2 className="text-3xl font-bold sm:text-4xl">
                  {" "}
                  Нашата история{" "}
                </h2>
                <p className="leading-relaxed">
                  {" "}
                  Печенето на кукита, торти и най-различни сладки изкушения е
                  моя страст още от 2015 г. За мен приготвянето им е истинско
                  изкуство - начин да изразя себе си и да създам малки моменти
                  на щастие. Най-голямото удоволствие е да видя усмивките на
                  хората, когато опитват от моите сладости. Всяко изделие се
                  приготвя с подбрани съставки, внимание към детайла и щипка
                  любов. 🍪✨{" "}
                </p>
                <Link
                  href="/about"
                  className="cta inline-flex w-fit items-center justify-center rounded-full px-6 py-3 text-sm font-semibold  transition hover:-translate-y-0.5 hover:bg-[#561c19]"
                >
                  {" "}
                  Научете повече{" "}
                </Link>
              </div>
              <div className="relative h-72 overflow-hidden sm:h-96 lg:h-full">
                <Image
                  src={AtelieImage}
                  alt="Сладкарско ателие No Regrets"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>
        <ReviewsCarousel reviews={REVIEWS} />
        <SiteFooter />
      </main>
    </div>
  );
}
