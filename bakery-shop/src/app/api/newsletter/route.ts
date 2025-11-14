import { NextResponse } from "next/server";

import { appendNewsletterEmail } from "@/lib/googleSheets";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const sanitizedEmail = typeof email === "string" ? email.trim() : "";

    if (!sanitizedEmail) {
      return NextResponse.json({ error: "Моля, въведете имейл адрес." }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(sanitizedEmail)) {
      return NextResponse.json({ error: "Въведеният имейл адрес не е валиден." }, { status: 422 });
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
