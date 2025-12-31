-- Add CUSTOMER role and make it default for new users.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CUSTOMER';

ALTER TABLE "User" ALTER COLUMN role SET DEFAULT 'CUSTOMER';

-- Downgrade non-operator users to CUSTOMER if they are not explicitly ADMIN/OPERATOR/AUDITOR.
UPDATE "User"
SET role = 'CUSTOMER'
WHERE role NOT IN ('ADMIN', 'OPERATOR', 'AUDITOR');
