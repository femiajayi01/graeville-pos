import { ValueTransformer } from 'typeorm';

/**
 * Postgres returns `numeric` columns as strings to avoid precision loss.
 * Money values here are small enough (2 d.p.) to be safely handled as JS numbers.
 */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : parseFloat(value),
};
