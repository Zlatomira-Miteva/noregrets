"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function AccountHomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/account/login");
    }
  }, [status, router]);

  return (
    <div className="flex min-h-screen flex-col bg-[#ffefed] text-[#5f000b]">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-6 rounded-3xl bg-white p-8 text-center shadow-card">
          <h1 className="text-3xl font-semibold">Моят профил</h1>
          <p className="text-[#5f000b]/80">Здравей, {session?.user?.name ?? session?.user?.email ?? "гост"}.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <a href="/account/orders" className="rounded-2xl border border-[#e4c8c8] px-6 py-4 transition hover:-translate-y-1 hover:shadow-card">
              <h3 className="text-lg font-semibold">Поръчки</h3>
              <p className="text-sm text-[#5f000b]/80">История на поръчките ти.</p>
            </a>
            <a href="/account/favorites" className="rounded-2xl border border-[#e4c8c8] px-6 py-4 transition hover:-translate-y-1 hover:shadow-card">
              <h3 className="text-lg font-semibold">Любими</h3>
              <p className="text-sm text-[#5f000b]/80">Запазени продукти.</p>
            </a>
            <a href="/account/profile" className="rounded-2xl border border-[#e4c8c8] px-6 py-4 transition hover:-translate-y-1 hover:shadow-card">
              <h3 className="text-lg font-semibold">Моите данни</h3>
              <p className="text-sm text-[#5f000b]/80">Адрес, телефон и контактни данни.</p>
            </a>
          </div>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#781e21]"
            >
              Изход
            </button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
