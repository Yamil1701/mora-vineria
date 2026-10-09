import { describe, expect, it } from 'vitest';
import { cartCount, cartTotal, currentStock, getCartLines, needsReplenishment, parseWholePesos, updateQuantity } from './demo-state';
import { demoProducts, type DemoSale } from './demo-data';

describe('demo-only cart helpers', () => {
  it('adds, changes, removes quantities without mutating original cart', () => {
    const initial = { corona: 1 };
    const adjusted = updateQuantity(initial, 'corona', 3);
    expect(initial.corona).toBe(1);
    expect(cartTotal(adjusted, demoProducts)).toBe(12000);
    expect(cartCount(adjusted, demoProducts)).toBe(3);
    expect(updateQuantity(adjusted, 'corona', 0)).toEqual({});
    expect(updateQuantity(initial, 'corona', -1)).toBe(initial);
  });
  it('only includes known products in totals', () => {
    expect(getCartLines({ corona: 1, unknown: 100 }, demoProducts)).toHaveLength(1);
    expect(cartTotal({ corona: 2, coca: 1 }, demoProducts)).toBe(11500);
  });
  it('never interprets payments with decimals or other characters as pesos', () => {
    expect(parseWholePesos('25000')).toBe(25000);
    expect(parseWholePesos('25.000')).toBeNull();
    expect(parseWholePesos('-100')).toBeNull();
    expect(parseWholePesos('')).toBeNull();
  });
  it('displays stock differences instead of silently clamping at zero', () => {
    const sale: DemoSale = { id: 's', total: 12000, method: 'efectivo', items: { corona: 3 }, createdAt: 'demo' };
    expect(currentStock(demoProducts[0], [sale])).toBe(-1);
    expect(needsReplenishment(demoProducts[0], [sale])).toBe(true);
  });
});
