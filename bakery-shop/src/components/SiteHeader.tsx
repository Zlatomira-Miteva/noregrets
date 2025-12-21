'use client';

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import Logo from "@/app/logo.svg";
import { NAVIGATION } from "@/data/navigation";
import { useCart } from "@/context/CartContext";
import shoppingCart from "@/../public/shopping_cart.png";
import Marquee from "@/components/Marquee";

const SiteHeader = () => {
  const { totalQuantity } = useCart();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href.includes("#")) return false;
    return pathname === href;
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
                      ? "text-[#5f000b] underline decoration-4 underline-offset-8"
                      : "text-[#5f000b]/80 hover:text-[#5f000b] hover:underline hover:decoration-4 hover:underline-offset-8"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/cart"
            aria-label="Преглед на количката"
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-card transition hover:bg-white"
          >
            <Image src={shoppingCart} alt="" width={20} height={20} className="h-5 w-5" priority />
            {totalQuantity > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#5f000b] px-1 text-xs font-semibold text-white">
                {totalQuantity}
              </span>
            ) : null}
          </Link>
        </div>
      </header>
    </>
  );
};

export default SiteHeader;
