import type { Pool, PoolClient } from "pg";
import { pgPool } from "@/lib/pg";

const ALLOW_DDL = process.env.ALLOW_SCHEMA_DDL === "1";

const safeExec = async (client: Pool | PoolClient, sql: string) => {
  try {
    await client.query(sql);
  } catch (error) {
    console.warn("[ensureProductSchema] skipping DDL", sql.split("\n").map((l) => l.trim())[0], error);
  }
};

// Ensure optional columns exist (idempotent, best-effort).
export const ensureProductSchema = (() => {
  let ensured = false;
  return async (client: Pool | PoolClient = pgPool) => {
    if (ensured || !ALLOW_DDL) return;
    await safeExec(
      client,
      `ALTER TABLE IF EXISTS "Product" ADD COLUMN IF NOT EXISTS "priceSmall" numeric(10,2);`,
    );
    await safeExec(
      client,
      `ALTER TABLE IF EXISTS "Product" ADD COLUMN IF NOT EXISTS "priceLarge" numeric(10,2);`,
    );
    await safeExec(client, `ALTER TABLE IF EXISTS "Product" ADD COLUMN IF NOT EXISTS "weightSmall" text;`);
    await safeExec(client, `ALTER TABLE IF EXISTS "Product" ADD COLUMN IF NOT EXISTS "weightLarge" text;`);
    ensured = true;
  };
})();
