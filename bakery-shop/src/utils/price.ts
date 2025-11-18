export const parsePrice = (price: string): number => {
  const numeric = price.replace(/[^0-9,\.]/g, "").replace(",", ".");
  const value = Number.parseFloat(numeric);
  return Number.isFinite(value) ? value : 0;
};

export const formatPrice = (value: number | string | null | undefined): string => {
  const numericValue = typeof value === "number" ? value : value ? Number(value) : 0;
  if (!Number.isFinite(numericValue)) {
    return "0.00 лв";
  }
  return `${numericValue.toFixed(2)} лв`;
};
