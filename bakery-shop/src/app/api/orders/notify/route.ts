import { NextResponse } from "next/server";
import { z } from "zod";

import { sendOrderEmail } from "@/lib/notify/email";

const {
  RESEND_API_KEY,
  CONTACT_FROM = "No Regrets <onboarding@resend.dev>",
  ORDER_NOTIFICATION_RECIPIENT = "zlati.noregrets@gmail.com",
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
        options: z.array(z.string()).optional(),
      })
    )
    .optional(),
  cart: z
    .object({
      items: z
        .array(
          z.object({
            name: z.string(),
            qty: z.number().optional(),
            price: z.number().optional(),
            currency: z.string().optional(),
            options: z.array(z.string()).optional(),
          }),
        )
        .optional(),
    })
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

    const normalizeItems = (targetTotal?: number) => {
      const items = data.cart?.items ?? data.items ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsedItems = items.map((item: any) => {
        const qty = Number(item.quantity ?? item.qty ?? 1) || 1;
        const price = Number(item.price ?? 0) || 0;
        const options = Array.isArray(item.options)
          ? (item.options as string[])
              .map((opt) => (typeof opt === "string" ? opt.trim() : ""))
              .filter(Boolean)
          : [];
        return { name: item.name, qty, price, line: price * qty, options };
      });
      const subtotal = parsedItems.reduce((acc, it) => acc + it.line, 0);
      if (!targetTotal || subtotal <= 0) {
        return parsedItems.map((it) => ({
          name: it.name,
          qty: it.qty,
          unitPrice: it.price,
          lineTotal: Number(it.line.toFixed(2)),
          options: it.options,
        }));
      }
      const factor = targetTotal / subtotal;
      let remaining = Number(targetTotal.toFixed(2));
      return parsedItems.map((it, idx) => {
        const isLast = idx === parsedItems.length - 1;
        const scaled = Number((it.line * factor).toFixed(2));
        const lineTotal = isLast ? Number(remaining.toFixed(2)) : scaled;
        const unitPrice = it.qty ? Number((lineTotal / it.qty).toFixed(2)) : 0;
        remaining = Number((remaining - lineTotal).toFixed(2));
        return { name: it.name, qty: it.qty, unitPrice, lineTotal, options: it.options };
      });
    };

    const normalizedItems = normalizeItems(data.totalAmount);
    const itemsText = normalizedItems
      .map((item) => {
        const base = `${item.name}: ${item.unitPrice.toFixed(2)} лв x ${item.qty} = ${item.lineTotal.toFixed(2)} лв`;
        const opts =
          item.options && item.options.length
            ? item.options.map((opt) => `  - ${opt}`).join("\n")
            : "";
        return opts ? `${base}\n${opts}` : base;
      })
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
      console.error("[orders.notify] Resend error", {
        status: response.status,
        errorPayload,
        reference: data.reference,
      });
      return NextResponse.json(
        { error: "Failed to send notification email", status: response.status },
        { status: 502 },
      );
    }

    // Also email the customer, if provided.
    if (data.customer?.email) {
      const customerLines = [
        `Здравейте${customerName ? `, ${customerName}` : ""}!`,
        `Получихме вашата поръчка ${data.reference ?? ""}.`,
        data.totalAmount ? `Обща сума: ${data.totalAmount.toFixed(2)} лв.` : null,
        data.deliveryLabel ? `Доставка: ${data.deliveryLabel}` : null,
        "",
        "Продукти:",
        itemsText || "(няма данни)",
      ]
        .filter(Boolean)
        .join("\n");

      sendOrderEmail({
        to: data.customer.email,
        subject: `Потвърждение за поръчка ${data.reference ?? ""}`.trim(),
        text: customerLines,
        html: customerLines.replace(/\n/g, "<br />"),
      }).catch((err) => console.error("[orders.notify.customer-email]", err));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[orders.notify] Unexpected error", error);
    return NextResponse.json({ error: "Неуспешно изпращане на уведомлението." }, { status: 500 });
  }
}
