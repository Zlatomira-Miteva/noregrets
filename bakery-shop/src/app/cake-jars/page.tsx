import CakeJarsClient from "@/components/CakeJarsClient";
import { getCakeJars } from "@/lib/cakeJars";

export const dynamic = "force-dynamic";

export default async function CakeJarsPage() {
  const cakeJars = await getCakeJars();
  return <CakeJarsClient initialJars={cakeJars} />;
}
