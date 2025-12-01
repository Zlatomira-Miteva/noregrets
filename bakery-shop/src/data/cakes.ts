import { formatPrice } from "@/utils/price";

export type CakeProduct = {
  slug: string;
  name: string;
  price: string;
  weight: string;
  leadTime: string;
  description: string;
  highlights: string[];
  fillings: string[];
  image: string;
};

export const CAKES: CakeProduct[] = [
  {
    slug: "red-velvet",
    name: "Червено Кадифе",
    price: formatPrice(10),
    weight: "220 гр.",
    leadTime: "Доставка до 3 дни",
    description:
      "Нежни червени блатове, напоени с ванилов сироп, и богат крем.",
    highlights: [
      "Ръчно приготвена",
      "Охлаждане преди сервиране 30 мин",
    ],
    fillings: ["Ред Велвет блат", "Крема сирене", "Швейцарски крем"],
    image: "/red-velvet-present-cake.png",
  },
  {
    slug: "mascarpone-raspberry",
    name: "Маскарпоне и малина",
    price: formatPrice(10),
    weight: "240 гр.",
    leadTime: "Доставка до 3 дни",
    description:
      "Въздушен ванилов блат, маскарпоне и малиново сладко.",
    highlights: [
      "Ръчно приготвена",
      "Охлаждане преди сервиране 30 мин",
    ],
    fillings: ["Ванилов блат", "Малиново сладко", "Маскарпоне и сметана"],
    image: "/mascarpone-raspberry-present-cake.png",
  },
  {
    slug: "nutella-biscoff",
    name: "Nutella Biscoff",
    price: formatPrice(12),
    weight: "220 гр.",
    leadTime: "Доставка до 3 дни",
    description:
      "Шоколадови блатове, пълни с крем Nutella и карамелен Lotus слой. Декорирана с мини бисквитки и глазура от млечен шоколад.",
    highlights: [
      "Ръчно приготвена",
      "Охлаждане преди сервиране 30 мин",
    ],
    fillings: ["Шоколадов блат", "Nutella", "Biscoff крем", "Kрем маскарпоне"],
    image: "/nutella-biscoff-present-cake.png",
  },
];
