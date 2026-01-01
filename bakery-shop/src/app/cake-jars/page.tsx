import type { Metadata } from "next";

import CakeJarsClient from "@/components/CakeJarsClient";
import { getCakeJars } from "@/lib/cakeJars";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Торти в буркан – сладко удоволствие | NoRegrets.bg",
  description: "Торти в буркан – сладко удоволствие | NoRegrets.bg",
};

export default async function CakeJarsPage() {
  const cakeJars = await getCakeJars();
  return <CakeJarsClient initialJars={cakeJars} />;
}
