// src/app/api/checkout/success/route.ts

import { ORDER_STATUS, updateOrderStatusWithAudit } from "@/lib/orders";
import { sendOrderStatusChangeEmail, sendOrderEmail } from "@/lib/notify/email";
import { formatPrice } from "@/utils/price";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const extractReference = async (request: Request): Promise<string | null> => {
  const url = new URL(request.url);
  const fromQuery =
    url.searchParams.get("reference") ||
    url.searchParams.get("orderReference") ||
    url.searchParams.get("OrderID") ||
    url.searchParams.get("orderid") ||
    url.searchParams.get("OrderId");
  if (fromQuery) return fromQuery;

  if (request.method === "POST") {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const fromForm =
        form.get("reference") ||
        form.get("orderReference") ||
        form.get("OrderID") ||
        form.get("orderid") ||
        form.get("OrderId");
      if (fromForm) return fromForm.toString();
    }
  }
  return null;
};

const buildHtml = (redirectPath: string) => `<!doctype html>
<html lang="bg">
<head>
  <meta charset="utf-8" />
  <title>Плащането е успешно</title>
  <meta http-equiv="refresh" content="0;url=${redirectPath}" />
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:#fff5f7;
      display:flex;
      align-items:center;
      justify-content:center;
      min-height:100vh;
      margin:0;
    }
    .card {
      background:white;
      padding:2rem 2.5rem;
      border-radius:18px;
      box-shadow:0 10px 40px rgba(0,0,0,0.08);
      text-align:center;
      max-width:360px;
    }
    h1 { color:#5f000b; margin-bottom:0.5rem; }
    p { margin:0.25rem 0; color:#444; }
    a {
      display:inline-block;
      margin-top:1.5rem;
      padding:0.7rem 1.4rem;
      border-radius:999px;
      background:#5f000b;
      color:white;
      text-decoration:none;
      font-weight:600;
      text-transform:uppercase;
      font-size:0.8rem;
      letter-spacing:0.06em;
    }
  </style>
  <script>
    (function(){
      try {
        window.localStorage.removeItem("noregrets-cart");
        window.sessionStorage.removeItem("pendingOrder");
        window.sessionStorage.removeItem("newsletterCaptured");
      } catch (e) {
        // ignore storage errors
      }
      window.location.replace(${JSON.stringify(redirectPath)});
    })();
  </script>
</head>
<body>
  <div class="card">
    <h1>Плащането е успешно 🎉</h1>
    <p>Благодарим ти за поръчката!</p>
    <p>Ще ти изпратим имейл с подробности.</p>
    <a href="${redirectPath}">Към магазина</a>
  </div>
</body>
</html>`;

const respond = (redirectPath: string) =>
  new Response(buildHtml(redirectPath), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

const updateStatusAndEmail = async (reference: string) => {
  const result = await updateOrderStatusWithAudit(reference, ORDER_STATUS.PAID, "mypos-success", {
    source: "success-url",
  });

  if (result && result.order.customerEmail && result.order.status === ORDER_STATUS.PAID) {
    sendOrderStatusChangeEmail({
      to: result.order.customerEmail,
      reference: result.order.reference,
      newStatus: result.order.status,
      previousStatus: result.previousStatus,
      totalAmount: Number(result.order.totalAmount),
      deliveryLabel: result.order.deliveryLabel,
      items: result.order.items,
    }).catch((err) => console.error("[checkout.success.email]", err));
  }

  if (result?.changed && (result.order.status === ORDER_STATUS.FAILED || result.order.status === ORDER_STATUS.CANCELLED)) {
    const subject = `myPOS плащане неуспешно: ${result.order.reference}`;
    const lines = [
      `Поръчка: ${result.order.reference}`,
      `Статус: ${result.order.status}`,
      `Клиент: ${result.order.customerName} (${result.order.customerEmail})`,
      `Сума: ${formatPrice(result.order.totalAmount)}`,
      result.order.deliveryLabel ? `Доставка: ${result.order.deliveryLabel}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    // sendOrderEmail({
    //   to: process.env.ORDER_NOTIFICATION_RECIPIENT ?? "zlati.noregrets@gmail.com",
    //   subject,
    //   html: lines.replace(/\n/g, "<br>"),
    //   text: lines,
    // }).catch((err) => console.error("[checkout.success.admin-email]", err));
  }
};

const handle = async (request: Request) => {
  const reference = await extractReference(request);
  if (reference) {
    updateStatusAndEmail(reference).catch((err) => console.error("[checkout.success] update failed", err));
  }
  const redirectPath = reference ? `/checkout/success?reference=${encodeURIComponent(reference)}` : "/checkout/success";
  return respond(redirectPath);
};

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
