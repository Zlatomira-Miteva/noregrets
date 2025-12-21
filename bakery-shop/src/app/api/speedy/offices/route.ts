import { NextResponse } from "next/server";

import { SPEEDY_FALLBACK_OFFICES, loadSpeedyOffices } from "@/lib/speedy";

export const runtime = "nodejs";

const normalizeOfficeAddress = (office: { address?: Record<string, unknown> }) => {
  if (!office.address) return "";
  const address = office.address as {
    fullAddressString?: string;
    siteAddressString?: string;
    localAddressString?: string;
  };
  return (
    address.fullAddressString ||
    address.localAddressString ||
    address.siteAddressString ||
    ""
  );
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("cityId");

  if (!siteId) {
    return NextResponse.json({ offices: [] }, { status: 400 });
  }

  if (!process.env.SPEEDY_USERNAME || !process.env.SPEEDY_PASSWORD) {
    return NextResponse.json(
      {
        offices: SPEEDY_FALLBACK_OFFICES,
        fallback: true,
        message: "Липсват SPEEDY_USERNAME/SPEEDY_PASSWORD. Зареждаме примерен списък.",
      },
      { status: 200 },
    );
  }

  try {
    const offices = await loadSpeedyOffices(siteId);
    const normalized = offices
      .map((office) => {
        const id = office.id ?? office.name;
        const name = office.name || office.nameEn || `Офис ${id}`;
        const address = normalizeOfficeAddress(office);

        if (!id || !name) return null;
        return {
          id: String(id),
          name,
          address,
        };
      })
      .filter(Boolean) as Array<{ id: string; name: string; address: string }>;

    if (normalized.length === 0) {
      return NextResponse.json(
        {
          offices: SPEEDY_FALLBACK_OFFICES,
          fallback: true,
          message: "Няма намерени офиси на Speedy за избрания град.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ offices: normalized, fallback: false }, { status: 200 });
  } catch (error) {
    console.error("Failed to load Speedy offices", error);
    return NextResponse.json(
      {
        offices: SPEEDY_FALLBACK_OFFICES,
        fallback: true,
        message:
          "Неуспешно зареждане на офисите на Speedy. Проверете SPEEDY_USERNAME/SPEEDY_PASSWORD.",
      },
      { status: 200 },
    );
  }
}
