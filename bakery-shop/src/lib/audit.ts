import { randomUUID } from "crypto";
import { pgPool } from "@/lib/pg";

type AuditPayload = {
  entity: string;
  entityId?: string | null;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  operatorCode?: string | null;
};

export async function logAudit({
  entity,
  entityId = null,
  action,
  oldValue,
  newValue,
  operatorCode,
}: AuditPayload) {
  try {
    await pgPool.query(
      `INSERT INTO "AuditLog" (id, entity, "entityId", action, "oldValue", "newValue", "operatorCode")
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [randomUUID(), entity, entityId, action, oldValue ?? null, newValue ?? null, operatorCode ?? null],
    );
  } catch (error) {
    console.error("[audit.log] failed", { entity, action, error });
  }
}
