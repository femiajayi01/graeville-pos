import { multiply, sum } from './money.util';

describe('money.util', () => {
  it('adds prices without floating point drift', () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(sum([0.1, 0.2])).toBe(0.3);
    expect(sum([3200.5, 3200.5, 1000])).toBe(7401);
  });

  it('multiplies a unit price by a quantity', () => {
    expect(multiply(450.35, 3)).toBe(1351.05);
    expect(multiply(19.99, 0)).toBe(0);
  });

  it('subtracts a discount', () => {
    expect(sum([7401, -401])).toBe(7000);
  });
});
