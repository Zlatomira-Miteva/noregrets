"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const cards = [
  {
    title: "Поръчки",
    description: "Преглед, статуси и отказване на поръчки.",
    href: "/admin/orders",
    accent: "bg-[#ffe7eb]",
  },
  {
    title: "Обобщение по дни",
    description: "Дневен изглед с платени поръчки и артикули за приготвяне.",
    href: "/admin/orders/summary",
    accent: "bg-[#fff3e5]",
  },
  {
    title: "Категории и продукти",
    description: "Създаване и редакция на продукти и категории.",
    href: "/admin/products",
    accent: "bg-[#e8f5ff]",
  },
  {
    title: "Промо кодове",
    description: "Управление на промоционални кодове.",
    href: "/admin/coupons",
    accent: "bg-[#f0e5ff]",
  },
];

export default function AdminHomePage() {
  const { status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ffefed] text-[#5f000b]">
        <p>Зареждаме...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.replace("/admin/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#ffefed] px-[clamp(1rem,4vw,4rem)] py-16 text-[#5f000b]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="space-y-3 text-center">
          <p className="text-sm uppercase">Админ панел</p>
          <h1 className="text-4xl font-semibold">Бързи действия</h1>
          <p>Всички админ страници на едно място.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/admin/orders"
              className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase hover:bg-white/40"
            >
              Поръчки
            </Link>
            <Link
              href="/admin/orders/summary"
              className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase hover:bg-white/40"
            >
              Обобщение по дни
            </Link>
            <Link
              href="/admin/products"
              className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase hover:bg-white/40"
            >
              Категории и продукти
            </Link>
            <Link
              href="/admin/coupons"
              className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase hover:bg-white/40"
            >
              Промо кодове
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase hover:bg-white/40"
            >
              Изход
            </button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-3xl border border-[#f5d5d6] bg-white/90 p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={`mb-4 h-10 w-10 rounded-2xl ${card.accent}`} />
              <h2 className="text-xl font-semibold">{card.title}</h2>
              <p className="mt-2 text-sm text-[#5f000b]/80">{card.description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#5f000b] transition group-hover:gap-3">
                Отвори
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
