"use client";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/price";
import SearchableSelect from "@/components/SearchableSelect";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

const FREE_SHIPPING_THRESHOLD = 90;
const PICKUP_TIME_WINDOW = "16:00 - 18:00";

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
  const [shippingMethod, setShippingMethod] = useState<
    "office" | "address" | "pickup"
  >("office");
  const officeCarrier = "econt" as const;

  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedOffice, setSelectedOffice] = useState<string>("");
  // Speedy disabled
  // const [selectedSpeedyCityId, setSelectedSpeedyCityId] = useState<string>("");
  // const [selectedSpeedyOffice, setSelectedSpeedyOffice] = useState<string>("");

  const [addressInfo, setAddressInfo] = useState({
    city: "",
    street: "",
    number: "",
    details: "",
  });

  const [pickupDate, setPickupDate] = useState("");
  const [pickupError, setPickupError] = useState<string | null>(null);

  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [customerErrors, setCustomerErrors] = useState({
    phone: "",
    email: "",
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

  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isPreparingOrder, setIsPreparingOrder] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const cityOptions = useMemo(() => {
    const unique: typeof cities = [];
    const seen = new Set<string>();
    for (const city of cities) {
      if (!city.referenceId) continue;
      if (seen.has(city.referenceId)) continue;
      seen.add(city.referenceId);
      unique.push(city);
    }
    return unique.map((city) => ({
      value: city.referenceId,
      label: city.name,
      description: city.id ? `Пощенски код: ${city.id}` : undefined,
    }));
  }, [cities]);

  const couponEligible = useMemo(() => {
    if (!couponDetails) return false;
    return totalPrice >= couponDetails.minimumOrderAmount;
  }, [couponDetails, totalPrice]);

  const validatePhoneValue = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "Въведете телефон.";
    }
    if (!/^0\d{9}$/.test(trimmed)) {
      return "Телефонът трябва да започва с 0 и да съдържа 10 цифри.";
    }
    return "";
  };

  const validateEmailValue = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "Въведете имейл.";
    }
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(trimmed)) {
      return "Невалиден формат на имейл.";
    }
    return "";
  };

  const validateContactInfo = () => {
    const phoneError = validatePhoneValue(customerInfo.phone);
    const emailError = validateEmailValue(customerInfo.email);
    setCustomerErrors({ phone: phoneError, email: emailError });
    if (phoneError || emailError) {
      setOrderError(
        phoneError || emailError || "Проверете данните за контакт."
      );
      return false;
    }
    return true;
  };

  const couponDiscountAmount = useMemo(() => {
    if (!couponDetails) return 0;
    if (totalPrice <= 0) return 0;
    if (totalPrice < couponDetails.minimumOrderAmount) return 0;

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

  const normalizeItemsForTotal = (
    source: typeof items,
    targetTotal: number
  ): typeof items => {
    if (!source.length || targetTotal <= 0) return source;
    const sum = source.reduce((acc, item) => acc + item.price * item.quantity, 0);
    if (sum <= 0) return source;
    if (Math.abs(sum - targetTotal) < 0.01) {
      return source.map((item) => ({
        ...item,
        price: Number(item.price.toFixed(2)),
      }));
    }

    const factor = targetTotal / sum;
    let remaining = targetTotal;

    return source.map((item, idx) => {
      const baseTotal = item.price * item.quantity;
      const isLast = idx === source.length - 1;
      const lineTotal = isLast
        ? Number(remaining.toFixed(2))
        : Number((baseTotal * factor).toFixed(2));
      const unitPrice = item.quantity
        ? Number((lineTotal / item.quantity).toFixed(2))
        : 0;
      remaining = Number(
        (remaining - unitPrice * item.quantity).toFixed(2)
      );
      return { ...item, price: unitPrice };
    });
  };

  const minPickupDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  }, []);

  const isSunday = (value: string) => {
    if (!value) return false;
    const [y, m, d] = value.split("-").map(Number);
    if (!y || !m || !d) return false;
    const utc = new Date(Date.UTC(y, m - 1, d));
    return utc.getUTCDay() === 0;
  };

  const couponStatusMessage = useMemo(() => {
    if (!couponDetails) return null;

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

    if (couponDiscountAmount === 0) return null;

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

  const buildOrderPayload = () => {
    if (!items.length) {
      setOrderError("Количката е празна.");
      return null;
    }

    if (
      !customerInfo.firstName ||
      !customerInfo.lastName ||
      !customerInfo.phone ||
      !customerInfo.email
    ) {
      setOrderError("Моля, попълнете име, фамилия, телефон и имейл.");
      return null;
    }

    if (!validateContactInfo()) {
      return null;
    }

    if (shippingMethod === "office" && officeCarrier === "econt" && (!selectedCityId || !selectedOffice)) {
      setOrderError("Моля, изберете град и офис на Еконт.");
      return null;
    }

    if (
      shippingMethod === "address" &&
      (!addressInfo.city || !addressInfo.street || !addressInfo.number)
    ) {
      setOrderError("Моля, попълнете адрес за доставка.");
      return null;
    }

    if (shippingMethod === "pickup") {
      if (!pickupDate) {
        setOrderError("Моля, изберете дата за взимане от магазина.");
        return null;
      }

      if (isSunday(pickupDate)) {
        setOrderError("В неделя не се приемат взимания от ателието.");
        return null;
      }
    }

    if (!termsAccepted) {
      setOrderError("Необходимо е да приемете Общите условия.");
      return null;
    }

    const econtCity = cities.find(
      (entry) => entry.referenceId === selectedCityId
    );
    const office = offices.find((entry) => entry.id === selectedOffice);
    const deliveryLabel =
      shippingMethod === "office" && officeCarrier === "econt"
        ? `Офис Econt – ${econtCity?.name ?? ""}${office ? `, ${office.name}` : ""}`
        : shippingMethod === "pickup"
        ? `Вземане от магазин – ${pickupDate} ${PICKUP_TIME_WINDOW}`
        : `Адрес: ${addressInfo.city}, ${addressInfo.street} ${addressInfo.number}${
            addressInfo.details ? `, ${addressInfo.details}` : ""
          }`;

    const orderReference = `NR-${Date.now()}`;
    const roundedTotal = Number(finalTotal.toFixed(2));
    const normalizedItems = normalizeItemsForTotal(items, roundedTotal);
    const orderPayload = {
      reference: orderReference,
      amount: roundedTotal,
      description: `Онлайн поръчка ${orderReference}`,
      customer: customerInfo,
      deliveryLabel,
      couponCode: couponDetails?.code ?? undefined,
      items: normalizedItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        options: item.options,
      })),
      totalQuantity: normalizedItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
      totalAmount: roundedTotal,
      createdAt: new Date().toISOString(),
      consents: {
        termsAccepted,
        marketing: marketingConsent,
      },
      cart: {
        items: normalizedItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          qty: item.quantity,
          price: item.price,
          currency: "BGN",
          options: item.options,
        })),
      },
    };

    setOrderError(null);
    return orderPayload;
  };

  const handleCheckout = async () => {
    const orderPayload = buildOrderPayload();
    if (!orderPayload) return;

    setIsPreparingOrder(true);

    try {
      sessionStorage.setItem("pendingOrder", JSON.stringify(orderPayload));

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const payload: {
        redirectUrl?: string;
        error?: string;
        form?: { endpoint: string; fields: Record<string, string> };
      } = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Checkout failed");
      }

      if (payload.form) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = payload.form.endpoint;
        Object.entries(payload.form.fields).forEach(([name, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }

      if (!payload.redirectUrl) {
        throw new Error(payload.error ?? "Checkout failed");
      }

      window.location.href = payload.redirectUrl;
    } catch (error) {
      console.error("Failed to store pending order", error);
      setOrderError("Неуспешно стартиране на плащането. Опитайте отново.");
      setOrderStatus(null);
    } finally {
      setIsPreparingOrder(false);
    }
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
    if (shippingMethod !== "office" || officeCarrier !== "econt") {
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
  }, [shippingMethod, officeCarrier, selectedCityId]);

  // Speedy fetching disabled

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 py-16">
        <div className="mx-auto w-full max-w-5xl px-[clamp(1rem,4vw,4rem)]">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-semibold sm:text-5xl">
              Вашата количка
            </h1>
            <p className="text-sm text-[#5f000b]/80">
              5% от печалбата биват дарявани всеки месец.
            </p>
            {reachMessage ? (
              <div className="mx-auto w-full max-w-xl space-y-3">
                <p className="/80">{reachMessage}</p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/60">
                  <div
                    className="h-full rounded-full bg-[#5f000b] transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (totalPrice / FREE_SHIPPING_THRESHOLD) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {items.length === 0 ? (
            <div className="mt-10 flex justify-center">
              <Link
                href="/home"
                className="cta rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase transition hover:bg-[#561c19]"
              >
                Към продуктите
              </Link>
            </div>
          ) : (
            <div className="mt-16 space-y-8">
              <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 text-left text-sm font-semibold uppercase sm:grid">
                <span>Продукт</span>
                <span>Цена</span>
                <span>Количество</span>
                <span>Общо</span>
              </div>

              <ul className="space-y-6">
                {items.map((item) => (
                  <li
                    key={item.key}
                    className="grid gap-6 rounded-s bg-white p-6 text-sm shadow-card sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-center"
                  >
                    <div className="space-y-2">
                      <h6 className="text-lg">{item.name}</h6>
                      {item.options && item.options.length > 0 ? (
                        <ul className="space-y-1 text-xs">
                          {item.options.map((option) => (
                            <li key={`${item.key}-${option}`}>{option}</li>
                          ))}
                        </ul>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="text-xs font-semibold uppercase underline"
                      >
                        Премахни
                      </button>
                    </div>

                    <div className="hidden text-base font-semibold sm:block">
                      {formatPrice(item.price)}
                    </div>

                    <div className="flex items-center justify-start sm:justify-center">
                      <div className="flex items-center gap-3 rounded-full p-3">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.key, item.quantity - 1)
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f1b8c4] text-lg font-semibold transition hover:bg-white"
                        >
                          –
                        </button>
                        <span className="flex h-10 min-w-[3rem] items-center justify-center rounded-full border border-[#f1b8c4] bg-white text-base font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.key, item.quantity + 1)
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f1b8c4] bg-white text-lg font-semibold transition hover:"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-base font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="space-y-6 rounded-3xl bg-white p-6 text-sm shadow-card">
                <div className="space-y-3">
                  <h3 className="text-lg">Данни за клиента</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs text-[#5f000b]/70">
                        Име
                      </span>
                      <input
                        type="text"
                        value={customerInfo.firstName}
                        onChange={(event) =>
                          setCustomerInfo((prev) => ({
                            ...prev,
                            firstName: event.target.value,
                          }))
                        }
                        placeholder="Първо име"
                        className="w-full rounded-2xl border border-[#f4b9c2] px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs text-[#5f000b]/70">
                        Фамилия
                      </span>
                      <input
                        type="text"
                        value={customerInfo.lastName}
                        onChange={(event) =>
                          setCustomerInfo((prev) => ({
                            ...prev,
                            lastName: event.target.value,
                          }))
                        }
                        placeholder="Фамилия"
                        className="w-full rounded-2xl border border-[#f4b9c2] px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs text-[#5f000b]/70">
                        Телефон
                      </span>
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        inputMode="tel"
                        pattern="0[0-9]{9}"
                        maxLength={10}
                        minLength={10}
                        onChange={(event) => {
                          const next = event.target.value;
                          setCustomerInfo((prev) => ({
                            ...prev,
                            phone: next,
                          }));
                          if (customerErrors.phone) {
                            setCustomerErrors((prev) => ({
                              ...prev,
                              phone: validatePhoneValue(next),
                            }));
                          }
                        }}
                        onBlur={() =>
                          setCustomerErrors((prev) => ({
                            ...prev,
                            phone: validatePhoneValue(customerInfo.phone),
                          }))
                        }
                        placeholder="Напр. 0888 123 456"
                        className={`w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none ${
                          customerErrors.phone
                            ? "border-red-500 focus:border-red-600"
                            : "border-[#f4b9c2] focus:border-[#5f000b]"
                        }`}
                      />
                      {customerErrors.phone ? (
                        <p className="text-xs text-red-600">
                          {customerErrors.phone}
                        </p>
                      ) : null}
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs text-[#5f000b]/70">
                        Имейл
                      </span>
                      <input
                        type="email"
                        value={customerInfo.email}
                        inputMode="email"
                        onChange={(event) => {
                          const next = event.target.value;
                          setCustomerInfo((prev) => ({
                            ...prev,
                            email: next,
                          }));
                          if (customerErrors.email) {
                            setCustomerErrors((prev) => ({
                              ...prev,
                              email: validateEmailValue(next),
                            }));
                          }
                        }}
                        onBlur={() =>
                          setCustomerErrors((prev) => ({
                            ...prev,
                            email: validateEmailValue(customerInfo.email),
                          }))
                        }
                        placeholder="you@example.com"
                        className={`w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none ${
                          customerErrors.email
                            ? "border-red-500 focus:border-red-600"
                            : "border-[#f4b9c2] focus:border-[#5f000b]"
                        }`}
                      />
                      {customerErrors.email ? (
                        <p className="text-xs text-red-600">
                          {customerErrors.email}
                        </p>
                      ) : null}
                    </label>
                  </div>
                </div>

                <div className="space-y-3 border-t border-[#f4b9c2] pt-8">
                  <h3 className="text-lg">Метод на плащане</h3>
                  <p>Плащанията се извършват единствено с карта.</p>
                  <p>
                    При финализиране ще ви пренасочим към защитена myPOS
                    страница за плащане.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                    <label className="flex cursor-default items-center gap-3 rounded-2xl border border-[#5f000b] px-4 py-3 ring-2 ring-[#5f000b]">
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked
                        readOnly
                        className="h-4 w-4 border-[#f4b9c2] focus:ring-[#5f000b]"
                      />
                      <span className="text-sm">Онлайн плащане</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4 border-t border-[#f4b9c2] pt-8">
                  <h3 className="text-lg">Доставка</h3>
                  <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                        shippingMethod === "office"
                          ? "border-[#5f000b] ring-2 ring-[#5f000b]"
                          : "border-[#f4b9c2]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        value="office"
                        checked={shippingMethod === "office"}
                        onChange={() => setShippingMethod("office")}
                        className="h-4 w-4 border-[#f4b9c2] focus:ring-[#5f000b]"
                      />
                      <span className="text-sm">Доставка до офис с Еконт</span>
                    </label>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                        shippingMethod === "address"
                          ? "border-[#5f000b] ring-2 ring-[#5f000b]"
                          : "border-[#f4b9c2]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        value="address"
                        checked={shippingMethod === "address"}
                        onChange={() => setShippingMethod("address")}
                        className="h-4 w-4 border-[#f4b9c2] focus:ring-[#5f000b]"
                      />
                      <span className="text-sm">Доставка до адрес с Еконт</span>
                    </label>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                        shippingMethod === "pickup"
                          ? "border-[#5f000b] ring-2 ring-[#5f000b]"
                          : "border-[#f4b9c2]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        value="pickup"
                        checked={shippingMethod === "pickup"}
                        onChange={() => setShippingMethod("pickup")}
                        className="h-4 w-4 border-[#f4b9c2] focus:ring-[#5f000b]"
                      />
                      <span className="text-sm">Взимане от ателието</span>
                    </label>
                  </div>
                  {shippingMethod === "office" ? (
                    <>
                      <div className="mt-8 space-y-4">
                        <SearchableSelect
                          id="econt-city"
                          label="Град"
                          value={selectedCityId}
                          onChange={setSelectedCityId}
                          options={cityOptions}
                          disabled={citiesLoading}
                          placeholder="Изберете град…"
                          noResultsText="Няма град с това име"
                        />
                        {citiesLoading ? (
                          <p className="/70"> Зареждаме списък с градове… </p>
                        ) : citiesError ? (
                          <p>{citiesError}</p>
                        ) : null}
                        {selectedCityId && !noOfficesMessage ? (
                          <label className="block text-l">
                            Изберете офис на Еконт
                            <select
                              className="mt-1 w-full rounded-2xl border border-[#f4b9c2] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                              value={selectedOffice}
                              onChange={(event) =>
                                setSelectedOffice(event.target.value)
                              }
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
                        {noOfficesMessage ? <p>{noOfficesMessage}</p> : null}
                        {officesLoading ? (
                          <p className="/70"> Зареждаме офисите… </p>
                        ) : officesError ? (
                          <p>{officesError}</p>
                        ) : null}
                      </div>
                    </>
                  ) : shippingMethod === "address" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1 text-xs">
                        Град
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
                        />
                      </label>
                      <label className="space-y-1 text-xs">
                        Улица
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
                        />
                      </label>
                      <label className="space-y-1 text-xs">
                        Номер
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
                        />
                      </label>
                      <label className="space-y-1 text-xs sm:col-span-2">
                        Допълнителни указания
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
                        />
                      </label>
                    </div>
                  ) : null}

                  {shippingMethod === "pickup" ? (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                        <div className="space-y-2 flex-1">
                          <span className="text-xs">Дата за взимане</span>
                          <div className="rounded-2xl border border-[#f4b9c2] bg-white p-3">
                            <DayPicker
                              mode="single"
                              weekStartsOn={1}
                              fromDate={minPickupDate}
                              disabled={[{ dayOfWeek: [0] }, { before: minPickupDate }]}
                              selected={pickupDate ? new Date(pickupDate) : undefined}
                              onSelect={(date) => {
                                if (!date) {
                                  setPickupDate("");
                                  setPickupError(null);
                                  return;
                                }
                                const normalized = new Date(
                                  Date.UTC(
                                    date.getFullYear(),
                                    date.getMonth(),
                                    date.getDate()
                                  )
                                );
                                if (normalized < minPickupDate) {
                                  setPickupError("Изберете дата след минималния срок за подготовка.");
                                  setPickupDate("");
                                  return;
                                }
                                if (normalized.getUTCDay() === 0) {
                                  setPickupError(
                                    "В неделя не се приемат взимания от ателието."
                                  );
                                  setPickupDate("");
                                  return;
                                }
                                const iso = normalized.toISOString().slice(0, 10);
                                setPickupError(null);
                                setPickupDate(iso);
                              }}
                              styles={{
                                caption: { color: "#5f000b" },
                                head_cell: { color: "#5f000b", fontWeight: 600 },
                                day: { borderRadius: "12px" },
                                day_selected: { backgroundColor: "#5f000b", color: "#fff" },
                                day_disabled: { color: "#c4c4c4" },
                              }}
                            />
                          </div>
                        </div>
                        <p className="rounded-2xl bg-[#b4102b] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white lg:w-2/5">
                          Взимането от магазина е възможно само между 16:00 и
                          18:00 часа в делнични дни и от 12:00 до 17:00 часа в
                          събота. Невзети поръчки в обявените часове могат да се
                          вземат на следващия ден в обявените работни часове.
                        </p>
                      </div>
                      {pickupError ? (
                        <p className="text-xs text-red-600">{pickupError}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg">Код за отстъпка</h3>
                  <form
                    onSubmit={handleApplyCoupon}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center"
                  >
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(event) => setCouponCode(event.target.value)}
                      placeholder="Въведете промо код"
                      className="w-full rounded-2xl border border-[#f4b9c2] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                      disabled={couponLoading}
                      aria-label="Код за отстъпка"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="cta rounded-full bg-[#5f000b] px-5 py-3 text-xs font-semibold uppercase transition hover:bg-[#561c19] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={couponLoading}
                      >
                        {couponLoading ? "Проверяваме…" : "Приложи"}
                      </button>
                      {couponDetails ? (
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="rounded-full border border-[#f4b9c2] px-5 py-3 text-xs font-semibold uppercase transition hover: disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={couponLoading}
                        >
                          Премахни
                        </button>
                      ) : null}
                    </div>
                  </form>
                  {couponError ? <p>{couponError}</p> : null}
                  {couponStatus ? <p>{couponStatus}</p> : null}
                  {couponStatusMessage ? (
                    <p className={`text-xs ${couponEligible ? "" : ""}`}>
                      {couponStatusMessage}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-card">
                <div className="space-y-2 text-l">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold">Общо</span>
                    <span className="text-xl font-bold">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>
                  {couponDiscountAmount > 0 ? (
                    <div className="flex items-center justify-between">
                      <span>Отстъпка ({couponDetails?.code ?? ""})</span>
                      <span>-{formatPrice(couponDiscountAmount)}</span>
                    </div>
                  ) : null}
                  <p className="/text-s">* Цената не включва доставка.</p>
                </div>

                <div className="space-y-4 text-sm text-[#5f000b]">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(event) =>
                        setTermsAccepted(event.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-[#f4b9c2] text-[#5f000b] focus:ring-[#5f000b]"
                    />
                    <span>
                      Прочетох{" "}
                      <Link
                        href="/terms"
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold link-underline decoration-[#5f000b] underline-offset-2"
                      >
                        Общите условия
                      </Link>{" "}
                      и се съгласявам.
                    </span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(event) =>
                        setMarketingConsent(event.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-[#f4b9c2] text-[#5f000b] focus:ring-[#5f000b]"
                    />
                    <span>
                      Съгласявам се да получавам имейли с нови предложения и
                      промоции.
                    </span>
                  </label>
                </div>

                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={clearCart}
                      className="rounded-full border border-[#f4b9c2] px-5 py-3 text-l font-semibold uppercase transition hover:"
                    >
                      Изчисти количката
                    </button>
                    <button
                      type="button"
                      onClick={handleCheckout}
                      className="cta rounded-full bg-[#5f000b] px-5 py-3 text-l font-semibold uppercase transition hover:bg-[#561c19] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isPreparingOrder || !termsAccepted}
                    >
                      {isPreparingOrder ? "Моля, изчакайте…" : "Поръчай"}
                    </button>
                  </div>
                  <div className="text-center text-xs text-[#5f000b]">
                    {orderError ? (
                      <p className="text-red-600">{orderError}</p>
                    ) : null}
                    {orderStatus ? <p>{orderStatus}</p> : null}
                  </div>
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
