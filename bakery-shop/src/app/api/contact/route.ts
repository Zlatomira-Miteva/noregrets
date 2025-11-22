import { NextResponse } from "next/server";

const {
  RESEND_API_KEY,
  CONTACT_RECIPIENT = "zlati@noregrets.bg",
  CONTACT_FROM = "No Regrets <hello@noregrets.bg>",
} = process.env;

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const name = typeof payload?.name === "string" ? payload.name.trim() : "";
    const email = typeof payload?.email === "string" ? payload.email.trim() : "";
    const phone = typeof payload?.phone === "string" ? payload.phone.trim() : "";
    const message = typeof payload?.message === "string" ? payload.message.trim() : "";

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Попълнете име, имейл и съобщение." },
        { status: 400 }
      );
    }

    if (!RESEND_API_KEY) {
      console.error("[contact] Missing RESEND_API_KEY");
      return NextResponse.json(
        {
          error:
            "Услугата за изпращане на имейли не е конфигурирана. Свържете се с нас директно на zlati@noregrets.bg.",
        },
        { status: 500 }
      );
    }

    const subject = `Ново запитване от ${name}`;
    const bodyLines = [
      `Име: ${name}`,
      `Имейл: ${email}`,
      phone ? `Телефон: ${phone}` : null,
      "",
      "Съобщение:",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: CONTACT_FROM,
        to: [CONTACT_RECIPIENT],
        reply_to: [`${name} <${email}>`],
        subject,
        text: bodyLines,
        html: bodyLines.replace(/\n/g, "<br />"),
      }),
    });

    if (!resendResponse.ok) {
      const errorPayload = await resendResponse.json().catch(() => ({}));
      console.error("[contact] Resend API error", errorPayload);
      throw new Error("Неуспешно изпращане.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[contact] Failed to send message", error);
    return NextResponse.json(
      { error: "Нещо се обърка. Моля, опитайте отново след малко." },
      { status: 500 }
    );
  }
}
