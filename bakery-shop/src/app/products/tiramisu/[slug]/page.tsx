import type { Metadata } from "next";
import { notFound } from "next/navigation";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getProductsByCategorySlug } from "@/lib/products";
import { formatPrice } from "@/utils/price";
import TiramisuDetailClient from "./TiramisuDetailClient";

type TiramisuPageProps = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: "Тирамису – класически и авторски вкусове | NoRegrets.bg",
  description:
    "Наслади се на нашето тирамису – италианска класика с twist. Поръчай онлайн или вземи от ателието в Пловдив. 🍮",
};

export default async function TiramisuProductPage({ params }: TiramisuPageProps) {
  const { slug } = await params;
  const products = await getProductsByCategorySlug("tiramisu");
  const initialProduct = products.find((p) => p.slug === slug) ?? products[0];

  if (!initialProduct) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fff1f3]">
      <SiteHeader />
      <main className="flex-1">
        <TiramisuDetailClient
          products={products.map((product) => ({
            ...product,
            priceLabel: formatPrice(product.price),
            shortDescription: product.shortDescription,
          }))}
          initialSlug={initialProduct.slug}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
