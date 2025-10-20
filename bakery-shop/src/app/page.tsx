import Image from "next/image";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  price: string;
  leadTime: string;
  image: string;
};

const NAVIGATION = [
  { href: "#cookies", label: "Кукита" },
  { href: "#cakes", label: "Торти" },
  { href: "#other", label: "Други" },
];

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Къпкейк ягода",
    price: "5.50 лв",
    leadTime: "Доставка до 3 дни",
    image:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    name: "Карамелен сандвич",
    price: "5.50 лв",
    leadTime: "Доставка до 3 дни",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 3,
    name: "Мини безе микс",
    price: "5.50 лв",
    leadTime: "Доставка до 3 дни",
    image:
      "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 4,
    name: "Сандвич макарон",
    price: "5.50 лв",
    leadTime: "Доставка до 3 дни",
    image:
      "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 5,
    name: "Класически бисквити",
    price: "5.50 лв",
    leadTime: "Доставка до 3 дни",
    image:
      "https://images.unsplash.com/photo-1518131678677-a9e1fc0b7649?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 6,
    name: "Розово безе",
    price: "5.50 лв",
    leadTime: "Доставка до 3 дни",
    image:
      "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 7,
    name: "Сандвич с крем",
    price: "5.50 лв",
    leadTime: "Доставка до 3 дни",
    image:
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 8,
    name: "Френски макарони",
    price: "5.50 лв",
    leadTime: "Доставка до 3 дни",
    image:
      "https://images.unsplash.com/photo-1469536526925-9fa741c0c927?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fcd9d9] text-[#2f1b16]">
      <header className="sticky top-0 z-20 bg-[#f4b9b9]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-[clamp(1rem,3vw,3rem)] py-4">
          <Link href="/" className="flex items-center gap-3 font-semibold tracking-[0.1em]">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#d64862] shadow-card">
              No
            </span>
            <span className="text-lg uppercase text-[#d64862]">Regrets</span>
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
            className="rounded-full bg-white/90 p-2 text-[#d64862] shadow-card transition hover:bg-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25h9.75m-9.75 0L6.426 6.272A1.125 1.125 0 0 0 5.325 5.25H3.375m4.125 9L5.25 18.75M17.25 14.25l1.125 4.5M9 21.375a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm9 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
          </button>
        </div>
      </header>

      <main>
        <section className="relative isolate h-[28rem] overflow-hidden md:h-[34rem]">
          <Image
            src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=80"
            alt="Къпкейкове с розов крем"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#fcd9d9]/0 via-[#fcd9d9]/20 to-[#fcd9d9]"></div>
          <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-[clamp(1rem,3vw,3rem)] pb-12">
            <h1 className="text-4xl font-semibold leading-tight text-white drop-shadow-md md:text-6xl">
              Най-сочните кукита
            </h1>
            <p className="mt-3 max-w-xl text-base text-white/90 md:text-lg">
              Ръчно приготвени десерти с любов и подбрани съставки за всяко
              специално тържество или сладка пауза през деня.
            </p>
          </div>
        </section>

        <section className="-mt-8 pb-16">
          <div className="mx-auto grid max-w-6xl gap-4 px-[clamp(1rem,3vw,3rem)] sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-[2.5rem] bg-[#ffe3e3] shadow-card transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-[4/5]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col gap-2 px-4 pb-4 pt-3 text-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d64862]">
                    <span>🍰</span>
                    <span>Сладкарница</span>
                  </div>
                  <h2 className="text-base font-semibold">{product.name}</h2>
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{product.price}</span>
                    <span className="text-[#d64862]">♡</span>
                  </div>
                  <p className="text-xs text-[#8c4a2f]">{product.leadTime}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
