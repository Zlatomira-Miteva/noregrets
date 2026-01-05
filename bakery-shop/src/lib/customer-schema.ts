import type { Pool, PoolClient } from "pg";
import { pgPool } from "@/lib/pg";

const ALLOW_DDL = process.env.ALLOW_SCHEMA_DDL === "1";

const safeExec = async (client: Pool | PoolClient, sql: string) => {
  try {
    await client.query(sql);
  } catch (err) {
    console.warn(
      "[ensureCustomerSchema] skipping DDL",
      sql.split("\n").map((l) => l.trim())[0],
      err instanceof Error ? err.message : err,
    );
  }
};

// Ensures customer-related schema exists (idempotent, best-effort).
export async function ensureCustomerSchema(client: Pool | PoolClient = pgPool) {
  if (!ALLOW_DDL) return;
  await safeExec(
    client,
    `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'UserRole' AND e.enumlabel = 'CUSTOMER') THEN
        ALTER TYPE "UserRole" ADD VALUE 'CUSTOMER';
      END IF;
    END$$;
  `,
  );

  await safeExec(client, `ALTER TABLE IF EXISTS "User" ALTER COLUMN role SET DEFAULT 'CUSTOMER'::"UserRole";`);
  await safeExec(client, `ALTER TABLE IF EXISTS "Order" ADD COLUMN IF NOT EXISTS "userId" text`);
  await safeExec(client, `CREATE INDEX IF NOT EXISTS "Order_userId_idx" ON "Order" ("userId") WHERE "userId" IS NOT NULL`);

  await safeExec(
    client,
    `
    CREATE TABLE IF NOT EXISTS "UserProfile" (
      id text PRIMARY KEY,
      "userId" text UNIQUE NOT NULL,
      "firstName" text,
      "lastName" text,
      phone text,
      email text,
      city text,
      zip text,
      address text,
      notes text,
      "econtCityId" text,
      "econtCityName" text,
      "econtOfficeId" text,
      "econtOfficeName" text,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now()
    );
  `,
  );
  await safeExec(client, `ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "econtCityId" text`);
  await safeExec(client, `ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "econtCityName" text`);
  await safeExec(client, `ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "econtOfficeId" text`);
  await safeExec(client, `ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "econtOfficeName" text`);

  await safeExec(
    client,
    `
    CREATE TABLE IF NOT EXISTS "UserFavorite" (
      id text PRIMARY KEY,
      "userId" text NOT NULL,
      "productId" text NOT NULL,
      payload jsonb,
      "variantKey" text,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      UNIQUE("userId","productId")
    );
  `,
  );
  await safeExec(client, `ALTER TABLE "UserFavorite" ADD COLUMN IF NOT EXISTS payload jsonb`);
  await safeExec(client, `ALTER TABLE "UserFavorite" ADD COLUMN IF NOT EXISTS "variantKey" text`);
  await safeExec(client, `ALTER TABLE "UserFavorite" DROP CONSTRAINT IF EXISTS "UserFavorite_userId_productId_key"`);
  await safeExec(
    client,
    `CREATE UNIQUE INDEX IF NOT EXISTS "UserFavorite_user_product_variant_idx"
       ON "UserFavorite" ("userId","productId","variantKey")`,
  );
}
