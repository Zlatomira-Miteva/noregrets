export type MochiInfo = {
  id: string;
  name: string;
  description: string;
  filling: string[];
  image: string;
};

export const MOCHIS: MochiInfo[] = [
  {
    id: "dark-choc",
    name: "Dark Chocolate Ganache",
    description:
      "Копринено тъмно шоколадово ганаше, обвито в еластична оризова обвивка. Сладък, но балансиран вкус с леко горчив финал.",
    filling: ["Шоколад", "Сметана", "Оризово брашно", "Захар"],
    image: "/dark-choc-mochi.png",
  },
  {
    id: "white-choc",
    name: "White Chocolate & Ягоди",
    description:
      "Ванилов бял шоколад, смесен с дехидратирани ягоди за лека кисела нотка. Мекият оризов слой се топи още при първата хапка.",
    filling: ["Бял шоколад", "Сметана", "Оризово брашно", "Захар"],
    image: "/white-choc-mochi.png",
  }
];
