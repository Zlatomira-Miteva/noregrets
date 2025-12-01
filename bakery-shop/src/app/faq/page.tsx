"use client";
import { useState } from "react";
import Marquee from "@/components/Marquee";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
type FaqItem = { question: string; answer: string[] };
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
      "Стандартните срокове за доставка са 3 работни дни. Можете да намерите повече подробности за нашата политика за доставка на страницата „Политика за доставка“.",
    ],
  },
  {
    question: "Каква е вашата политика за връщане?",
    answer: [
      "За съжаление, поради спецификата на продукта не можем да предложим възстановяване или замяна на храни.",
      "Ако не получите поръчката си поради неправилен или непълен адрес за доставка, не можем да направим възстановяване или повторно изпращане. Ако куриерът е направил няколко опита за доставка и пратката не е потърсена и бъде върната, също не можем да възстановим средства или да изпратим отново.",
      "Ако получите продукт с дефект или грешка, изискваме снимка на проблема, за да оценим възможността за възстановяване. Без снимка не можем да обработим претенцията. За да бъде одобренo връщане, продуктът трябва да е неизползван и в същото състояние, в което сте го получили, както и в оригиналната опаковка.",
      "За да завършите процеса по връщане, молим да предоставите номер на поръчка или доказателство за покупка. За начало на процедурата ни пишете на zlati@noregrets.bg.",
    ],
  },
  {
    question: "Къде доставяте?",
    answer: [
      "Доставяме до всеки адрес в България. Не изпращаме до пощенски кутии или автоматични пощенски станции.",
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
    ],
  },
  {
    question: "Какво е работното време на магазина?",
    answer: [
      "No Regrets, гр. Пловдив, ул. Богомил 48",
      "Отворено 6 дни в седмицата само за взимане на направени поръчки. Работим по предварителна поръчка!",
      "Понеделник – Събота: 16:00 – 18:00",
    ],
  },
];
export default function FAQPage() {
  const [openItem, setOpenItem] = useState<string | null>(
    FAQ_ITEMS[0].question
  );
  return (
    <div className="flex min-h-screen flex-col ">
      {" "}
      <Marquee /> <SiteHeader />{" "}
      <main className="flex-1">
        {" "}
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-[clamp(1.25rem,4vw,4rem)] py-20">
          {" "}
          <header className="space-y-3 text-center">
            {" "}
            <p className="uppercase">ЧЗВ</p>{" "}
            <h1 className="text-4xl font-semibold sm:text-5xl">
              Често задавани въпроси
            </h1>{" "}
            <p className="/80">
              {" "}
              Ако не откривате нужното, пишете ни на{""}{" "}
              <a href="mailto:zlati@noregrets.bg" className="underline">
                {" "}
                zlati@noregrets.bg{" "}
              </a>{" "}
              .{" "}
            </p>{" "}
          </header>{" "}
          <div className="space-y-4">
            {" "}
            {FAQ_ITEMS.map((item) => {
              const isOpen = openItem === item.question;
              return (
                <article
                  key={item.question}
                  className="rounded-s bg-white/90 p-5 shadow-card"
                >
                  {" "}
                  <button
                    type="button"
                    onClick={() =>
                      setOpenItem((prev) =>
                        prev === item.question ? null : item.question
                      )
                    }
                    className="flex w-full items-center justify-between gap-6 text-left"
                  >
                    {" "}
                    <span className="text-xl font-semibold">
                      {item.question}
                    </span>{" "}
                    <span
                      className={`text-2xl transition-transform ${
                        isOpen ? "rotate-45" : "rotate-0"
                      }`}
                      aria-hidden="true"
                    >
                      {" "}
                      +{" "}
                    </span>{" "}
                  </button>{" "}
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ${
                      isOpen ? "mt-4 grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    {" "}
                    <div className="overflow-hidden text-sm leading-relaxed">
                      {" "}
                      {item.answer.map((paragraph, index) => (
                        <p
                          key={index}
                          className={index > 0 ? "mt-4" : undefined}
                        >
                          {" "}
                          {paragraph}{" "}
                        </p>
                      ))}{" "}
                    </div>{" "}
                  </div>{" "}
                </article>
              );
            })}{" "}
          </div>{" "}
        </div>{" "}
      </main>{" "}
      <SiteFooter />{" "}
    </div>
  );
}
