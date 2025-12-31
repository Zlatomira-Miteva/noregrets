-- Enforce operator metadata for ADMIN/OPERATOR/AUDITOR roles.
-- Run with: psql "$DATABASE_URL" -f scripts/sql/20250309_operator_constraints.sql

-- Unique operator code when present.
CREATE UNIQUE INDEX IF NOT EXISTS "User_operatorCode_key" ON "User"("operatorCode") WHERE "operatorCode" IS NOT NULL;

-- Check: require operator fields for operator roles.
DO $$
DECLARE
  rel regclass := to_regclass('public."User"');
BEGIN
  IF rel IS NULL THEN
    RAISE EXCEPTION 'Table "User" not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_operator_role_fields'
      AND conrelid = rel
  ) THEN
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
  END IF;
END;
$$;

-- Trigger to enforce active period (uses NOW(), so done via trigger not CHECK).
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
