import type { StaticImageData } from "next/image";

import LemonJar from "@/app/lemon-cake-jar.png";
import MascarponeRaspberryJar from "@/app/mascarpone-raspberry-cake-jar.png";
import NutellaBiscoffJar from "@/app/nutella-biscoff-cake-jar.png";
import RedVelvetJar from "@/app/red-velvet-cake-jar.png";

export type CakeJarInfo = {
  id: string;
  name: string;
  description: string;
  layers: string[];
  image: StaticImageData;
};

export const CAKE_JARS: CakeJarInfo[] = [
  {
    id: "red-velvet",
    name: "Торта червено кадифе",
    description:
      "Ред Велвет блатове, напоени с ванилов сироп и покрити с нежен крем сирене с бял шоколад. Всеки буркан е кадифено сладък и изненадващо лек.",
    layers: ["Ред Велвет блат", "Крема сирене", "Швейцарски крем"],
    image: RedVelvetJar,
  },
  {
    id: "nutella-biscoff",
    name: "Торта Nutella & Biscoff",
    description:
      "Шоколадов мус с белгийско какао, хрупкави парченца Lotus и сърце от течна Nutella. Комбинация между дълбок шоколад и карамелен хрупкав слой.",
    layers: ["Шоколадов блат", "Nutella", "Biscoff крем", "Швейцарски крем"],
    image: NutellaBiscoffJar,
  },
  {
    id: "mascarpone-raspberry",
    name: "Торта с маскарпоне и малина",
    description:
      "Въздушен маскарпоне крем, малинов конфитюр и ванилови блатове. Баланс между свежест, леко кисела малина и копринен крем.",
    layers: ["Ванилов блат", "Малиново сладко", "Маскарпоне и сметана"],
    image: MascarponeRaspberryJar,
  },
  {
    id: "lemon",
    name: "Торта с лимонов домашен крем",
    description:
      "Слънчево лимоново курд, пухкав ванилов блат и шамфъстъчен крем. Свеж, ароматен и с приятно ядков финал.",
    layers: ["Ванилов блат", "Лимон", "Домашен крем"],
    image: LemonJar,
  },
];
