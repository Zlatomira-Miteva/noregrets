"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function CheckoutSuccessPage() {
  const [sheetStatus, setSheetStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = sessionStorage.getItem("pendingOrder");
    if (!cached) return;

    let parsedOrder: {
      customer?: { email?: string | null };
      consents?: { marketing?: boolean };
    } | null = null;
    try {
      parsedOrder = JSON.parse(cached);
    } catch (_error) {
      parsedOrder = null;
    }

    const send = async () => {
      try {
        setSheetStatus("saving");
        const response = await fetch("/api/orders/sheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: cached,
        });
        if (!response.ok) {
          throw new Error("Failed to save order");
        }
        setSheetStatus("saved");

        const wantsMarketing = Boolean(parsedOrder?.consents?.marketing);
        const email = parsedOrder?.customer?.email?.trim();
        if (wantsMarketing && email) {
          try {
            await fetch("/api/newsletter", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, honeypot: "" }),
            });
          } catch (newsletterError) {
            console.error("Failed to add marketing consent email", newsletterError);
          }
        }
      } catch (error) {
        console.error("Order logging failed", error);
        setSheetStatus("error");
      } finally {
        sessionStorage.removeItem("pendingOrder");
      }
    };

    send();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#fff6f1]">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="max-w-xl space-y-6 rounded-3xl bg-white p-10 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Плащането е успешно</p>
          <h1 className="text-4xl font-semibold text-[#5f000b]">Благодарим ви!</h1>
          <p className="text-lg text-[#5f000b]/80">
            Получихме вашата поръчка и започваме да я подготвяме. Ще ви изпратим потвърждение по имейл с всички детайли.
          </p>
          {sheetStatus === "saving" ? <p className="text-sm text-[#5f000b]/70">Записваме поръчката ви…</p> : null}
          {sheetStatus === "saved" ? <p className="text-sm text-green-700">Поръчката е записана успешно.</p> : null}
          {sheetStatus === "error" ? (
            <p className="text-sm text-red-600">Не успяхме да запишем поръчката. Свържете се с нас при нужда.</p>
          ) : null}
          <div className="flex justify-center">
            <Link
              href="/"
              className="cta rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#781e21]"
            >
              Обратно към началото
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
