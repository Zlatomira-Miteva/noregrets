import { notFound } from "next/navigation";

import CakeProductDetail from "@/components/CakeProductDetail";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { CAKES } from "@/data/cakes";

type CakePageProps = {
  params: { slug: string };
};

export default function CakePage({ params }: CakePageProps) {
  const cake = CAKES.find((item) => item.slug === params.slug);

  if (!cake) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fff1f3]">
      <SiteHeader />
      <main className="flex-1">
        <CakeProductDetail cake={cake} />
      </main>
      <SiteFooter />
    </div>
  );
}
