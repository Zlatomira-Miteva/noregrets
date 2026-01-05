-- Add REFUNDED status (idempotent) and refund fields.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "refundAmount" NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS "refundMethod" TEXT,
  ADD COLUMN IF NOT EXISTS "refundAt" TIMESTAMPTZ;
