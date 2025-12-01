'use client';

import { FormEvent, useState } from "react";

import { FOOTER_LINK_GROUPS, SOCIAL_LINKS } from "@/data/footer";

const SiteFooter = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const isLoading = status === "loading";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const sanitizedEmail = email.trim().toLowerCase();

    if (!sanitizedEmail) {
      setStatus("error");
      setMessage("Моля, въведете имейл адрес.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sanitizedEmail, honeypot }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Неуспешно записване.");
      }

      setStatus("success");
      setMessage("Благодарим! Успешно се абонирахте.");
      setEmail("");
      setHoneypot("");
    } catch (error) {
      const fallbackMessage =
        error instanceof Error ? error.message : "Нещо се обърка. Моля, опитайте отново.";
      setStatus("error");
      setMessage(fallbackMessage);
    }
  };

  return (
    <footer className="bg-[#311E20] text-white">
      <div className="mx-auto flex w-full flex-col gap-12 px-[clamp(1rem,3vw,3rem)] py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[45%_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <h4 className="text-3xl leading-tight sm:text-4xl">Абонирайте се за новини и отстъпки</h4>
            <p>Първи научавайте за нови вкусове и специални оферти.</p>
            <form className="space-y-3" onSubmit={handleSubmit} noValidate>
              <div className="flex max-w-xl overflow-hidden rounded-full bg-white/10 shadow-inner backdrop-blur">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Имейл адрес"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full flex-1 border-none bg-transparent px-6 py-3 text-sm text-white placeholder:text-white/70 focus:outline-none"
                />

                <input
                  type="text"
                  name="favoriteDessert"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                  className="hidden"
                  aria-hidden="true"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-white/20 px-6 text-sm font-semibold uppercase text-white transition hover:bg-white/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Изпращане..." : "Изпрати"}
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              {message && (
                <p
                  className={`text-sm ${status === "success" ? "text-emerald-200" : "text-rose-200"}`}
                  aria-live="polite"
                  role="status"
                >
                  {message}
                </p>
              )}
              <p className="text-white/70">
                С изпращането на формата приемате{" "}
                <a href="/terms" className="link-underline underline hover:text-white">
                  Общите условия
                </a>{" "}
                и{" "}
                <a href="/privacy" className="link-underline underline hover:text-white">
                  Политиката за поверителност
                </a>
                .
              </p>
            </form>
          </div>

          {FOOTER_LINK_GROUPS.map((group) => (
            <div key={group.title} className="space-y-4">
              <h4 className="text-lg">{group.title}</h4>
              <ul className="space-y-2 text-sm text-white/80">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="transition hover:text-white hover:underline">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-6 border-t border-white/10 pt-8 text-sm text-white/80 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            <span className="text-lg" aria-hidden="true">
              🇧🇬
            </span>
            България (BGN)
          </button>

          <div className="flex flex-wrap items-center gap-4 text-xs uppercase">
            <span>© {currentYear} No Regrets</span>
            <span className="hidden h-4 w-px bg-white/20 md:block" />
            <a href="/privacy" className="hover:text-white">
              Политика за поверителност
            </a>
            <span className="hidden h-4 w-px bg-white/20 md:block" />
            <a href="/terms" className="hover:text-white">
              Общи условия
            </a>
          </div>

          <div className="flex items-center gap-4 text-white">
            {SOCIAL_LINKS.map((item) => (
              <a
                key={item.id}
                href={item.href}
                aria-label={item.label}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/30"
              >
                {item.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
