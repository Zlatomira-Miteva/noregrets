import Image from "next/image";
import Link from "next/link";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { COOKIES } from "@/data/cookies";

const allergenNote =
  "Всички кукита съдържат пшеница, яйца и млечни продукти. Възможни са следи от ядки и фъстъци.";

export default function CookiesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#ffefed]">
      <SiteHeader />
      <main className="flex-1">
        <section className="px-[clamp(1rem,4vw,4rem)] py-16 text-center">
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
            Разгледайте нашите кукита
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg">
            Шест емблематични вкуса, изпечени специално за вас по предварителна поръчка. Изберете
            любимите си и поръчайте кутия, която да споделите или да пазите само
            за себе си.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/products/custom-box/6"
              className="cta rounded-full bg-[#5f000b] px-6 py-3 text-l font-semibold uppercase text-white transition hover:bg-[#781e21]"
            >
              Направи си кутия с 6 кукита
            </Link>
            <Link
              href="/cart"
              className="rounded-full border border-[#5f000b] px-6 py-3 text-sm font-semibold uppercase transition hover:bg-white/60"
            >
              Виж количката
            </Link>
          </div>
        </section>

        <section className="space-y-16 px-[clamp(1rem,4vw,4rem)] pb-24">
          {COOKIES.map((cookie, index) => (
            <article
              key={cookie.id}
              className={`flex flex-col gap-10 rounded-3xl p-8 shadow-card ${
                index % 2 ? "lg:flex-row-reverse" : "lg:flex-row"
              }`}
            >
              <div className="flex w-full items-center justify-center lg:w-1/2">
                <div className="group relative h-72 w-72 sm:h-96 sm:w-96">
                  <div className="pointer-events-none absolute inset-0 scale-125 rounded-full bg-gradient-to-b from-[#f1b8c4] to-transparent opacity-60 blur-3xl" />
                  <Image
                    src={cookie.image}
                    alt={cookie.name}
                    fill
                    className="object-contain transition-transform duration-500 ease-out group-hover:scale-105 group-hover:-rotate-3"
                    sizes="(min-width: 1024px) 25rem, 60vw"
                  />
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-center gap-6 lg:w-1/2">
                <header>
                  <h2 className="mt-3 text-3xl font-bold">{cookie.name}</h2>
                </header>
                <div>
                  <p className="text-sm uppercase text-[#5f000b]/60">
                    Съставки
                  </p>
                  <p className="mt-3 text-base leading-relaxed">
                    {cookie.ingredients.join(", ")}
                  </p>
                  <p className="mt-4 text-base text-[#5f000b]/80">
                    {cookie.description}
                  </p>
                </div>
                <Link
                  href="/products/custom-box/6"
                  className="cta inline-flex items-center justify-center rounded-full bg-[#5f000b] px-6 py-3 text-l font-semibold uppercase text-white transition hover:bg-[#781e21]"
                >
                  Направи кутия с 6 кукита
                </Link>
                <p className="text-sm italic text-[#5f000b]/70">
                  {allergenNote}
                </p>
              </div>
            </article>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
