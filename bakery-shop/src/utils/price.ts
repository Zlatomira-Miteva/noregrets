const EUR_CONVERSION_RATE = 1.95583;

export const parsePrice = (price: string): number => {
  if (!price) return 0;
  const normalized = price.replace(",", ".");
  const match = normalized.match(/[0-9]+(?:\.[0-9]+)?/);
  const value = match ? Number.parseFloat(match[0]) : 0;
  return Number.isFinite(value) ? value : 0;
};

export const formatPrice = (value: number | string | null | undefined): string => {
  const numericValue =
    typeof value === "number" ? value : value !== null && value !== undefined ? parsePrice(String(value)) : 0;
  if (!Number.isFinite(numericValue)) {
    return "0.00 € / 0.00 лв";
  }
  const eurValue = numericValue / EUR_CONVERSION_RATE;
  return `${eurValue.toFixed(2)} € / ${numericValue.toFixed(2)} лв`;
};
