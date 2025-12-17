import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("[pg] DATABASE_URL is not set. Database calls will fail.");
}

// Reuse pool across hot reloads in dev
const globalForPg = global as unknown as { pgPool?: Pool };

export const pgPool =
  globalForPg.pgPool ??
  new Pool({
    connectionString,
    max: Number(process.env.PG_POOL_MAX ?? 5),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pgPool;
}
