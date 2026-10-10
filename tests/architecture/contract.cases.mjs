import test from 'node:test';
import assert from 'node:assert/strict';
import { Fraction, journalDate, pesos, suggestedPrice, ReferenceBook, applyDebtPayments } from './reference-model.mjs';

test('07:59/08:00 Salta, UTC conversion and previous year', () => {
  assert.equal(journalDate('2026-10-10T10:59:59Z'), '2026-10-09');
  assert.equal(journalDate('2026-10-10T11:00:00Z'), '2026-10-10');
  assert.equal(journalDate('2026-01-01T03:00:00Z'), '2025-12-31');
  assert.throws(() => journalDate('demo'));
});
test('ARS rejects decimal, negative, string and unsafe values; cash change exact', () => {
  for (const invalid of [1.5, -1, '1000', NaN, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => pesos(invalid));
  assert.equal(pesos(5000) - pesos(3500), 1500);
  const book = new ReferenceBook(); book.receive('a', 2, 2000);
  assert.throws(() => book.sale('bad', 2, Number.MAX_SAFE_INTEGER));
  assert.equal(book.stock, 2); // rejected before effects
});
test('F01 approved historical FIFO example', () => {
  const b = new ReferenceBook(); b.receive('a', 10, 20000); b.receive('b', 10, 25000);
  const sales = [b.sale('x', 6, 3500), b.sale('y', 4, 4000), b.sale('z', 3, 4000)];
  const costs = [12000, 8000, 7500], profits = [9000, 8000, 4500];
  sales.forEach((s, i) => { assert(s.cost.equals(costs[i])); assert(new Fraction(s.total).plus(s.cost.times(-1)).equals(profits[i])); });
  assert.equal(b.stock, 7);
});
test('F02 crosses lots with exact allocations', () => {
  const b = new ReferenceBook(); b.receive('a', 2, 4000); b.receive('b', 3, 7500);
  const s = b.sale('x', 4, 4000);
  assert.deepEqual(s.allocations.map(a => [a.lotId, a.units]), [['a', 2], ['b', 2]]);
  assert(s.cost.equals(9000)); assert.equal(b.stock, 1);
});
test('F03/F05 concurrent acceptance conserves both sales and unknown missing cost', () => {
  for (const order of [['x', 'y'], ['y', 'x']]) {
    const b = new ReferenceBook(); b.receive('a', 1, 2000);
    const first = b.sale(order[0], 1, 3500), second = b.sale(order[1], 1, 3500);
    assert(first.cost.equals(2000)); assert.equal(second.cost, null); assert.equal(second.missing, 1);
    assert.equal(b.stock, -1); assert.equal(b.sales.length, 2); assert.equal(b.cash, 5000); // 7000 cobros - 2000 compra
  }
});
test('F04 no stock never creates zero cost or artificial profit', () => {
  const b = new ReferenceBook(), s = b.sale('x', 2, 3500);
  assert.equal(s.cost, null); assert.equal(s.missing, 2); assert.equal(b.stock, -2); assert.equal(b.cash, 7000);
});
test('F06 correction releases tail segments, preserves original allocation', () => {
  const b = new ReferenceBook(); b.receive('a', 2, 4000); b.receive('b', 2, 5000);
  const s = b.sale('x', 3, 4000), before = s.allocations.map(a => [a.lotId, a.units]);
  assert.deepEqual(b.reduceSale(s, 1), [{lotId:'b',units:1},{lotId:'a',units:1}]);
  assert.deepEqual(s.allocations.map(a => [a.lotId, a.units]), before);
  assert.deepEqual(b.lots.map(l => l.available), [1, 2]); assert.equal(b.stock, 3);
});
test('F07 price change affects next sale only', () => {
  const b = new ReferenceBook(); b.receive('a', 2, 4000);
  const a = b.sale('x', 1, 3500), c = b.sale('y', 1, 4000);
  assert.equal(a.total, 3500); assert.equal(c.total, 4000); assert(a.cost.equals(2000)); assert(c.cost.equals(2000));
});
test('F08 separate partial receptions do not apply order effects', () => {
  const b = new ReferenceBook(); assert.equal(b.stock, 0); assert.equal(b.cash, 0);
  b.receive('partial1', 8, 16000); assert.equal(b.stock, 8); assert.equal(b.cash, -16000);
  b.receive('partial2', 8, 16000); assert.equal(b.stock, 16); assert.equal(b.cash, -32000);
});
test('F09 unknown oldest lot is consumed, never skipped', () => {
  const b = new ReferenceBook(); b.receive('unknown', 2); b.receive('b', 2, 5000);
  const s = b.sale('x', 3, 4000);
  assert.equal(s.cost, null); assert.equal(s.missing, 0);
  assert.deepEqual(s.allocations.map(a => [a.lotId, a.units]), [['unknown', 2], ['b', 1]]);
});
test('F10 one ID retried 100 times has one effect; payload change rejected', () => {
  const b = new ReferenceBook(); b.receive('a', 10, 20000);
  const first = b.sale('stable', 1, 3500);
  for (let i = 0; i < 100; i++) assert.equal(b.sale('stable', 1, 3500), first);
  assert.equal(b.sales.length, 1); assert.equal(b.stock, 9); assert.equal(b.cash, -16500);
  assert.throws(() => b.sale('stable', 1, 4000), /IDEMPOTENCY_KEY_REUSED/);
});
test('F11 two physical partial payments preserve excess in either order', () => {
  assert.deepEqual(applyDebtPayments(1000, [700, 700]), {remaining:0,cash:1400,unapplied:400});
  assert.deepEqual(applyDebtPayments(1000, [800, 600]), {remaining:0,cash:1400,unapplied:400});
  assert.deepEqual(applyDebtPayments(1000, [600, 800]), {remaining:0,cash:1400,unapplied:400});
});
test('F12 indivisible pack conserves value and price rounds upwards to 500', () => {
  const unit = new Fraction(125000, 6);
  assert(unit.times(3).equals(62500)); assert(unit.times(6).equals(125000));
  assert.equal(suggestedPrice(unit), 31500n);
  assert.equal(suggestedPrice(new Fraction(3500)), 5500n);
  assert.equal(suggestedPrice(new Fraction(10000)), 15000n);
});
test('F14 new reception does not silently assign old missing sale', () => {
  const b = new ReferenceBook(), s = b.sale('x', 1, 3500);
  b.receive('later', 3, 6000);
  assert.equal(s.cost, null); assert.equal(s.missing, 1); assert.equal(b.stock, 2);
});
