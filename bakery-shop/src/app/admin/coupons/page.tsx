"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { formatPrice } from "@/utils/price";

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

const defaultCouponForm = {
  code: "",
  discountType: "PERCENT",
  discountValue: "10",
  minimumOrderAmount: "0",
  maximumDiscountAmount: "",
  validFrom: "",
  validUntil: "",
};

export default function AdminCouponsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponForm, setCouponForm] = useState(defaultCouponForm);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const loadCoupons = () => {
    setCouponError(null);
    fetch("/api/coupons")
      .then((res) => {
        if (res.status === 401) {
          throw new Error("Неупълномощен достъп.");
        }
        return res.json();
      })
      .then((data) => setCoupons(data.coupons ?? []))
      .catch((err) => setCouponError(err.message || "Неуспешно зареждане на купоните."));
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/admin/login");
    }
  }, [router, status]);

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

  const handleCouponSubmit = (event: FormEvent) => {
    event.preventDefault();
    setCouponLoading(true);
    setCouponMessage(null);
    setCouponError(null);

    const discountValue = Number(couponForm.discountValue);
    const minimumAmount = Number(couponForm.minimumOrderAmount);
    const maximumAmount = couponForm.maximumDiscountAmount ? Number(couponForm.maximumDiscountAmount) : null;
    const validFrom = couponForm.validFrom || undefined;
    const validUntil = couponForm.validUntil || undefined;

    if (Number.isNaN(discountValue) || Number.isNaN(minimumAmount) || (maximumAmount !== null && Number.isNaN(maximumAmount))) {
      setCouponError("Моля, въведете валидни числа.");
      setCouponLoading(false);
      return;
    }

    fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: couponForm.code.trim(),
        discountType: couponForm.discountType as "PERCENT" | "FIXED",
        discountValue,
        minimumOrderAmount: minimumAmount,
        maximumDiscountAmount: maximumAmount,
        validFrom,
        validUntil,
      }),
    })
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload.error ?? "Неуспешно създаване на купон.");
        }
        setCouponMessage("Купонът е създаден успешно.");
        setCouponForm(defaultCouponForm);
        loadCoupons();
      })
      .catch((err: Error) => setCouponError(err.message))
      .finally(() => setCouponLoading(false));
  };

  return (
    <div className="min-h-screen bg-[#ffefed] px-[clamp(1rem,4vw,4rem)] py-16 text-[#5f000b]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <header className="space-y-3 text-center">
          <p className="text-sm uppercase">Админ панел</p>
          <h1 className="text-4xl font-semibold">Промо кодове</h1>
          <p>Добавяйте и следете активните промо кодове за No Regrets.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/admin/orders"
              className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase hover:bg-white/40"
            >
              Поръчки
            </Link>
            <Link
              href="/admin/products"
              className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase hover:bg-white/40"
            >
              Категории и продукти
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase hover:bg-white/40"
            >
              Изход
            </button>
          </div>
        </header>

        <section className="rounded-3xl bg-white/90 p-6 shadow-card">
          <h2 className="text-2xl font-semibold">Създай промо код</h2>
          <form onSubmit={handleCouponSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm uppercase">
              Код
              <input
                type="text"
                value={couponForm.code}
                onChange={(event) => setCouponForm((prev) => ({ ...prev, code: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                required
              />
            </label>

            <label className="text-sm uppercase">
              Тип
              <select
                value={couponForm.discountType}
                onChange={(event) => setCouponForm((prev) => ({ ...prev, discountType: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
              >
                <option value="PERCENT">Процент</option>
                <option value="FIXED">Фиксирана сума</option>
              </select>
            </label>

            <label className="text-sm uppercase">
              Стойност
              <input
                type="number"
                min={0}
                step={0.01}
                value={couponForm.discountValue}
                onChange={(event) => setCouponForm((prev) => ({ ...prev, discountValue: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                required
              />
            </label>

            <label className="text-sm uppercase">
              Минимална сума
              <input
                type="number"
                min={0}
                step={0.01}
                value={couponForm.minimumOrderAmount}
                onChange={(event) => setCouponForm((prev) => ({ ...prev, minimumOrderAmount: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
              />
            </label>

            <label className="text-sm uppercase sm:col-span-2">
              Максимална отстъпка
              <input
                type="number"
                min={0}
                step={0.01}
                value={couponForm.maximumDiscountAmount}
                onChange={(event) => setCouponForm((prev) => ({ ...prev, maximumDiscountAmount: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                placeholder="По избор"
              />
            </label>

            <label className="text-sm uppercase">
              Валиден от
              <input
                type="date"
                value={couponForm.validFrom}
                onChange={(event) => setCouponForm((prev) => ({ ...prev, validFrom: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
              />
            </label>

            <label className="text-sm uppercase">
              Валиден до
              <input
                type="date"
                value={couponForm.validUntil}
                onChange={(event) => setCouponForm((prev) => ({ ...prev, validUntil: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={couponLoading}
              className="sm:col-span-2 rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#561c19] disabled:opacity-60"
            >
              {couponLoading ? "Създаваме..." : "Добави промо код"}
            </button>
          </form>
          {couponMessage ? <p className="mt-4 text-sm text-green-700">{couponMessage}</p> : null}
          {couponError ? <p className="mt-4 text-sm text-[#b42318]">{couponError}</p> : null}
        </section>

        <section className="rounded-3xl bg-white/90 p-6 shadow-card">
          <h2 className="text-2xl font-semibold">Списък с промо кодове</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-[#5f000b]/70">
                  <th className="pb-2">Код</th>
                  <th className="pb-2">Тип</th>
                  <th className="pb-2">Стойност</th>
                  <th className="pb-2">Минимум</th>
                  <th className="pb-2">Валидност</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr>
                    <td className="py-4 text-center text-sm text-[#5f000b]/70" colSpan={5}>
                      Все още няма добавени промо кодове.
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-t border-[#f5d5d6]">
                      <td className="py-2 font-semibold">{coupon.code}</td>
                      <td className="py-2">{coupon.discountType === "PERCENT" ? "%" : "лв"}</td>
                      <td className="py-2">
                        {coupon.discountType === "PERCENT"
                          ? `${coupon.discountValue}%`
                          : formatPrice(coupon.discountValue)}
                      </td>
                      <td className="py-2">{formatPrice(coupon.minimumOrderAmount)}</td>
                      <td className="py-2 text-sm text-[#5f000b]/70">
                        {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString("bg-BG") : "—"}
                      </td>
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
