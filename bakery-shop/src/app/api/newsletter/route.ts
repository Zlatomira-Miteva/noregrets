import { NextResponse } from "next/server";

import { appendNewsletterEmail } from "@/lib/googleSheets";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMITS = [
  { windowMs: 60 * 1000, max: 3 }, // 3 submissions per minute
  { windowMs: 60 * 60 * 1000, max: 10 }, // 10 per hour
  { windowMs: 24 * 60 * 60 * 1000, max: 30 }, // 30 per day
];
const LONGEST_WINDOW = Math.max(...RATE_LIMITS.map((limit) => limit.windowMs));
const submissionHistory = new Map<string, number[]>();

const isRateLimited = (key: string) => {
  const now = Date.now();
  const history = (submissionHistory.get(key) ?? []).filter((timestamp) => now - timestamp < LONGEST_WINDOW);

  submissionHistory.set(key, history);

  const limited = RATE_LIMITS.some((limit) => history.filter((timestamp) => now - timestamp < limit.windowMs).length >= limit.max);

  if (limited) {
    return true;
  }

  history.push(now);
  submissionHistory.set(key, history);
  return false;
};

export async function POST(request: Request) {
  try {
    const { email, honeypot } = await request.json();
    const sanitizedEmail = typeof email === "string" ? email.trim() : "";
    const honeypotValue = typeof honeypot === "string" ? honeypot.trim() : "";

    if (honeypotValue) {
      return NextResponse.json({ error: "Невалидна заявка." }, { status: 400 });
    }

    if (!sanitizedEmail) {
      return NextResponse.json({ error: "Моля, въведете имейл адрес." }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(sanitizedEmail)) {
      return NextResponse.json({ error: "Въведеният имейл адрес не е валиден." }, { status: 422 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const userAgent = request.headers.get("user-agent") ?? "unknown";
    const rateKey = `${ip}:${userAgent}`;

    if (isRateLimited(rateKey)) {
      return NextResponse.json(
        { error: "Получихме твърде много заявки от вашето устройство. Моля, опитайте отново по-късно." },
        { status: 429 },
      );
    }

    await appendNewsletterEmail(sanitizedEmail.toLowerCase());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter subscription failed", error);

    const message =
      error instanceof Error && /Missing Google Sheets credentials/.test(error.message)
        ? "Системата за абонаменти не е конфигурирана."
        : "Възникна грешка при записването. Моля, опитайте отново по-късно.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
