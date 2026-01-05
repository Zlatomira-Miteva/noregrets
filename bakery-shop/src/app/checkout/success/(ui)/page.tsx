"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/price";

export default function CheckoutSuccessPage() {
  const [statusUpdate, setStatusUpdate] = useState<"idle" | "updating" | "updated" | "error">("idle");
  const [summary, setSummary] = useState<{
    reference: string;
    totalAmount: number;
    items: Array<{ name: string; quantity: number; total: number }>;
  } | null>(null);
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
      .then(() => {
        setStatusUpdate("updated");
        return fetch(`/api/orders/summary?reference=${encodeURIComponent(reference)}`).then((res) => res.json());
      })
      .then((data) => {
        if (data?.reference) {
          setSummary({
            reference: data.reference,
            totalAmount: Number(data.totalAmount ?? 0),
            items: Array.isArray(data.items) ? data.items : [],
          });
        }
      })
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
      customer?: {
        email?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        phone?: string | null;
      };
      consents?: { marketing?: boolean };
      deliveryLabel?: string | null;
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
        const alreadyCaptured = sessionStorage.getItem("newsletterCaptured") === "1";
        if (wantsMarketing && email && !alreadyCaptured) {
          try {
            await fetch("/api/newsletter", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                firstName: parsedOrder?.customer?.firstName ?? "",
                lastName: parsedOrder?.customer?.lastName ?? "",
                phone: parsedOrder?.customer?.phone ?? "",
                address: parsedOrder?.deliveryLabel ?? "",
                honeypot: "",
              }),
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
        sessionStorage.removeItem("newsletterCaptured");
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

  const totalFormatted = useMemo(() => (summary ? formatPrice(summary.totalAmount) : null), [summary]);

  return (
    <div className="relative z-[9999] flex min-h-screen flex-col bg-[#fff6f1] pointer-events-auto">
      <div className="pointer-events-auto">
        <SiteHeader />
      </div>
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center pointer-events-auto">
        <div className="max-w-xl space-y-6 rounded-3xl bg-white p-10 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Плащането е успешно</p>
          <h1 className="text-4xl font-semibold text-[#5f000b]">Благодарим ви!</h1>
          <p className="text-lg text-[#5f000b]/80">
            Получихме вашата поръчка и започваме да я подготвяме. Ще ви изпратим потвърждение по имейл с всички детайли.
          </p>
          {summary ? (
            <div className="space-y-2 rounded-2xl bg-[#fff6f1] p-4 text-left text-sm text-[#5f000b]">
              <p className="font-semibold">Номер на поръчка: {summary.reference}</p>
              {totalFormatted ? <p>Обща сума: {totalFormatted}</p> : null}
              {summary.items?.length ? (
                <ul className="mt-2 space-y-1">
                  {summary.items.map((item, idx) => (
                    <li key={`${item.name}-${idx}`} className="flex justify-between text-[#5f000b]/80">
                      <span>{item.name} × {item.quantity}</span>
                      <span>{formatPrice(item.total ?? 0)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
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
