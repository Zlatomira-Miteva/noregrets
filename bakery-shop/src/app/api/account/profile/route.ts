import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { ensureCustomerSchema } from "@/lib/customer-schema";
import { pgPool } from "@/lib/pg";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await ensureCustomerSchema();
    const res = await pgPool.query(`SELECT * FROM "UserProfile" WHERE "userId"=$1 LIMIT 1`, [session.user.id]);
    return NextResponse.json(res.rows[0] ?? null);
  } catch (error) {
    console.error("[account.profile.get]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const {
    firstName,
    lastName,
    phone,
    email,
    city,
    zip,
    address,
    notes,
    econtCityId,
    econtCityName,
    econtOfficeId,
    econtOfficeName,
  } = (body ?? {}) as Record<string, unknown>;

  try {
    await ensureCustomerSchema();
    await pgPool.query(
      `INSERT INTO "UserProfile"
       (id,"userId","firstName","lastName",phone,email,city,zip,address,notes,"econtCityId","econtCityName","econtOfficeId","econtOfficeName")
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
        session.user.id,
        typeof firstName === "string" ? firstName : null,
        typeof lastName === "string" ? lastName : null,
        typeof phone === "string" ? phone : null,
        typeof email === "string" ? email : null,
        typeof city === "string" ? city : null,
        typeof zip === "string" ? zip : null,
        typeof address === "string" ? address : null,
        typeof notes === "string" ? notes : null,
        typeof econtCityId === "string" ? econtCityId : null,
        typeof econtCityName === "string" ? econtCityName : null,
        typeof econtOfficeId === "string" ? econtOfficeId : null,
        typeof econtOfficeName === "string" ? econtOfficeName : null,
      ],
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[account.profile.put]", error);
    return NextResponse.json({ error: "Неуспешно запазване" }, { status: 500 });
  }
}
