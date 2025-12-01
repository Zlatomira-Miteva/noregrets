export type CakeJarInfo = {
  id: string;
  name: string;
  description: string;
  layers: string[];
  image: string;
};

export const CAKE_JARS: CakeJarInfo[] = [
  {
    id: "red-velvet",
    name: "Торта червено кадифе",
    description:
      "Ред Велвет блатове, напоени с ванилов сироп и покрити с нежен крем сирене с бял шоколад. Всеки буркан е кадифено сладък и изненадващо лек.",
    layers: ["Ред Велвет блат", "Крема сирене", "Швейцарски крем"],
    image: "/red-velvet-cake-jar.png",
  },
  {
    id: "nutella-biscoff",
    name: "Торта Nutella & Biscoff",
    description:
      "Какаови блатове, крем маскарпоне, хрупкави парченца Lotus, крем Lotus и Nutella. Комбинация между дълбок шоколад и карамелен хрупкав слой.",
    layers: ["Шоколадов блат", "Nutella", "Biscoff крем", "Швейцарски крем"],
    image: "/nutella-biscoff-cake-jar.png",
  },
  {
    id: "mascarpone-raspberry",
    name: "Торта с маскарпоне и малина",
    description:
      "Въздушен маскарпоне крем, малинов конфитюр и ванилови блатове. Баланс между свежест, малина и копринен крем.",
    layers: ["Ванилов блат", "Малиново сладко", "Маскарпоне и сметана"],
    image: "/mascarpone-raspberry-cake-jar.png",
  },
];
