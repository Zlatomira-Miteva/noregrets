'use client';

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import Logo from "@/app/logo.svg";
import { NAVIGATION } from "@/data/navigation";
import { useCart } from "@/context/CartContext";
import shoppingCart from "@/../public/shopping_cart.png";
import Marquee from "@/components/Marquee";

const SiteHeader = () => {
  const { totalQuantity } = useCart();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href.includes("#")) return false;
    const targetPath = new URL(href, "http://localhost").pathname.replace(/\/+$/, "") || "/";
    const currentPath = (pathname ?? "/").replace(/\/+$/, "") || "/";

    if (
      currentPath === targetPath ||
      currentPath.startsWith(`${targetPath}/`) ||
      (targetPath === "/home" && currentPath === "/") ||
      (targetPath === "/" && currentPath === "/home")
    ) {
      return true;
    }

    if (targetPath === "/products/cake-jar" && currentPath === "/cake-jars") {
      return true;
    }

    return false;
  };

  return (
    <>
      <Marquee />
      <header className="sticky top-0 z-[100] bg-[#ffefed]/90 backdrop-blur">
        <div className="mx-auto flex w-full items-center justify-between px-[clamp(1rem,3vw,3rem)] py-1">
          <Link href="/home" className="block flex-shrink-0">
            <span className="relative block h-12 w-[9.5rem] md:w-[12rem]">
              <Image src={Logo} alt="No Regrets" fill priority sizes="(max-width: 768px) 152px, 192px" className="object-contain" />
            </span>
          </Link>

          <nav className="hidden gap-8 text-sm font-medium md:flex">
            {NAVIGATION.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`nav-link transition ${
                    active
                      ? "nav-link-active font-semibold text-[#5f000b]"
                      : "text-[#5f000b]/80 hover:text-[#5f000b] hover:underline hover:decoration-4 hover:underline-offset-8"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/cart"
              aria-label="Преглед на количката"
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#5f000b] shadow-card transition hover:bg-white"
            >
              <Image src={shoppingCart} alt="" width={20} height={20} className="h-5 w-5" priority />
              {totalQuantity > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#5f000b] px-1 text-xs font-semibold text-white">
                  {totalQuantity}
                </span>
              ) : null}
            </Link>
            <Link
              href="/account"
              aria-label="Моят профил"
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#5f000b] shadow-card transition hover:bg-white"
            >
              <span className="h-6 w-6">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c1.5-3 4.5-5 8-5s6.5 2 8 5" strokeLinecap="round" />
                </svg>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <Link
              href="/cart"
              aria-label="Преглед на количката"
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#5f000b] shadow-card transition hover:bg-white"
            >
              <Image src={shoppingCart} alt="" width={20} height={20} className="h-5 w-5" priority />
              {totalQuantity > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#5f000b] px-1 text-xs font-semibold text-white">
                  {totalQuantity}
                </span>
              ) : null}
            </Link>
            <Link
              href="/account"
              aria-label="Моят профил"
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#5f000b] shadow-card transition hover:bg-white"
            >
              <span className="h-6 w-6">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c1.5-3 4.5-5 8-5s6.5 2 8 5" strokeLinecap="round" />
                </svg>
              </span>
            </Link>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#5f000b] shadow-card transition hover:bg-white md:hidden"
              aria-label="Меню"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              <span className="sr-only">Отвори меню</span>
              <div className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
              </div>
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="md:hidden">
            <div className="mx-auto flex w-full flex-col gap-3 px-[clamp(1rem,3vw,3rem)] pb-4">
              <nav className="flex flex-col gap-2 rounded-2xl bg-white/90 p-4 shadow-card">
                {NAVIGATION.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        active ? "bg-[#ffefed] text-[#5f000b]" : "text-[#5f000b]/80 hover:bg-[#ffefed]"
                      }`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        ) : null}
      </header>
    </>
  );
};

export default SiteHeader;
