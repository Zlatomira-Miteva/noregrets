import { NextResponse } from "next/server";

const CITY_ENDPOINTS = [
  "https://ee.econt.com/services/Nomenclatures/NomenclaturesService.getCities.json",
  "https://www.econt.com/services/Nomenclatures/NomenclaturesService.getCities.json",
];
const OFFICE_ENDPOINTS = [
  "https://ee.econt.com/services/Nomenclatures/NomenclaturesService.getOffices.json",
  "https://www.econt.com/services/Nomenclatures/NomenclaturesService.getOffices.json",
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

type EcontOffice = {
  cityID?: string | number;
  city_id?: string | number;
  name?: string;
  name_en?: string;
  isAPS?: boolean;
  address?: {
    city?: {
      id?: string | number;
      cityID?: string | number;
      postCode?: string | number;
      country?: {
        code2?: string;
        code3?: string;
      };
    };
  };
};

const FALLBACK_CITIES = [
  { id: "1000", referenceId: "1000", name: "София" },
  { id: "4000", referenceId: "4000", name: "Пловдив" },
  { id: "9000", referenceId: "9000", name: "Варна" },
];

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const computeSize = (data: unknown) => Buffer.byteLength(JSON.stringify(data ?? {}), "utf8");

let cachedCities:
  | {
      payload: { cities: Array<{ id: string; referenceId: string; name: string; regionName?: string }> };
      fetchedAt: number;
      sizeBytes: number;
      hits: number;
    }
  | null = null;

const loadOfficeCityIds = async (): Promise<Set<string>> => {
  const cityIds = new Set<string>();

  for (const endpoint of OFFICE_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode: "BGR", languageCode: "bg" }),
        next: { revalidate: 60 * 60 * 12 },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Econt offices API responded with ${response.status}`);
      }

      const data = (await response.json()) as { offices?: EcontOffice[] };
      const offices = Array.isArray(data?.offices) ? data.offices : [];

      for (const office of offices) {
        if (office.isAPS) {
          continue;
        }
        const name = (office.name ?? office.name_en ?? "").toLowerCase();
        if (name.includes("еконттомат") || name.includes("econtomat")) {
          continue;
        }

        const countryCode =
          (office.address?.city?.country?.code2 ?? office.address?.city?.country?.code3 ?? "")
            .toString()
            .toUpperCase();
        if (countryCode && countryCode !== "BG" && countryCode !== "BGR") {
          continue;
        }

        const cityIdentifier =
          office.cityID ??
          office.city_id ??
          office.address?.city?.id ??
          office.address?.city?.cityID ??
          office.address?.city?.postCode ??
          "";
        const normalized = String(cityIdentifier);
        if (normalized) {
          cityIds.add(normalized);
        }
      }

      if (cityIds.size > 0) {
        return cityIds;
      }
    } catch (error) {
      console.error(`Failed to load offices from ${endpoint}`, error);
    }
  }

  return cityIds;
};

export async function GET() {
  try {
    const now = Date.now();
    if (cachedCities && now - cachedCities.fetchedAt < CACHE_TTL_MS) {
      cachedCities.hits += 1;
      console.log("[econt:cities] cache hit", {
        ageMs: now - cachedCities.fetchedAt,
        sizeBytes: cachedCities.sizeBytes,
        hits: cachedCities.hits,
      });
      return NextResponse.json(cachedCities.payload, { status: 200 });
    }

    const requestCountContext = { attempts: 0 };
    let data: unknown = null;

    for (const endpoint of CITY_ENDPOINTS) {
      try {
        requestCountContext.attempts += 1;
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
        const rawSize = computeSize(data);
        console.log("[econt:cities] fetched", { endpoint, status: response.status, sizeBytes: rawSize });
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

    const officeCityIds = await loadOfficeCityIds();
    const filteredCities =
      officeCityIds.size > 0
        ? cities.filter((city) => officeCityIds.has(city.referenceId))
        : cities;

    if (filteredCities.length === 0) {
      return NextResponse.json({ cities: FALLBACK_CITIES }, { status: 200 });
    }

    const payload = { cities: filteredCities };
    const sizeBytes = computeSize(payload);
    cachedCities = { payload, fetchedAt: now, sizeBytes, hits: 0 };
    console.log("[econt:cities] cache set", { sizeBytes, requestAttempts: requestCountContext.attempts });

    return NextResponse.json(payload, { status: 200 });
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
