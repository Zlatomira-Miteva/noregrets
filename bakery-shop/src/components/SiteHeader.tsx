'use client';

import Image from "next/image";
import Link from "next/link";

import Logo from "@/app/logo.svg";
import ShoppingCartIcon from "@/app/shopping_cart.png";
import { NAVIGATION } from "@/data/navigation";

const SiteHeader = () => {
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

        <button
          type="button"
          aria-label="Преглед на количката"
          className="rounded-full bg-white/90 p-2 shadow-card transition hover:bg-white"
        >
          <Image src={ShoppingCartIcon} alt="" className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

export default SiteHeader;
