/** Reusable class-transformer helpers for DTOs. */
type Params = { value: unknown };

export const trim = ({ value }: Params): unknown =>
  typeof value === 'string' ? value.trim() : value;

export const trimLower = ({ value }: Params): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

/** Treats "" as "not provided" so optional validators are skipped. */
export const emptyToUndefined = ({ value }: Params): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

export const stripSpaces = ({ value }: Params): unknown =>
  typeof value === 'string' ? value.replace(/\s+/g, '') : value;

export const toBoolean = ({ value }: Params): unknown =>
  value === true || value === 'true' || value === '1';
