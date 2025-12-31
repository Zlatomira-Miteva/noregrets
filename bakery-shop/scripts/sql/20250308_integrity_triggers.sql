-- Integrity triggers to block deletion and lock finalized orders (no Prisma).
-- Run with: psql "$DATABASE_URL" -f scripts/sql/20250308_integrity_triggers.sql

-- Generic prevent-delete function for multiple tables
CREATE OR REPLACE FUNCTION prevent_delete_generic() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Deleting from % is not allowed', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

-- Prevent deletes on Order
CREATE OR REPLACE FUNCTION prevent_order_delete() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Deleting orders is not allowed';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_order_delete ON "Order";
CREATE TRIGGER trg_prevent_order_delete
  BEFORE DELETE ON "Order"
  FOR EACH ROW
  EXECUTE PROCEDURE prevent_order_delete();

-- Prevent deletes on master data
DROP TRIGGER IF EXISTS trg_prevent_product_delete ON "Product";
CREATE TRIGGER trg_prevent_product_delete
  BEFORE DELETE ON "Product"
  FOR EACH ROW
  EXECUTE PROCEDURE prevent_delete_generic();

DROP TRIGGER IF EXISTS trg_prevent_product_variant_delete ON "ProductVariant";
CREATE TRIGGER trg_prevent_product_variant_delete
  BEFORE DELETE ON "ProductVariant"
  FOR EACH ROW
  EXECUTE PROCEDURE prevent_delete_generic();

DROP TRIGGER IF EXISTS trg_prevent_product_category_delete ON "ProductCategory";
CREATE TRIGGER trg_prevent_product_category_delete
  BEFORE DELETE ON "ProductCategory"
  FOR EACH ROW
  EXECUTE PROCEDURE prevent_delete_generic();

DROP TRIGGER IF EXISTS trg_prevent_coupon_delete ON "Coupon";
CREATE TRIGGER trg_prevent_coupon_delete
  BEFORE DELETE ON "Coupon"
  FOR EACH ROW
  EXECUTE PROCEDURE prevent_delete_generic();

DROP TRIGGER IF EXISTS trg_prevent_cookie_option_delete ON "CookieOption";
CREATE TRIGGER trg_prevent_cookie_option_delete
  BEFORE DELETE ON "CookieOption"
  FOR EACH ROW
  EXECUTE PROCEDURE prevent_delete_generic();

DROP TRIGGER IF EXISTS trg_prevent_user_delete ON "User";
CREATE TRIGGER trg_prevent_user_delete
  BEFORE DELETE ON "User"
  FOR EACH ROW
  EXECUTE PROCEDURE prevent_delete_generic();

-- Allow media cleanup: explicitly drop prevent-delete triggers on image tables if they exist
DROP TRIGGER IF EXISTS trg_prevent_product_image_delete ON "ProductImage";
DROP TRIGGER IF EXISTS trg_prevent_product_category_image_delete ON "ProductCategoryImage";

-- Optional: prevent deletes on legacy/lowercase tables if they exist (orders, payments, shipments, etc.)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['Payment', 'payments', 'orders', 'order_items', 'shipments']
  LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      BEGIN
        EXECUTE format('DROP TRIGGER IF EXISTS trg_prevent_%s_delete ON %I;', lower(t), t);
        EXECUTE format(
          'CREATE TRIGGER trg_prevent_%s_delete BEFORE DELETE ON %I FOR EACH ROW EXECUTE PROCEDURE prevent_delete_generic();',
          lower(t),
          t
        );
      EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skip prevent-delete trigger on % (not owner)', t;
      END;
    END IF;
  END LOOP;
END $$;

-- Generic audit trigger to capture inserts/updates even outside the app layer
CREATE OR REPLACE FUNCTION audit_change_generic() RETURNS trigger AS $$
DECLARE
  audit_id TEXT := md5(random()::text || clock_timestamp()::text);
  entity_id TEXT := COALESCE(NEW.id, OLD.id)::text;
BEGIN
  INSERT INTO "AuditLog" (id, entity, "entityId", action, "oldValue", "newValue")
  VALUES (
    audit_id,
    TG_TABLE_NAME,
    entity_id,
    TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach audit triggers to key tables (insert/update only; deletes are blocked above)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'Order',
    'User',
    'Product',
    'ProductVariant',
    'ProductImage',
    'ProductCategory',
    'ProductCategoryImage',
    'Coupon',
    'CookieOption'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%s ON "%s";', lower(t), t);
    EXECUTE format(
      'CREATE TRIGGER trg_audit_%s AFTER INSERT OR UPDATE ON "%s" FOR EACH ROW EXECUTE PROCEDURE audit_change_generic();',
      lower(t),
      t
    );
  END LOOP;
END $$;

-- Optional audit coverage for additional tables if present
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['Payment', 'payments', 'orders', 'order_items', 'shipments', 'UserProfile', 'UserFavorite']
  LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      BEGIN
        EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%s ON %I;', lower(t), t);
        EXECUTE format(
          'CREATE TRIGGER trg_audit_%s AFTER INSERT OR UPDATE ON %I FOR EACH ROW EXECUTE PROCEDURE audit_change_generic();',
          lower(t),
          t
        );
      EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skip audit trigger on % (not owner)', t;
      END;
    END IF;
  END LOOP;
END $$;

-- Prevent deletes on OrderAuditLog
CREATE OR REPLACE FUNCTION prevent_order_audit_delete() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Deleting audit rows is not allowed';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_order_audit_delete ON "OrderAuditLog";
CREATE TRIGGER trg_prevent_order_audit_delete
  BEFORE DELETE ON "OrderAuditLog"
  FOR EACH ROW
  EXECUTE PROCEDURE prevent_order_audit_delete();

-- Block updates of finalized orders (PAID/COMPLETED/CANCELLED) except status staying the same
CREATE OR REPLACE FUNCTION prevent_finalized_order_update() RETURNS trigger AS $$
DECLARE
  final_status TEXT;
BEGIN
  final_status := upper(OLD.status::text);
  IF final_status IN ('PAID','COMPLETED','CANCELLED') THEN
    -- Allow no-op updates
    IF OLD.status = NEW.status
       AND OLD.items = NEW.items
       AND OLD."totalAmount" = NEW."totalAmount"
       AND OLD."deliveryLabel" = NEW."deliveryLabel"
       AND OLD."customerName" = NEW."customerName"
       AND OLD."customerEmail" = NEW."customerEmail"
       AND OLD."customerPhone" = NEW."customerPhone"
       AND COALESCE(OLD.metadata,'{}'::jsonb) = COALESCE(NEW.metadata,'{}'::jsonb)
    THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Finalized orders are immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_finalized_order_update ON "Order";
CREATE TRIGGER trg_prevent_finalized_order_update
  BEFORE UPDATE ON "Order"
  FOR EACH ROW
  EXECUTE PROCEDURE prevent_finalized_order_update();
