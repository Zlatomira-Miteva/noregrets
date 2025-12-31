import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { isActiveAdmin } from "@/lib/authz";
import { type OrderStatus, updateOrderWithAudit } from "@/lib/orders";
import { sendOrderStatusChangeEmail } from "@/lib/notify/email";

const updateSchema = z.object({
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  deliveryLabel: z.string().optional(),
  totalAmount: z.coerce.number().positive().optional(),
  status: z
    .enum(["PENDING", "IN_PROGRESS", "COMPLETED", "PAID", "FAILED", "CANCELLED"])
    .optional(),
});

export async function PATCH(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: { params: any },
) {
  const orderId = params?.orderId;
  const session = await getServerSession(authOptions);
  if (!isActiveAdmin(session)) {
    return NextResponse.json({ error: "Неупълномощен достъп." }, { status: 401 });
  }

  if (!orderId) {
    return NextResponse.json({ error: "Липсва ID на поръчката." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const updates = updateSchema.parse(body);

    const performedBy = session?.user?.operatorCode ?? session?.user?.email ?? "admin";
    const updated = await updateOrderWithAudit(orderId, updates, performedBy);
    if (!updated) {
      return NextResponse.json({ error: "Поръчката не е намерена." }, { status: 404 });
    }

    if (updated.changed && updates.status && updates.status !== "PENDING" && updated.order.customerEmail) {
      sendOrderStatusChangeEmail({
        to: updated.order.customerEmail,
        reference: updated.order.reference,
        newStatus: updates.status,
        previousStatus: updated.previousStatus,
        totalAmount: Number(updated.order.totalAmount),
        deliveryLabel: updated.order.deliveryLabel,
        items: updated.order.items,
      }).catch((err) => console.error("[admin.orders.patch.email]", err));
    }

    return NextResponse.json({
      order: {
        id: updated.order.id,
        reference: updated.order.reference,
        customerName: updated.order.customerName,
        customerEmail: updated.order.customerEmail,
        customerPhone: updated.order.customerPhone,
        deliveryLabel: updated.order.deliveryLabel,
        items: updated.order.items,
        totalAmount: Number(updated.order.totalAmount),
        status: updated.order.status,
        metadata: updated.order.metadata,
        createdAt: updated.order.createdAt,
        updatedAt: updated.order.updatedAt,
      },
    });
  } catch (error) {
    console.error("[admin.orders.patch]", error);
    return NextResponse.json({ error: "Неуспешно обновяване на поръчката." }, { status: 400 });
  }
}
