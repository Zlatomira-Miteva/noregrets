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
  deliveryLabel: string;
  items: unknown;
  totalAmount: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "PAID" | "FAILED" | "CANCELLED";
  createdAt: string;
};

type OrderItem = { name?: string; quantity?: number; price?: number };

type DaySummary = {
  date: string;
  orders: Array<AdminOrder & { itemsParsed: OrderItem[]; totalItems: number }>;
  totals: { orders: number; items: number; amount: number };
  products: Record<string, { quantity: number; amount: number }>;
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

const parseItems = (items: unknown): OrderItem[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (typeof item !== "object" || !item) return {};
    const typed = item as OrderItem;
    return {
      name: typed.name,
      quantity: typeof typed.quantity === "number" ? typed.quantity : undefined,
      price: typeof typed.price === "number" ? typed.price : undefined,
    };
  });
};

const formatDate = (value: string) =>
  new Date(`${value}T12:00:00Z`).toLocaleDateString("bg-BG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const ALLOWED_STATUSES: AdminOrder["status"][] = ["PAID"];

export default function OrdersSummaryPage() {
  const { status } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/orders");
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Неуспешно зареждане на поръчките.");
      }
      setOrders((payload.orders ?? []) as AdminOrder[]);
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
      orders.map((order) => {
        const itemsParsed = parseItems(order.items);
        const totalItems = itemsParsed.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
        return { ...order, itemsParsed, totalItems };
      }),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00Z`).getTime() : null;
    const end = endDate ? new Date(`${endDate}T23:59:59.999Z`).getTime() : null;

    return ordersWithItems.filter((order) => {
      const created = new Date(order.createdAt).getTime();
      if (Number.isNaN(created)) return false;
      if (!ALLOWED_STATUSES.includes(order.status)) return false;
      if (start && created < start) return false;
      if (end && created > end) return false;
      return true;
    });
  }, [endDate, ordersWithItems, startDate]);

  const totals = useMemo(() => {
    let ordersCount = 0;
    let items = 0;
    let amount = 0;
    filteredOrders.forEach((order) => {
      ordersCount += 1;
      items += order.totalItems;
      amount += Number(order.totalAmount ?? 0);
    });
    return { ordersCount, items, amount };
  }, [filteredOrders]);

  const daySummaries = useMemo<DaySummary[]>(() => {
    const map = new Map<string, DaySummary>();

    filteredOrders.forEach((order) => {
      const dayKey = new Date(order.createdAt).toISOString().slice(0, 10);
      const existing =
        map.get(dayKey) ??
        ({
          date: dayKey,
          orders: [],
          totals: { orders: 0, items: 0, amount: 0 },
          products: {},
        } satisfies DaySummary);

      const orderAmount = Number(order.totalAmount ?? 0);
      existing.orders.push(order);
      existing.totals.orders += 1;
      existing.totals.items += order.totalItems;
      existing.totals.amount += orderAmount;

      order.itemsParsed.forEach((item) => {
        const label = item.name || "Артикул";
        const quantity = Number(item.quantity ?? 0);
        const lineAmount = (item.price ?? 0) * quantity;
        const productSummary = existing.products[label] ?? { quantity: 0, amount: 0 };
        productSummary.quantity += quantity;
        productSummary.amount += lineAmount;
        existing.products[label] = productSummary;
      });

      map.set(dayKey, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredOrders]);

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

  return (
    <div className="min-h-screen bg-[#ffefed] px-[clamp(1rem,4vw,4rem)] py-16 text-[#5f000b]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="space-y-3 text-center">
          <p className="text-sm uppercase">Админ панел</p>
          <h1 className="text-4xl font-semibold">Обобщение по дни</h1>
          <p>Виж поръчките ден по ден и колко артикула трябва да приготвиш.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/admin"
              className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase hover:bg-white/40"
            >
              Начало
            </Link>
            <Link
              href="/admin/orders"
              className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase hover:bg-white/40"
            >
              Всички поръчки
            </Link>
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
        </header>

        <section className="rounded-3xl bg-white/90 p-6 shadow-card">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Общ поглед</h2>
              <p className="text-sm text-[#5f000b]/80">Филтър по дата и ключови метрики (само платени).</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs uppercase text-[#5f000b]/70">
                От
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="ml-2 rounded-full border border-[#dcb1b1] bg-white px-3 py-1 text-sm focus:border-[#5f000b] focus:outline-none"
                />
              </label>
              <label className="text-xs uppercase text-[#5f000b]/70">
                До
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="ml-2 rounded-full border border-[#dcb1b1] bg-white px-3 py-1 text-sm focus:border-[#5f000b] focus:outline-none"
                />
              </label>
              <button
                type="button"
                onClick={loadOrders}
                className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase hover:bg-[#5f000b] hover:text-white disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Зареждам..." : "Обнови"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#f5d5d6] bg-white p-4 shadow-sm">
              <p className="text-xs uppercase text-[#5f000b]/70">Поръчки</p>
              <p className="text-3xl font-semibold">{totals.ordersCount}</p>
              <p className="text-sm text-[#5f000b]/70">в избрания период</p>
            </div>
            <div className="rounded-2xl border border-[#f5d5d6] bg-white p-4 shadow-sm">
              <p className="text-xs uppercase text-[#5f000b]/70">Общо артикули</p>
              <p className="text-3xl font-semibold">{totals.items}</p>
              <p className="text-sm text-[#5f000b]/70">бр. за приготвяне</p>
            </div>
            <div className="rounded-2xl border border-[#f5d5d6] bg-white p-4 shadow-sm">
              <p className="text-xs uppercase text-[#5f000b]/70">Оборот</p>
              <p className="text-3xl font-semibold">{formatPrice(totals.amount)}</p>
              <p className="text-sm text-[#5f000b]/70">сума от поръчки</p>
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-3xl bg-white/90 p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">По дни</h2>
            <p className="text-sm text-[#5f000b]/70">
              Групирани по дата на създаване на поръчката.
            </p>
          </div>

          {daySummaries.length === 0 ? (
            <p className="text-sm text-[#5f000b]/80">Няма поръчки за избрания период.</p>
          ) : (
            <div className="space-y-6">
              {daySummaries.map((day) => (
                <div key={day.date} className="rounded-2xl border border-[#f5d5d6] bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f5d5d6] pb-3">
                    <div>
                      <p className="text-xs uppercase text-[#5f000b]/70">Дата</p>
                      <p className="text-xl font-semibold">{formatDate(day.date)}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="rounded-full bg-[#5f000b]/10 px-3 py-1 font-semibold text-[#5f000b]">
                        {day.totals.orders} поръчки
                      </span>
                      <span className="rounded-full bg-[#5f000b]/10 px-3 py-1 font-semibold text-[#5f000b]">
                        {day.totals.items} артикула
                      </span>
                      <span className="rounded-full bg-[#5f000b]/10 px-3 py-1 font-semibold text-[#5f000b]">
                        {formatPrice(day.totals.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <p className="text-sm uppercase text-[#5f000b]/70">Артикули за приготвяне</p>
                      <div className="overflow-hidden rounded-xl border border-[#f5d5d6]">
                        <table className="w-full text-sm">
                          <thead className="bg-[#ffefed] text-xs uppercase text-[#5f000b]/70">
                            <tr>
                              <th className="px-3 py-2 text-left">Продукт</th>
                              <th className="px-3 py-2 text-right">Количество</th>
                              <th className="px-3 py-2 text-right">Сума</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(day.products).length === 0 ? (
                              <tr>
                                <td colSpan={3} className="px-3 py-2 text-center text-[#5f000b]/70">
                                  Няма артикули за този ден.
                                </td>
                              </tr>
                            ) : (
                              Object.entries(day.products).map(([name, info]) => (
                                <tr key={name} className="border-t border-[#f5d5d6]">
                                  <td className="px-3 py-2 font-semibold">{name}</td>
                                  <td className="px-3 py-2 text-right">{info.quantity}</td>
                                  <td className="px-3 py-2 text-right">{formatPrice(info.amount)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm uppercase text-[#5f000b]/70">Поръчки в този ден</p>
                      <div className="space-y-3">
                        {day.orders.map((order) => (
                          <div
                            key={order.id}
                            className="rounded-xl border border-[#f5d5d6] bg-white px-3 py-2 shadow-sm"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="space-y-1">
                                <p className="text-xs uppercase text-[#5f000b]/70">Поръчка</p>
                                <p className="text-sm font-semibold">{order.reference}</p>
                                <p className="text-xs text-[#5f000b]/70">
                                  {order.customerName || "Клиент"} • {order.deliveryLabel || "Доставка"}
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[order.status]}`}
                              >
                                {statusLabels[order.status]}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-[#5f000b]/80">
                              <span>{order.totalItems} бр.</span>
                              <span>{formatPrice(order.totalAmount)}</span>
                              <span className="text-xs">
                                {new Date(order.createdAt).toLocaleTimeString("bg-BG", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
