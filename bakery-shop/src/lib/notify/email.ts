import { ORDER_STATUS, type OrderStatus } from "@/lib/orders";
import { formatPrice } from "@/utils/price";

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
  CONTACT_FROM = "No Regrets <info@noregrets.bg>",
  ORDER_NOTIFICATION_RECIPIENT = "info@noregrets.bg",
} = process.env;

const BRAND_BG = "#ffefed";
const BRAND_TEXT = "#2d1b1b";
const BRAND_CARD = "#ffffff";

// Hardcoded absolute logo URL (PNG/SVG-safe for email clients)
const logoUrl = "https://noregrets.bg/no-regrets-logo.svg";
const APP_ORIGIN = "https://www.noregrets.bg";
const footerLinks = [
  { label: "ЧЗВ", url: `${APP_ORIGIN}/faq` },
  { label: "Политика за доставки", url: `${APP_ORIGIN}/shipping-policy` },
  { label: "Общи условия", url: `${APP_ORIGIN}/terms` },
];

type BrandEmailInput = {
  title: string;
  greetingName?: string | null;
  introLines: string[];
  orderReference?: string | null;
  orderLines?: string[];
  itemsLines?: string[];
  deliveryLines?: string[];
  customerLines?: string[];
  footerNote?: string;
};

export const buildBrandedEmail = ({
  title,
  greetingName,
  introLines,
  orderReference,
  orderLines,
  itemsLines,
  deliveryLines,
  customerLines,
  footerNote,
}: BrandEmailInput) => {
  const salutation = `Здравейте${greetingName ? `, ${greetingName}` : ""}!`;
  const sections: Array<{ heading: string; lines: string[] }> = [];

  const itemsClean = (itemsLines ?? []).filter(Boolean);
  const orderMeta = (orderLines ?? []).filter(Boolean);
  const deliveryMeta = (deliveryLines ?? []).filter(Boolean);
  const customerMeta = (customerLines ?? []).filter(Boolean);

  if (itemsClean.length) sections.push({ heading: "Детайли за поръчка", lines: itemsClean });
  if (orderMeta.length) sections.push({ heading: "Резюме", lines: orderMeta });
  if (deliveryMeta.length) sections.push({ heading: "Доставка / Вземане", lines: deliveryMeta });
  if (customerMeta.length) sections.push({ heading: "Контакт", lines: customerMeta });

  const defaultFooterNote =
    footerNote ??
    "Изпращаме поръчки от понеделник до четвъртък. Не изпращаме в петък, за да пристигнат продуктите максимално свежи.";

  const textSections = [
    salutation,
    title,
    ...introLines,
    orderReference ? `Номер на поръчка: ${orderReference}` : null,
    "",
    ...sections.flatMap((section) => [section.heading, ...section.lines, ""]),
    defaultFooterNote,
    "Взимането от ателието е възможно само между 16:00 и 18:00 часа в делнични дни и от 12:00 до 17:00 часа в събота. Невзети поръчки в обявените часове могат да се вземат на следващия ден в обявените работни часове.",
    "",
    `Поздрави,\nЗлати от No Regrets`,
    `www.noregrets.bg`,
    `Email: info@noregrets.bg`,
  ].filter(Boolean) as string[];

  const text = textSections.join("\n");

  const htmlSections = sections
    .map(
      (section) => `
        <div style="margin-top:20px;padding:16px;border:1px solid #f5d5d6;border-radius:16px;background:${BRAND_CARD};">
          <p style="margin:0 0 8px 0;font-weight:700;color:${BRAND_TEXT};font-size:14px;letter-spacing:0.02em;text-transform:uppercase;">${section.heading}</p>
          ${section.lines
            .map(
              (line) =>
                `<p style="margin:4px 0;font-size:14px;color:${BRAND_TEXT};line-height:1.5;">${line.replace(/\n/g, "<br/>")}</p>`,
            )
            .join("")}
        </div>
      `,
    )
    .join("");

  const linksHtml = footerLinks
    .map(
      (link) =>
        `<a href="${link.url}" style="color:${BRAND_TEXT};font-weight:600;text-decoration:none;margin-right:12px;">${link.label}</a>`,
    )
    .join("");

  const html = `
  <body style="margin:0;padding:0;background:${BRAND_BG};" bgcolor="${BRAND_BG}">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="${BRAND_BG}" style="background:${BRAND_BG};padding:0;margin:0;font-family:Arial,sans-serif;color:${BRAND_TEXT};">
    <tr>
      <td align="center" bgcolor="${BRAND_BG}" style="padding:28px 0;background:${BRAND_BG};">
        <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;padding:0 20px;">
          <tr>
            <td align="center" style="padding-bottom:16px;">
              <img src="${logoUrl}" alt="No Regrets" style="height:52px;display:block;margin:0 auto;" />
            </td>
          </tr>
          <tr>
            <td style="background:${BRAND_CARD};border-radius:24px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,0.05);">
              <p style="margin:0 0 6px 0;color:${BRAND_TEXT};font-size:14px;">${salutation}</p>
              <h1 style="margin:4px 0 12px 0;font-size:20px;color:${BRAND_TEXT};">${title}</h1>
              ${introLines
                .map(
                  (line) =>
                    `<p style="margin:6px 0;font-size:14px;line-height:1.5;color:${BRAND_TEXT};">${line.replace(/\n/g, "<br/>")}</p>`,
                )
                .join("")}
              ${
                orderReference
                  ? `<p style="margin:10px 0 14px 0;font-size:14px;font-weight:600;">Номер на поръчка: ${orderReference}</p>`
                  : ""
              }
              ${htmlSections}
              <div style="margin-top:16px;padding:14px;border-radius:16px;background:${BRAND_BG};border:1px solid #f5d5d6;">
                <p style="margin:0 0 8px 0;font-weight:700;font-size:14px;">Важно за доставки и взимане</p>
                <p style="margin:4px 0;font-size:14px;line-height:1.5;">Изпращаме поръчки от понеделник до четвъртък. Не изпращаме в петък, за да пристигнат продуктите максимално свежи. Поръчки, направени след 15:00 ч. в четвъртък, се изпращат в следващия понеделник.</p>
                <p style="margin:4px 0;font-size:14px;line-height:1.5;">Взимането от ателието е възможно само между 16:00 и 18:00 часа в делнични дни и от 12:00 до 17:00 часа в събота. Невзети поръчки в обявените часове могат да се вземат на следващия ден в обявените работни часове.</p>
              </div>
              ${
                footerNote
                  ? `<p style="margin:12px 0 0 0;font-size:14px;line-height:1.5;">${footerNote}</p>`
                  : ""
              }
              <p style="margin:16px 0 0 0;font-size:14px;">Поздрави,<br/>Злати от No Regrets</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:16px;font-size:13px;color:${BRAND_TEXT};">
              <p style="margin:4px 0;">www.noregrets.bg · info@noregrets.bg</p>
              <p style="margin:8px 0 0 0;">${linksHtml}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  </body>
  `;

  return { html, text };
};

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
      ? normalizedItems.map((it) => `${it.name}: ${formatPrice(it.unitPrice)} x ${it.qty} = ${formatPrice(it.lineTotal)}`)
      : [];

  const statusExtra =
    newStatus === ORDER_STATUS.COMPLETED
      ? "Поръчката е приготвена и я изпращаме. Очаквайте я скоро."
      : "";

  const { html, text } = buildBrandedEmail({
    title: `Статус на поръчка ${reference}: ${statusLabel}`,
    orderReference: reference,
    greetingName: null,
    introLines: [
      `Благодарим Ви за покупката.`,
      `Статусът на вашата поръчка е променен: ${statusLabel}.`,
      previousLabel ? `Предишен статус: ${previousLabel}.` : "",
      statusExtra,
      typeof totalAmount === "number" ? `Обща сума: ${formatPrice(totalAmount)}` : "",
      deliveryLabel ? `Доставка: ${deliveryLabel}` : "",
    ].filter(Boolean),
    itemsLines,
    orderLines: [],
    deliveryLines: deliveryLabel ? [deliveryLabel] : [],
    customerLines: [],
  });

  const subject = `Статус на поръчка ${reference}: ${statusLabel}`;
  await sendOrderEmail({ to, subject, html, text });
}
