import { getProductBySlug } from "@/lib/products";
import MiniCookiesClient from "./MiniCookiesClient";

export const dynamic = "force-dynamic";

export default async function MiniCookiesPage() {
  const product = await getProductBySlug("mini-cookies");
  return <MiniCookiesClient initialProduct={product} />;
}
