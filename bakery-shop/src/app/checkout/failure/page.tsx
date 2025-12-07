"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

type CheckoutResponse = {
  redirectUrl?: string;
  error?: string;
  form?: { endpoint: string; fields: Record<string, string> };
};

export default function CheckoutFailurePage() {
  const [pendingExists, setPendingExists] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = sessionStorage.getItem("pendingOrder");
    setPendingExists(Boolean(cached));

    // Fire-and-forget admin notification on failed payment so issues are visible.
    if (cached && !notified) {
      fetch("/api/orders/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: cached,
      }).catch((notifyErr) => console.error("[checkout.failure] notify failed", notifyErr));
      setNotified(true);
    }
  }, []);

  const retryCheckout = async () => {
    if (typeof window === "undefined") return;
    const cached = sessionStorage.getItem("pendingOrder");
    if (!cached) {
      setError("Няма запазена поръчка. Моля, опитайте през количката.");
      return;
    }

    setLoading(true);
    setMessage("Подготвяме нов опит за плащане…");
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: cached,
      });

      const payload: CheckoutResponse = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Неуспешно стартиране на плащането.");
      }

      if (payload.form) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = payload.form.endpoint;
        Object.entries(payload.form.fields).forEach(([name, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }

      if (payload.redirectUrl) {
        window.location.href = payload.redirectUrl;
        return;
      }

      throw new Error(payload.error ?? "Неуспешно стартиране на плащането.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неуспешен опит за плащане.");
      setMessage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fff1f1]">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="max-w-xl space-y-6 rounded-3xl bg-white p-10 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Плащането не беше завършено</p>
          <h1 className="text-4xl font-semibold text-[#5f000b]">Нещо се обърка</h1>
          <p className="text-lg text-[#5f000b]/80">
            Транзакцията не беше успешна или бе отменена. Можете да опитате плащането отново.
          </p>
          {message ? <p className="text-sm text-[#5f000b]">{message}</p> : null}
          {error ? <p className="text-sm text-[#b42318]">{error}</p> : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={retryCheckout}
              disabled={loading || !pendingExists}
              className="cta rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#781e21] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Зареждаме…" : pendingExists ? "Опитай плащане отново" : "Няма запазена поръчка"}
            </button>
            <Link
              href="/cart"
              className="rounded-full border border-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-[#5f000b] transition hover:bg-white/70"
            >
              Върни се към количката
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-[#5f000b] transition hover:bg-white/70"
            >
              Свържете се с нас
            </Link>
          </div>
          {!pendingExists ? (
            <p className="text-xs text-[#5f000b]/70">
              Ако не виждате запазена поръчка, върнете се към количката и пуснете плащането оттам.
            </p>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
