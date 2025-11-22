"use client";

import Link from "next/link";
import { useEffect } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function CheckoutFailurePage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("pendingOrder");
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#fff1f1]">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="max-w-xl space-y-6 rounded-3xl bg-white p-10 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Плащането не беше завършено</p>
          <h1 className="text-4xl font-semibold text-[#5f000b]">Нещо се обърка</h1>
          <p className="text-lg text-[#5f000b]/80">
            Транзакцията не беше успешна или бе отменена. Моля, опитайте отново.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/cart"
              className="cta rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#781e21]"
            >
              Върни се към количката
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-[#5f000b] transition hover:bg-white/70"
            >
              Свържете се с нас
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
