import { NextResponse } from "next/server";
import { z } from "zod";

const {
  RESEND_API_KEY,
  CONTACT_FROM = "No Regrets <hello@noregrets.bg>",
  ORDER_NOTIFICATION_RECIPIENT = "zlati@noregrets.bg",
} = process.env;

const orderSchema = z.object({
  reference: z.string().optional(),
  amount: z.number().optional(),
  description: z.string().optional(),
  customer: z
    .object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  deliveryLabel: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().optional(),
        price: z.number().optional(),
      })
    )
    .optional(),
  totalAmount: z.number().optional(),
  totalQuantity: z.number().optional(),
  createdAt: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    if (!RESEND_API_KEY) {
      console.error("[orders.notify] Missing RESEND_API_KEY");
      return NextResponse.json({ error: "Email service not configured." }, { status: 500 });
    }

    const payload = await request.json();
    const parsed = orderSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const data = parsed.data;
    const customerName = `${data.customer?.firstName ?? ""} ${data.customer?.lastName ?? ""}`.trim();
    const itemsText = (data.items ?? [])
      .map((item) => `${item.name}${item.quantity ? ` × ${item.quantity}` : ""}`)
      .join("\n");

    const lines = [
      `Поръчка: ${data.reference ?? "(без номер)"}`,
      data.createdAt ? `Дата: ${new Date(data.createdAt).toLocaleString("bg-BG")}` : null,
      data.deliveryLabel ? `Доставка: ${data.deliveryLabel}` : null,
      data.totalAmount ? `Общо: ${data.totalAmount.toFixed(2)} лв.` : null,
      data.totalQuantity ? `Брой артикули: ${data.totalQuantity}` : null,
      "",
      "Клиент:",
      customerName || "(не е попълнено)",
      data.customer?.email ? `Имейл: ${data.customer.email}` : null,
      data.customer?.phone ? `Телефон: ${data.customer.phone}` : null,
      "",
      "Продукти:",
      itemsText || "(няма данни)",
    ]
      .filter(Boolean)
      .join("\n");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: CONTACT_FROM,
        to: [ORDER_NOTIFICATION_RECIPIENT],
        subject: `Нова онлайн поръчка ${data.reference ?? ""}`.trim(),
        text: lines,
        html: lines.replace(/\n/g, "<br />"),
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      console.error("[orders.notify] Resend error", errorPayload);
      throw new Error("Failed to send notification email");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[orders.notify]", error);
    return NextResponse.json({ error: "Неуспешно изпращане на уведомлението." }, { status: 500 });
  }
}
