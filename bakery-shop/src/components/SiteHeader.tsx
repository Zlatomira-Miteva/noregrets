'use client';

import Image from "next/image";
import Link from "next/link";

import Logo from "@/app/logo.svg";
import ShoppingCartIcon from "@/app/shopping_cart.png";
import { NAVIGATION } from "@/data/navigation";
import { useCart } from "@/context/CartContext";

const SiteHeader = () => {
  const { totalQuantity } = useCart();

  return (
    <header className="sticky top-0 z-20 bg-[#f4b9b9]/80 backdrop-blur">
      <div className="mx-auto flex w-full items-center justify-between px-[clamp(1rem,3vw,3rem)] py-3">
        <Link href="/" className="block flex-shrink-0">
          <span className="relative block h-12 w-[9.5rem] md:w-[12rem]">
            <Image
              src={Logo}
              alt="No Regrets"
              fill
              priority
              sizes="(max-width: 768px) 152px, 192px"
              className="object-contain"
            />
          </span>
        </Link>

        <nav className="hidden gap-8 text-sm font-medium md:flex">
          {NAVIGATION.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="transition hover:text-[#d64862]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/cart"
          aria-label="Преглед на количката"
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-card transition hover:bg-white"
        >
          <Image src={ShoppingCartIcon} alt="" className="h-5 w-5" />
          {totalQuantity > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#9d0012] px-1 text-xs font-semibold text-white">
              {totalQuantity}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
};

export default SiteHeader;
