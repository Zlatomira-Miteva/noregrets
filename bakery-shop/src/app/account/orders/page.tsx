"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { formatPrice } from "@/utils/price";
import { useCart } from "@/context/CartContext";

type Order = {
  id: string;
  reference: string;
  totalAmount: number;
  status: string;
  deliveryLabel?: string;
  items?: { name: string; quantity: number; price?: number; options?: string[] }[];
  createdAt: string;
};

export default function AccountOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addItem } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/account/login?callbackUrl=/account/orders");
    }
  }, [status, router]);

  useEffect(() => {
    const load = async () => {
      if (!session?.user) return;
      setLoading(true);
      const res = await fetch("/api/account/orders");
      const data = await res.json();
      setOrders(data.orders ?? []);
      setLoading(false);
    };
    load();
  }, [session]);

  const handleReorder = async (orderId: string) => {
    const res = await fetch("/api/account/orders/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    if (!res.ok) {
      return;
    }
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items.forEach((it: any) => {
      addItem({
        productId: it.productId ?? it.name,
        name: it.name,
        price: Number(it.price ?? 0),
        quantity: Number(it.qty ?? it.quantity ?? 1),
        options: Array.isArray(it.options) ? it.options : [],
        image: it.image,
      });
    });
    router.push("/cart");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#ffefed] text-[#5f000b]">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-4 py-12">
        <div className="w-full max-w-5xl space-y-6 rounded-3xl bg-white p-8 shadow-card">
          <h1 className="text-2xl font-semibold">Моите поръчки</h1>
          {loading ? (
            <p>Зарежда...</p>
          ) : orders.length === 0 ? (
            <p className="text-[#5f000b]/80">Нямаш поръчки все още.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-[#e4c8c8] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-[#5f000b]/70">Референция</p>
                      <p className="font-semibold">{order.reference}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#5f000b]/70">Статус</p>
                      <p className="font-semibold">{order.status}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-[#5f000b]/80">
                    <p>Създадена: {new Date(order.createdAt).toLocaleString("bg-BG")}</p>
                    {order.deliveryLabel ? <p>Доставка/вземане: {order.deliveryLabel}</p> : null}
                  </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-semibold">{formatPrice(order.totalAmount)}</p>
                  <button
                    type="button"
                    onClick={() => handleReorder(order.id)}
                    className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase text-[#5f000b] transition hover:bg-[#5f000b] hover:text-white"
                  >
                    Поръчай пак
                  </button>
                </div>
                  {Array.isArray(order.items) ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#5f000b]/80">
                      {order.items.map((it, idx) => (
                        <li key={idx}>
                          {it.name} x {it.quantity}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
