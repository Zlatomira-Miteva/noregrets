"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cookie-consent";
const ANALYTICS_SCRIPT_URL = "https://t.contentsquare.net/uxa/e9a4e8239ea47.js";

const loadAnalyticsOnce = () => {
  if (typeof window === "undefined") return;
  if ((window as unknown as { __csLoaded?: boolean }).__csLoaded) return;
  const script = document.createElement("script");
  script.src = ANALYTICS_SCRIPT_URL;
  script.async = true;
  document.body.appendChild(script);
  (window as unknown as { __csLoaded?: boolean }).__csLoaded = true;
};

export default function CookieConsentToast() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setMounted(true);
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "accepted") {
      loadAnalyticsOnce();
      setVisible(false);
    } else {
      setVisible(true);
    }
  }, []);

  const handleAccept = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "accepted");
    }
    loadAnalyticsOnce();
    setVisible(false);
  }, []);

  const handleReject = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "rejected");
    }
    setVisible(false);
  }, []);

  if (!mounted || !visible) return null;

  return (
    <div
      className="pointer-events-auto max-w-md rounded-2xl bg-[#2a1b1f] px-5 py-4 text-sm text-white shadow-xl"
      style={{
        position: "fixed",
        bottom: "1rem",
        left: "1rem",
        zIndex: 2147483647,
      }}
    >
      <p className="leading-relaxed">
        Използваме бисквитки, за да осигурим правилното функциониране на сайта
        и, след ваше съгласие, аналитични инструменти за подобряване на
        изживяването.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleReject}
          className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase text-white transition hover:bg-white/25"
        >
          Отказ
        </button>
        <button
          type="button"
          onClick={handleAccept}
          className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase text-[#2a1b1f] transition hover:bg-[#f4e8ec]"
        >
          Приемам
        </button>
      </div>
    </div>
  );
}
