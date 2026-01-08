import { randomUUID } from "node:crypto";

import type { Pool, PoolClient } from "pg";

import { pgPool } from "@/lib/pg";

type PgQueryable = Pool | PoolClient;

// Ensures enums, extension, and tables exist (idempotent).
export async function ensureN18Schema(client: PgQueryable = pgPool) {
  // pgcrypto provides gen_random_uuid(); attempt to enable but continue if missing.
  await client.query(`DO $$
    BEGIN
      BEGIN
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      EXCEPTION
        WHEN OTHERS THEN
          -- Ignore missing extension on hosts where it's not available.
          NULL;
      END;
    END$$;`);

  await client.query(`DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_enum') THEN
        CREATE TYPE payment_method_enum AS ENUM ('card', 'cod');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
        CREATE TYPE payment_status_enum AS ENUM ('pending', 'authorized', 'paid', 'failed', 'refunded');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'courier_enum') THEN
        CREATE TYPE courier_enum AS ENUM ('econt', 'speedy', 'other');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sales_document_type_enum') THEN
        CREATE TYPE sales_document_type_enum AS ENUM ('N18_CH52O', 'COD_DOC');
      END IF;
    END$$;`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY,
      reference TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      delivery_address TEXT NOT NULL,
      total_amount NUMERIC(12,2) NOT NULL,
      currency CHAR(3) NOT NULL DEFAULT 'EUR',
      payment_method payment_method_enum NOT NULL DEFAULT 'card',
      payment_status payment_status_enum NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID NOT NULL,
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      product_name TEXT NOT NULL,
      tax_group TEXT NOT NULL,
      quantity NUMERIC(12,3) NOT NULL,
      unit_price NUMERIC(12,2) NOT NULL,
      total_price NUMERIC(12,2) NOT NULL,
      PRIMARY KEY (order_id, product_name, tax_group)
    );
  `);
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='order_items' AND column_name='id'
      ) THEN
        ALTER TABLE order_items ADD COLUMN id UUID NOT NULL;
      END IF;
    END$$;
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS payments (
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      provider TEXT NOT NULL DEFAULT 'mypos',
      transaction_id TEXT NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      paid_at TIMESTAMPTZ,
      status payment_status_enum NOT NULL,
      PRIMARY KEY (order_id, transaction_id)
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS shipments (
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      courier courier_enum NOT NULL,
      tracking_number TEXT,
      shipped_at TIMESTAMPTZ,
      PRIMARY KEY (order_id, courier)
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS sales_documents (
      id UUID PRIMARY KEY,
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      document_number TEXT UNIQUE NOT NULL,
      document_type sales_document_type_enum NOT NULL,
      issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      total_amount NUMERIC(12,2) NOT NULL
    );
  `);

  // Drop defaults that rely on gen_random_uuid if extension is absent.
  await client.query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='id') THEN
        BEGIN
          ALTER TABLE orders ALTER COLUMN id DROP DEFAULT;
        EXCEPTION
          WHEN others THEN NULL;
        END;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_documents' AND column_name='id') THEN
        BEGIN
          ALTER TABLE sales_documents ALTER COLUMN id DROP DEFAULT;
        EXCEPTION
          WHEN others THEN NULL;
        END;
      END IF;
    END$$;`);
}

type SnapshotItem = {
  name: string;
  quantity: number;
  price: number;
  taxGroup?: string;
};

type SnapshotOrder = {
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  totalAmount: number;
  currency?: string;
  paymentMethod?: "card" | "cod";
  paymentStatus?: "pending" | "authorized" | "paid" | "failed" | "refunded";
  items: SnapshotItem[];
  createdAt?: Date;
};

export async function upsertOrderSnapshot(order: SnapshotOrder) {
  const client = await pgPool.connect();
  try {
    await ensureN18Schema(client);
    await client.query("BEGIN");
    const currency = order.currency ?? "EUR";
    const method = order.paymentMethod ?? "card";
    const status = order.paymentStatus ?? "pending";
    const createdAt = order.createdAt ?? new Date();

    const existing = await client.query(`SELECT id FROM orders WHERE reference = $1 LIMIT 1`, [order.reference]);
    let orderId = existing.rows[0]?.id as string | undefined;
    if (!orderId) {
      const newId = randomUUID();
      const res = await client.query(
        `INSERT INTO orders (id, reference, customer_name, customer_email, customer_phone, delivery_address, total_amount, currency, payment_method, payment_status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING id`,
        [
          newId,
          order.reference,
          order.customerName,
          order.customerEmail,
          order.customerPhone,
          order.deliveryAddress,
          order.totalAmount,
          currency,
          method,
          status,
          createdAt,
        ],
      );
      orderId = res.rows[0].id;
    } else {
      await client.query(
        `UPDATE orders
         SET customer_name=$1, customer_email=$2, customer_phone=$3, delivery_address=$4, total_amount=$5, currency=$6, payment_method=$7, payment_status=$8
         WHERE id=$9`,
        [
          order.customerName,
          order.customerEmail,
          order.customerPhone,
          order.deliveryAddress,
          order.totalAmount,
          currency,
          method,
          status,
          orderId,
        ],
      );
    }

    const itemTuples = order.items.map((item) => ({
      name: item.name,
      tax: item.taxGroup ?? "0%",
      qty: Number(item.quantity),
      price: Number(item.price),
    }));

    // Soft-clear old rows by setting quantity/price to 0 for rows not in current set (avoids DELETE trigger).
    if (itemTuples.length) {
      const names = itemTuples.map((it) => it.name);
      await client.query(
        `UPDATE order_items
         SET quantity=0, total_price=0, unit_price=0
         WHERE order_id = $1 AND product_name <> ALL($2::text[])`,
        [orderId, names],
      );
    }

    for (const item of itemTuples) {
      const total = Number((item.qty * item.price).toFixed(2));
      await client.query(
        `INSERT INTO order_items (id, order_id, product_name, tax_group, quantity, unit_price, total_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (order_id, product_name, tax_group)
         DO UPDATE SET quantity=EXCLUDED.quantity, unit_price=EXCLUDED.unit_price, total_price=EXCLUDED.total_price`,
        [randomUUID(), orderId, item.name, item.tax, item.qty, item.price, total],
      );
    }

    await client.query("COMMIT");
    return orderId;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[orders.save] mirror to orders/order_items failed", err);
    return null;
  } finally {
    client.release();
  }
}

export async function recordPaymentByReference(params: {
  reference: string;
  transactionId: string;
  amount: number;
  status: "paid" | "authorized" | "failed" | "refunded";
  paidAt?: Date;
}) {
  const client = await pgPool.connect();
  try {
    await ensureN18Schema(client);
    await client.query("BEGIN");
    const orderRes = await client.query(`SELECT id FROM orders WHERE reference=$1 LIMIT 1`, [params.reference]);
    if (!orderRes.rows.length) {
      await client.query("ROLLBACK");
      return false;
    }
    const orderId = orderRes.rows[0].id as string;

    await client.query(
      `INSERT INTO payments (order_id, provider, transaction_id, amount, status, paid_at)
       VALUES ($1,'mypos',$2,$3,$4,$5)
       ON CONFLICT (order_id, transaction_id) DO UPDATE SET status=excluded.status, paid_at=excluded.paid_at, amount=excluded.amount`,
      [orderId, params.transactionId, params.amount, params.status, params.paidAt ?? new Date()],
    );

    await client.query(`UPDATE orders SET payment_status=$1 WHERE id=$2`, [params.status, orderId]);
    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function recordShipmentByReference(params: {
  reference: string;
  courier: "econt" | "speedy" | "other";
  tracking?: string;
  shippedAt?: Date;
}) {
  const client = await pgPool.connect();
  try {
    await ensureN18Schema(client);
    await client.query("BEGIN");
    const orderRes = await client.query(`SELECT id FROM orders WHERE reference=$1 LIMIT 1`, [params.reference]);
    if (!orderRes.rows.length) {
      await client.query("ROLLBACK");
      return false;
    }
    const orderId = orderRes.rows[0].id as string;
    await client.query(
      `INSERT INTO shipments (order_id, courier, tracking_number, shipped_at)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (order_id, courier) DO UPDATE SET tracking_number=excluded.tracking_number, shipped_at=excluded.shipped_at`,
      [orderId, params.courier, params.tracking ?? null, params.shippedAt ?? new Date()],
    );
    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function createSalesDocumentByReference(params: {
  reference: string;
  documentType: "N18_CH52O" | "COD_DOC";
  documentNumber?: string;
  totalAmount?: number;
}) {
  const client = await pgPool.connect();
  try {
    await ensureN18Schema(client);
    await client.query("BEGIN");
    const orderRes = await client.query(`SELECT id, total_amount FROM orders WHERE reference=$1 LIMIT 1`, [params.reference]);
    if (!orderRes.rows.length) {
      await client.query("ROLLBACK");
      return null;
    }
    const { id: orderId, total_amount } = orderRes.rows[0];
    const docNumber =
      params.documentNumber ??
      `N18-${new Date().getFullYear()}-${Math.floor(Date.now() / 1000)}-${Math.floor(Math.random() * 1000)}`;
    const total = params.totalAmount ?? Number(total_amount);
    const inserted = await client.query(
      `INSERT INTO sales_documents (id, order_id, document_number, document_type, total_amount)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (document_number) DO NOTHING
       RETURNING document_number`,
      [randomUUID(), orderId, docNumber, params.documentType, total],
    );
    await client.query("COMMIT");
    return inserted.rows[0]?.document_number ?? docNumber;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
