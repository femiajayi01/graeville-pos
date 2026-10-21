/**
 * Money is stored as numeric(12,2). Arithmetic is done in kobo (integer minor units)
 * to avoid floating point drift when adding many line items.
 */
export const toMinor = (amount: number): number =>
  Math.round(Number(amount) * 100);
export const fromMinor = (minor: number): number => minor / 100;
export const multiply = (unitPrice: number, quantity: number): number =>
  fromMinor(toMinor(unitPrice) * quantity);
export const sum = (values: number[]): number =>
  fromMinor(values.reduce((acc, v) => acc + toMinor(v), 0));
