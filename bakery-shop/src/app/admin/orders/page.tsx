"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { formatPrice } from "@/utils/price";

type AdminOrder = {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryLabel: string;
  items: unknown;
  totalAmount: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "PAID" | "FAILED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
};

type OrderDraft = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryLabel: string;
  totalAmount: string;
  status: AdminOrder["status"];
};

const statusLabels: Record<AdminOrder["status"], string> = {
  PENDING: "Чака плащане",
  IN_PROGRESS: "В процес",
  COMPLETED: "Завършена",
  PAID: "Платена",
  FAILED: "Неуспешна",
  CANCELLED: "Отказана",
};

const statusClasses: Record<AdminOrder["status"], string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-50 text-green-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-200 text-gray-700",
};

const parseItems = (items: unknown): Array<{ name?: string; quantity?: number; price?: number }> => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (typeof item !== "object" || !item) return {};
    const typed = item as { name?: string; quantity?: number; price?: number };
    return {
      name: typed.name,
      quantity: typeof typed.quantity === "number" ? typed.quantity : undefined,
      price: typeof typed.price === "number" ? typed.price : undefined,
    };
  });
};

export default function AdminOrdersPage() {
  const { status } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [drafts, setDrafts] = useState<Record<string, OrderDraft>>({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [testMailStatus, setTestMailStatus] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/orders");
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Неуспешно зареждане на поръчките.");
      }
      const list = (payload.orders ?? []) as AdminOrder[];
      setOrders(list);
      const nextDrafts: Record<string, OrderDraft> = {};
      list.forEach((order) => {
        nextDrafts[order.id] = {
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          deliveryLabel: order.deliveryLabel,
          totalAmount: order.totalAmount.toString(),
          status: order.status,
        };
      });
      setDrafts(nextDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неуспешно зареждане.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/admin/login");
    }
  }, [router, status]);

  const ordersWithItems = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        itemsParsed: parseItems(order.items),
      })),
    [orders],
  );

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ffefed] text-[#5f000b]">
        <p>Зареждаме...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const handleFieldChange = (orderId: string, field: keyof OrderDraft, value: string) => {
    setDrafts((prev) => ({ ...prev, [orderId]: { ...prev[orderId], [field]: value } }));
  };

  const submitUpdate = async (orderId: string, overrides?: Partial<OrderDraft>) => {
    const draft = drafts[orderId];
    if (!draft) return;
    const payload: Record<string, unknown> = {
      ...draft,
      ...overrides,
      totalAmount: Number((overrides?.totalAmount ?? draft.totalAmount).toString().replace(",", ".")),
    };

    setSavingId(orderId);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Неуспешно обновяване.");
      }
      const updated = data.order as AdminOrder;
      setOrders((prev) => prev.map((order) => (order.id === updated.id ? updated : order)));
      setDrafts((prev) => ({
        ...prev,
        [updated.id]: {
          customerName: updated.customerName,
          customerEmail: updated.customerEmail,
          customerPhone: updated.customerPhone,
          deliveryLabel: updated.deliveryLabel,
          totalAmount: updated.totalAmount.toString(),
          status: updated.status,
        },
      }));
      setMessage("Поръчката е обновена.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Грешка при запазване.");
    } finally {
      setSavingId(null);
    }
  };

  const cancelOrder = (orderId: string) => submitUpdate(orderId, { status: "CANCELLED" });

  const sendTestNotification = async () => {
    setTestMailStatus("Изпращаме тестов имейл…");
    try {
      const response = await fetch("/api/orders/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: "TEST-NOTIFY",
          totalAmount: 0,
          deliveryLabel: "Тестов имейл от админ",
          customer: { firstName: "Admin", lastName: "Test", email: "test@example.com", phone: "" },
          items: [],
          totalQuantity: 0,
          createdAt: new Date().toISOString(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "Неуспешно изпращане.");
      }
      setTestMailStatus("Тестовият имейл е изпратен (провери inbox).");
    } catch (err) {
      setTestMailStatus(err instanceof Error ? err.message : "Неуспешно изпращане.");
    }
  };

  return (
    <div className="min-h-screen bg-[#ffefed] px-[clamp(1rem,4vw,4rem)] py-16 text-[#5f000b]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="space-y-3 text-center">
          <p className="text-sm uppercase">Админ панел</p>
          <h1 className="text-4xl font-semibold">Поръчки</h1>
          <p>Преглед, промяна на статус и отказване на поръчки.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/admin/products"
              className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase hover:bg-white/40"
            >
              Категории и продукти
            </Link>
            <Link
              href="/admin/coupons"
              className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase hover:bg-white/40"
            >
              Промо кодове
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase hover:bg-white/40"
            >
              Изход
            </button>
          </div>
          {error ? <p className="text-sm text-[#b42318]">{error}</p> : null}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
        </header>

        <section className="rounded-3xl bg-white/90 p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">Всички поръчки</h2>
            <button
              type="button"
              onClick={loadOrders}
              className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase hover:bg-[#5f000b] hover:text-white disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Зареждам..." : "Обнови"}
            </button>
            <button
              type="button"
              onClick={sendTestNotification}
              className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase hover:bg-white/60 disabled:opacity-60"
              disabled={loading}
            >
              Изпрати тестов имейл
            </button>
          </div>
          {testMailStatus ? <p className="text-sm text-[#5f000b]">{testMailStatus}</p> : null}

          {ordersWithItems.length === 0 ? (
            <p>Няма намерени поръчки.</p>
          ) : (
            <div className="space-y-6">
              {ordersWithItems.map((order) => {
                const draft = drafts[order.id];
                return (
                  <div key={order.id} className="rounded-2xl border border-[#f5d5d6] bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f5d5d6] pb-3">
                      <div className="space-y-1">
                        <p className="text-xs uppercase text-[#5f000b]/70">Поръчка</p>
                        <p className="text-lg font-semibold">{order.reference}</p>
                        <p className="text-sm text-[#5f000b]/70">
                          Създадена: {new Date(order.createdAt).toLocaleString("bg-BG")}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <p className="text-sm uppercase text-[#5f000b]/70">Продукти</p>
                        <ul className="space-y-2">
                          {order.itemsParsed.length ? (
                            order.itemsParsed.map((item, idx) => (
                              <li key={`${order.id}-item-${idx}`} className="flex items-center justify-between text-sm">
                                <span>{item.name ?? "Артикул"}</span>
                                <span className="text-[#5f000b]/80">
                                  {item.quantity ? `${item.quantity} бр.` : null}{" "}
                                  {typeof item.price === "number" ? `× ${item.price.toFixed(2)} лв.` : ""}
                                </span>
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-[#5f000b]/70">Няма данни за продукти.</li>
                          )}
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm uppercase text-[#5f000b]/70">Данни за клиента</p>
                        <div className="grid gap-3">
                          <label className="text-xs uppercase">
                            Име
                            <input
                              type="text"
                              value={draft?.customerName ?? ""}
                              onChange={(event) =>
                                handleFieldChange(order.id, "customerName", event.target.value)
                              }
                              className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-3 py-2 text-sm focus:border-[#5f000b] focus:outline-none"
                            />
                          </label>
                          <label className="text-xs uppercase">
                            Имейл
                            <input
                              type="email"
                              value={draft?.customerEmail ?? ""}
                              onChange={(event) =>
                                handleFieldChange(order.id, "customerEmail", event.target.value)
                              }
                              className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-3 py-2 text-sm focus:border-[#5f000b] focus:outline-none"
                            />
                          </label>
                          <label className="text-xs uppercase">
                            Телефон
                            <input
                              type="text"
                              value={draft?.customerPhone ?? ""}
                              onChange={(event) =>
                                handleFieldChange(order.id, "customerPhone", event.target.value)
                              }
                              className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-3 py-2 text-sm focus:border-[#5f000b] focus:outline-none"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <label className="text-xs uppercase">
                        Адрес/Доставка
                        <textarea
                          value={draft?.deliveryLabel ?? ""}
                          onChange={(event) =>
                            handleFieldChange(order.id, "deliveryLabel", event.target.value)
                          }
                          className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-3 py-2 text-sm focus:border-[#5f000b] focus:outline-none"
                          rows={2}
                        />
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-xs uppercase">
                          Общо
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={draft?.totalAmount ?? ""}
                            onChange={(event) =>
                              handleFieldChange(order.id, "totalAmount", event.target.value)
                            }
                            className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-3 py-2 text-sm focus:border-[#5f000b] focus:outline-none"
                          />
                        </label>
                        <label className="text-xs uppercase">
                          Статус
                          <select
                            value={draft?.status ?? order.status}
                            onChange={(event) =>
                              handleFieldChange(order.id, "status", event.target.value as AdminOrder["status"])
                            }
                            className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-3 py-2 text-sm focus:border-[#5f000b] focus:outline-none"
                          >
                            <option value="PENDING">Чака плащане</option>
                            <option value="IN_PROGRESS">В процес</option>
                            <option value="COMPLETED">Завършена</option>
                            <option value="PAID">Платена</option>
                            <option value="FAILED">Неуспешна</option>
                            <option value="CANCELLED">Отказана</option>
                          </select>
                        </label>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f5d5d6] pt-3">
                      <p className="text-sm text-[#5f000b]/80">
                        Текущо: {formatPrice(order.totalAmount)} | Обновена:{" "}
                        {new Date(order.updatedAt).toLocaleString("bg-BG")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => cancelOrder(order.id)}
                          className="rounded-full border border-[#b42318] px-4 py-2 text-xs font-semibold uppercase text-[#b42318] transition hover:bg-[#b42318]/10 disabled:opacity-50"
                          disabled={savingId === order.id}
                        >
                          Откажи
                        </button>
                        <button
                          type="button"
                          onClick={() => submitUpdate(order.id)}
                          className="rounded-full bg-[#5f000b] px-5 py-2 text-xs font-semibold uppercase text-white transition hover:bg-[#781e21] disabled:opacity-60"
                          disabled={savingId === order.id}
                        >
                          {savingId === order.id ? "Запазваме..." : "Запази"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
