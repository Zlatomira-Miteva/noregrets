"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

const AdminLoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin/coupons";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("Невалидни данни за вход.");
      return;
    }

    router.push(callbackUrl);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5cec7] px-6 text-[#5f000b]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-6 shadow-card">
        <header className="space-y-1 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-[#5f000b]/70">Админ панел</p>
          <h1 className="text-2xl font-semibold">Вход</h1>
          <p className="text-sm">Въведете администраторските креденшъли.</p>
        </header>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-[#dcb1b1] px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
          placeholder="Email"
          required
        />
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-[#dcb1b1] px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
          placeholder="Парола"
          required
        />
        {error ? <p className="text-sm text-[#b42318]">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[#5f000b] px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-[#561c19] disabled:opacity-60"
        >
          {loading ? "Вход..." : "Влез"}
        </button>
      </form>
    </div>
  );
};

export default AdminLoginPage;

