import type { Metadata } from "next";

import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Контакти – No Regrets Сладкарско ателие в Пловдив",
  description:
    "Свържи се с No Regrets за поръчки, събития или фирмени доставки. Намери ни на ул. Богомил 48, Пловдив. 📩",
};

export default function ContactPage() {
  return <ContactClient />;
}
