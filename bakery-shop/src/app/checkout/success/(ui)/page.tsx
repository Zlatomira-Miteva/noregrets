"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { useCart } from "@/context/CartContext";

export default function CheckoutSuccessPage() {
  const [statusUpdate, setStatusUpdate] = useState<"idle" | "updating" | "updated" | "error">("idle");
  const { clearCart } = useCart();

  // Clear cart on success entry.
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // Ensure backend marks the order as PAID when landing on the success page.
  useEffect(() => {
    if (typeof window === "undefined" || statusUpdate !== "idle") return;
    const url = new URL(window.location.href);
    const reference =
      url.searchParams.get("reference") ||
      url.searchParams.get("orderReference") ||
      url.searchParams.get("OrderID") ||
      url.searchParams.get("orderid") ||
      url.searchParams.get("OrderId");
    if (!reference) return;
    setStatusUpdate("updating");
    fetch(`/api/checkout/success?reference=${encodeURIComponent(reference)}`, { method: "POST" })
      .then(() => setStatusUpdate("updated"))
      .catch((err) => {
        console.error("Failed to mark order as paid", err);
        setStatusUpdate("error");
      });
  }, [statusUpdate]);

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
    } catch {
      parsedOrder = null;
    }

    const send = async () => {
      try {
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

        try {
          await fetch("/api/orders/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: cached,
          });
        } catch (notifyError) {
          console.error("Order notification failed", notifyError);
        }
      } catch (error) {
        console.error("Order logging failed", error);
      } finally {
        sessionStorage.removeItem("pendingOrder");
      }
    };

    send();
  }, []);

  // Lightweight debug helper (opt-in via ?debug=1) to surface data in production.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const debugFlag = url.searchParams.get("debug");
    if (!debugFlag || debugFlag === "0") return;

    const reference =
      url.searchParams.get("reference") ||
      url.searchParams.get("orderReference") ||
      url.searchParams.get("OrderID") ||
      url.searchParams.get("orderid") ||
      url.searchParams.get("OrderId") ||
      "(missing)";

    const pendingRaw = sessionStorage.getItem("pendingOrder");
    let pendingEmail: string | undefined;
    let pendingAmount: number | undefined;
    try {
      const parsed = pendingRaw ? JSON.parse(pendingRaw) : null;
      pendingEmail = parsed?.customer?.email;
      pendingAmount = parsed?.totalAmount ?? parsed?.amount;
    } catch {
      pendingEmail = undefined;
      pendingAmount = undefined;
    }

    const summary = [
      `Reference: ${reference}`,
      `Status update: ${statusUpdate}`,
      pendingEmail ? `Customer email: ${pendingEmail}` : null,
      pendingAmount ? `Amount: ${pendingAmount}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    console.info("[checkout-success-debug]", summary);
      try {
        window.alert(summary);
      } catch {
        /* ignore */
      }
  }, [statusUpdate]);

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
          <div className="flex justify-center">
            <Link
              href="/home"
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
