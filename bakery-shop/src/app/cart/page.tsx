"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/price";
import Marquee from "@/components/Marquee";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import CookieBoxHero from "@/app/cookie-box-hero.jpg";

const FREE_SHIPPING_THRESHOLD = 150;

const CartPage = () => {
  const { items, totalPrice, clearCart, removeItem, updateQuantity } = useCart();
  const [reachMessage, setReachMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [shippingType, setShippingType] = useState<"office" | "address">("office");
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedOffice, setSelectedOffice] = useState<string>("");
  const [addressInfo, setAddressInfo] = useState({ city: "", street: "", number: "", details: "" });
  const [cities, setCities] = useState<Array<{ id: string; referenceId: string; name: string }>>([]);
  const [offices, setOffices] = useState<Array<{ id: string; name: string; address?: string }>>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [officesLoading, setOfficesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState<string | null>(null);
  const [officesError, setOfficesError] = useState<string | null>(null);

  useEffect(() => {
    if (totalPrice >= FREE_SHIPPING_THRESHOLD) {
      setReachMessage("Поздравления! Вие получавате безплатна доставка.");
    } else {
      const remaining = FREE_SHIPPING_THRESHOLD - totalPrice;
      setReachMessage(`Добавете още ${formatPrice(remaining)} за безплатна доставка.`);
    }
  }, [totalPrice]);

  useEffect(() => {
    if (cities.length > 0 || citiesLoading) {
      return;
    }
    setCitiesLoading(true);
    fetch("/api/econt/cities")
      .then((response) => response.json())
      .then((data) => {
        setCities(data.cities ?? []);
        setCitiesError(data.fallback ? data.message ?? null : null);
      })
      .catch(() => setCitiesError("Неуспешно зареждане на градовете."))
      .finally(() => setCitiesLoading(false));
  }, [cities.length, citiesLoading]);

  useEffect(() => {
    if (shippingType !== "office") {
      setSelectedCityId("");
      setSelectedOffice("");
      setOffices([]);
      return;
    }
    if (!selectedCityId) {
      setOffices([]);
      setSelectedOffice("");
      return;
    }
    setOfficesLoading(true);
    const query = new URLSearchParams({ cityId: selectedCityId }).toString();
    fetch(`/api/econt/offices?${query}`)
      .then((response) => response.json())
      .then((data) => {
        setOffices(data.offices ?? []);
        setOfficesError(data.fallback ? data.message ?? null : null);
        setSelectedOffice("");
      })
      .catch(() => setOfficesError("Неуспешно зареждане на офисите."))
      .finally(() => setOfficesLoading(false));
  }, [shippingType, selectedCityId]);

  console.log({offices})
  return (
    <div className="flex min-h-screen flex-col bg-[#fcd9d9] text-[#2f1b16]">
      <Marquee />
      <SiteHeader />

      <main className="flex-1 bg-[#f7c8cf] py-16">
        <div className="mx-auto w-full max-w-5xl px-[clamp(1rem,4vw,4rem)]">
        <div className="space-y-4 text-center text-[#2f1b16]">
          <h1 className="text-4xl font-semibold sm:text-5xl">Вашата количка</h1>
          {reachMessage ? (
            <div className="mx-auto w-full max-w-xl space-y-3">
              <p className="text-sm text-[#8c4a2f]/80">{reachMessage}</p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/60">
                <div
                  className="h-full rounded-full bg-[#2f1b16] transition-all"
                  style={{ width: `${Math.min(100, (totalPrice / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>

        {items.length === 0 ? (
          <div className="mt-10 flex justify-center">
            <Link
              href="/"
              className="rounded-full bg-[#2f1b16] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#561c19]"
            >
              Към продуктите
            </Link>
          </div>
        ) : (
          <div className="mt-16 space-y-8">
            <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 text-left text-sm font-semibold uppercase tracking-[0.2em] text-[#2f1b16] sm:grid">
              <span>Продукт</span>
              <span>Цена</span>
              <span>Количество</span>
              <span>Общо</span>
            </div>

            <ul className="space-y-6">
              {items.map((item) => (
                <li
                  key={item.key}
                  className="grid gap-6 rounded-3xl bg-white p-6 text-sm text-[#2f1b16] shadow-card sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-center"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative hidden h-20 w-20 overflow-hidden rounded-2xl bg-[#fde9ec] sm:block">
                      <Image src={CookieBoxHero} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-lg font-semibold">{item.name}</h2>
                      {item.options && item.options.length > 0 ? (
                        <ul className="space-y-1 text-xs text-[#8c4a2f]/80">
                          {item.options.map((option) => (
                            <li key={`${item.key}-${option}`}>{option}</li>
                          ))}
                        </ul>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9d0012] underline"
                      >
                        Премахни
                      </button>
                    </div>
                  </div>

                  <div className="hidden text-base font-semibold text-[#2f1b16] sm:block">
                    {formatPrice(item.price)}
                  </div>

                  <div className="flex items-center justify-start sm:justify-center">
                    <div className="flex items-center gap-3 rounded-full bg-[#fde9ec] p-3">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f1b8c4] text-lg font-semibold text-[#9d0012] transition hover:bg-white"
                      >
                        –
                      </button>
                      <span className="flex h-10 min-w-[3rem] items-center justify-center rounded-full border border-[#f1b8c4] bg-white text-base font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f1b8c4] bg-white text-lg font-semibold text-[#9d0012] transition hover:bg-[#fce3e7]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-base font-semibold text-[#9d0012]">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-6 rounded-3xl bg-white p-6 text-sm text-[#2f1b16] shadow-card">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Метод на плащане</h2>
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                  <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${paymentMethod === "cod" ? "border-[#9d0012] ring-2 ring-[#9d0012]" : "border-[#f4b9c2]"}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="h-4 w-4 border-[#f4b9c2] text-[#9d0012] focus:ring-[#9d0012]"
                    />
                    <span className="text-sm">Плащане при доставка</span>
                  </label>
                  <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${paymentMethod === "online" ? "border-[#9d0012] ring-2 ring-[#9d0012]" : "border-[#f4b9c2]"}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={paymentMethod === "online"}
                      onChange={() => setPaymentMethod("online")}
                      className="h-4 w-4 border-[#f4b9c2] text-[#9d0012] focus:ring-[#9d0012]"
                    />
                    <span className="text-sm">Онлайн плащане (myPOS)</span>
                  </label>
                </div>
                {paymentMethod === "online" ? (
                  <p className="text-xs text-[#8c4a2f]/80">
                    При финализиране ще ви пренасочим към защитена myPOS страница за плащане.
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Доставка</h2>
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                  <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${shippingType === "office" ? "border-[#9d0012] ring-2 ring-[#9d0012]" : "border-[#f4b9c2]"}`}>
                    <input
                      type="radio"
                      name="shipping"
                      value="office"
                      checked={shippingType === "office"}
                      onChange={() => setShippingType("office")}
                      className="h-4 w-4 border-[#f4b9c2] text-[#9d0012] focus:ring-[#9d0012]"
                    />
                    <span className="text-sm">Доставка до офис на Econt</span>
                  </label>
                  <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${shippingType === "address" ? "border-[#9d0012] ring-2 ring-[#9d0012]" : "border-[#f4b9c2]"}`}>
                    <input
                      type="radio"
                      name="shipping"
                      value="address"
                      checked={shippingType === "address"}
                      onChange={() => setShippingType("address")}
                      className="h-4 w-4 border-[#f4b9c2] text-[#9d0012] focus:ring-[#9d0012]"
                    />
                    <span className="text-sm">Доставка до адрес</span>
                  </label>
                </div>

                {shippingType === "office" ? (
                  <div className="space-y-4">
                    <label className="block text-xs uppercase tracking-[0.2em] text-[#8c4a2f]/70">
                      Град (Econt)
                      <select
                        className="mt-1 w-full rounded-2xl border border-[#f4b9c2] bg-white px-4 py-3 text-sm text-[#2f1b16] focus:border-[#9d0012] focus:outline-none"
                        value={selectedCityId}
                        onChange={(event) => setSelectedCityId(event.target.value)}
                        disabled={citiesLoading}
                      >
                        <option value="">Изберете град…</option>
                        {cities.map((city) => (
                          <option key={city.referenceId} value={city.referenceId}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    {citiesLoading ? (
                      <p className="text-xs text-[#8c4a2f]/70">Зареждаме списък с градове…</p>
                    ) : citiesError ? (
                      <p className="text-xs text-[#9d0012]">{citiesError}</p>
                    ) : null}

                    {selectedCityId ? (
                      <label className="block text-xs uppercase tracking-[0.2em] text-[#8c4a2f]/70">
                        Изберете офис на Econt
                        <select
                          className="mt-1 w-full rounded-2xl border border-[#f4b9c2] bg-white px-4 py-3 text-sm text-[#2f1b16] focus:border-[#9d0012] focus:outline-none"
                          value={selectedOffice}
                          onChange={(event) => setSelectedOffice(event.target.value)}
                          disabled={officesLoading}
                        >
                          <option value="">Изберете офис…</option>
                          {offices.map((office) => (
                            <option key={office.id} value={office.id}>
                              {office.name}
                              {office.address ? ` — ${office.address}` : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    {officesLoading ? (
                      <p className="text-xs text-[#8c4a2f]/70">Зареждаме офисите…</p>
                    ) : officesError ? (
                      <p className="text-xs text-[#9d0012]">{officesError}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-xs uppercase tracking-[0.2em] text-[#8c4a2f]/70">
                      Град
                      <input
                        type="text"
                        value={addressInfo.city}
                        onChange={(event) => setAddressInfo((prev) => ({ ...prev, city: event.target.value }))}
                        className="w-full rounded-2xl border border-[#f4b9c2] bg-white px-4 py-3 text-sm text-[#2f1b16] focus:border-[#9d0012] focus:outline-none"
                        placeholder="Напр. София"
                      />
                    </label>
                    <label className="space-y-1 text-xs uppercase tracking-[0.2em] text-[#8c4a2f]/70">
                      Улица
                      <input
                        type="text"
                        value={addressInfo.street}
                        onChange={(event) => setAddressInfo((prev) => ({ ...prev, street: event.target.value }))}
                        className="w-full rounded-2xl border border-[#f4b9c2] bg-white px-4 py-3 text-sm text-[#2f1b16] focus:border-[#9d0012] focus:outline-none"
                        placeholder="Улица"
                      />
                    </label>
                    <label className="space-y-1 text-xs uppercase tracking-[0.2em] text-[#8c4a2f]/70">
                      Номер
                      <input
                        type="text"
                        value={addressInfo.number}
                        onChange={(event) => setAddressInfo((prev) => ({ ...prev, number: event.target.value }))}
                        className="w-full rounded-2xl border border-[#f4b9c2] bg-white px-4 py-3 text-sm text-[#2f1b16] focus:border-[#9d0012] focus:outline-none"
                        placeholder="№"
                      />
                    </label>
                    <label className="space-y-1 text-xs uppercase tracking-[0.2em] text-[#8c4a2f]/70 sm:col-span-2">
                      Допълнителни указания
                      <textarea
                        value={addressInfo.details}
                        onChange={(event) => setAddressInfo((prev) => ({ ...prev, details: event.target.value }))}
                        className="w-full rounded-2xl border border-[#f4b9c2] bg-white px-4 py-3 text-sm text-[#2f1b16] focus:border-[#9d0012] focus:outline-none"
                        rows={3}
                        placeholder="Етаж, вход, домофон и др."
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-6 text-[#2f1b16] shadow-card sm:flex-row sm:justify-between">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-sm uppercase tracking-[0.3em] text-[#9d0012]/70">Общо</p>
                <p className="text-2xl font-semibold text-[#9d0012]">
                  {formatPrice(totalPrice)}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={clearCart}
                  className="rounded-full border border-[#f4b9c2] px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#9d0012] transition hover:bg-[#fde4e8]"
                >
                  Изчисти количката
                </button>
                <button
                  type="button"
                  className="rounded-full bg-[#2f1b16] px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#561c19]"
                >
                  Поръчай
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default CartPage;
