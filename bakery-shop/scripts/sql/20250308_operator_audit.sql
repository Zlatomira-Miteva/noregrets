-- Manual SQL (no Prisma) to add operator fields, roles and AuditLog.
-- Run with: psql "$DATABASE_URL" -f scripts/sql/20250308_operator_audit.sql

-- Extend roles with operator/auditor variants
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'OPERATOR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'AUDITOR';

-- Operator metadata and activity window
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "operatorCode" TEXT,
  ADD COLUMN IF NOT EXISTS "firstName" TEXT,
  ADD COLUMN IF NOT EXISTS "lastName" TEXT,
  ADD COLUMN IF NOT EXISTS "activeFrom" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "activeTo" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

-- Backfill operator codes and names for existing users to avoid lock-out
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY "createdAt") AS rn
  FROM "User"
)
UPDATE "User" u
SET
  "operatorCode" = COALESCE(u."operatorCode", 'OP' || lpad(numbered.rn::text, 4, '0')),
  "firstName" = COALESCE(u."firstName", u.name),
  "lastName" = COALESCE(u."lastName", NULL)
FROM numbered
WHERE u.id = numbered.id;

ALTER TABLE "User" ALTER COLUMN "operatorCode" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "User_operatorCode_key" ON "User" ("operatorCode");

-- Generic audit log (append-only; no FK to keep it resilient)
CREATE TABLE IF NOT EXISTS "AuditLog" (
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  "entityId" TEXT,
  action TEXT NOT NULL,
  "oldValue" JSONB,
  "newValue" JSONB,
  "operatorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AuditLog_entity_createdAt_idx" ON "AuditLog" (entity, "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_operatorCode_createdAt_idx" ON "AuditLog" ("operatorCode", "createdAt");
