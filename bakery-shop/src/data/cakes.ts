import type { StaticImageData } from "next/image";

import MascarponeRaspberryPresentCake from "@/app/mascarpone-raspberry-present-cake.png";
import NutellaBiscoffPresentCake from "@/app/nutella-biscoff-present-cake.png";
import RedVelvetPresentCake from "@/app/red-velvet-present-cake.png";

export type CakeProduct = {
  slug: string;
  name: string;
  price: string;
  weight: string;
  leadTime: string;
  description: string;
  highlights: string[];
  fillings: string[];
  image: StaticImageData;
};

export const CAKES: CakeProduct[] = [
  {
    slug: "red-velvet",
    name: "Червено Кадифе",
    price: "10.00 лв",
    weight: "220 гр.",
    leadTime: "Доставка до 3 дни",
    description:
      "Нежни червени блатове, напоени с ванилов сироп, и богат крем.",
    highlights: [
      "Ръчно приготвена",
      "Охлаждане преди сервиране 30 мин",
    ],
    fillings: ["Ред Велвет блат", "Крема сирене", "Швейцарски крем"],
    image: RedVelvetPresentCake,
  },
  {
    slug: "mascarpone-raspberry",
    name: "Маскарпоне и малина",
    price: "10.00 лв",
    weight: "240 гр.",
    leadTime: "Доставка до 3 дни",
    description:
      "Въздушен ванилов блат, маскарпоне и малиново сладко.",
    highlights: [
      "Ръчно приготвена",
      "Охлаждане преди сервиране 30 мин",
    ],
    fillings: ["Ванилов блат", "Малиново сладко", "Маскарпоне и сметана"],
    image: MascarponeRaspberryPresentCake,
  },
  {
    slug: "nutella-biscoff",
    name: "Nutella Biscoff",
    price: "12.00 лв",
    weight: "220 гр.",
    leadTime: "Доставка до 3 дни",
    description:
      "Шоколадови блатове, пълни с крем Nutella и карамелен Lotus слой. Декорирана с мини бисквитки и глазура от млечен шоколад.",
    highlights: [
      "Ръчно приготвена",
      "Охлаждане преди сервиране 30 мин",
    ],
    fillings: ["Шоколадов блат", "Nutella", "Biscoff крем", "Kрем маскарпоне"],
    image: NutellaBiscoffPresentCake,
  },
];
