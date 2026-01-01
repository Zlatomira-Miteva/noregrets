"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

type ContactStatus = "idle" | "sending" | "success" | "error";

const CONTACT_CHANNELS = [
  {
    label: "Имейл",
    value: "info@noregrets.bg",
    href: "mailto:info@noregrets.bg",
  },
  {
    label: "Адрес",
    value: "гр. Пловдив, ул. „Богомил“ 48",
  },
];

export default function ContactClient() {
  const [status, setStatus] = useState<ContactStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(payload?.error ?? "Неуспешно изпращане на съобщението.");
        setStatus("error");
        return;
      }
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      console.error("[contact]", err);
      setStatus("error");
      setError("Неуспешно изпращане на съобщението.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fff1f3] text-[#5f000b]">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl rounded-3xl bg-white p-8 shadow-card">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <h1 className="text-3xl font-semibold">Свържи се с нас</h1>
                <p className="text-sm text-[#5f000b]/80">
                  За поръчки, събития или фирмени доставки.
                </p>
              </div>
              <label className="space-y-1">
                <span className="text-xs text-[#5f000b]/70">Име</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-[#e4c8c8] px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-[#5f000b]/70">Имейл</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-[#e4c8c8] px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                  required
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-[#5f000b]/70">Съобщение</span>
                <textarea
                  value={form.message}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                  rows={5}
                  className="w-full rounded-2xl border border-[#e4c8c8] px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                  required
                />
              </label>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {status === "success" ? (
                <p className="text-sm text-green-700">
                  Изпратено успешно! Ще се свържем с теб скоро.
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#781e21] disabled:opacity-60 sm:w-auto"
              >
                {status === "sending" ? "Изпращане..." : "Изпрати"}
              </button>
            </form>

            <div className="space-y-4 rounded-3xl bg-[#fff6f8] p-6">
              <h2 className="text-xl font-semibold">Как да ни намериш</h2>
              <ul className="space-y-3 text-sm">
                {CONTACT_CHANNELS.map((item) => (
                  <li key={item.label} className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-[#5f000b]/70">
                      {item.label}
                    </p>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="font-semibold text-[#5f000b] underline decoration-dotted"
                      >
                        {item.value}
                      </Link>
                    ) : (
                      <p className="font-semibold text-[#5f000b]">
                        {item.value}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <div className="space-y-2 rounded-2xl bg-white p-4 text-sm shadow-card">
                <p>Работно време за взимане на поръчки от място:</p>{" "}
                <p> Пн - Пт: 16:00 – 18:00</p> <p> Съб: 12:00 – 17:00</p>{" "}
                <p>Неделя почивен ден</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
