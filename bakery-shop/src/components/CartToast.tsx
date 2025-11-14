'use client';

import { useEffect, useState } from "react";

import { useCart } from "@/context/CartContext";

const DISPLAY_DURATION = 2600;

const CartToast = () => {
  const { lastAddedEvent, acknowledgeLastAdded } = useCart();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!lastAddedEvent) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    const hideTimer = window.setTimeout(() => {
      setIsVisible(false);
      acknowledgeLastAdded();
    }, DISPLAY_DURATION);

    return () => window.clearTimeout(hideTimer);
  }, [lastAddedEvent, acknowledgeLastAdded]);

  if (!isVisible || !lastAddedEvent) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-[5.5rem] z-50 flex max-w-sm items-center gap-3 rounded-2xl bg-[#2a1d20]/95 px-4 py-3 text-white shadow-2xl ring-1 ring-white/10 transition duration-300 md:right-6 md:top-[4.5rem]">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-base text-emerald-200">
        ✓
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-semibold uppercase tracking-wide">Добавено в количката!</p>
        <p className="text-xs text-white/80">{lastAddedEvent.name}</p>
      </div>
    </div>
  );
};

export default CartToast;
