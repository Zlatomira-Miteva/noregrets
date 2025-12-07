import { OrderStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { updateOrderStatusWithAudit } from "@/lib/orders";
import { sendOrderStatusChangeEmail, sendOrderEmail } from "@/lib/notify/email";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const reference = formData.get("orderReference")?.toString();
    const status = formData.get("status")?.toString()?.toUpperCase();

    if (!reference) {
      return NextResponse.json({ error: "Missing reference." }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: "Missing status." }, { status: 400 });
    }

    const nextStatus =
      status === "SUCCESS"
        ? OrderStatus.PAID
        : status === "FAILED"
          ? OrderStatus.FAILED
          : status === "CANCELED"
            ? OrderStatus.CANCELLED
            : null;

    if (!nextStatus) {
      return NextResponse.json({ error: "Unsupported status." }, { status: 400 });
    }

    const rawPayload = Object.fromEntries(
      Array.from(formData.entries()).map(([key, value]) => [key, typeof value === "string" ? value : String(value)]),
    );

    const result = await updateOrderStatusWithAudit(reference, nextStatus, "mypos-callback", {
      statusFromGateway: status,
      payload: rawPayload,
    });

    if (!result) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (result.changed && result.order.customerEmail && result.order.status !== OrderStatus.PENDING) {
      sendOrderStatusChangeEmail({
        to: result.order.customerEmail,
        reference: result.order.reference,
        newStatus: result.order.status,
        previousStatus: result.previousStatus,
        totalAmount: Number(result.order.totalAmount),
        deliveryLabel: result.order.deliveryLabel,
      }).catch((err) => console.error("[mypos.result.email]", err));
    }

    // Notify admin on failed/cancelled payments to spot issues quickly.
    if (result.changed && (result.order.status === OrderStatus.FAILED || result.order.status === OrderStatus.CANCELLED)) {
      const subject = `myPOS плащане неуспешно: ${result.order.reference}`;
      const lines = [
        `Поръчка: ${result.order.reference}`,
        `Статус: ${result.order.status}`,
        `Клиент: ${result.order.customerName} (${result.order.customerEmail})`,
        `Сума: ${result.order.totalAmount.toFixed(2)} лв.`,
        result.order.deliveryLabel ? `Доставка: ${result.order.deliveryLabel}` : null,
        `Gateway status: ${status}`,
      ]
        .filter(Boolean)
        .join("\n");

      sendOrderEmail({
        to: process.env.ORDER_NOTIFICATION_RECIPIENT ?? "zlati@noregrets.bg",
        subject,
        html: lines.replace(/\n/g, "<br>"),
        text: lines,
      }).catch((err) => console.error("[mypos.result.admin-email]", err));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("myPOS callback failed", error);
    return NextResponse.json({ error: "Callback error." }, { status: 500 });
  }
}
