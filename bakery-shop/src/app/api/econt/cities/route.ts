import { NextResponse } from "next/server";

const CITY_ENDPOINTS = [
  "https://ee.econt.com/services/Nomenclatures/NomenclaturesService.getCities.json",
  "https://www.econt.com/services/Nomenclatures/NomenclaturesService.getCities.json",
];

type EcontCity = {
  countryCode?: string;
  id?: number | string;
  cityID?: number | string;
  postCode?: string | number;
  name?: string;
  name_en?: string;
  regionName?: string;
  isActive?: boolean;
};

const FALLBACK_CITIES = [
  { id: "1000", referenceId: "1000", name: "София" },
  { id: "4000", referenceId: "4000", name: "Пловдив" },
  { id: "9000", referenceId: "9000", name: "Варна" },
];

export async function GET() {
  try {
    let data: unknown = null;

    for (const endpoint of CITY_ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ countryCode: "BGR", languageCode: "bg" }),
          next: { revalidate: 60 * 60 * 12 },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Econt API responded with ${response.status}`);
        }

        data = await response.json();
        const parsedAttempt = data as { cities?: EcontCity[] } | undefined;
        if (parsedAttempt?.cities) {
          break;
        }
      } catch (error) {
        console.error(`Failed to load cities from ${endpoint}`, error);
      }
    }

    if (!data) {
      throw new Error("All Econt city endpoints failed");
    }
    const parsed = data as { cities?: EcontCity[] } | undefined;
    const rawCities: EcontCity[] = Array.isArray(parsed?.cities) ? parsed.cities : [];

    const cities = rawCities
      .filter((city) => {
        const countryCode = city.countryCode;
       const isActive = city.isActive ?? true;
        return (countryCode === "BG" || countryCode === "BGR" || !countryCode) && isActive;
      })
      .map((city) => {
        const referenceId = String(city.cityID ?? city.id ?? "");
        const id = String(city.postCode ?? referenceId);
        const name = city.name ?? city.name_en ?? `Град ${referenceId}`;
        const regionName = city.regionName;
        return { id, referenceId, name, regionName };
      })
      .filter((city) => city.referenceId && city.name)
      .sort((a, b) => a.name.localeCompare(b.name, "bg"));

    if (cities.length === 0) {
      return NextResponse.json({ cities: FALLBACK_CITIES }, { status: 200 });
    }

    return NextResponse.json({ cities }, { status: 200 });
  } catch (error) {
    console.error("Failed to load Econt cities", error);
    return NextResponse.json(
      {
        cities: FALLBACK_CITIES,
        fallback: true,
        message: "Неуспешно зареждане на градовете от Econt. Връщаме примерен списък.",
      },
      { status: 200 }
    );
  }
}
