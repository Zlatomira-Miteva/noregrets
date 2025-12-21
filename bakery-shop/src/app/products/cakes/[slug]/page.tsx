import { notFound } from "next/navigation";

import CakeProductDetail from "@/components/CakeProductDetail";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getProductBySlug } from "@/lib/products";
import { formatPrice } from "@/utils/price";

type CakePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CakePage({ params }: CakePageProps) {
  const { slug } = await params;
  const cake = await getProductBySlug(slug);

  if (!cake) {
    notFound();
  }

  const displayCake = {
    slug: cake.slug,
    name: cake.name,
    price: formatPrice(cake.price),
    weight: cake.weight,
    leadTime: cake.leadTime,
    description: cake.description,
    image: cake.heroImage,
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fff1f3]">
      
      <SiteHeader />
      <main className="flex-1">
        <CakeProductDetail cake={displayCake} />
      </main>
      <SiteFooter />
    </div>
  );
}
