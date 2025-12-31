"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function AccountRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!acceptTerms) {
      setError("Моля приеми Общите условия.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Паролите не съвпадат.");
      return;
    }
    setLoading(true);
    const fullName = `${form.firstName} ${form.lastName}`.trim();
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fullName,
        email: form.email,
        password,
        profile: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
        },
      }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoading(false);
      setError(payload?.error ?? "Неуспешна регистрация");
      return;
    }
    const signInResult = await signIn("credentials", {
      email: form.email,
      password,
      redirect: false,
      callbackUrl: "/account",
    });
    setLoading(false);
    if (signInResult?.error) {
      router.push("/account/login");
      return;
    }
    router.push("/account");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#ffefed] text-[#5f000b]">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6 rounded-3xl bg-white p-8 shadow-card">
          <h1 className="text-2xl font-semibold">Регистрация</h1>
          <form className="grid gap-4" onSubmit={handleSubmit}>
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
              <span className="text-xs text-[#5f000b]/70">Имейл</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                required
                className="w-full rounded-2xl border border-[#e4c8c8] px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
              />
            </label>
            <div className="space-y-1">
              <span className="text-xs text-[#5f000b]/70">Парола</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-[#e4c8c8] px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-[#5f000b]/70">Повтори паролата</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-[#e4c8c8] px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
              />
            </div>
            <label className="flex items-start gap-3 text-sm text-[#5f000b]/80">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#e4c8c8] text-[#5f000b] focus:ring-[#5f000b]"
                required
              />
              <span>
                Съгласен съм с{" "}
                <a
                  href="/terms"
                  className="font-semibold text-[#e00034] underline decoration-[#e00034] decoration-2 underline-offset-2 hover:text-[#ff0048] hover:decoration-[#ff0048] visited:text-[#e00034]"
                  style={{ textDecorationLine: "underline" }}
                >
                  Общите условия
                </a>{" "}
                и{" "}
                <a
                  href="/privacy"
                  className="font-semibold text-[#e00034] underline decoration-[#e00034] decoration-2 underline-offset-2 hover:text-[#ff0048] hover:decoration-[#ff0048] visited:text-[#e00034]"
                  style={{ textDecorationLine: "underline" }}
                >
                  Политиката за поверителност
                </a>
                .
              </span>
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#5f000b] px-4 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#781e21] disabled:opacity-60"
            >
              {loading ? "Моля изчакайте..." : "Създай профил"}
            </button>
          </form>
          <p className="text-sm text-[#5f000b]/80">
            Имаш профил?{" "}
            <a href="/account/login" className="font-semibold underline">
              Влез
            </a>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
