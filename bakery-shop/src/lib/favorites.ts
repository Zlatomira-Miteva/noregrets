export type FavoritePayload =
  | {
      type: "custom-box";
      size: string;
      items: Array<{ id: string; name: string; quantity: number }>;
    }
  | Record<string, unknown>;

const isPlainObject = (val: unknown): val is Record<string, unknown> =>
  !!val && typeof val === "object" && !Array.isArray(val);

// Deterministic stringify (sorts object keys) so hashes are stable.
const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  if (isPlainObject(value)) {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `"${key}":${stableStringify((value as Record<string, unknown>)[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
};

// Lightweight deterministic hash (FNV-1a) to avoid needing crypto across envs.
export const computeVariantKey = (payload: FavoritePayload | null | undefined): string => {
  if (!payload) return "";
  try {
    const input = stableStringify(payload);
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = (hash >>> 0) * 0x01000193;
    }
    return `v${(hash >>> 0).toString(36)}`;
  } catch {
    return "";
  }
};
