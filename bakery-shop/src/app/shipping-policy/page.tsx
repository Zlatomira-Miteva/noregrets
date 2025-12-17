"use client";
import { useState } from "react";
import Marquee from "@/components/Marquee";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
type ShippingSection = {
  title: string;
  body: string[];
};
const SHIPPING_SECTIONS: ShippingSection[] = [
  {
    title: "Кога ще получа поръчката си?",
    body: [
      "Време за доставка в България: 3 работни дни.",
      "*Изпращаме поръчки от понеделник до четвъртък. Не изпращаме в петък, за да пристигнат продуктите максимално свежи. Поръчки, направени след 15:00 ч. в четвъртък, се изпращат в следващия понеделник.",
    ],
  },
  {
    title: "Къде доставяме?",
    body: [
      "Доставяме до всички жилищни и бизнес адреси в България. Не изпращаме до пощенски кутии или автоматични станции.",
    ],
  },
  {
    title: "Мога ли да отменя или променя поръчка?",
    body: [
      "Ще направим всичко възможно да съдействаме с промени, но си запазваме правото да откажем, ако продуктът вече е изпратен.",
      "Проверете внимателно съдържанието и адреса преди финализиране. След като поръчката е обработена, не можем да променим адреса или съдържанието.",
    ],
  },
];
export default function ShippingPolicyPage() {
  const [openTitle, setOpenTitle] = useState<string | null>(
    SHIPPING_SECTIONS[0]?.title ?? null
  );
  return (
    <div className="flex min-h-screen flex-col">
      <Marquee />
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-[clamp(1.25rem,4vw,4rem)] py-20 text-[#5f000b]">
          <header className="space-y-3 text-center">
            <p className="text-sm uppercase">Политика за доставка</p>
            <h1 className="text-4xl font-semibold sm:text-5xl">
              Как пътуват нашите сладкиши
            </h1>
            <p>
              Имаме въпроси или коментари? Нашият екип е на линия от понеделник
              до петък, 08:00 – 15:00 ч.
            </p>
          </header>

          <div className="space-y-4">
            {SHIPPING_SECTIONS.map((section) => {
              const isOpen = openTitle === section.title;
              return (
                <article
                  key={section.title}
                  className="rounded-3xl bg-white/90 p-5 shadow-card"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenTitle((prev) =>
                        prev === section.title ? null : section.title
                      )
                    }
                    className="flex w-full items-center justify-between gap-6 text-left"
                  >
                    <h2 className="text-xl font-semibold">{section.title}</h2>
                    <span
                      className={`text-2xl transition-transform ${
                        isOpen ? "rotate-45" : "rotate-0"
                      }`}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ${
                      isOpen ? "mt-4 grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden text-sm leading-relaxed">
                      {section.body.map((paragraph, index) => (
                        <p
                          key={`${section.title}-${index}`}
                          className={index > 0 ? "mt-3" : undefined}
                        >
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
