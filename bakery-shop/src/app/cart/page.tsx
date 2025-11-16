"use client";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/price";
import Marquee from "@/components/Marquee";
import SearchableSelect from "@/components/SearchableSelect";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import CookieBoxHero from "@/app/cookie-box-hero.jpg";
const FREE_SHIPPING_THRESHOLD = 150;
type AppliedCoupon = {
  code: string;
  description: string | null;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscountAmount: number | null;
};
const CartPage = () => {
  const { items, totalPrice, clearCart, removeItem, updateQuantity } =
    useCart();
  const [reachMessage, setReachMessage] = useState<string | null>(null);
  const [shippingType, setShippingType] = useState<"office" | "address">(
    "office"
  );
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedOffice, setSelectedOffice] = useState<string>("");
  const [addressInfo, setAddressInfo] = useState({
    city: "",
    street: "",
    number: "",
    details: "",
  });
  const [cities, setCities] = useState<
    Array<{ id: string; referenceId: string; name: string }>
  >([]);
  const [offices, setOffices] = useState<
    Array<{ id: string; name: string; address?: string }>
  >([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [officesLoading, setOfficesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState<string | null>(null);
  const [officesError, setOfficesError] = useState<string | null>(null);
  const [noOfficesMessage, setNoOfficesMessage] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponDetails, setCouponDetails] = useState<AppliedCoupon | null>(
    null
  );
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponStatus, setCouponStatus] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const cityOptions = useMemo(
    () =>
      cities.map((city) => ({
        value: city.referenceId,
        label: city.name,
        description: city.id ? `Пощенски код: ${city.id}` : undefined,
      })),
    [cities]
  );
  const couponEligible = useMemo(() => {
    if (!couponDetails) {
      return false;
    }
    return totalPrice >= couponDetails.minimumOrderAmount;
  }, [couponDetails, totalPrice]);
  const couponDiscountAmount = useMemo(() => {
    if (!couponDetails) {
      return 0;
    }
    if (totalPrice <= 0) {
      return 0;
    }
    if (totalPrice < couponDetails.minimumOrderAmount) {
      return 0;
    }
    let discount =
      couponDetails.discountType === "PERCENT"
        ? (totalPrice * couponDetails.discountValue) / 100
        : couponDetails.discountValue;
    if (
      couponDetails.maximumDiscountAmount !== null &&
      couponDetails.maximumDiscountAmount >= 0
    ) {
      discount = Math.min(discount, couponDetails.maximumDiscountAmount);
    }
    return Math.min(discount, totalPrice);
  }, [couponDetails, totalPrice]);
  const finalTotal = useMemo(
    () => Math.max(0, totalPrice - couponDiscountAmount),
    [couponDiscountAmount, totalPrice]
  );
  const couponStatusMessage = useMemo(() => {
    if (!couponDetails) {
      return null;
    }
    if (
      couponDetails.minimumOrderAmount > 0 &&
      totalPrice < couponDetails.minimumOrderAmount
    ) {
      const remaining = Math.max(
        0,
        couponDetails.minimumOrderAmount - totalPrice
      );
      return `Добавете още ${formatPrice(remaining)} за да активирате код ${
        couponDetails.code
      }.`;
    }
    if (couponDiscountAmount === 0) {
      return null;
    }
    const baseLabel =
      couponDetails.discountType === "PERCENT"
        ? `${couponDetails.discountValue}%`
        : formatPrice(couponDetails.discountValue);
    return `Код ${couponDetails.code} е активен: -${formatPrice(
      couponDiscountAmount
    )} (${baseLabel}).`;
  }, [couponDetails, couponDiscountAmount, totalPrice]);
  const handleApplyCoupon = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = couponCode.trim();
    if (!trimmed) {
      setCouponError("Въведете код за отстъпка.");
      setCouponStatus(null);
      return;
    }
    const normalized = trimmed.toUpperCase();
    setCouponLoading(true);
    setCouponError(null);
    setCouponStatus(null);
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalized, cartTotal: totalPrice }),
      });
      const payload: {
        coupon?: AppliedCoupon;
        discountAmount?: number;
        error?: string;
      } = await response.json();
      if (!response.ok || !payload.coupon) {
        setCouponDetails(null);
        setCouponError(
          typeof payload.error === "string"
            ? payload.error
            : "Кодът не може да бъде приложен."
        );
        return;
      }
      setCouponDetails(payload.coupon);
      setCouponCode(normalized);
      setCouponStatus(
        typeof payload.discountAmount === "number"
          ? `Кодът е приложен! Отстъпката е ${formatPrice(
              payload.discountAmount
            )}.`
          : "Кодът е приложен успешно."
      );
    } catch (error) {
      console.error("Coupon apply failed", error);
      setCouponDetails(null);
      setCouponError("Нещо се обърка. Моля, опитайте отново.");
    } finally {
      setCouponLoading(false);
    }
  };
  const handleRemoveCoupon = () => {
    setCouponDetails(null);
    setCouponCode("");
    setCouponError(null);
    setCouponStatus("Кодът е премахнат.");
  };
  useEffect(() => {
    if (totalPrice >= FREE_SHIPPING_THRESHOLD) {
      setReachMessage("Поздравления! Вие получавате безплатна доставка.");
    } else {
      const remaining = FREE_SHIPPING_THRESHOLD - totalPrice;
      setReachMessage(
        `Добавете още ${formatPrice(remaining)} за безплатна доставка.`
      );
    }
  }, [totalPrice]);
  useEffect(() => {
    setCitiesLoading(true);
    fetch("/api/econt/cities")
      .then((response) => response.json())
      .then((data) => {
        setCities(Array.isArray(data.cities) ? data.cities : []);
        setCitiesError(data.fallback ? data.message ?? null : null);
      })
      .catch(() => setCitiesError("Неуспешно зареждане на градовете."))
      .finally(() => setCitiesLoading(false));
  }, []);
  useEffect(() => {
    if (shippingType !== "office") {
      setSelectedCityId("");
      setSelectedOffice("");
      setOffices([]);
      setNoOfficesMessage(null);
      return;
    }
    if (!selectedCityId) {
      setOffices([]);
      setSelectedOffice("");
      setNoOfficesMessage(null);
      return;
    }
    setOfficesLoading(true);
    const query = new URLSearchParams({ cityId: selectedCityId }).toString();
    fetch(`/api/econt/offices?${query}`)
      .then((response) => response.json())
      .then((data) => {
        const nextOffices = Array.isArray(data.offices) ? data.offices : [];
        setOffices(nextOffices);
        setOfficesError(data.fallback ? data.message ?? null : null);
        setSelectedOffice("");
        setNoOfficesMessage(
          nextOffices.length === 0
            ? "Няма офис на Еконт в този град. Моля, изберете доставка до адрес."
            : null
        );
      })
      .catch(() => {
        setOfficesError("Неуспешно зареждане на офисите.");
        setNoOfficesMessage(null);
      })
      .finally(() => setOfficesLoading(false));
  }, [shippingType, selectedCityId]);
  return (
    <div className="flex min-h-screen flex-col ">
      {" "}
      <Marquee /> <SiteHeader />{" "}
      <main className="flex-1 py-16">
        {" "}
        <div className="mx-auto w-full max-w-5xl px-[clamp(1rem,4vw,4rem)]">
          {" "}
          <div className="space-y-4 text-center ">
            {" "}
            <h1 className="text-4xl font-semibold sm:text-5xl">
              {" "}
              Вашата количка{" "}
            </h1>{" "}
            {reachMessage ? (
              <div className="mx-auto w-full max-w-xl space-y-3">
                {" "}
                <p className="/80">{reachMessage}</p>{" "}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/60">
                  {" "}
                  <div
                    className="h-full rounded-full bg-[#5f000b] transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (totalPrice / FREE_SHIPPING_THRESHOLD) * 100
                      )}%`,
                    }}
                  />{" "}
                </div>{" "}
              </div>
            ) : null}{" "}
          </div>{" "}
          {items.length === 0 ? (
            <div className="mt-10 flex justify-center">
              {" "}
              <Link
                href="/"
                className="cta rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase  transition hover:bg-[#561c19]"
              >
                {" "}
                Към продуктите{" "}
              </Link>{" "}
            </div>
          ) : (
            <div className="mt-16 space-y-8">
              {" "}
              <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 text-left text-sm font-semibold uppercase sm:grid">
                {" "}
                <span>Продукт</span> <span>Цена</span> <span>Количество</span>{" "}
                <span>Общо</span>{" "}
              </div>{" "}
              <ul className="space-y-6">
                {" "}
                {items.map((item) => (
                  <li
                    key={item.key}
                    className="grid gap-6 rounded-3xl bg-white p-6 text-sm shadow-card sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-center"
                  >
                    {" "}
                    <div className="flex items-start gap-4">
                      {" "}
                      <div className="ratio-square relative hidden h-20 w-20 overflow-hidden rounded-2xl sm:block">
                        {" "}
                        <Image
                          src={CookieBoxHero}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />{" "}
                      </div>{" "}
                      <div className="space-y-2">
                        {" "}
                        <h6 className="text-lg">{item.name}</h6>{" "}
                        {item.options && item.options.length > 0 ? (
                          <ul className="space-y-1 text-xs">
                            {" "}
                            {item.options.map((option) => (
                              <li key={`${item.key}-${option}`}>{option}</li>
                            ))}{" "}
                          </ul>
                        ) : null}{" "}
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="text-xs font-semibold uppercase underline"
                        >
                          {" "}
                          Премахни{" "}
                        </button>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="hidden text-base font-semibold sm:block">
                      {" "}
                      {formatPrice(item.price)}{" "}
                    </div>{" "}
                    <div className="flex items-center justify-start sm:justify-center">
                      {" "}
                      <div className="flex items-center gap-3 rounded-full p-3">
                        {" "}
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.key, item.quantity - 1)
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f1b8c4] text-lg font-semibold transition hover:bg-white"
                        >
                          {" "}
                          –{" "}
                        </button>{" "}
                        <span className="flex h-10 min-w-[3rem] items-center justify-center rounded-full border border-[#f1b8c4] bg-white text-base font-semibold">
                          {" "}
                          {item.quantity}{" "}
                        </span>{" "}
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.key, item.quantity + 1)
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f1b8c4] bg-white text-lg font-semibold transition hover:"
                        >
                          {" "}
                          +{" "}
                        </button>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="text-base font-semibold ">
                      {" "}
                      {formatPrice(item.price * item.quantity)}{" "}
                    </div>{" "}
                  </li>
                ))}{" "}
              </ul>{" "}
              <div className="space-y-6 rounded-3xl bg-white p-6 text-sm shadow-card">
                {" "}
                <div className="space-y-3">
                  {" "}
                  <h3 className="text-lg">Метод на плащане</h3>{" "}
                  <p>Плащанията се извършват единствено с карта.</p>{" "}
                  <p>
                    При финализиране ще ви пренасочим към защитена myPOS
                    страница за плащане.
                  </p>{" "}
                  <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                    {" "}
                    <label className="flex cursor-default items-center gap-3 rounded-2xl border border-[#5f000b] px-4 py-3 ring-2 ring-[#5f000b]">
                      {" "}
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked
                        readOnly
                        className="h-4 w-4 border-[#f4b9c2] focus:ring-[#5f000b]"
                      />{" "}
                      <span className="text-sm">Онлайн плащане (myPOS)</span>{" "}
                    </label>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="space-y-3">
                  {" "}
                  <h3 className="text-lg">Доставка</h3>{" "}
                  <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                    {" "}
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                        shippingType === "office"
                          ? "border-[#5f000b] ring-2 ring-[#5f000b]"
                          : "border-[#f4b9c2]"
                      }`}
                    >
                      {" "}
                      <input
                        type="radio"
                        name="shipping"
                        value="office"
                        checked={shippingType === "office"}
                        onChange={() => setShippingType("office")}
                        className="h-4 w-4 border-[#f4b9c2] focus:ring-[#5f000b]"
                      />{" "}
                      <span className="text-sm">Доставка до офис на Econt</span>{" "}
                    </label>{" "}
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                        shippingType === "address"
                          ? "border-[#5f000b] ring-2 ring-[#5f000b]"
                          : "border-[#f4b9c2]"
                      }`}
                    >
                      {" "}
                      <input
                        type="radio"
                        name="shipping"
                        value="address"
                        checked={shippingType === "address"}
                        onChange={() => setShippingType("address")}
                        className="h-4 w-4 border-[#f4b9c2] focus:ring-[#5f000b]"
                      />{" "}
                      <span className="text-sm">Доставка до адрес</span>{" "}
                    </label>{" "}
                  </div>{" "}
                  {shippingType === "office" ? (
                    <div className="space-y-4">
                      {" "}
                      <SearchableSelect
                        id="econt-city"
                        label="Град (Econt)"
                        value={selectedCityId}
                        onChange={setSelectedCityId}
                        options={cityOptions}
                        disabled={citiesLoading}
                        placeholder="Изберете град…"
                        noResultsText="Няма град с това име"
                      />{" "}
                      {citiesLoading ? (
                        <p className="/70"> Зареждаме списък с градове… </p>
                      ) : citiesError ? (
                        <p className="">{citiesError}</p>
                      ) : null}{" "}
                      {selectedCityId && !noOfficesMessage ? (
                        <label className="block text-l uppercase">
                          {" "}
                          Изберете офис на Econt{" "}
                          <select
                            className="mt-1 w-full rounded-2xl border border-[#f4b9c2] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                            value={selectedOffice}
                            onChange={(event) =>
                              setSelectedOffice(event.target.value)
                            }
                            disabled={officesLoading}
                          >
                            {" "}
                            <option value="">Изберете офис…</option>{" "}
                            {offices.map((office) => (
                              <option key={office.id} value={office.id}>
                                {" "}
                                {office.name}{" "}
                                {office.address ? ` — ${office.address}` : ""}{" "}
                              </option>
                            ))}{" "}
                          </select>{" "}
                        </label>
                      ) : null}{" "}
                      {noOfficesMessage ? (
                        <p className=""> {noOfficesMessage} </p>
                      ) : null}{" "}
                      {officesLoading ? (
                        <p className="/70"> Зареждаме офисите… </p>
                      ) : officesError ? (
                        <p className="">{officesError}</p>
                      ) : null}{" "}
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {" "}
                      <label className="space-y-1 text-xs uppercase">
                        {" "}
                        Град{" "}
                        <input
                          type="text"
                          value={addressInfo.city}
                          onChange={(event) =>
                            setAddressInfo((prev) => ({
                              ...prev,
                              city: event.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-[#f4b9c2] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                          placeholder="Напр. София"
                        />{" "}
                      </label>{" "}
                      <label className="space-y-1 text-xs uppercase">
                        {" "}
                        Улица{" "}
                        <input
                          type="text"
                          value={addressInfo.street}
                          onChange={(event) =>
                            setAddressInfo((prev) => ({
                              ...prev,
                              street: event.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-[#f4b9c2] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                          placeholder="Улица"
                        />{" "}
                      </label>{" "}
                      <label className="space-y-1 text-xs uppercase">
                        {" "}
                        Номер{" "}
                        <input
                          type="text"
                          value={addressInfo.number}
                          onChange={(event) =>
                            setAddressInfo((prev) => ({
                              ...prev,
                              number: event.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-[#f4b9c2] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                          placeholder="№"
                        />{" "}
                      </label>{" "}
                      <label className="space-y-1 text-xs uppercase sm:col-span-2">
                        {" "}
                        Допълнителни указания{" "}
                        <textarea
                          value={addressInfo.details}
                          onChange={(event) =>
                            setAddressInfo((prev) => ({
                              ...prev,
                              details: event.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-[#f4b9c2] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                          rows={3}
                          placeholder="Етаж, вход, домофон и др."
                        />{" "}
                      </label>{" "}
                    </div>
                  )}{" "}
                </div>{" "}
                <div className="space-y-3">
                  {" "}
                  <h3 className="text-lg">Код за отстъпка</h3>{" "}
                  <form
                    onSubmit={handleApplyCoupon}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center"
                  >
                    {" "}
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(event) => setCouponCode(event.target.value)}
                      placeholder="Въведете промо код"
                      className="w-full rounded-2xl border border-[#f4b9c2] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                      disabled={couponLoading}
                      aria-label="Код за отстъпка"
                    />{" "}
                    <div className="flex items-center gap-2">
                      {" "}
                      <button
                        type="submit"
                        className="cta rounded-full bg-[#5f000b] px-5 py-3 text-xs font-semibold uppercase  transition hover:bg-[#561c19] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={couponLoading}
                      >
                        {" "}
                        {couponLoading ? "Проверяваме…" : "Приложи"}{" "}
                      </button>{" "}
                      {couponDetails ? (
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="rounded-full border border-[#f4b9c2] px-5 py-3 text-xs font-semibold uppercase transition hover: disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={couponLoading}
                        >
                          {" "}
                          Премахни{" "}
                        </button>
                      ) : null}{" "}
                    </div>{" "}
                  </form>{" "}
                  {couponError ? <p className="">{couponError}</p> : null}{" "}
                  {couponStatus ? <p className="">{couponStatus}</p> : null}{" "}
                  {couponStatusMessage ? (
                    <p className={`text-xs ${couponEligible ? "" : ""}`}>
                      {" "}
                      {couponStatusMessage}{" "}
                    </p>
                  ) : null}{" "}
                </div>{" "}
              </div>{" "}
              <div className="flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-card">
                {" "}
                <div className="space-y-2 text-l">
                  {" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span className="text-xl font-bold">Общо</span>{" "}
                    <span className="text-xl font-bold">{formatPrice(finalTotal)}</span>{" "}
                  </div>{" "}
                  {couponDiscountAmount > 0 ? (
                    <div className="flex items-center justify-between ">
                      {" "}
                      <span>Отстъпка ({couponDetails?.code ?? ""})</span>{" "}
                      <span>-{formatPrice(couponDiscountAmount)}</span>{" "}
                    </div>
                  ) : null}{" "}
                  <p className="/text-s">
                    {" "}
                    * Цената не включва доставка. Таксата на куриер е
                    приблизително 8 лв. и се начислява отделно.{" "}
                  </p>{" "}
                </div>{" "}
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                  {" "}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {" "}
                    <button
                      type="button"
                      onClick={clearCart}
                      className="rounded-full border border-[#f4b9c2] px-5 py-3 text-xs font-semibold uppercase transition hover:"
                    >
                      {" "}
                      Изчисти количката{" "}
                    </button>{" "}
                    <button
                      type="button"
                      className="cta rounded-full bg-[#5f000b] px-5 py-3 text-xs font-semibold uppercase  transition hover:bg-[#561c19]"
                    >
                      {" "}
                      Поръчай{" "}
                    </button>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>
          )}{" "}
        </div>{" "}
      </main>{" "}
      <SiteFooter />{" "}
    </div>
  );
};
export default CartPage;
