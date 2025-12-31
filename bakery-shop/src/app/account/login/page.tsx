"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

function LoginPageInner() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/account";

  useEffect(() => {
    if (session?.user) {
      router.replace("/account");
    }
  }, [session, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (result?.error) {
      setError("Невалиден имейл или парола.");
      return;
    }
    router.push(callbackUrl);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#ffefed] text-[#5f000b]" suppressHydrationWarning>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6 rounded-3xl bg-white p-8 shadow-card">
          <h1 className="text-2xl font-semibold">Вход</h1>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Имейл</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-[#e4c8c8] px-4 py-2 outline-none focus:border-[#5f000b]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Парола</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-[#e4c8c8] px-4 py-2 outline-none focus:border-[#5f000b]"
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#5f000b] px-4 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#781e21] disabled:opacity-60"
            >
              {loading ? "Моля изчакайте..." : "Вход"}
            </button>
          </form>
          <p className="text-sm text-[#5f000b]/80">
            Нямаш профил?{" "}
            <a href="/account/register" className="font-semibold underline">
              Регистрирай се
            </a>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function AccountLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
