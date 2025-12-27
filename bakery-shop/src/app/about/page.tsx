"use client";

import Image from "next/image";
import Link from "next/link";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
const ABOUT_US_IMAGE = "/about-us.png";

const SOCIAL_URLS = {
  instagram: "https://www.instagram.com/noregrets.bg/",
  tiktok: "https://www.tiktok.com/@no.regrets.bg",
  facebook:
    "https://www.facebook.com/profile.php?id=100092485898884&viewas=100000686899395",
};

const PICKUP_WINDOW_NOTICE =
  "Взимането от ателието е възможно само между 16:00 и 18:00 часа в делнични дни и от 12:00 до 17:00 часа в събота. Невзети поръчки в обявените часове могат да се вземат на следващия ден в обявените работни часове.";

const HERO_STATS = [
  { label: "От 2016 г.", description: "Експериментирам с вкусове и текстури" },
  {
    label: "1 човек",
    description: "Аз съм зад всески сладкиш, доставка и съобщение",
  },
  {
    label: "Видео дневник",
    description: (
      <>
        Споделям процеса в{" "}
        <a
          href={SOCIAL_URLS.instagram}
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          Instagram
        </a>
        ,{" "}
        <a
          href={SOCIAL_URLS.tiktok}
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          TikTok
        </a>{" "}
        и{" "}
        <a
          href={SOCIAL_URLS.facebook}
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          Facebook
        </a>
      </>
    ),
  },
];

const STORY_SECTIONS = [
  {
    title: "Началото",
    description:
      "No Regrets започна като вечерен проект след работа. Постепенно замених дивана с миксер, а неделите - с пробни партиди. Всяка рецепта е пречупена през моя вкус за баланс между сладко, солено и малко хрупкавост.",
  },
  {
    title: "Малка марка, смели мечти",
    description:
      "Работя сама и предпочитам малките серии. Това ми позволява да следя за качеството на използваните продукти, да тествам нови идеи и да поддържам обещанието за пресни печива без компромиси.",
  },
  {
    title: "Социалните мрежи като отворена кухня",
    description:
      "Снимам видеа от процеса - от смесването до последната поръска. Това е моят начин да покажа, че зад марката стои реален човек, който още се учи, греши и се радва на малките успехи.",
  },
];

const PROCESS_STEPS = [
  {
    title: "Рецепта",
    badge: "Стъпка 1",
    description:
      "Скицирам вкусовете в тефтер и тествам микро партиди, докато постигна усещането „още една хапка“.",
  },
  {
    title: "Печене",
    badge: "Стъпка 2",
    description:
      "Замесвам, пека и декорирам сама, затова количествата са лимитирани. Всяка кутия е опакована ръчно.",
  },
  {
    title: "Споделяне",
    badge: "Стъпка 3",
    description: (
      <>
        Заснемам най-интересните моменти за{" "}
        <a
          href={SOCIAL_URLS.tiktok}
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          TikTok
        </a>{" "}
        и{" "}
        <a
          href={SOCIAL_URLS.instagram}
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          Instagram Reels
        </a>
        . Видео дневникът ми напомня защо започнах.
      </>
    ),
  },
];

const SOCIAL_NOTES = [
  {
    title: "Истински кадри",
    description:
      "Няма голям екип или студио - само телефон на статив, брашно и много смях. Видеата показват процеса такъв, какъвто е.",
  },
  {
    title: "Обратната връзка ме води",
    description:
      "Коментарите и съобщенията ми помагат да реша кой вкус да се върне, какво да подобря и кои истории да разкажа следващи.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fff7f4] text-[#3a1114]">
      
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-[#fbe7e0]">
          <div className="grid w-full gap-10 px-[clamp(1.25rem,4vw,4rem)] py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="space-y-6">
              <p className="text-sm uppercase text-[#b25b64]">Нашата история</p>
              <h1 className="text-4xl font-semibold leading-tight text-[#3a1114] sm:text-5xl">
                Една пекарна, един човек и много мечти
              </h1>
              <p className="text-base leading-relaxed text-[#4e1f25]">
                Казвам се Злати и стоя зад No Regrets. Работя сама - от първия
                списък с продукти, през месенето, до снимането на къси клипове
                за социалните мрежи. Тепърва започвам, но вярвам, че
                автентичните истории имат вкус на домашно приготвено и на
                смелост да покажеш грешките си.
              </p>
              <p className="text-sm font-semibold text-[#5f000b]">
                {PICKUP_WINDOW_NOTICE}
              </p>
              <div className="flex flex-wrap gap-6 rounded-s bg-white/70 p-6 shadow-card">
                {HERO_STATS.map((item) => (
                  <div key={item.label} className="max-w-[14rem]">
                    <p className="text-sm uppercase text-[#b25b64]">
                      {item.label}
                    </p>
                    <p className="text-base font-medium text-[#3a1114]">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-s shadow-2xl">
              <Image
                src={ABOUT_US_IMAGE}
                alt="Прясно изпечени сладки в студиото No Regrets"
                width={1200}
                height={900}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="w-full space-y-10 px-[clamp(1.25rem,4vw,4rem)]">
            <div className="space-y-4 text-center">
              <p className="text-sm uppercase text-[#b25b64]">Защо започнах</p>
              <h2 className="text-3xl font-semibold text-[#3a1114] sm:text-4xl">
                Историята зад No Regrets
              </h2>
              <p>
                Историята на No Regrets не е за голям екип и производствена
                линия. Това е разказ за една жена, която решава да сподели
                любовта си към приготвянето на сладкиши, колкото и несигурно да
                изглежда.
              </p>
              <p>
                Тук всеки ден започва с аромат на изпечено масло, а приключва
                със заснето видео, което показва как се ражда любимата ви торта
                или куки.
              </p>
              <p className="font-semibold">
                Още сме в началото, но всяка поръчка финансира следващата мечта.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {STORY_SECTIONS.map((section) => (
                <article
                  key={section.title}
                  className="rounded-s bg-white/90 p-6 shadow-card"
                >
                  <h3 className="text-xl font-semibold text-[#3a1114]">
                    {section.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#4e1f25]">
                    {section.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="bg-[#2c070b] py-20">
          <div className="w-full space-y-10 px-[clamp(1.25rem,4vw,4rem)]">
            <div className="space-y-4 text-center">
              <p className="text-sm uppercase text-[#b25b64]">Работен процес</p>
              <h2 className="text-3xl font-semibold sm:text-4xl">
                Как създавам всяка поръчка
              </h2>
              <p className="text-base ">
                Няма тайни - всичко минава през ръцете ми и е документирано в
                къси клипове, защото прозрачността ми дава сила.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {PROCESS_STEPS.map((step) => (
                <article
                  key={step.title}
                  className="flex flex-col gap-4 rounded-s bg-white/5 p-6 backdrop-blur"
                >
                  <span className="inline-flex w-fit rounded-full bg-white/15 px-3 py-1 text-xs uppercase">
                    {step.badge}
                  </span>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-sm ">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-30">
          <div className="w-full space-y-30 px-[clamp(1.25rem,4vw,4rem)]">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="space-y-4">
                <p className="text-sm uppercase text-[#b25b64]">
                  Социални мрежи
                </p>
                <h2 className="text-3xl font-semibold text-[#3a1114] sm:text-4xl">
                  Видеата, които разказват ежедневно
                </h2>
                <p className="text-base leading-relaxed text-[#4e1f25]">
                  Социалните медии са моят екип. Чрез тях споделям изгарящите
                  тави, малките победи и дори неуспешните опити. Ако искате да
                  следите процеса в реално време, последвайте{" "}
                  <a
                    href={SOCIAL_URLS.instagram}
                    className="underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Instagram
                  </a>
                  ,{" "}
                  <a
                    href={SOCIAL_URLS.tiktok}
                    className="underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    TikTok
                  </a>{" "}
                  или{" "}
                  <a
                    href={SOCIAL_URLS.facebook}
                    className="underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Facebook
                  </a>
                  .
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {SOCIAL_NOTES.map((note) => (
                  <article
                    key={note.title}
                    className="rounded-s bg-white/90 p-6 shadow-card"
                  >
                    <h3 className="text-lg font-semibold text-[#3a1114]">
                      {note.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#4e1f25]">
                      {note.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-s bg-white p-10 py-20 text-center shadow-card">
              <h3 className="text-2xl font-semibold text-[#3a1114]">
                Да си запишем следващата среща
              </h3>
              <p className="mt-3 text-base text-[#4e1f25]">
                Все още съм в началото, но всяка торта и всяко куки ме
                доближава до мечтата ми. Пиши ми, ако имаш идея
                за колаборация, специален повод или просто искаш да кажеш
                „здравей“.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="mailto:info@noregrets.bg"
                  className="cta inline-flex items-center justify-center rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase transition hover:-translate-y-0.5"
                >
                  Свържи се с мен
                </Link>
                <Link
                  href="/cookies"
                  className="inline-flex items-center justify-center rounded-full border border-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-[#5f000b] transition hover:-translate-y-0.5 hover:bg-[#5f000b]/10"
                >
                  Разгледай предложенията
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
