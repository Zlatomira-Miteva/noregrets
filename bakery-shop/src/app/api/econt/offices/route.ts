import { NextResponse } from "next/server";

const OFFICE_ENDPOINTS = [
  "https://ee.econt.com/services/Nomenclatures/NomenclaturesService.getOffices.json",
  "https://www.econt.com/services/Nomenclatures/NomenclaturesService.getOffices.json",
];

type EcontOffice = {
  id?: string | number;
  code?: string | number;
  name?: string;
  name_en?: string;
  address?: string;
  address_en?: string;
  cityID?: string | number;
  city_id?: string | number;
};

const FALLBACK_OFFICES = [
  { id: "sofia-center", name: "София - Център, офис 1001", referenceCityId: "1000" },
  { id: "plovdiv-maritsa", name: "Пловдив - Марица, офис 2034", referenceCityId: "4000" },
  { id: "varna-seaside", name: "Варна - Морска градина, офис 3120", referenceCityId: "9000" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityId = searchParams.get("cityId");

  if (!cityId) {
    return NextResponse.json({ offices: [] }, { status: 400 });
  }

  try {
    const numericId = Number.parseInt(String(cityId), 10);
    const cityPayload = Number.isFinite(numericId) ? numericId : cityId;
    console.log({numericId, OFFICE_ENDPOINTS})
    let data: unknown = null;

    debugger;

    for (const endpoint of OFFICE_ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cityID: cityPayload, countryCode: "BGR", languageCode: "bg" }),
          next: { revalidate: 60 * 60 * 12 },
        });

        if (!response.ok) {
          throw new Error(`Econt API responded with ${response.status}`);
        }

        data = await response.json();
        const parsedAttempt = data as { offices?: EcontOffice[] } | undefined;
        if (parsedAttempt?.offices) {
          return  NextResponse.json({offices: parsedAttempt?.offices, fallback: false }, { status: 200 });
        }
      } catch (error) {
        console.error(`Failed to load offices from ${endpoint}`, error);
      }
    }

    if (!data) {
      throw new Error("All Econt office endpoints failed");
    }
    const parsed = data as { offices?: EcontOffice[] } | undefined;
    const rawOffices: EcontOffice[] = Array.isArray(parsed?.offices) ? parsed.offices : [];

    const normalizedCityId = String(cityId);

    const offices = rawOffices
      .filter((office) => {
        const cityIdentifier = String(office.cityID ?? office.city_id ?? "");
        return cityIdentifier === normalizedCityId;
      })
      .map((office) => {
        const id = String(office.id ?? office.code ?? office.name ?? "");
        const name = office.name ?? office.name_en ?? `Офис ${id}`;
        const address = office.address ?? office.address_en ?? "";
        return { id, name, address };
      })
      .filter((office) => office.id && office.name);

    if (offices.length === 0) {
      const fallback = FALLBACK_OFFICES.filter(
        (office) => office.referenceCityId === normalizedCityId
      );
      return NextResponse.json({ offices: fallback, fallback: true }, { status: 200 });
    }

    return NextResponse.json({ offices }, { status: 200 });
  } catch (error) {
    console.error("Failed to load Econt offices", error);
    return NextResponse.json(
      {
        offices: FALLBACK_OFFICES,
        fallback: true,
        message: "Неуспешно зареждане на офисите от Econt. Връщаме примерен списък.",
      },
      { status: 200 }
    );
  }
}
