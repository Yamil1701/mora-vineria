import { describe, expect, it } from 'vitest';
import { addCost, allocateFifo, businessDate, parseInteger, profit, rational, roundCost, saleTotal, validateCommand, whole } from './rules';
import type { Lot } from './types';
const id = () => crypto.randomUUID();
function lot(quantity: number, total: number | null, order: number): Lot {
  return { id: id(), productId: id(), quantity, available: quantity, unitCost: total === null ? null : rational(BigInt(total), BigInt(quantity)), order, sourceCommand: id(), registeredAt: '2026-10-10T11:00:00Z' };
}
describe('production domain rules', () => {
  it('derives jornada at 07:59/08:00 including month/year boundaries', () => {
    expect(businessDate('2026-10-10T10:59:59Z')).toBe('2026-10-09');
    expect(businessDate('2026-10-10T11:00:00Z')).toBe('2026-10-10');
    expect(businessDate('2026-01-01T03:00:00Z')).toBe('2025-12-31');
    expect(businessDate('2026-03-01T10:59:59Z')).toBe('2026-02-28');
    for (const date of ['demo', '2026-02-30T11:00:00Z', '2026-10-10']) expect(() => businessDate(date)).toThrow();
  });
  it('rejects ARS decimals, unsafe values and malformed input', () => {
    for (const value of [1.5, -1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) expect(() => whole(value)).toThrow();
    for (const input of ['1.000', '1,5', '-1', '', '1e3']) expect(() => parseInteger(input, 'Precio')).toThrow();
    expect(parseInteger(' 1500 ', 'Precio')).toBe(1500);
    expect(() => saleTotal([{ id: id(), productId: id(), name: 'A', quantity: 2, referencePrice: 0, unitPrice: Number.MAX_SAFE_INTEGER }])).toThrow();
  });
  it('crosses lots in order without mutating inputs', () => {
    const a = lot(2, 4000, 1), b = lot(3, 7500, 2), result = allocateFifo([b, a], 4);
    expect(result.allocations.map(s => [s.lotId, s.units])).toEqual([[a.id, 2], [b.id, 2]]);
    expect(result.cost).toEqual(rational(9000n)); expect(a.available).toBe(2); expect(b.available).toBe(3);
    expect(profit(16000, result.cost!)).toEqual(rational(7000n));
  });
  it('consumes unknown old cost instead of skipping it; missing is not zero', () => {
    const result = allocateFifo([lot(2, null, 1), lot(2, 5000, 2)], 3);
    expect(result.cost).toBeNull(); expect(result.allocations[0].cost).toBeNull(); expect(result.missingUnits).toBe(0);
    expect(allocateFifo([], 2)).toMatchObject({ missingUnits: 2, cost: null });
  });
  it('conserves indivisible pack cost, exact sums and negative profit', () => {
    const a = lot(6, 125000, 1), first = allocateFifo([a], 3);
    expect(first.cost).toEqual(rational(62500n)); expect(allocateFifo(first.updates, 3).cost).toEqual(rational(62500n));
    expect(addCost(rational(1n, 3n), rational(2n, 3n))).toEqual(rational(1n));
    expect(roundCost(profit(1000, rational(2000n)))).toBe(-1000);
  });
  it('rejects empty sale, duplicate lines, short payment and non-cash command', () => {
    const line = { id: id(), productId: id(), name: 'A', quantity: 1, referencePrice: 3500, unitPrice: 3500 };
    const c = { type: 'RecordSale' as const, id: id(), registeredAt: '2026-10-10T11:00:00Z', contractVersion: 1 as const, dependencies: [], payload: { saleId: id(), lines: [line], received: 3500, draftId: null, draftVersion: null } };
    expect(() => validateCommand(c)).not.toThrow();
    expect(() => validateCommand({ ...c, payload: { ...c.payload, received: 3000 } })).toThrow();
    expect(() => validateCommand({ ...c, payload: { ...c.payload, lines: [] } })).toThrow();
    expect(() => validateCommand({ ...c, payload: { ...c.payload, lines: [line, line] } })).toThrow();
  });
  it('known zero cost requires an explicit reason; unknown is separate', () => {
    const c = { type: 'RecordOpeningStock' as const, id: id(), registeredAt: '2026-10-10T11:00:00Z', contractVersion: 1 as const, dependencies: [], payload: { productId: id(), quantity: 2, totalCost: 0 } };
    expect(() => validateCommand(c)).toThrow();
    expect(() => validateCommand({ ...c, payload: { ...c.payload, costReason: 'Recibido sin cargo' } })).not.toThrow();
    expect(() => validateCommand({ ...c, payload: { ...c.payload, totalCost: null } })).not.toThrow();
  });

});
