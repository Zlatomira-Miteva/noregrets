import Image from "next/image";
import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";
import CookieShowcase from "@/components/CookieShowcase";
import FeaturedTabs from "@/components/FeaturedTabs";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { formatPrice } from "@/utils/price";
import { getProductBySlug } from "@/lib/products";

export const dynamic = "force-dynamic";

const PRODUCT_IMAGE = "/small-box-cookies.webp";
const COOKIE_BOX_IMAGE = "/cookie-box-closed.png";
const COOKIE_BOX_HERO_IMAGE = "/cookie-box.jpg";
const ATELIE_IMAGE = "/atelie-no-regrets.png";
const BEST_SELLERS_COOKIE_BOX_IMAGE = "/best-sellers-cookie-box.png";
const BOX_SIX_COOKIES_IMAGE = "/box-six-cookies-open.png";
const MASCARPONE_RASPBERRY_IMAGE = "/mascarpone-raspberry-cake-jar.png";
const NUTELLA_BISCOFF_IMAGE = "/nutella-biscoff-cake-jar.png";
const RED_VELVET_IMAGE = "/red-velvet-cake-jar.png";

const PICKUP_WINDOW_NOTICE =
  "Взимането от ателието е възможно само между 16:00 и 18:00 часа в делнични дни и от 12:00 до 17:00 часа в събота. Невзети поръчки в обявените часове могат да се вземат на следващия ден в обявените работни часове.";

type HomepageFeaturedCard = {
  id: string;
  name: string;
  href: string;
  imageSrc: string;
  leadTime?: string;
  weight?: string;
  priceLabel?: string;
};

type FeaturedCardConfig = {
  slug: string;
  href: string;
  label: string;
  fallbackImage: string;
};

const FEATURED_COOKIE_CONFIG: FeaturedCardConfig[] = [
  {
    slug: "mini-cookies",
    href: "/products/mini-cookies",
    label: "Mini Cookie Box",
    fallbackImage: PRODUCT_IMAGE,
  },
  {
    slug: "best-sellers",
    href: "/products/best-sellers",
    label: "Best Seller Cookie Box",
    fallbackImage: BEST_SELLERS_COOKIE_BOX_IMAGE,
  },
  {
    slug: "custom-box-6",
    href: "/products/custom-box/6",
    label: "Make Box of 6 Cookies",
    fallbackImage: BOX_SIX_COOKIES_IMAGE,
  },
];

const loadHomepageFeaturedCards = async (): Promise<HomepageFeaturedCard[]> => {
  const cards = await Promise.all(
    FEATURED_COOKIE_CONFIG.map(async (config) => {
      const product = await getProductBySlug(config.slug);
      if (!product) return null;
      const isCustomBox = config.slug.startsWith("custom-box");
      return {
        id: product.slug,
        name: product.name,
        href: config.href,
        imageSrc: product.heroImage || config.fallbackImage,
        leadTime: product.leadTime || undefined,
        weight: product.weight || undefined,
        priceLabel: isCustomBox ? undefined : formatPrice(product.price ?? 0),
      };
    })
  );

  return cards.filter(Boolean) as HomepageFeaturedCard[];
};
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
    image: PRODUCT_IMAGE,
    bestSeller: true,
  },
  {
    id: 2,
    name: "Кепка No Regrets",
    price: formatPrice(32),
    image: COOKIE_BOX_IMAGE,
    bestSeller: true,
  },
  {
    id: 3,
    name: "Чанта за пазар No Regrets",
    price: formatPrice(38),
    image: PRODUCT_IMAGE,
    bestSeller: false,
  },
  {
    id: 4,
    name: "Подложка за печене",
    price: formatPrice(24),
    image: COOKIE_BOX_IMAGE,
    bestSeller: false,
  },
];
const REVIEWS = [
  {
    id: 1,
    author: "Илиана Узунова",
    content:
      "Бисквитките са уникално вкусни! Не искам да свършват! Любими са ми Бискоф, червено кадифе и Нутела Буено ❤️",
    productName: "Направи сам кутия с 6 кукита",
    productImage: BOX_SIX_COOKIES_IMAGE,
  },
  {
    id: 2,
    author: "Марина Пеева",
    content:
      "Уникални вкусотии! Имам фаворити в бисквитките и тортите. Бисквитките Бискоф и троен шоколад са с уникален вкус, гъделичкат и най-фините сетива. Торта Нутела-Бискоф с нейния вкус е уникална и запомняща.",
    productName: "Направи сам кутия с 6 кукита и Торта в буркан",
    productImage: NUTELLA_BISCOFF_IMAGE,
  },
  {
    id: 3,
    author: "Каролина Емилова",
    content:
      "Просто невероятна торта! Опитах тортата с маскарпоне и бисквитки с Нутела и останах очарована! Кремът е толкова нежен и лек, а вкусът Нутела се усеща точно толкова колкото трябва - не прекалено сладък, но напълно пристрастяващ. Нисквитките придават чудесна текстура, която прави всяка хапка оше по- вълшебна. Истинксо удоволствие за сетивата - усеща се, че е направена с внимание и любов. Определено бих си я взела пак - една от най- вкусните, които съм опитвала.",
    productName: "Торта в буркан",
    productImage: MASCARPONE_RASPBERRY_IMAGE,
  },
  {
    id: 4,
    author: "Ивелина Милкова",
    content:
      "Всяко нейно сладко изкушение е направено с любов и внимание към детайла! Вкусът е уникален, а визията - като от списание! Определено личи, че това е повече от работа - това е страст! Препоръчвам с две ръце!",
    productName: "Торта в буркан",
    productImage: RED_VELVET_IMAGE,
  },
];
export default async function Home() {
  const featuredCookieCards = await loadHomepageFeaturedCards();
  const bestSellerCards = featuredCookieCards;

  return (
    <div className="min-h-screen ">
      
      <SiteHeader />
      <main>
        <HeroCarousel />
        <FeaturedTabs />
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
              {bestSellerCards.map((product) => {
                const hasMeta = Boolean(product.leadTime || product.weight);
                const hasPrice = Boolean(product.priceLabel);
                return (
                  <article
                    key={product.id}
                    className="group flex h-full flex-col overflow-hidden rounded-sm bg-white shadow-card transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <Link
                      href={product.href}
                      className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f000b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcd9d9]"
                    >
                      <div className="relative aspect-[1/1]">
                        <Image
                          src={product.imageSrc}
                          alt={product.name}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-3 px-5 pb-6 pt-5">
                        <h6 className="text-lg leading-snug">{product.name}</h6>
                        {hasMeta ? (
                          <div className="flex flex-col gap-1 text-sm text-[#5f000b]/80">
                            {product.leadTime ? <span>{product.leadTime}</span> : null}
                            {product.weight ? <span>{product.weight}</span> : null}
                          </div>
                        ) : null}
                        {hasPrice ? (
                          <div className="mt-auto text-base font-semibold">{product.priceLabel}</div>
                        ) : (
                          <div className="mt-auto flex items-center justify-between text-base font-semibold">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full transition group-hover:bg-[#5f000b] group-hover:text-white">
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
                        )}
                      </div>
                    </Link>
                  </article>
                );
              })}
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
                <p className="text-sm font-semibold text-[#5f000b]">
                  {PICKUP_WINDOW_NOTICE}
                </p>
                <div className="text-sm text-[#5f000b]">
                  <p>ул. „Богомил“ 48, Пловдив</p>
                  <p>Имейл: info@noregrets.bg</p>
                </div>
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
                  src={ATELIE_IMAGE}
                  alt="Сладкарско ателие No Regrets"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>
        <section className="py-20">
          <div className="mx-auto grid w-full gap-10 bg-[#3e1b20] px-[clamp(1.5rem,4vw,3.5rem)] py-12 text-white lg:grid-cols-[1.1fr_minmax(0,0.9fr)]">
            <div className="space-y-5">
              <h2 className="text-3xl font-bold sm:text-4xl">Сладости за твоя бизнес</h2>
              <p className="leading-relaxed text-white/90">
                Ако управлявате кафе, сладкарница или офис и търсите свежи десерти за гостите и клиентите си,
                можем да изготвим специално меню спрямо вашите нужди. Предлагам дегустации и съм
                отворена за нестандартни запитвания.
              </p>
              <p className="leading-relaxed text-white/90">
                Обичам персонализираните проекти - споделете
                идеята си и ще подготвим сладко предложение, съобразено с обема и стила на вашия бизнес.
              </p>
              <Link
                href="/contact"
                className="cta inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase text-[#5f000b] transition hover:bg-white/80"
              >
                Свържете се с мен
              </Link>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-6 text-base leading-relaxed text-white/90">
              <p className="text-sm font-semibold uppercase tracking-wide text-white/70">Как помагам</p>
              <ul className="mt-4 space-y-3">
                <li>• Седмични или месечни доставки на различни десерти.</li>
                <li>• Пробни дегустации и изработка на мостри за вашия екип.</li>
                <li>• Специални рецепти по заявка и персонализирани опаковки.</li>
                <li>• Бърза комуникация и съдействие за корпоративни подаръци и събития.</li>
              </ul>
            </div>
          </div>
        </section>
        <ReviewsCarousel reviews={REVIEWS} />
        <SiteFooter />
      </main>
    </div>
  );
}
