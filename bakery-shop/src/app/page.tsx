import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function ComingSoonPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#ffe0ea] text-[#5f000b]">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center">
        <p className="text-4xl font-semibold uppercase tracking-widest">Coming Soon</p>
      </main>
      <SiteFooter />
    </div>
  );
}
