import { NextResponse } from "next/server";

const OFFICE_ENDPOINTS = [
  "https://ee.econt.com/services/Nomenclatures/NomenclaturesService.getOffices.json",
  "https://www.econt.com/services/Nomenclatures/NomenclaturesService.getOffices.json",
];

const trimCityPrefix = (label: string, cityName?: string | null) => {
  if (!label) return label;
  const trimmedCity = (cityName ?? "").trim();
  const normalizedLabel = label.trimStart();

  if (!trimmedCity) {
    return normalizedLabel;
  }

  const labelLower = normalizedLabel.toLowerCase();
  const cityLower = trimmedCity.toLowerCase();

  if (!labelLower.startsWith(cityLower)) {
    return normalizedLabel;
  }

  let rest = normalizedLabel.slice(trimmedCity.length);
  rest = rest.replace(/^([\s,.\-–—]+)+/, "").trimStart();

  return rest || normalizedLabel;
};

type EcontOffice = {
  id?: string | number;
  code?: string | number;
  name?: string;
  nameEn?: string;
  name_en?: string;
  address?: {
    fullAddress?: string;
    fullAddressEn?: string;
    street?: string;
    num?: string | number;
    other?: string;
    city?: {
      id?: string | number;
      cityID?: string | number;
      postCode?: string | number;
      name?: string;
      nameEn?: string;
      country?: {
        code2?: string;
        code3?: string;
      };
    };
  };
  cityID?: string | number;
  city_id?: string | number;
  isAPS?: boolean;
};

const FALLBACK_OFFICES = [
  { id: "sofia-center", name: "Център, офис 1001", referenceCityId: "1000" },
  { id: "plovdiv-maritsa", name: "Марица, офис 2034", referenceCityId: "4000" },
  { id: "varna-seaside", name: "Морска градина, офис 3120", referenceCityId: "9000" },
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
    let data: unknown = null;

    for (const endpoint of OFFICE_ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cityID: cityPayload, countryCode: "BGR", languageCode: "bg" }),
          next: { revalidate: 60 * 60 * 12 },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Econt API responded with ${response.status}`);
        }

        const responsePayload = (await response.json()) as { offices?: EcontOffice[] };
        if (Array.isArray(responsePayload?.offices)) {
          data = responsePayload;
          break;
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

    const normalizedCityId = String(cityPayload);

    const offices = rawOffices
      .map((office) => {
        const cityIdentifier =
          office.cityID ??
          office.city_id ??
          office.address?.city?.id ??
          office.address?.city?.cityID ??
          office.address?.city?.postCode ??
          "";
        if (String(cityIdentifier) !== normalizedCityId) {
          return null;
        }

        if (office.isAPS) {
          return null;
        }

        const countryCode =
          (office.address?.city?.country?.code2 ?? office.address?.city?.country?.code3 ?? "")
            .toString()
            .toUpperCase();
        if (countryCode && countryCode !== "BG" && countryCode !== "BGR") {
          return null;
        }

        const id = String(office.id ?? office.code ?? office.name ?? "");
        const cityName = office.address?.city?.name ?? office.address?.city?.nameEn ?? "";
        const rawName = office.name ?? office.name_en ?? office.nameEn ?? `Офис ${id}`;
        const name = trimCityPrefix(rawName, cityName);
        const normalizedName = name.toLowerCase();
        if (normalizedName.includes("еконттомат") || normalizedName.includes("econtomat")) {
          return null;
        }

        const fullAddress = office.address?.fullAddress ?? office.address?.fullAddressEn ?? "";
        const parts = [
          office.address?.street,
          office.address?.num ? `№ ${office.address?.num}` : null,
          office.address?.other,
        ].filter(Boolean);
        const composedAddress = fullAddress || parts.join(", ");

        return {
          id,
          name,
          address: composedAddress,
        };
      })
      .filter((office): office is { id: string; name: string; address: string } => {
        return Boolean(office?.id && office?.name);
      });

    if (offices.length === 0) {
      const fallback = FALLBACK_OFFICES.filter(
        (office) => office.referenceCityId === normalizedCityId
      );
      return NextResponse.json({ offices: fallback, fallback: true }, { status: 200 });
    }

    return NextResponse.json({ offices, fallback: false }, { status: 200 });
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
