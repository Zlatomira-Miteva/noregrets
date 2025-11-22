import { getProductBySlug } from "@/lib/products";
import BestSellersClient from "./BestSellersClient";

export default async function BestSellersPage() {
  const product = await getProductBySlug("best-sellers");
  return <BestSellersClient initialProduct={product} />;
}
