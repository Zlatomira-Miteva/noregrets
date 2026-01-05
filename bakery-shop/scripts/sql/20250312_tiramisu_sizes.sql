-- Add size-specific pricing and weight columns for products (EUR stored).
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "priceSmall" NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS "priceLarge" NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS "weightSmall" TEXT,
  ADD COLUMN IF NOT EXISTS "weightLarge" TEXT;

-- Optional: backfill existing price into priceSmall for published tiramisu items.
UPDATE "Product"
SET "priceSmall" = COALESCE("priceSmall", price)
WHERE "priceSmall" IS NULL AND "categoryId" IN (
  SELECT id FROM "ProductCategory" WHERE slug = 'tiramisu'
);
