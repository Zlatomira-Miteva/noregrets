export const parsePrice = (price: string): number => {
  const numeric = price.replace(/[^0-9,\.]/g, "").replace(",", ".");
  const value = Number.parseFloat(numeric);
  return Number.isFinite(value) ? value : 0;
};

export const formatPrice = (value: number): string => {
  return `${value.toFixed(2)} лв`;
};

