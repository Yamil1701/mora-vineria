// Executable design oracle only. Not imported by src; no DB/network/auth guarantees.
export class Fraction {
  constructor(n, d = 1n) {
    this.n = BigInt(n); this.d = BigInt(d);
    if (this.d <= 0n) throw new Error('invalid denominator');
  }
  plus(other) { return new Fraction(this.n * other.d + other.n * this.d, this.d * other.d); }
  times(units) { return new Fraction(this.n * BigInt(units), this.d); }
  equals(n, d = 1) { return this.n * BigInt(d) === BigInt(n) * this.d; }
}
export function journalDate(instant) {
  const date = new Date(instant);
  if (!Number.isFinite(date.getTime())) throw new Error('invalid instant');
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Salta', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map(p => [p.type, p.value]));
  const day = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00Z`);
  if (Number(parts.hour) < 8) day.setUTCDate(day.getUTCDate() - 1);
  return day.toISOString().slice(0, 10);
}
export function pesos(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('invalid ARS');
  return value;
}
export function suggestedPrice(cost) {
  const numerator = cost.n * 3n;
  const denominator = cost.d * 1000n;
  return ((numerator + denominator - 1n) / denominator) * 500n;
}
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
export class ReferenceBook {
  constructor() { this.lots = []; this.results = new Map(); this.sales = []; this.stock = 0; this.cash = 0; }
  receive(id, units, total = null) {
    if (!Number.isSafeInteger(units) || units <= 0) throw new Error('invalid units');
    if (total !== null) pesos(total);
    this.lots.push({ id, available: units, cost: total === null ? null : new Fraction(total, units) });
    this.stock += units;
    if (total !== null) this.cash -= total;
  }
  sale(id, units, price) {
    const payload = canonical({ units, price });
    if (this.results.has(id)) {
      const previous = this.results.get(id);
      if (previous.payload !== payload) throw new Error('IDEMPOTENCY_KEY_REUSED');
      return previous.result;
    }
    if (!Number.isSafeInteger(units) || units <= 0) throw new Error('invalid units');
    const total = pesos(pesos(price) * units);
    let left = units, known = true, cost = new Fraction(0);
    const allocations = [];
    for (const lot of this.lots) {
      const take = Math.min(left, lot.available);
      if (!take) continue;
      allocations.push({ lotId: lot.id, units: take, cost: lot.cost?.times(take) ?? null });
      if (lot.cost === null) known = false; else cost = cost.plus(lot.cost.times(take));
      lot.available -= take; left -= take;
    }
    this.stock -= units; this.cash += total;
    const result = { id, units, price, total, allocations, missing: left, cost: known && left === 0 ? cost : null };
    this.sales.push(result); this.results.set(id, { payload, result });
    return result;
  }
  reduceSale(sale, nextUnits) {
    if (!Number.isSafeInteger(nextUnits) || nextUnits < 0 || nextUnits > sale.units) throw new Error('invalid correction');
    let release = sale.units - nextUnits;
    const reversals = [];
    const unassigned = Math.min(release, sale.missing); release -= unassigned;
    for (const segment of [...sale.allocations].reverse()) {
      const take = Math.min(release, segment.units);
      if (take) {
        this.lots.find(l => l.id === segment.lotId).available += take;
        reversals.push({ lotId: segment.lotId, units: take }); release -= take;
      }
    }
    this.stock += sale.units - nextUnits;
    this.cash -= (sale.units - nextUnits) * sale.price;
    // Original stays immutable; this oracle intentionally does not implement correction command replay.
    return reversals;
  }
}
export function applyDebtPayments(debt, amounts) {
  let remaining = pesos(debt), cash = 0, unapplied = 0;
  for (const amount of amounts) {
    pesos(amount); cash = pesos(cash + amount);
    const applied = Math.min(remaining, amount);
    remaining -= applied; unapplied += amount - applied;
  }
  return { remaining, cash, unapplied };
}
