"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { formatPrice } from "@/utils/price";

type Favorite = {
  productId: string;
  name?: string;
  slug?: string;
  price?: number | null;
  heroImage?: string | null;
  createdAt?: string;
};

const absImage = (path?: string | null) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://noregrets.bg").replace(/\/+$/, "");
  return `${base}${normalized}`;
};

export default function AccountFavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/account/login?callbackUrl=/account/favorites");
    }
  }, [status, router]);

  useEffect(() => {
    const load = async () => {
      if (!session?.user) return;
      setLoading(true);
      const res = await fetch("/api/account/favorites");
      const data = await res.json();
      setFavorites(data.favorites ?? []);
      setLoading(false);
    };
    load();
  }, [session]);

  const handleRemove = async (productId: string) => {
    await fetch("/api/account/favorites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setFavorites((prev) => prev.filter((f) => f.productId !== productId));
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#ffefed] text-[#5f000b]">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-4 py-12">
        <div className="w-full max-w-5xl space-y-6 rounded-3xl bg-white p-8 shadow-card">
          <h1 className="text-2xl font-semibold">Любими продукти</h1>
          {loading ? (
            <p>Зарежда...</p>
          ) : favorites.length === 0 ? (
            <p className="text-[#5f000b]/80">Нямаш любими продукти.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((fav) => (
                <article key={fav.productId} className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#e4c8c8] bg-white">
                  <a href={fav.slug ? `/products/${fav.slug}` : "#"} className="block">
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#fff4f1]">
                      {fav.heroImage ? (
                        <img src={absImage(fav.heroImage)} alt={fav.name ?? fav.slug ?? fav.productId} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-[#5f000b]/60">Без снимка</div>
                      )}
                    </div>
                    <div className="space-y-1 px-4 py-3">
                      <h3 className="text-lg font-semibold">{fav.name ?? fav.slug ?? fav.productId ?? "Продукт"}</h3>
                      {fav.price != null ? <p className="text-sm text-[#5f000b]/80">{formatPrice(fav.price)}</p> : null}
                    </div>
                  </a>
                  <div className="mt-auto px-4 pb-4">
                    <button
                      type="button"
                      onClick={() => handleRemove(fav.productId)}
                      className="w-full rounded-full bg-[#5f000b] px-4 py-2 text-sm font-semibold uppercase text-white transition hover:bg-[#781e21]"
                    >
                      Премахни
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
