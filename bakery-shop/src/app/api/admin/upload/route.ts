import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";

import { authOptions } from "@/auth";
import { logAudit } from "@/lib/audit";
import { isActiveAdmin } from "@/lib/authz";

const normalizeInputToArray = (formData: FormData, key: string): File[] => {
  const value = formData.getAll(key);
  return value.filter((item): item is File => item instanceof File);
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isActiveAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const files = normalizeInputToArray(formData, "files");

  if (!files.length) {
    return NextResponse.json({ error: "Не са получени изображения." }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (!buffer.length) {
      continue;
    }

    const originalExt = path.extname(file.name) || "";
    const safeExt = originalExt.toLowerCase().slice(0, 10);
    const fileName = `${Date.now()}-${randomUUID()}${safeExt}`;
    await writeFile(path.join(uploadsDir, fileName), buffer);
    urls.push(`/uploads/${fileName}`);
  }

  if (!urls.length) {
    return NextResponse.json({ error: "Неуспешно качване на файловете." }, { status: 500 });
  }

  await logAudit({
    entity: "upload",
    action: "files_uploaded",
    newValue: { urls },
    operatorCode: session?.user?.operatorCode ?? session?.user?.email ?? null,
  });

  return NextResponse.json({ urls }, { status: 201 });
}
