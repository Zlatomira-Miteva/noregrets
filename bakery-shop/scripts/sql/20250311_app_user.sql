-- Create a limited DB user for the application.
-- Edit the password below (leave the quotes) before running.
-- Usage: psql "$DATABASE_URL" -f scripts/sql/20250311_app_user.sql

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    EXECUTE 'CREATE ROLE app_user LOGIN PASSWORD ''StrongPassword!ChangeMe''';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Optional: lock down public schema exposure.
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO app_user;

-- Grant needed table privileges (adjust if you want stricter DELETE rules).
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Default privileges for future tables/sequences.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO app_user;
