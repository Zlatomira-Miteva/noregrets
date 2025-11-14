import type { StaticImageData } from "next/image";

import DarkChocMochi from "@/app/dark-choc-mochi.png";
import WhiteChocMochi from "@/app/white-choc-mochi.png";

export type MochiInfo = {
  id: string;
  name: string;
  description: string;
  filling: string[];
  image: StaticImageData;
};

export const MOCHIS: MochiInfo[] = [
  {
    id: "dark-choc",
    name: "Dark Chocolate Ganache",
    description:
      "Копринено тъмно шоколадово ганаше, обвито в еластична оризова обвивка. Сладък, но балансиран вкус с леко горчив финал.",
    filling: ["Шоколад", "Сметана", "Оризово брашно", "Захар"],
    image: DarkChocMochi,
  },
  {
    id: "white-choc",
    name: "White Chocolate & Ягоди",
    description:
      "Ванилов бял шоколад, смесен с дехидратирани ягоди за лека кисела нотка. Мекият оризов слой се топи още при първата хапка.",
    filling: ["Бял шоколад", "Сметана", "Оризово брашно", "Захар"],
    image: WhiteChocMochi,
  }
];
