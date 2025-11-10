"use client";

import { FormEvent, useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Coupon = {
  id: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscountAmount: number | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
};

const defaultFormState = {
  code: "",
  discountType: "PERCENT" as "PERCENT" | "FIXED",
  discountValue: 10,
  minimumOrderAmount: 0,
  maximumDiscountAmount: "",
};

export default function CouponAdminPage() {
  const { status } = useSession();
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState(defaultFormState);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCoupons = () => {
    fetch("/api/coupons")
      .then((res) => {
        if (res.status === 401) {
          throw new Error("Неупълномощен достъп.");
        }
        return res.json();
      })
      .then((data) => setCoupons(data.coupons ?? []))
      .catch((err) => setError(err.message || "Неуспешно зареждане на купоните."));
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/admin/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5cec7] text-[#5f000b]">
        <p>Зареждаме...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setStatusMessage(null);
    setError(null);

    fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minimumOrderAmount: Number(form.minimumOrderAmount),
        maximumDiscountAmount: form.maximumDiscountAmount ? Number(form.maximumDiscountAmount) : null,
      }),
    })
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload.error ?? "Неуспешно създаване на купон.");
        }
        setStatusMessage("Купонът е създаден успешно.");
        setForm(defaultFormState);
        loadCoupons();
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-[#f5cec7] px-[clamp(1rem,4vw,4rem)] py-16 text-[#5f000b]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
        <header className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.35em]">Админ панел</p>
          <h1 className="text-4xl font-semibold">Управление на промо кодове</h1>
          <p>Създайте нов код за отстъпка. Всеки код е валиден 30 дни и може да бъде използван само веднъж.</p>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] hover:bg-white/40"
          >
            Изход
          </button>
        </header>

        <section className="rounded-3xl bg-white/90 p-6 shadow-card">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm uppercase tracking-[0.25em]">
              Код
              <input
                type="text"
                value={form.code}
                onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                required
              />
            </label>

            <label className="text-sm uppercase tracking-[0.25em]">
              Тип
              <select
                value={form.discountType}
                onChange={(event) => setForm((prev) => ({ ...prev, discountType: event.target.value as "PERCENT" | "FIXED" }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
              >
                <option value="PERCENT">Процент</option>
                <option value="FIXED">Фиксирана сума</option>
              </select>
            </label>

            <label className="text-sm uppercase tracking-[0.25em]">
              Стойност
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.discountValue}
                onChange={(event) => setForm((prev) => ({ ...prev, discountValue: Number(event.target.value) }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                required
              />
            </label>

            <label className="text-sm uppercase tracking-[0.25em]">
              Минимална сума
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.minimumOrderAmount}
                onChange={(event) => setForm((prev) => ({ ...prev, minimumOrderAmount: Number(event.target.value) }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
              />
            </label>

            <label className="text-sm uppercase tracking-[0.25em] sm:col-span-2">
              Максимална отстъпка
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.maximumDiscountAmount}
                onChange={(event) => setForm((prev) => ({ ...prev, maximumDiscountAmount: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                placeholder="По избор"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="sm:col-span-2 rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-[#561c19] disabled:opacity-60"
            >
              {loading ? "Създаваме..." : "Добави промо код"}
            </button>
          </form>
          {statusMessage ? <p className="mt-4 text-sm text-green-700">{statusMessage}</p> : null}
          {error ? <p className="mt-4 text-sm text-[#b42318]">{error}</p> : null}
        </section>

        <section className="rounded-3xl bg-white/90 p-6 shadow-card">
          <h2 className="text-2xl font-semibold">Списък с промо кодове</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.3em] text-[#5f000b]/70">
                  <th className="pb-2">Код</th>
                  <th className="pb-2">Тип</th>
                  <th className="pb-2">Стойност</th>
                  <th className="pb-2">Минимум</th>
                  <th className="pb-2">Макс. отстъпка</th>
                  <th className="pb-2">Валиден до</th>
                  <th className="pb-2">Статус</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-sm">
                      Няма създадени купони.
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-t border-[#efd5d0]">
                      <td className="py-2 font-semibold">{coupon.code}</td>
                      <td className="py-2">{coupon.discountType === "PERCENT" ? "Процент" : "Сума"}</td>
                      <td className="py-2">
                        {coupon.discountType === "PERCENT"
                          ? `${coupon.discountValue}%`
                          : `${Number(coupon.discountValue).toFixed(2)} лв`}
                      </td>
                      <td className="py-2">{Number(coupon.minimumOrderAmount ?? 0).toFixed(2)} лв</td>
                      <td className="py-2">
                        {coupon.maximumDiscountAmount !== null
                          ? `${Number(coupon.maximumDiscountAmount).toFixed(2)} лв`
                          : "-"}
                      </td>
                      <td className="py-2">
                        {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString("bg-BG") : "-"}
                      </td>
                      <td className="py-2">{coupon.isActive ? "Активен" : "Използван"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
