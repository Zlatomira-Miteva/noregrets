import { ORDER_STATUS, deleteOrderByReference, updateOrderStatusWithAudit } from "@/lib/orders";
import { createSalesDocumentByReference, recordPaymentByReference } from "@/lib/n18";
import { sendOrderStatusChangeEmail, sendOrderEmail } from "@/lib/notify/email";
import { formatPrice } from "@/utils/price";
import { pgPool } from "@/lib/pg";

const okResponse = () =>
  new Response("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });

const persistTransactionId = async (reference: string, transactionId: string | undefined | null) => {
  if (!transactionId) return;
  const client = await pgPool.connect();
  try {
    // Try to set both metadata and column; fall back to metadata-only if column is missing.
    try {
      await client.query(
        `UPDATE "Order"
         SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{paymentTransactionId}', to_jsonb($2::text), true),
             "paymentTransactionId" = $2
         WHERE reference = $1`,
        [reference, transactionId],
      );
    } catch {
      await client.query(
        `UPDATE "Order"
         SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{paymentTransactionId}', to_jsonb($2::text), true)
         WHERE reference = $1`,
        [reference, transactionId],
      );
    }
  } catch (err) {
    console.error("[mypos.result.persistTransactionId]", err);
  } finally {
    client.release();
  }
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const entries = Object.fromEntries(
      Array.from(formData.entries()).map(([key, value]) => [key.toString(), typeof value === "string" ? value : String(value)]),
    );

    // Temp debug to inspect gateway payload in prod.
    console.log("[mypos.result] entries", entries);

    const reference =
      entries.orderReference ||
      entries.OrderReference ||
      entries.orderID ||
      entries.OrderID ||
      entries.orderid ||
      entries.OrderId ||
      null;

    const statusRaw =
      entries.status ??
      entries.Status ??
      entries.STATUS ??
      entries.paymentStatus ??
      entries.PaymentStatus ??
      entries.result ??
      entries.Result ??
      entries.RESULT ??
      (entries.IPCmethod === "IPCPurchaseNotify" ? "SUCCESS" : null);
    const status = statusRaw?.toString().toUpperCase();

    if (!reference || !status) {
      console.warn("[mypos.result] missing reference or status", { reference, status, ipcMethod: entries.IPCmethod, entries });
      // Still acknowledge to myPOS to avoid retries.
      return okResponse();
    }

    const successStatuses = new Set(["SUCCESS", "SUCCESSFUL", "OK", "APPROVED", "AUTHORISED", "AUTHORIZED", "PAID"]);
    const failedStatuses = new Set(["FAILED", "FAIL", "DECLINED", "ERROR"]);
    const cancelledStatuses = new Set(["CANCELED", "CANCELLED", "CANCEL", "VOID", "EXPIRED"]);

    const nextStatus = (() => {
      if (successStatuses.has(status)) return ORDER_STATUS.PAID;
      if (failedStatuses.has(status)) return ORDER_STATUS.FAILED;
      if (cancelledStatuses.has(status)) return ORDER_STATUS.CANCELLED;
      return null; // Unknown status: acknowledge but do not change.
    })();

    const rawPayload = entries;

    if (nextStatus === ORDER_STATUS.FAILED || nextStatus === ORDER_STATUS.CANCELLED) {
      await deleteOrderByReference(reference, "mypos-callback", `gateway-status:${status}`).catch((err) =>
        console.error("[mypos.result.delete]", err),
      );
      return okResponse();
    }

    if (!nextStatus) {
      return okResponse();
    }

    const result = await updateOrderStatusWithAudit(reference, nextStatus, "mypos-callback", {
      statusFromGateway: status,
      payload: rawPayload,
    });

    // Mirror payment into N18 tables
    if (nextStatus === ORDER_STATUS.PAID) {
      const transactionId =
        entries.IPC_Trnref || entries.ipc_trnref || entries.Trnref || entries.trnref || entries.TransactionID || reference;
      const amount = Number(entries.Amount ?? entries.amount ?? 0) || (result?.order?.totalAmount ?? 0);
      await recordPaymentByReference({
        reference,
        transactionId: String(transactionId ?? reference),
        amount,
        status: "paid",
        paidAt: new Date(),
      }).catch((err) => console.error("[mypos.result.payment-mirror]", err));

      await persistTransactionId(reference, transactionId as string | undefined);

      // Generate sales document (чл.52о)
      await createSalesDocumentByReference({
        reference,
        documentType: "N18_CH52O",
      }).catch((err) => console.error("[mypos.result.sales-doc]", err));
    }

    if (result && result.order.customerEmail && result.order.status === ORDER_STATUS.PAID) {
      sendOrderStatusChangeEmail({
        to: result.order.customerEmail,
        reference: result.order.reference,
        newStatus: result.order.status,
        previousStatus: result.previousStatus,
        totalAmount: Number(result.order.totalAmount),
        deliveryLabel: result.order.deliveryLabel,
        items: result.order.items,
      }).catch((err) => console.error("[mypos.result.email]", err));
    }

    // Notify admin on failed/cancelled payments to spot issues quickly.
    if (
      result?.changed &&
      (result.order.status === ORDER_STATUS.FAILED || result.order.status === ORDER_STATUS.CANCELLED)
    ) {
      const subject = `myPOS плащане неуспешно: ${result.order.reference}`;
      const lines = [
        `Поръчка: ${result.order.reference}`,
        `Статус: ${result.order.status}`,
        `Клиент: ${result.order.customerName} (${result.order.customerEmail})`,
        `Сума: ${formatPrice(result.order.totalAmount)}`,
        result.order.deliveryLabel ? `Доставка: ${result.order.deliveryLabel}` : null,
        `Gateway status: ${status}`,
      ]
        .filter(Boolean)
        .join("\n");

      sendOrderEmail({
        to: process.env.ORDER_NOTIFICATION_RECIPIENT ?? "zlati.noregrets@gmail.com",
        subject,
        html: lines.replace(/\n/g, "<br>"),
        text: lines,
      }).catch((err) => console.error("[mypos.result.admin-email]", err));
    }

    return okResponse();
  } catch (error) {
    console.error("myPOS callback failed", error);
    return okResponse();
  }
}
