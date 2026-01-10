import { randomUUID } from "node:crypto";

import { pgPool } from "@/lib/pg";
import { upsertOrderSnapshot } from "@/lib/n18";

export const ORDER_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  PAID: "PAID",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

type OrderItem = {
  name: string;
  price: number;
  quantity: number;
  options?: string[];
  pricePaid?: number;
  originalPrice?: number;
  lineTotal?: number;
  productId?: string;
};

type CartItem = {
  name: string;
  qty: number;
  price: number;
  currency: string;
  options?: string[];
};

export type OrderPayload = {
  reference: string;
  amount: number;
  description?: string;
  deliveryLabel: string;
  couponCode?: string;
  discountAmount?: number;
  subtotal?: number;
  originalItems?: Array<{
    name: string;
    quantity: number;
    originalPrice: number;
    options?: string[];
    productId?: string;
  }>;
  coupon?: {
    code: string;
    discountType: string;
    discountValue: number;
    maximumDiscountAmount: number | null;
    minimumOrderAmount: number;
    discountAmount: number;
  };
  items: OrderItem[];
  userId?: string | null;
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

export type AdminOrderUpdateInput = {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryLabel?: string;
  totalAmount?: number;
  status?: OrderStatus;
  metadata?: Record<string, unknown> | null;
  refundAmount?: number | null;
  refundMethod?: string | null;
  refundAt?: string | null;
};

export type OrderRecord = {
  id: string;
  userId?: string | null;
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryLabel: string;
  items: unknown;
  totalAmount: number;
  status: OrderStatus;
  paymentUrl: string | null;
  metadata: unknown;
  discountAmount?: number | null;
  subtotal?: number | null;
  paymentTransactionId?: string | null;
  refundAmount?: number | null;
  refundMethod?: string | null;
  refundAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

const decimal = (value: number) => Number(value.toFixed(2));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializeOrder = (row: any): OrderRecord => ({
  id: row.id,
  userId: row.userId ?? row.userid ?? null,
  reference: row.reference,
  customerName: row.customerName ?? row.customername,
  customerEmail: row.customerEmail ?? row.customeremail,
  customerPhone: row.customerPhone ?? row.customerphone,
  deliveryLabel: row.deliveryLabel ?? row.deliverylabel,
  items: row.items,
  totalAmount: Number(row.totalAmount ?? row.totalamount),
  status: row.status,
  paymentUrl: row.paymentUrl ?? row.paymenturl ?? null,
  metadata: row.metadata ?? null,
  refundAmount: row.refundAmount ?? row.refundamount ?? null,
  refundMethod: row.refundMethod ?? row.refundmethod ?? null,
  refundAt:
    row.refundAt instanceof Date
      ? row.refundAt.toISOString()
      : row.refundat instanceof Date
        ? row.refundat.toISOString()
        : row.refundAt || row.refundat
          ? new Date(row.refundAt ?? row.refundat).toISOString()
          : null,
  createdAt:
    row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : row.createdat instanceof Date
        ? row.createdat.toISOString()
        : new Date(row.createdAt ?? row.createdat).toISOString(),
  updatedAt:
    row.updatedAt instanceof Date
      ? row.updatedAt.toISOString()
      : row.updatedat instanceof Date
        ? row.updatedat.toISOString()
        : new Date(row.updatedAt ?? row.updatedat).toISOString(),
  discountAmount:
    row.discountAmount ?? row.discountamount ?? (row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>).discountAmount ?? null
      : null),
  subtotal:
    row.subtotal ?? (row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>).subtotal ?? null
      : null),
  paymentTransactionId:
    row.paymentTransactionId ??
    row.paymenttransactionid ??
    (row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>).paymentTransactionId ?? null
      : null),
});

export async function getOrderByReference(reference: string): Promise<OrderRecord | null> {
  const client = await pgPool.connect();
  try {
    const res = await client.query(`SELECT * FROM "Order" WHERE reference = $1 LIMIT 1`, [reference]);
    if (!res.rows.length) return null;
    return serializeOrder(res.rows[0]);
  } finally {
    client.release();
  }
}

const appendAuditLog = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  orderId: string,
  action: string,
  oldValue: unknown,
  newValue: unknown,
  performedBy?: string,
) => {
  await client.query(
    `INSERT INTO "OrderAuditLog" (id,"orderId","action","oldValue","newValue","performedBy") VALUES ($1,$2,$3,$4,$5,$6)`,
    [randomUUID(), orderId, action, oldValue ?? null, newValue ?? null, performedBy ?? null],
  );
};

const buildMetadata = (payload: OrderPayload) => {
  const metadata = {
    description: payload.description,
    totalQuantity: payload.totalQuantity,
    subtotal: payload.subtotal,
    discountAmount: payload.discountAmount,
    originalItems: payload.originalItems ?? null,
    consents: payload.consents,
    cart: payload.cart,
    coupon: payload.couponCode || payload.coupon
      ? {
          code: payload.coupon?.code ?? payload.couponCode ?? null,
          discountType: payload.coupon?.discountType ?? null,
          discountValue: payload.coupon?.discountValue ?? null,
          maximumDiscountAmount: payload.coupon?.maximumDiscountAmount ?? null,
          minimumOrderAmount: payload.coupon?.minimumOrderAmount ?? null,
          discountAmount:
            payload.discountAmount ??
            payload.coupon?.discountAmount ??
            null,
          subtotal: payload.subtotal ?? null,
        }
      : null,
    customerLocation: {
      country: payload.customer.country,
      city: payload.customer.city,
      zip: payload.customer.zip,
      address: payload.customer.address,
    },
    clientCreatedAt: payload.createdAt,
  };

  return JSON.parse(JSON.stringify(metadata));
};

export async function saveOrderWithAudit(payload: OrderPayload, performedBy?: string) {
  const customerName =
    `${payload.customer.firstName ?? ""} ${payload.customer.lastName ?? ""}`.trim() || payload.customer.email;
  const rawAmount = Number(payload.totalAmount ?? payload.amount);
  const amount = Number.isFinite(rawAmount) ? rawAmount : 0;
  const metadata = buildMetadata(payload);

  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    const existingRes = await client.query(`SELECT * FROM "Order" WHERE reference = $1 LIMIT 1`, [
      payload.reference,
    ]);
    const existing = existingRes.rows[0] ? serializeOrder(existingRes.rows[0]) : null;

    const nextStatus = (() => {
      if (!existing) return "PENDING";
      if (existing.status === "PAID") return "PAID";
      if (existing.status === "COMPLETED") return "COMPLETED";
      if (existing.status === "IN_PROGRESS") return "IN_PROGRESS";
      return "PENDING";
    })() as OrderStatus;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderRow: any;
    if (existing) {
      try {
        const updateRes = await client.query(
          `UPDATE "Order"
           SET "customerName"=$1,"customerEmail"=$2,"customerPhone"=$3,"deliveryLabel"=$4,"items"=$5,"totalAmount"=$6,"status"=$7,"metadata"=$8,"discountAmount"=$9,"subtotal"=$10,"userId"=COALESCE($11,"userId"),"updatedAt"=NOW()
           WHERE id=$12
           RETURNING *`,
          [
            customerName,
            payload.customer.email,
            payload.customer.phone,
            payload.deliveryLabel,
            JSON.stringify(payload.items),
            decimal(amount),
            nextStatus,
            metadata,
            payload.discountAmount != null ? decimal(payload.discountAmount) : null,
            payload.subtotal != null ? decimal(payload.subtotal) : null,
            payload.userId ?? null,
            existing.id,
          ],
        );
        orderRow = updateRes.rows[0];
      } catch (err) {
        // Fallback for deployments without the new columns: restart transaction and retry.
        await client.query("ROLLBACK");
        await client.query("BEGIN");
        const updateRes = await client.query(
          `UPDATE "Order"
           SET "customerName"=$1,"customerEmail"=$2,"customerPhone"=$3,"deliveryLabel"=$4,"items"=$5,"totalAmount"=$6,"status"=$7,"metadata"=$8,"userId"=COALESCE($9,"userId"),"updatedAt"=NOW()
           WHERE id=$10
           RETURNING *`,
          [
            customerName,
            payload.customer.email,
            payload.customer.phone,
            payload.deliveryLabel,
            JSON.stringify(payload.items),
            decimal(amount),
            nextStatus,
            metadata,
            payload.userId ?? null,
            existing.id,
          ],
        );
        orderRow = updateRes.rows[0];
      }
    } else {
      const newOrderId = randomUUID();
      try {
        const insertRes = await client.query(
          `INSERT INTO "Order"
           (id, reference, "customerName", "customerEmail", "customerPhone", "deliveryLabel", items, "totalAmount", status, metadata, "discountAmount", "subtotal", "userId", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, NOW())
           RETURNING *`,
          [
            newOrderId,
            payload.reference,
            customerName,
            payload.customer.email,
            payload.customer.phone,
            payload.deliveryLabel,
            JSON.stringify(payload.items),
            decimal(amount),
            nextStatus,
            metadata,
            payload.discountAmount != null ? decimal(payload.discountAmount) : null,
            payload.subtotal != null ? decimal(payload.subtotal) : null,
            payload.userId ?? null,
          ],
        );
        orderRow = insertRes.rows[0];
      } catch (err) {
        // Fallback for deployments without the new columns: restart transaction and retry.
        await client.query("ROLLBACK");
        await client.query("BEGIN");
        const insertRes = await client.query(
          `INSERT INTO "Order"
           (id, reference, "customerName", "customerEmail", "customerPhone", "deliveryLabel", items, "totalAmount", status, metadata, "userId", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, NOW())
           RETURNING *`,
          [
            newOrderId,
            payload.reference,
            customerName,
            payload.customer.email,
            payload.customer.phone,
            payload.deliveryLabel,
            JSON.stringify(payload.items),
            decimal(amount),
            nextStatus,
            metadata,
            payload.userId ?? null,
          ],
        );
        orderRow = insertRes.rows[0];
      }
    }

    const order = serializeOrder(orderRow);

    await appendAuditLog(
      client,
      order.id,
      existing ? "order_updated" : "order_created",
      existing,
      order,
      performedBy ?? payload.customer.email,
    );

    await client.query("COMMIT");

    // Mirror into N18-compliant snapshot tables (idempotent).
    try {
      await upsertOrderSnapshot({
        reference: order.reference,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryLabel,
        totalAmount: order.totalAmount,
        currency: payload.cart?.items?.[0]?.currency ?? "EUR",
        paymentMethod: "card",
        paymentStatus: "pending",
        items: payload.items.map((it) => ({
          name: it.name,
          quantity: it.quantity,
          price: it.price,
          taxGroup: "20%",
        })),
        createdAt: new Date(order.createdAt),
      });
    } catch (mirrorErr) {
      console.error("[orders.save] mirror to orders/order_items failed", mirrorErr);
    }

    return order;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateOrderStatusWithAudit(
  reference: string,
  nextStatus: OrderStatus,
  performedBy?: string,
  context?: Record<string, unknown>,
): Promise<{ order: OrderRecord; previousStatus: OrderStatus; changed: boolean } | null> {
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query(`SELECT * FROM "Order" WHERE reference = $1 LIMIT 1`, [reference]);
    if (!res.rows.length) {
      await client.query("ROLLBACK");
      return null;
    }
    const order = serializeOrder(res.rows[0]);
    if (order.status === nextStatus) {
      await appendAuditLog(
        client,
        order.id,
        "status_checked",
        { status: order.status },
        { status: nextStatus, context },
        performedBy,
      );
      await client.query("COMMIT");
      return { order, previousStatus: order.status, changed: false };
    }

    const updateRes = await client.query(
      `UPDATE "Order" SET status=$1, "updatedAt"=NOW() WHERE id=$2 RETURNING *`,
      [nextStatus, order.id],
    );
    const updated = serializeOrder(updateRes.rows[0]);

    await appendAuditLog(
      client,
      updated.id,
      "status_changed",
      { status: order.status },
      { status: updated.status, context },
      performedBy,
    );
    await client.query("COMMIT");
    return { order: updated, previousStatus: order.status, changed: order.status !== updated.status };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteOrderByReference(
  reference: string,
  performedBy?: string,
  reason?: string,
): Promise<boolean> {
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query(`SELECT * FROM "Order" WHERE reference = $1 LIMIT 1`, [reference]);
    if (!res.rows.length) {
      await client.query("ROLLBACK");
      return false;
    }
    const existing = serializeOrder(res.rows[0]);

    const metadata = {
      ...(existing.metadata ?? {}),
      cancelledReason: reason ?? null,
      cancelledBy: performedBy ?? null,
      cancelledAt: new Date().toISOString(),
    };

    const updateRes = await client.query(
      `UPDATE "Order"
       SET status=$2, metadata=$3, "updatedAt"=NOW()
       WHERE id=$1
       RETURNING *`,
      [existing.id, ORDER_STATUS.CANCELLED, metadata],
    );
    const updated = serializeOrder(updateRes.rows[0]);

    await appendAuditLog(client, existing.id, "order_marked_cancelled_instead_of_delete", existing, updated, performedBy);
    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateOrderWithAudit(
  orderId: string,
  updates: AdminOrderUpdateInput,
  performedBy?: string,
): Promise<{ order: OrderRecord; previousStatus: OrderStatus; changed: boolean } | null> {
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query(`SELECT * FROM "Order" WHERE id = $1 LIMIT 1`, [orderId]);
    if (!res.rows.length) {
      await client.query("ROLLBACK");
      return null;
    }
    const order = serializeOrder(res.rows[0]);

    const fields: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = [];
    let idx = 1;

    if (updates.customerName !== undefined) {
      fields.push(`"customerName"=$${++idx}`);
      values.push(updates.customerName);
    }
    if (updates.customerEmail !== undefined) {
      fields.push(`"customerEmail"=$${++idx}`);
      values.push(updates.customerEmail);
    }
    if (updates.customerPhone !== undefined) {
      fields.push(`"customerPhone"=$${++idx}`);
      values.push(updates.customerPhone);
    }
    if (updates.deliveryLabel !== undefined) {
      fields.push(`"deliveryLabel"=$${++idx}`);
      values.push(updates.deliveryLabel);
    }
    if (updates.totalAmount !== undefined) {
      fields.push(`"totalAmount"=$${++idx}`);
      values.push(decimal(updates.totalAmount));
    }
    if (updates.refundAmount !== undefined) {
      fields.push(`"refundAmount"=$${++idx}`);
      values.push(updates.refundAmount);
    }
    if (updates.refundMethod !== undefined) {
      fields.push(`"refundMethod"=$${++idx}`);
      values.push(updates.refundMethod);
    }
    if (updates.refundAt !== undefined) {
      fields.push(`"refundAt"=$${++idx}`);
      values.push(updates.refundAt ? new Date(updates.refundAt) : null);
    }
    if (updates.status !== undefined) {
      fields.push(`status=$${++idx}`);
      values.push(updates.status);
    }
    if (updates.metadata !== undefined) {
      fields.push(`metadata=$${++idx}`);
      values.push(updates.metadata);
    }

    if (!fields.length) {
      await client.query("COMMIT");
      return { order, previousStatus: order.status, changed: false };
    }

    const query = `UPDATE "Order" SET ${fields.join(",")}, "updatedAt"=NOW() WHERE id=$1 RETURNING *`;
    const updateRes = await client.query(query, [orderId, ...values]);
    const updated = serializeOrder(updateRes.rows[0]);

    await appendAuditLog(client, order.id, "order_updated_admin", order, updated, performedBy);

    await client.query("COMMIT");
    return {
      order: updated,
      previousStatus: order.status,
      changed: updates.status !== undefined ? updates.status !== order.status : false,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
