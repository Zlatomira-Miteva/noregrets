import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { authOptions } from "@/auth";
import { pgPool } from "@/lib/pg";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const profile = (body?.profile ?? {}) as Record<string, unknown>;
  const firstName = typeof profile.firstName === "string" ? profile.firstName.trim() : "";
  const lastName = typeof profile.lastName === "string" ? profile.lastName.trim() : "";
  const displayName = (name || `${firstName} ${lastName}`).trim();

  if (!email || !password) {
    return NextResponse.json({ error: "Email и парола са задължителни." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Паролата трябва да е поне 6 символа." }, { status: 400 });
  }

  const client = await pgPool.connect();
  try {
    const roleRes = await client.query(
      `SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'UserRole' AND e.enumlabel = 'CUSTOMER' LIMIT 1`,
    );
    const customerRoleAvailable = roleRes.rows.length > 0;
    const roleToUse = customerRoleAvailable ? "CUSTOMER" : "ADMIN";

    const existing = await client.query(`SELECT id FROM "User" WHERE email=$1 LIMIT 1`, [email]);
    if (existing.rows.length) {
      return NextResponse.json({ error: "Този имейл вече е регистриран." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const id = randomUUID();
    await client.query(
      `INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`,
      [id, email, displayName || null, hashed, roleToUse],
    );

    // Optional profile data (best-effort; skip if table/permissions missing).
    try {
      await client.query(
        `INSERT INTO "UserProfile" (id,"userId","firstName","lastName",phone,email,city,zip,address,notes,
          "econtCityId","econtCityName","econtOfficeId","econtOfficeName")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT ("userId") DO UPDATE SET
           "firstName"=EXCLUDED."firstName",
           "lastName"=EXCLUDED."lastName",
           phone=EXCLUDED.phone,
           email=EXCLUDED.email,
           city=EXCLUDED.city,
           zip=EXCLUDED.zip,
           address=EXCLUDED.address,
            notes=EXCLUDED.notes,
           "econtCityId"=EXCLUDED."econtCityId",
           "econtCityName"=EXCLUDED."econtCityName",
           "econtOfficeId"=EXCLUDED."econtOfficeId",
           "econtOfficeName"=EXCLUDED."econtOfficeName",
           "updatedAt"=NOW()`,
        [
          randomUUID(),
          id,
          firstName || null,
          lastName || null,
          typeof profile.phone === "string" ? profile.phone : null,
          typeof profile.email === "string" ? profile.email : email,
          typeof profile.city === "string" ? profile.city : null,
          typeof profile.zip === "string" ? profile.zip : null,
          typeof profile.address === "string" ? profile.address : null,
          typeof profile.notes === "string" ? profile.notes : null,
          typeof profile.econtCityId === "string" ? profile.econtCityId : null,
          typeof profile.econtCityName === "string" ? profile.econtCityName : null,
          typeof profile.econtOfficeId === "string" ? profile.econtOfficeId : null,
          typeof profile.econtOfficeName === "string" ? profile.econtOfficeName : null,
        ],
      );
    } catch (profileErr) {
      console.warn("[auth.signup] profile skipped", profileErr instanceof Error ? profileErr.message : profileErr);
    }

    return NextResponse.json({ ok: true, userId: id });
  } catch (error) {
    console.error("[auth.signup] error", error);
    return NextResponse.json({ error: "Неуспешна регистрация" }, { status: 500 });
  } finally {
    client.release();
  }
}
