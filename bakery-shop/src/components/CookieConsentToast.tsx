"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "cookie-consent-accepted";

export default function CookieConsentToast() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setMounted(true);
    const accepted = window.localStorage.getItem(STORAGE_KEY);
    setVisible(!accepted);
  }, []);

  const handleAccept = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "true");
    }
    setVisible(false);
  };

  if (!mounted || !visible) return null;

  return (
    <div
      className="pointer-events-auto max-w-xs rounded-2xl bg-[#2a1b1f] px-5 py-4 text-sm text-white shadow-xl"
      style={{
        position: "fixed",
        bottom: "1rem",
        left: "1rem",
        zIndex: 2147483647,
      }}
    >
      <p className="leading-relaxed">
        Използвайки този сайт, се съгласявате с нашата{" "}
        <Link href="/privacy" className="underline">
          политика за бисквитки
        </Link>{" "}
        и аналитични инструменти за подобряване на изживяването.
      </p>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={handleAccept}
          className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase text-[#2a1b1f] transition hover:bg-[#f4e8ec]"
        >
          ОК
        </button>
      </div>
    </div>
  );
}
