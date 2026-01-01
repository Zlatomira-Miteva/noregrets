"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SearchableSelect from "@/components/SearchableSelect";

export default function AccountProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    city: "",
    zip: "",
    address: "",
    notes: "",
    econtCityId: "",
    econtCityName: "",
    econtOfficeId: "",
    econtOfficeName: "",
  });
  const [deliveryMethod, setDeliveryMethod] = useState<"address" | "econt">("address");
  const [cities, setCities] = useState<Array<{ id: string; referenceId: string; name: string }>>([]);
  const [offices, setOffices] = useState<Array<{ id: string; name: string; address?: string }>>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [officesLoading, setOfficesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState<string | null>(null);
  const [officesError, setOfficesError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/account/login?callbackUrl=/account/profile");
    }
  }, [status, router]);

  useEffect(() => {
    const load = async () => {
      if (!session?.user) return;
      setLoading(true);
      try {
        const res = await fetch("/api/account/profile");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setForm({
              firstName: data.firstName ?? "",
              lastName: data.lastName ?? "",
              phone: data.phone ?? "",
              email: data.email ?? session.user.email ?? "",
              city: data.city ?? "",
              zip: data.zip ?? "",
              address: data.address ?? "",
              notes: data.notes ?? "",
              econtCityId: data.econtCityId ?? "",
              econtCityName: data.econtCityName ?? "",
              econtOfficeId: data.econtOfficeId ?? "",
              econtOfficeName: data.econtOfficeName ?? "",
            });
            setDeliveryMethod(
              data.econtOfficeId || data.econtCityId ? "econt" : "address",
            );
          } else if (session.user.email) {
            setForm((prev) => ({ ...prev, email: session.user?.email ?? prev.email }));
          }
          const fullName = session.user.name ?? "";
          if (fullName && (!data?.firstName || !data?.lastName)) {
            const parts = fullName.split(" ").filter(Boolean);
            setForm((prev) => ({
              ...prev,
              firstName: prev.firstName || parts[0] || "",
              lastName: prev.lastName || (parts.length > 1 ? parts.slice(1).join(" ") : ""),
            }));
          }
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session]);

  const cityOptions = useMemo(
    () =>
      cities.map((city) => ({
        value: city.referenceId,
        label: city.name,
        description: city.id ? `Пощенски код: ${city.id}` : undefined,
      })),
    [cities],
  );

  const officeOptions = useMemo(
    () =>
      offices.map((office) => ({
        value: office.id,
        label: office.name,
        description: office.address,
      })),
    [offices],
  );

  useEffect(() => {
    setCitiesLoading(true);
    fetch("/api/econt/cities")
      .then((res) => res.json())
      .then((data) => {
        setCities(Array.isArray(data.cities) ? data.cities : []);
        setCitiesError(data.fallback ? data.message ?? null : null);
      })
      .catch(() => setCitiesError("Неуспешно зареждане на градовете."))
      .finally(() => setCitiesLoading(false));
  }, []);

  useEffect(() => {
    if (!form.econtCityId) {
      setOffices([]);
      setForm((prev) => ({ ...prev, econtOfficeId: "", econtOfficeName: "" }));
      return;
    }
    setOfficesLoading(true);
    fetch(`/api/econt/offices?cityId=${encodeURIComponent(form.econtCityId)}`)
      .then((res) => res.json())
      .then((data) => {
        setOffices(Array.isArray(data.offices) ? data.offices : []);
        setOfficesError(data.fallback ? data.message ?? null : null);
      })
      .catch(() => setOfficesError("Неуспешно зареждане на офисите."))
      .finally(() => setOfficesLoading(false));
  }, [form.econtCityId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaveMessage(null);
    setLoading(true);
    try {
      const payload =
        deliveryMethod === "econt"
          ? { ...form, city: "", zip: "", address: "" }
          : {
              ...form,
              econtCityId: "",
              econtCityName: "",
              econtOfficeId: "",
              econtOfficeName: "",
            };
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(payload?.error ?? "Неуспешно запазване.");
      } else {
        setSaveMessage("Промените са запазени успешно.");
        setTimeout(() => setSaveMessage(null), 10000);
      }
    } catch {
      setError("Неуспешно запазване.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#ffefed] text-[#5f000b]">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl space-y-6 rounded-3xl bg-white p-8 shadow-card">
          <h1 className="text-2xl font-semibold">Моите данни</h1>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSave}>
            <label className="space-y-1">
              <span className="text-xs text-[#5f000b]/70">Име</span>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                className="w-full rounded-2xl border border-[#e4c8c8] px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-[#5f000b]/70">Фамилия</span>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                className="w-full rounded-2xl border border-[#e4c8c8] px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-[#5f000b]/70">Телефон</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full rounded-2xl border border-[#e4c8c8] px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-[#5f000b]/70">Имейл</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-2xl border border-[#e4c8c8] px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs text-[#5f000b]/70">Бележки</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full rounded-2xl border border-[#e4c8c8] px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
              />
            </label>
            <div className="sm:col-span-2 space-y-2">
              <span className="text-xs font-semibold text-[#5f000b]">Метод на доставка</span>
              <div className="flex flex-wrap gap-4 text-sm text-[#5f000b]/80">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="address"
                    checked={deliveryMethod === "address"}
                    onChange={() => setDeliveryMethod("address")}
                    className="h-4 w-4 text-[#5f000b] focus:ring-[#5f000b]"
                  />
                  <span>До адрес</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="econt"
                    checked={deliveryMethod === "econt"}
                    onChange={() => setDeliveryMethod("econt")}
                    className="h-4 w-4 text-[#5f000b] focus:ring-[#5f000b]"
                  />
                  <span>Офис на Еконт</span>
                </label>
              </div>
            </div>
            {deliveryMethod === "econt" ? (
              <div className="space-y-1 sm:col-span-2">
                <span className="text-xs text-[#5f000b]/70">Офис на Еконт</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SearchableSelect
                    id="econt-city"
                    value={form.econtCityId}
                    onChange={(value) => {
                      const selected = cityOptions.find((c) => c.value === value);
                      setForm((prev) => ({
                        ...prev,
                        econtCityId: value,
                        econtCityName: selected?.label ?? "",
                        econtOfficeId: "",
                        econtOfficeName: "",
                      }));
                    }}
                    options={cityOptions}
                    placeholder={citiesLoading ? "Зарежда..." : "Град на офис (Еконт)"}
                    noResultsText={citiesError ?? "Няма резултат"}
                    disabled={citiesLoading}
                  />
                  <SearchableSelect
                    id="econt-office"
                    value={form.econtOfficeId}
                    onChange={(value) => {
                      const selected = officeOptions.find((o) => o.value === value);
                      setForm((prev) => ({
                        ...prev,
                        econtOfficeId: value,
                        econtOfficeName: selected?.label ?? "",
                      }));
                    }}
                    options={officeOptions}
                    placeholder={
                      form.econtCityId
                        ? officesLoading
                          ? "Зарежда офисите..."
                          : "Изберете офис (име/адрес)"
                        : "Изберете град за офис"
                    }
                    noResultsText={officesError ?? "Няма резултат"}
                    disabled={!form.econtCityId || officesLoading}
                  />
                </div>
              </div>
            ) : (
              <>
                <label className="space-y-1">
                  <span className="text-xs text-[#5f000b]/70">Град (доставка до адрес)</span>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full rounded-2xl border border-[#e4c8c8] px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-[#5f000b]/70">Пощенски код (адрес)</span>
                  <input
                    type="text"
                    value={form.zip}
                    onChange={(e) => setForm((prev) => ({ ...prev, zip: e.target.value }))}
                    className="w-full rounded-2xl border border-[#e4c8c8] px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs text-[#5f000b]/70">Адрес</span>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full rounded-2xl border border-[#e4c8c8] px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                  />
                </label>
              </>
            )}
            {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
            {saveMessage ? <p className="text-sm text-green-700 sm:col-span-2">{saveMessage}</p> : null}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#781e21] disabled:opacity-60 sm:w-auto"
              >
                {loading ? "Запазване..." : "Запази"}
              </button>
            </div>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
