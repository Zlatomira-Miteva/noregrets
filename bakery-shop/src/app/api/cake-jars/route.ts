import { NextResponse } from "next/server";

import { getCakeJars } from "@/lib/cakeJars";

export async function GET() {
  const response = await getCakeJars();
  return NextResponse.json(response);
}
