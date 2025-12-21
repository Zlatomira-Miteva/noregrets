import { NextResponse } from "next/server";

import { SPEEDY_FALLBACK_CITIES, loadSpeedyOfficeSiteIds, loadSpeedySites } from "@/lib/speedy";

export const runtime = "nodejs";

export async function GET() {
  if (!process.env.SPEEDY_USERNAME || !process.env.SPEEDY_PASSWORD) {
    return NextResponse.json(
      {
        cities: SPEEDY_FALLBACK_CITIES,
        fallback: true,
        message: "Липсват SPEEDY_USERNAME/SPEEDY_PASSWORD. Зареждаме примерен списък.",
      },
      { status: 200 },
    );
  }

  try {
    const [sites, officeSiteIds] = await Promise.all([loadSpeedySites(), loadSpeedyOfficeSiteIds()]);
    const filtered =
      officeSiteIds.size > 0 ? sites.filter((site) => officeSiteIds.has(site.id)) : sites;

    if (filtered.length === 0) {
      return NextResponse.json(
        {
          cities: SPEEDY_FALLBACK_CITIES,
          fallback: true,
          message: "Няма намерени градове с офис на Speedy.",
        },
        { status: 200 },
      );
    }

    const payload = {
      cities: filtered.map((site) => ({
        id: site.postCode || site.id,
        referenceId: site.id,
        name: site.region ? `${site.name} (${site.region})` : site.name,
      })),
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Failed to load Speedy cities", error);
    return NextResponse.json(
      {
        cities: SPEEDY_FALLBACK_CITIES,
        fallback: true,
        message:
          "Неуспешно зареждане на градовете от Speedy. Проверете SPEEDY_USERNAME/SPEEDY_PASSWORD.",
      },
      { status: 200 },
    );
  }
}
