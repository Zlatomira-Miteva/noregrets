'use client';

import { useState } from "react";

import Marquee from "@/components/Marquee";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

type FaqItem = {
  question: string;
  answer: string[];
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Кога ще изпратите моята поръчка?",
    answer: [
      "Обикновено обработваме и изпращаме поръчките в рамките на 1–2 работни дни. Изпращаме от понеделник до четвъртък (не изпращаме в петък, за да не престоява пратката през уикенда). Ако направите поръчка след 08:00 ч. в четвъртък, тя ще бъде изпратена в следващия понеделник.",
    ],
  },
  {
    question: "Колко време отнема доставката?",
    answer: [
      "Стандартните срокове за доставка варират според населеното място. Можете да намерите повече подробности за нашата политика за доставка на страницата „Доставка и изпращане“.",
    ],
  },
  {
    question: "Каква е вашата политика за връщане?",
    answer: [
      "За съжаление, поради спецификата на продукта не можем да предложим възстановяване или замяна на храни.",
      "Ако не получите поръчката си поради неправилен или непълен адрес за доставка, не можем да направим възстановяване или повторно изпращане. Ако куриерът е направил няколко опита за доставка и пратката не е потърсена и бъде върната, също не можем да възстановим средства или да изпратим отново.",
      "Ако получите продукт с дефект или грешка, изискваме снимка на проблема, за да оценим възможността за възстановяване. Без снимка не можем да обработим претенцията. За да бъде одобренo връщане, продуктът трябва да е неизползван и в същото състояние, в което сте го получили, както и в оригиналната опаковка.",
      "За да завършите процеса по връщане, молим да предоставите номер на поръчка или доказателство за покупка. За начало на процедурата ни пишете на orders@noregrets.bg.",
    ],
  },
  {
    question: "Къде доставяте?",
    answer: [
      "Доставяме до всеки адрес в България. Не изпращаме до пощенски кутии или автоматични пощенски станции.",
      "Предлагаме международна доставка с DHL Express до Нова Зеландия, Малайзия, Сингапур, Хонконг и Япония (само големите градове).",
      "Ако вашата държава не е в списъка, в момента не предлагаме доставка до този регион.",
      "САЩ/Канада – поради промени в тарифите и изискванията на куриерите в момента не предлагаме доставка до Северна Америка.",
    ],
  },
  {
    question: "Какви начини на плащане приемате?",
    answer: [
      "Приемаме основните кредитни карти (Visa, Mastercard) за сигурно и удобно плащане. Засега не приемаме други методи.",
    ],
  },
  {
    question: "Как да направя поръчка за взимане на място?",
    answer: [
      "Можете да направите предварителна или специална поръчка през нашия сайт в раздел „ВЗЕМИ НА МЯСТО“.",
      "Само продуктите от каталога за взимане на място могат да се резервират предварително и да се вземат от магазина.",
      "В момента предлагаме взимане и предварителни поръчки единствено от нашия магазин във Fortitude Valley. Другите ни локации все още не поддържат тази услуга.",
    ],
  },
  {
    question: "Как да направя поръчка за доставка?",
    answer: [
      "Можете да направите доставка чрез раздел „ДОСТАВКА“ на нашия сайт. Само продуктите в този каталог са налични за доставка.",
      "Съжаляваме, но не доставяме торти, къпкейкове или макарони.",
    ],
  },
  {
    question: "Какво е работното време на магазина?",
    answer: [
      "Fortitude Valley",
      "Отворено 7 дни в седмицата",
      "Понеделник – Петък: 08:00 – 15:30",
      "Събота – Неделя: 08:00 – 15:00",
    ],
  },
];

export default function FAQPage() {
  const [openItem, setOpenItem] = useState<string | null>(FAQ_ITEMS[0].question);

  return (
    <div className="flex min-h-screen flex-col bg-[#fcd9d9] text-[#2f1b16]">
      <Marquee />
      <SiteHeader />

      <main className="flex-1 bg-[#f4b9c2] text-white">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-[clamp(1.5rem,4vw,4rem)] py-20">
          <header className="text-center">
            <p className="text-sm uppercase text-white/70">
              Вие попитахте, ние отговаряме
            </p>
            <h1 className="mt-4 text-4xl sm:text-5xl">
              Често задавани въпроси
            </h1>
            <p className="mt-4 text-base text-white/80 sm:text-lg">
              Ако не намирате това, което търсите, пишете ни на{" "}
              <a href="mailto:hello@noregrets.bg" className="underline">
                zlati@noregrets.bg
              </a>
              .
            </p>
          </header>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openItem === item.question;
              return (
                <article
                  key={item.question}
                  className="overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur transition hover:border-white/40"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenItem((prev) => (prev === item.question ? null : item.question))
                    }
                    className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
                  >
                    <span className="text-lg font-semibold">{item.question}</span>
                    <span
                      className={`transition-transform ${
                        isOpen ? "rotate-90" : "rotate-0"
                      }`}
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 16 16"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M5 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden px-6 pb-6 text-sm leading-relaxed text-white/80">
                      {item.answer.map((paragraph, index) => (
                        <p key={index} className={index > 0 ? "mt-4" : undefined}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
