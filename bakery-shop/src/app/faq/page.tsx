import type { Metadata } from "next";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import FAQClient from "./FAQClient";

export const metadata: Metadata = {
  title: "ЧЗВ – Поръчки, доставка и взимане | NoRegrets.bg",
  description: "Научи отговорите на най-честите въпроси за поръчки, доставка и взимане на сладкиши от No Regrets. ❓",
};

export default function FAQPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <FAQClient />
      <SiteFooter />
    </div>
  );
}
