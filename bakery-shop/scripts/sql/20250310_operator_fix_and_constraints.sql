-- Fix operator data and (re)apply constraints for ADMIN/OPERATOR/AUDITOR roles.
-- Run with: psql "$DATABASE_URL" -f scripts/sql/20250310_operator_fix_and_constraints.sql

BEGIN;

-- 1) Allow NULL operatorCode column (will be enforced only for operator roles).
ALTER TABLE "User" ALTER COLUMN "operatorCode" DROP NOT NULL;

-- 2) Unique operator code when present.
CREATE UNIQUE INDEX IF NOT EXISTS "User_operatorCode_key" ON "User"("operatorCode") WHERE "operatorCode" IS NOT NULL;

-- 3) Auto-fill missing operator metadata for operator roles to satisfy constraints.
UPDATE "User" u
SET
  "operatorCode" = COALESCE(u."operatorCode", 'OP' || substr(u.id::text, 8, 8)),
  "firstName" = COALESCE(u."firstName", 'Operator'),
  "lastName" = COALESCE(u."lastName", 'User'),
  active = TRUE,
  "activeFrom" = COALESCE(u."activeFrom", NOW()),
  "activeTo" = NULL
WHERE role IN ('ADMIN','OPERATOR','AUDITOR')
  AND (
    "operatorCode" IS NULL
    OR "firstName" IS NULL
    OR "lastName" IS NULL
    OR active IS NOT TRUE
  );

-- 4) Drop old constraint if present.
DO $$
DECLARE
  rel regclass := to_regclass('public."User"');
BEGIN
  IF rel IS NULL THEN
    RAISE EXCEPTION 'Table "User" not found';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_operator_role_fields'
      AND conrelid = rel
  ) THEN
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT user_operator_role_fields', rel);
  END IF;
END;
$$;

-- 5) Add check constraint: operator roles must have code/names/active flag.
DO $$
DECLARE
  rel regclass := to_regclass('public."User"');
BEGIN
  IF rel IS NULL THEN
    RAISE EXCEPTION 'Table "User" not found';
  END IF;
  EXECUTE format(
    'ALTER TABLE %s ADD CONSTRAINT user_operator_role_fields
     CHECK (
       role NOT IN (''ADMIN'',''OPERATOR'',''AUDITOR'')
       OR (
         "operatorCode" IS NOT NULL
         AND "firstName" IS NOT NULL
         AND "lastName" IS NOT NULL
         AND active = TRUE
       )
     )',
    rel
  );
END;
$$;

-- 6) Enforce active window for operator roles.
CREATE OR REPLACE FUNCTION enforce_operator_active_window() RETURNS trigger AS $$
BEGIN
  IF NEW.role IN ('ADMIN','OPERATOR','AUDITOR') THEN
    IF NEW."activeFrom" IS NOT NULL AND NEW."activeFrom" > NOW() THEN
      RAISE EXCEPTION 'Operator not active yet';
    END IF;
    IF NEW."activeTo" IS NOT NULL AND NEW."activeTo" < NOW() THEN
      RAISE EXCEPTION 'Operator period expired';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_operator_active_window ON "User";
CREATE TRIGGER trg_enforce_operator_active_window
  BEFORE INSERT OR UPDATE ON "User"
  FOR EACH ROW
  EXECUTE PROCEDURE enforce_operator_active_window();

COMMIT;
