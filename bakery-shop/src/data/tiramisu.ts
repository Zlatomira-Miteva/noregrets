import { CakeProduct } from "@/data/cakes";
import { formatPrice } from "@/utils/price";

export type TiramisuProduct = CakeProduct;

export const TIRAMISU: TiramisuProduct[] = [
  {
    slug: "classic-tiramisu",
    name: "Класическо тирамису",
    price: formatPrice(6.9),
    weight: "180 гр.",
    leadTime: "Доставка до 4 работни дни",
    description: "Нежен крем с маскарпоне, еспресо и какао върху напоени бишкоти – класическа рецепта, но с No Regrets почерк.",
    highlights: ["Свежо маскарпоне", "Истинско еспресо", "Порция готова за споделяне"],
    fillings: ["Маскарпоне крем", "Еспресо сироп", "Бишкоти Savoiardi", "Какао"],
    image: "/regular-tiramisu.png",
  },
  {
    slug: "strawberry-tiramisu",
    name: "Ягодово тирамису",
    price: formatPrice(7.2),
    weight: "180 гр.",
    leadTime: "Доставка до 4 работни дни",
    description: "Леко плодово тирамису с ягодов конфитюр и маскарпоне – свеж контраст между крем, плод и какао.",
    highlights: ["Ягодов слой", "Маскарпоне крем", "Фино какао"],
    fillings: ["Маскарпоне крем", "Ягодово сладко", "Бишкоти Savoiardi", "Какао"],
    image: "/strawberry-tiramisu.png",
  },
  {
    slug: "pistachio-tiramisu",
    name: "Тирамису с шамфъстък",
    price: formatPrice(7.6),
    weight: "180 гр.",
    leadTime: "Доставка до 4 работни дни",
    description: "Кремообразно тирамису с шамфъстък и фин еспресо вкус за любителите на ядковите десерти.",
    highlights: ["Шамфъстък паста", "Маскарпоне", "Еспресо"],
    fillings: ["Маскарпоне крем", "Шамфъстък паста", "Еспресо сироп", "Бишкоти Savoiardi"],
    image: "/regular-tiramisu.png",
  },
];
