import { dayRange, orderNumberPrefix, toDateKey } from './date.util';

describe('date.util', () => {
  it('formats yymmdd order prefixes', () => {
    expect(orderNumberPrefix(new Date(2026, 9, 5))).toBe('261005');
  });

  it('builds an inclusive local-day range', () => {
    const { start, end } = dayRange('2026-10-01', '2026-10-15');
    expect(toDateKey(start)).toBe('2026-10-01');
    expect(start.getHours()).toBe(0);
    expect(toDateKey(end)).toBe('2026-10-15');
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
  });

  it('uses a single day when only one bound is given', () => {
    const { start, end } = dayRange('2026-10-03');
    expect(toDateKey(start)).toBe('2026-10-03');
    expect(toDateKey(end)).toBe('2026-10-03');
  });
});
