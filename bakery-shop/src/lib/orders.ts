import { Prisma, OrderStatus, type Order } from "@prisma/client";

import { prisma } from "@/lib/db";

type OrderItem = {
  name: string;
  price: number;
  quantity: number;
};

type CartItem = {
  name: string;
  qty: number;
  price: number;
  currency: string;
};

export type OrderPayload = {
  reference: string;
  amount: number;
  description?: string;
  deliveryLabel: string;
  items: OrderItem[];
  totalQuantity?: number;
  totalAmount?: number;
  createdAt?: string;
  customer: {
    firstName?: string;
    lastName?: string;
    email: string;
    phone: string;
    country?: string;
    city?: string;
    zip?: string;
    address?: string;
  };
  consents?: { termsAccepted?: boolean; marketing?: boolean };
  cart?: { items: CartItem[] };
};

type TransactionClient = Prisma.TransactionClient;

const decimal = (value: number) => new Prisma.Decimal(Number(value.toFixed(2)));

export type AdminOrderUpdateInput = {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryLabel?: string;
  totalAmount?: number;
  status?: OrderStatus;
  metadata?: Record<string, unknown> | null;
};

const serializeOrder = (order: Order) => ({
  id: order.id,
  reference: order.reference,
  customerName: order.customerName,
  customerEmail: order.customerEmail,
  customerPhone: order.customerPhone,
  deliveryLabel: order.deliveryLabel,
  totalAmount: order.totalAmount instanceof Prisma.Decimal ? order.totalAmount.toNumber() : Number(order.totalAmount),
  status: order.status,
  items: order.items,
  metadata: order.metadata ?? null,
  createdAt: order.createdAt.toISOString(),
  updatedAt: order.updatedAt.toISOString(),
});

const appendAuditLog = async (
  tx: TransactionClient,
  orderId: string,
  action: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oldValue: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newValue: any,
  performedBy?: string,
) => {
  return tx.orderAuditLog.create({
    data: {
      orderId,
      action,
      oldValue,
      newValue,
      performedBy,
    },
  });
};

const buildMetadata = (payload: OrderPayload) => {
  const metadata = {
    description: payload.description,
    totalQuantity: payload.totalQuantity,
    consents: payload.consents,
    cart: payload.cart,
    customerLocation: {
      country: payload.customer.country,
      city: payload.customer.city,
      zip: payload.customer.zip,
      address: payload.customer.address,
    },
    clientCreatedAt: payload.createdAt,
  };

  // Strip undefined values to keep the JSON tidy.
  return JSON.parse(JSON.stringify(metadata));
};

export async function saveOrderWithAudit(payload: OrderPayload, performedBy?: string) {
  const customerName =
    `${payload.customer.firstName ?? ""} ${payload.customer.lastName ?? ""}`.trim() ||
    payload.customer.email;
  const rawAmount = Number(payload.totalAmount ?? payload.amount);
  const amount = Number.isFinite(rawAmount) ? rawAmount : 0;
  const metadata = buildMetadata(payload);
  const statusForRetry = (existing?: Order | null) => {
    if (!existing) return OrderStatus.PENDING;
    if (existing.status === OrderStatus.PAID) return OrderStatus.PAID;
    if (existing.status === OrderStatus.COMPLETED) return OrderStatus.COMPLETED;
    if (existing.status === OrderStatus.IN_PROGRESS) return OrderStatus.IN_PROGRESS;
    // If previously failed/cancelled, re-arm to pending for a retry
    return OrderStatus.PENDING;
  };

  return prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({ where: { reference: payload.reference } });
    const data = {
      reference: payload.reference,
      customerName,
      customerEmail: payload.customer.email,
      customerPhone: payload.customer.phone,
      deliveryLabel: payload.deliveryLabel,
      items: payload.items as Prisma.InputJsonValue,
      totalAmount: decimal(amount),
      status: statusForRetry(existing),
      metadata: metadata as Prisma.InputJsonValue,
    };

    const order = existing
      ? await tx.order.update({ where: { id: existing.id }, data })
      : await tx.order.create({ data });

    const oldSnapshot = existing ? serializeOrder(existing) : null;
    const newSnapshot = serializeOrder(order);

    await appendAuditLog(
      tx,
      order.id,
      existing ? "order_updated" : "order_created",
      oldSnapshot,
      newSnapshot,
      performedBy ?? payload.customer.email,
    );

    return order;
  });
}

export async function updateOrderStatusWithAudit(
  reference: string,
  nextStatus: OrderStatus,
  performedBy?: string,
  context?: Record<string, unknown>,
): Promise<{ order: Order; previousStatus: OrderStatus; changed: boolean } | null> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { reference } });
    if (!order) return null;

    if (order.status === nextStatus) {
      await appendAuditLog(
        tx,
        order.id,
        "status_checked",
        { status: order.status },
        { status: nextStatus, context },
        performedBy,
      );
      return { order, previousStatus: order.status, changed: false };
    }

    const updated = await tx.order.update({
      where: { id: order.id },
      data: { status: nextStatus },
    });

    await appendAuditLog(
      tx,
      updated.id,
      "status_changed",
      { status: order.status },
      { status: updated.status, context },
      performedBy,
    );

    return { order: updated, previousStatus: order.status, changed: order.status !== updated.status };
  });
}

export async function updateOrderWithAudit(
  orderId: string,
  updates: AdminOrderUpdateInput,
  performedBy?: string,
): Promise<{ order: Order; previousStatus: OrderStatus; changed: boolean } | null> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) return null;

    const data: Prisma.OrderUpdateInput = {};

    if (updates.customerName !== undefined) data.customerName = updates.customerName;
    if (updates.customerEmail !== undefined) data.customerEmail = updates.customerEmail;
    if (updates.customerPhone !== undefined) data.customerPhone = updates.customerPhone;
    if (updates.deliveryLabel !== undefined) data.deliveryLabel = updates.deliveryLabel;
    if (updates.totalAmount !== undefined) data.totalAmount = decimal(updates.totalAmount);
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.metadata !== undefined) data.metadata = updates.metadata as Prisma.InputJsonValue;

    if (Object.keys(data).length === 0) return { order, previousStatus: order.status, changed: false };

    const before = serializeOrder(order);
    const updated = await tx.order.update({ where: { id: order.id }, data });
    const after = serializeOrder(updated);

    await appendAuditLog(tx, order.id, "order_updated_admin", before, after, performedBy);

    return {
      order: updated,
      previousStatus: order.status,
      changed: updates.status !== undefined ? updates.status !== order.status : false,
    };
  });
}
