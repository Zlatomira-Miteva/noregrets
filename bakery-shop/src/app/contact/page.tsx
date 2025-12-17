"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import Marquee from "@/components/Marquee";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

type ContactStatus = "idle" | "sending" | "success" | "error";

const CONTACT_CHANNELS = [
  {
    label: "Имейл",
    value: "zlati.noregrets@gmail.com",
    href: "mailto:zlati.noregrets@gmail.com",
  },
  {
    label: "Адрес",
    value: "гр. Пловдив, ул. „Богомил“ 48",
  },
];

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState<ContactStatus>("idle");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    phone: "",
  });

  const validateEmail = (value: string) => {
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

  const validatePhone = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }
    if (!/^0\d{9}$/.test(trimmed)) {
      return "Телефонът трябва да започва с 0 и да съдържа 10 цифри.";
    }
    return "";
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "email" && fieldErrors.email) {
      setFieldErrors((prev) => ({
        ...prev,
        email: validateEmail(value),
      }));
    }
    if (name === "phone" && fieldErrors.phone) {
      setFieldErrors((prev) => ({
        ...prev,
        phone: validatePhone(value),
      }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;

    const emailError = validateEmail(formData.email);
    const phoneError = validatePhone(formData.phone);
    setFieldErrors({ email: emailError, phone: phoneError });

    if (!formData.name.trim() || !formData.message.trim()) {
      setFeedback("Моля, попълнете име и съобщение.");
      setStatus("error");
      return;
    }

    if (emailError || phoneError) {
      setFeedback(emailError || phoneError);
      setStatus("error");
      return;
    }

    setStatus("sending");
    setFeedback(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(typeof payload?.error === "string" ? payload.error : "Неуспешно изпращане.");
      }

      setStatus("success");
      setFeedback("Благодарим! Ще се свържем с вас възможно най-скоро.");
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      const fallbackMessage =
        error instanceof Error ? error.message : "Нещо се обърка. Моля, опитайте отново.";
      setStatus("error");
      setFeedback(fallbackMessage);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fff7f4] text-[#3a1114]">
      <Marquee />
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-[#fbe7e0] py-16">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-[clamp(1.25rem,4vw,4rem)] text-center">
            <p className="text-sm uppercase text-[#b25b64]">Свържете се с нас</p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Контакт с No Regrets
            </h1>
            <p className="text-base text-[#4e1f25]">
              Използвайте формата, за да ни изпратите въпрос за поръчка, събитие или партньорство.
              Отговаряме лично на всеки имейл.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto grid w-full max-w-5xl gap-10 px-[clamp(1.25rem,4vw,4rem)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="space-y-8 rounded-3xl bg-white p-8 shadow-card">
              <div>
                <h2 className="text-2xl font-semibold">Данни за контакт</h2>
                <p className="mt-2 text-sm text-[#5f000b]/70">
                  В работни дни отговаряме между 10:00 и 18:00 ч. Взимането от магазина става между
                  16:00 и 18:00 ч. В събота работим от 12:00 до 17:00 ч.
                </p>
              </div>

              <dl className="space-y-6 text-base">
                {CONTACT_CHANNELS.map((channel) => (
                  <div key={channel.label}>
                    <dt className="text-xs uppercase text-[#b25b64]">{channel.label}</dt>
                    <dd className="text-lg font-semibold">
                      {channel.href ? (
                        <a href={channel.href} className="underline decoration-dotted underline-offset-4 hover:text-[#5f000b]">
                          {channel.value}
                        </a>
                      ) : (
                        channel.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="rounded-2xl bg-[#fbe7e0] p-6 text-sm leading-relaxed text-[#4e1f25]">
                <p className="font-semibold">Нуждаете се от бърз отговор?</p>
                <p>
                  Проверете страницата{" "}
                  <Link href="/faq" className="font-semibold link-underline decoration-[#5f000b] underline-offset-4">
                    Често задавани въпроси
                  </Link>{" "}
                  или ни пишете директно чрез формата.
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-card">
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm font-semibold uppercase">
                    Име и фамилия *
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-[#f4b9c2] px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                      placeholder="Напр. Златина Иванова"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold uppercase">
                    Имейл *
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={() =>
                        setFieldErrors((prev) => ({
                          ...prev,
                          email: validateEmail(formData.email),
                        }))
                      }
                      required
                      className={`w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none ${
                        fieldErrors.email ? "border-red-500 focus:border-red-600" : "border-[#f4b9c2] focus:border-[#5f000b]"
                      }`}
                      placeholder="your@email.com"
                    />
                    {fieldErrors.email ? <p className="text-xs text-red-600">{fieldErrors.email}</p> : null}
                  </label>
                </div>

                <label className="space-y-2 text-sm font-semibold uppercase">
                  Телефон (по желание)
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={() =>
                      setFieldErrors((prev) => ({
                        ...prev,
                        phone: validatePhone(formData.phone),
                      }))
                    }
                    className={`w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none ${
                      fieldErrors.phone ? "border-red-500 focus:border-red-600" : "border-[#f4b9c2] focus:border-[#5f000b]"
                    }`}
                    placeholder="0888 123 456"
                  />
                  {fieldErrors.phone ? <p className="text-xs text-red-600">{fieldErrors.phone}</p> : null}
                </label>

                <label className="space-y-2 text-sm font-semibold uppercase">
                  Съобщение *
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full rounded-2xl border border-[#f4b9c2] px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                    placeholder="Разкажете ни повече за повода или въпроса си..."
                  />
                </label>

                <button
                  type="submit"
                  className="cta inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold uppercase transition hover:bg-[#561c19] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? "Изпращане…" : "Изпрати съобщение"}
                </button>

                {feedback ? (
                  <p
                    className={`text-sm ${
                      status === "success" ? "text-emerald-600" : "text-red-600"
                    }`}
                    role="status"
                  >
                    {feedback}
                  </p>
                ) : null}
                <p className="text-xs text-[#5f000b]/70">
                  С изпращането на формата приемате{" "}
                  <Link href="/privacy" className="link-underline decoration-[#5f000b] underline-offset-2">
                    Политиката за поверителност
                  </Link>{" "}
                  и{" "}
                  <Link href="/terms" className="link-underline decoration-[#5f000b] underline-offset-2">
                    Общите условия
                  </Link>
                  .
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default ContactPage;
