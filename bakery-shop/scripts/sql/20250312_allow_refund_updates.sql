-- Allow transitions to REFUNDED and editing refund fields on finalized orders.
CREATE OR REPLACE FUNCTION prevent_finalized_order_update() RETURNS trigger AS $$
DECLARE
  final_status TEXT;
BEGIN
  final_status := upper(OLD.status::text);

  -- If already PAID/COMPLETED/CANCELLED, allow transition to REFUNDED
  IF final_status IN ('PAID','COMPLETED','CANCELLED') THEN
    IF upper(NEW.status::text) = 'REFUNDED' THEN
      RETURN NEW;
    END IF;
    -- Allow no-op updates (unchanged data)
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

  -- If already REFUNDED, allow updates (e.g., refund fields/metadata)
  IF final_status = 'REFUNDED' THEN
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_finalized_order_update ON "Order";
CREATE TRIGGER trg_prevent_finalized_order_update
  BEFORE UPDATE ON "Order"
  FOR EACH ROW
  EXECUTE PROCEDURE prevent_finalized_order_update();
