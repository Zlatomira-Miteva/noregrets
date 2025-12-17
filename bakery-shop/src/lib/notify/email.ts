import { ORDER_STATUS, type OrderStatus } from "@/lib/orders";

type OrderEmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type StatusEmailPayload = {
  to: string;
  reference: string;
  newStatus: OrderStatus;
  previousStatus?: OrderStatus;
  totalAmount?: number;
  deliveryLabel?: string;
  items?: unknown;
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Чака плащане",
  IN_PROGRESS: "В процес",
  COMPLETED: "Завършена",
  PAID: "Платена",
  FAILED: "Неуспешна",
  CANCELLED: "Отказана",
};

const {
  RESEND_API_KEY,
  CONTACT_FROM = "No Regrets <onboarding@resend.dev>",
  ORDER_NOTIFICATION_RECIPIENT = "zlati.noregrets@gmail.com",
} = process.env;

const sendEmailViaResend = async ({ to, subject, html, text }: OrderEmailPayload): Promise<void> => {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY missing; skipping send.", { to, subject });
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: CONTACT_FROM,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    console.error("[email] Resend error", { to, subject, errorPayload });
    throw new Error("Failed to send email");
  }
};

export async function sendOrderEmail({
  to,
  subject,
  html,
  text,
}: OrderEmailPayload): Promise<void> {
  if (!to) return;
  if (process.env.NODE_ENV !== "production") {
    console.info("sendOrderEmail called with:", { to, subject });
  }

  await sendEmailViaResend({ to, subject, html, text });
}

export async function sendOrderStatusChangeEmail({
  to,
  reference,
  newStatus,
  previousStatus,
  totalAmount,
  deliveryLabel,
  items,
}: StatusEmailPayload) {
  if (!to) return;
  if (newStatus === ORDER_STATUS.PENDING) return;
  const statusLabel = STATUS_LABELS[newStatus] ?? newStatus;
  const previousLabel = previousStatus ? STATUS_LABELS[previousStatus] ?? previousStatus : null;

  const normalizeItems = (raw: unknown, targetTotal?: number) => {
    const arr = Array.isArray(raw) ? raw : [];
    const parsed = arr
      .map((it) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const item = it as any;
        const name = typeof item?.name === "string" ? item.name : "(артикул)";
        const qty = Number(item?.quantity ?? item?.qty ?? 1) || 1;
        const price = Number(item?.price ?? 0) || 0;
        return { name, qty, price, line: price * qty };
      })
      .filter((it) => it.name);

    if (!parsed.length) return [];

    const subtotal = parsed.reduce((acc, it) => acc + it.line, 0);
    if (!targetTotal || subtotal <= 0) {
      return parsed.map((it) => ({
        name: it.name,
        qty: it.qty,
        unitPrice: it.price,
        lineTotal: Number(it.line.toFixed(2)),
      }));
    }

    const factor = targetTotal / subtotal;
    let remaining = Number(targetTotal.toFixed(2));

    const adjusted = parsed.map((it, idx) => {
      const isLast = idx === parsed.length - 1;
      const scaledLine = Number((it.line * factor).toFixed(2));
      const lineTotal = isLast ? Number(remaining.toFixed(2)) : scaledLine;
      const unitPrice = it.qty ? Number((lineTotal / it.qty).toFixed(2)) : 0;
      remaining = Number((remaining - lineTotal).toFixed(2));
      return { name: it.name, qty: it.qty, unitPrice, lineTotal };
    });

    return adjusted;
  };

  const normalizedItems = normalizeItems(items, totalAmount);
  const itemsLines =
    normalizedItems.length > 0
      ? normalizedItems.map(
          (it) => `${it.name}: ${it.unitPrice.toFixed(2)} лв x ${it.qty} = ${it.lineTotal.toFixed(2)} лв`,
        )
      : [];

  const lines = [
    `Здравейте,`,
    `Статусът на вашата поръчка ${reference} е променен: ${statusLabel}.`,
    previousLabel ? `Предишен статус: ${previousLabel}.` : null,
    typeof totalAmount === "number" ? `Обща сума: ${totalAmount.toFixed(2)} лв.` : null,
    deliveryLabel ? `Доставка: ${deliveryLabel}` : null,
    normalizedItems.length ? "" : null,
    ...itemsLines,
    "",
    `Ако имате въпроси, отговорете на този имейл или ни пишете на ${ORDER_NOTIFICATION_RECIPIENT}.`,
    "Поздрави,",
    "Злати от No Regrets",
  ].filter(Boolean);

  const contentLines = lines.filter((line): line is string => typeof line === "string");

  const text = contentLines.join("\n");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.noregrets.bg";
  const logoUrl = `${appUrl.replace(/\/+$/, "")}/logo.svg`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #2d1b1b;">
      <div style="margin-bottom: 12px;">
        <img src="${logoUrl}" alt="No Regrets" style="height: 48px;" />
      </div>
      ${contentLines
        .map((line) =>
          line === ""
            ? `<p style="margin: 8px 0;"></p>`
            : `<p style="margin: 4px 0;">${line.replace(/\n/g, "<br/>")}</p>`,
        )
        .join("")}
    </div>
  `;

  const subject = `Статус на поръчка ${reference}: ${statusLabel}`;

  await sendOrderEmail({ to, subject, html, text });
}
