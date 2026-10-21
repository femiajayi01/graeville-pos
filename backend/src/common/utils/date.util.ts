/**
 * Date helpers. process.env.TZ is set to APP_TIMEZONE in main.ts, so `new Date(y, m, d)`
 * is the store's local midnight — matching the Laravel `"$date 00:00:00"` / `"$date 23:59:59"` ranges.
 */
const pad = (n: number, len = 2) => String(n).padStart(len, '0');

/** YYYY-MM-DD of a date in local time. */
export const toDateKey = (date: Date = new Date()): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Parses YYYY-MM-DD as local midnight. */
export const parseDateKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const endOfDay = (date: Date): Date =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );

/** Inclusive [start, end] for two YYYY-MM-DD strings (defaults to today). */
export const dayRange = (
  from?: string,
  to?: string,
): { start: Date; end: Date } => {
  const today = toDateKey();
  return {
    start: startOfDay(parseDateKey(from ?? to ?? today)),
    end: endOfDay(parseDateKey(to ?? from ?? today)),
  };
};

/** yymmdd prefix used by order numbers, e.g. 261015. */
export const orderNumberPrefix = (date: Date = new Date()): string =>
  `${String(date.getFullYear()).slice(-2)}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
