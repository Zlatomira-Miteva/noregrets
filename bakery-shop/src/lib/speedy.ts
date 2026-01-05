type SpeedyOffice = {
  id?: number | string;
  name?: string;
  nameEn?: string;
  siteId?: number | string;
  address?: {
    fullAddressString?: string;
    siteAddressString?: string;
    localAddressString?: string;
  };
  type?: string;
};

type SpeedySite = {
  id: string;
  name: string;
  postCode?: string;
  region?: string;
};

const rawBase = (process.env.SPEEDY_API_BASE_URL || "https://api.speedy.bg/v1").replace(/\/+$/, "");
const SPEEDY_BASE_URL = rawBase.endsWith("/v1") ? rawBase : `${rawBase}/v1`;
const SPEEDY_USERNAME = process.env.SPEEDY_USERNAME;
const SPEEDY_PASSWORD = process.env.SPEEDY_PASSWORD;
const SPEEDY_CLIENT_SYSTEM_ID = process.env.SPEEDY_CLIENT_SYSTEM_ID;
const SPEEDY_COUNTRY_ID = process.env.SPEEDY_COUNTRY_ID || "100";
const SPEEDY_LANGUAGE = process.env.SPEEDY_LANGUAGE || "BG";

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const officeSiteIdsCache: { value: Set<string> | null; fetchedAt: number | null } = {
  value: null,
  fetchedAt: null,
};

const allSitesCache: { value: SpeedySite[] | null; fetchedAt: number | null; sizeBytes: number } = {
  value: null,
  fetchedAt: null,
  sizeBytes: 0,
};

const officeCache = new Map<
  string,
  { value: SpeedyOffice[]; fetchedAt: number; sizeBytes: number; hits: number }
>();

const computeSize = (data: unknown) => Buffer.byteLength(JSON.stringify(data ?? {}), "utf8");

function getAuthPayload() {
  if (!SPEEDY_USERNAME || !SPEEDY_PASSWORD) {
    throw new Error("Missing Speedy credentials (SPEEDY_USERNAME, SPEEDY_PASSWORD).");
  }

  const payload: Record<string, unknown> = {
    userName: SPEEDY_USERNAME,
    password: SPEEDY_PASSWORD,
    language: SPEEDY_LANGUAGE,
  };

  if (SPEEDY_CLIENT_SYSTEM_ID) {
    payload.clientSystemId = Number.isNaN(Number(SPEEDY_CLIENT_SYSTEM_ID))
      ? SPEEDY_CLIENT_SYSTEM_ID
      : Number(SPEEDY_CLIENT_SYSTEM_ID);
  }

  return payload;
}

async function speedyRequest<T>(
  path: string,
  body: Record<string, unknown>,
  options?: { responseType?: "json" | "text"; revalidateSeconds?: number },
): Promise<T | string> {
  const bases = [SPEEDY_BASE_URL];

  let lastError: Error | null = null;
  for (const base of bases) {
    const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...getAuthPayload(), ...body }),
        cache: "no-store",
        next: options?.revalidateSeconds ? { revalidate: options.revalidateSeconds } : undefined,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Speedy API ${path} via ${base} responded with ${response.status} ${response.statusText}: ${text.slice(0, 200)}`);
      }

      if (options?.responseType === "text") {
        return response.text();
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }

  throw lastError ?? new Error("Speedy API request failed");
}

// const parseCsvLine = (line: string) => {
//   const values: string[] = [];
//   let current = "";
//   let inQuotes = false;
//
//   for (let i = 0; i < line.length; i += 1) {
//     const char = line[i];
//     const next = line[i + 1];
//
//     if (char === '"' && inQuotes && next === '"') {
//       current += '"';
//       i += 1;
//       continue;
//     }
//
//     if (char === '"') {
//       inQuotes = !inQuotes;
//       continue;
//     }
//
//     if (char === "," && !inQuotes) {
//       values.push(current);
//       current = "";
//       continue;
//     }
//
//     current += char;
//   }
//
//   values.push(current);
//   return values.map((value) => value.trim());
// };

export async function loadSpeedySites(): Promise<SpeedySite[]> {
  const now = Date.now();
  if (allSitesCache.value && allSitesCache.fetchedAt && now - allSitesCache.fetchedAt < CACHE_TTL_MS) {
    allSitesCache.fetchedAt = now;
    return allSitesCache.value;
  }

  const countryId = Number.isNaN(Number(SPEEDY_COUNTRY_ID)) ? SPEEDY_COUNTRY_ID : Number(SPEEDY_COUNTRY_ID);
  const response = (await speedyRequest<{ sites?: Array<{ id?: string | number; name?: string; postCode?: string; region?: string }> }>(
    `/location/site`,
    { countryId },
  )) as { sites?: Array<{ id?: string | number; name?: string; postCode?: string; region?: string }> };
  const rawSites = Array.isArray(response?.sites) ? response.sites : [];
  const sites = rawSites
    .map((site) => {
      const id = site?.id;
      const name = site?.name;
      if (!id || !name) return null;
      return {
        id: String(id),
        name: name,
        postCode: site.postCode ? String(site.postCode) : undefined,
        region: site.region,
      } as SpeedySite;
    })
    .filter(Boolean) as SpeedySite[];

  if (sites.length === 0) {
    throw new Error("Failed to load Speedy sites");
  }
  allSitesCache.value = sites;
  allSitesCache.fetchedAt = now;
  allSitesCache.sizeBytes = computeSize({ sites });

  return sites;
}

export async function loadSpeedyOfficeSiteIds(): Promise<Set<string>> {
  const now = Date.now();
  if (officeSiteIdsCache.value && officeSiteIdsCache.fetchedAt && now - officeSiteIdsCache.fetchedAt < CACHE_TTL_MS) {
    officeSiteIdsCache.fetchedAt = now;
    return officeSiteIdsCache.value;
  }

  const payload = (await speedyRequest<{ offices?: SpeedyOffice[] }>(`/location/office`, {
    countryId: Number.isNaN(Number(SPEEDY_COUNTRY_ID)) ? SPEEDY_COUNTRY_ID : Number(SPEEDY_COUNTRY_ID),
  })) as { offices?: SpeedyOffice[] };
  const offices = Array.isArray(payload?.offices) ? payload.offices : [];

  if (offices.length === 0) {
    throw new Error("Failed to load Speedy offices");
  }
  const ids = new Set<string>();
  for (const office of offices) {
    if (office.type && String(office.type).toUpperCase() === "APT") continue;
    const siteId = office.siteId ?? (office as Record<string, unknown>).siteID ?? null;
    if (siteId === null || siteId === undefined) continue;
    const normalized = String(siteId);
    if (normalized) ids.add(normalized);
  }

  officeSiteIdsCache.value = ids;
  officeSiteIdsCache.fetchedAt = now;
  return ids;
}

export async function loadSpeedyOffices(siteId: string) {
  const cacheKey = String(siteId);
  const now = Date.now();
  const cached = officeCache.get(cacheKey);
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    cached.hits += 1;
    return cached.value;
  }

  const payload = (await speedyRequest<{ offices?: SpeedyOffice[] }>(`/location/office`, {
    countryId: Number.isNaN(Number(SPEEDY_COUNTRY_ID)) ? SPEEDY_COUNTRY_ID : Number(SPEEDY_COUNTRY_ID),
    siteId: Number.isNaN(Number(siteId)) ? siteId : Number(siteId),
  })) as { offices?: SpeedyOffice[] };

  const offices = (Array.isArray(payload?.offices) ? payload.offices : []).filter((office) => {
    const type = (office.type || "").toUpperCase();
    return type !== "APT";
  });

  officeCache.set(cacheKey, { value: offices, fetchedAt: now, sizeBytes: computeSize({ offices }), hits: 0 });
  return offices;
}

export const SPEEDY_FALLBACK_CITIES: SpeedySite[] = [
  { id: "68134", name: "София", postCode: "1000" },
  { id: "56784", name: "Пловдив", postCode: "4000" },
  { id: "10135", name: "Варна", postCode: "9000" },
];

export const SPEEDY_FALLBACK_OFFICES = [
  { id: "1001", name: "София Център", address: "бул. Витоша 1" },
  { id: "4001", name: "Пловдив Център", address: "ул. Главна 5" },
];
