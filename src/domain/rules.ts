import type { Allocation, Command, Lot, ProductFields, Rational, SaleLine } from './types';
export class DomainError extends Error {
  constructor(public code: string, message: string) { super(message); this.name = 'DomainError'; }
}
export function fail(code: string, message: string): never { throw new DomainError(code, message); }
export function whole(value: number, label = 'Importe', positive = false): number {
  if (!Number.isSafeInteger(value) || value < (positive ? 1 : 0)) fail('INVALID_INTEGER', `${label}: ingresá un entero ${positive ? 'mayor que cero' : 'sin decimales ni signo negativo'}.`);
  return value;
}
export function signed(value: number): number {
  if (!Number.isSafeInteger(value)) fail('OVERFLOW', 'El resultado supera el límite admitido.');
  return value;
}
export function sum(values: readonly number[]): number { return values.reduce((a, b) => signed(a + b), 0); }
export function parseInteger(value: string, label: string, positive = false): number {
  if (!/^\d+$/.test(value.trim())) fail('INVALID_INTEGER', `${label}: usá números enteros sin puntos ni comas.`);
  return whole(Number(value.trim()), label, positive);
}
export function uuid(value: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) fail('INVALID_ID', 'Identificador inválido.');
  return value;
}
export function text(value: string, label: string, required = false): string {
  if (typeof value !== 'string' || value.length > 120 || (required && !value.trim())) fail('INVALID_TEXT', `${label}: completá un texto de hasta 120 caracteres.`);
  return value.trim();
}
export function validateFields(f: ProductFields): void {
  text(f.name, 'Nombre', true); text(f.variant, 'Presentación'); text(f.category, 'Categoría');
  whole(f.price, 'Precio'); if (f.objective !== null) whole(f.objective, 'Objetivo');
  if (typeof f.active !== 'boolean') fail('INVALID_PRODUCT', 'Estado del producto inválido.');
}
const timezone = 'America/Argentina/Salta';
export function businessDate(instant: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(instant)) fail('INVALID_DATE', 'Fecha de carga inválida.');
  const date = new Date(instant);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 19) !== instant.slice(0, 19)) fail('INVALID_DATE', 'Fecha de carga inválida.');
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(date).map(part => [part.type, part.value]));
  const day = new Date(`${p.year}-${p.month}-${p.day}T12:00:00Z`);
  if (Number(p.hour) < 8) day.setUTCDate(day.getUTCDate() - 1);
  return day.toISOString().slice(0, 10);
}
function gcd(a: bigint, b: bigint): bigint { while (b) [a, b] = [b, a % b]; return a < 0n ? -a : a; }
export function rational(n: bigint, d = 1n): Rational {
  if (d <= 0n) fail('INVALID_COST', 'Costo inválido.');
  const g = gcd(n, d); return { numerator: String(n / g), denominator: String(d / g) };
}
export function addCost(a: Rational, b: Rational): Rational { return rational(BigInt(a.numerator) * BigInt(b.denominator) + BigInt(b.numerator) * BigInt(a.denominator), BigInt(a.denominator) * BigInt(b.denominator)); }
export function scaleCost(a: Rational, quantity: number): Rational { return rational(BigInt(a.numerator) * BigInt(quantity), BigInt(a.denominator)); }
export function roundCost(cost: Rational): number {
  const n = BigInt(cost.numerator), d = BigInt(cost.denominator), abs = n < 0n ? -n : n;
  return signed(Number(((abs + d / 2n) / d) * (n < 0n ? -1n : 1n)));
}
export function profit(total: number, cost: Rational): Rational { return addCost(rational(BigInt(total)), scaleCost(cost, -1)); }
export function saleTotal(lines: readonly SaleLine[]): number { return sum(lines.map(l => whole(l.quantity, 'Cantidad', true) * whole(l.unitPrice, 'Precio'))); }
export function validateLines(lines: readonly SaleLine[]): void {
  if (!Array.isArray(lines) || !lines.length || lines.length > 100) fail('INVALID_LINES', 'Agregá entre 1 y 100 líneas.');
  const ids = new Set<string>();
  for (const l of lines) {
    uuid(l.id); uuid(l.productId); text(l.name, 'Producto', true); whole(l.quantity, 'Cantidad', true); whole(l.referencePrice, 'Precio de referencia'); whole(l.unitPrice, 'Precio');
    if (ids.has(l.id)) fail('DUPLICATE_LINE', 'Hay líneas repetidas.'); ids.add(l.id);
  }
  saleTotal(lines);
}
export function validateCommand(c: Command): void {
  uuid(c.id); businessDate(c.registeredAt);
  if (c.contractVersion !== 1 || !Array.isArray(c.dependencies)) fail('INVALID_VERSION', 'Versión de operación incompatible.');
  c.dependencies.forEach(uuid);
  switch (c.type) {
    case 'CreateProduct': uuid(c.payload.productId); validateFields(c.payload.fields); break;
    case 'EditProduct': uuid(c.payload.productId); whole(c.payload.expectedVersion, 'Versión', true); validateFields(c.payload.fields); break;
    case 'RecordOpeningStock': uuid(c.payload.productId); whole(c.payload.quantity, 'Unidades', true); if (c.payload.totalCost !== null) whole(c.payload.totalCost, 'Costo total'); if (c.payload.totalCost === 0) text(c.payload.costReason ?? '', 'Motivo del costo cero', true); break;
    case 'ReceivePurchase': {
      uuid(c.payload.receiptId);
      if (!c.payload.lines.length || c.payload.lines.length > 100) fail('INVALID_LINES', 'Recepción vacía o demasiado grande.');
      const ids = new Set<string>();
      c.payload.lines.forEach(l => { uuid(l.id); uuid(l.productId); whole(l.quantity, 'Unidades', true); whole(l.totalCost, 'Costo total'); text(l.presentation, 'Presentación'); if (l.totalCost === 0) text(l.costReason ?? '', 'Motivo del costo cero', true); if (ids.has(l.id)) fail('DUPLICATE_LINE', 'Hay líneas repetidas.'); ids.add(l.id); });
      sum(c.payload.lines.map(l => l.totalCost)); break;
    }
    case 'RecordSale': {
      uuid(c.payload.saleId); validateLines(c.payload.lines);
      if (c.payload.received !== null && whole(c.payload.received, 'Recibido') < saleTotal(c.payload.lines)) fail('SHORT_PAYMENT', 'El efectivo recibido no alcanza para el total.');
      if (c.payload.draftId !== null) { uuid(c.payload.draftId); whole(c.payload.draftVersion!, 'Versión', true); }
      else if (c.payload.draftVersion !== null) fail('INVALID_DRAFT', 'Borrador inválido.');
      break;
    }
    default: fail('UNSUPPORTED', 'Operación todavía no disponible.');
  }
}
export function allocateFifo(lots: readonly Lot[], units: number): { allocations: Allocation[]; updates: Lot[]; missingUnits: number; cost: Rational | null } {
  whole(units, 'Unidades', true);
  let left = units, known = true, cost = rational(0n);
  const allocations: Allocation[] = [], updates: Lot[] = [];
  for (const lot of [...lots].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))) {
    whole(lot.available, 'Unidades de lote');
    const take = Math.min(left, lot.available); if (!take) continue;
    const segment = lot.unitCost === null ? null : scaleCost(lot.unitCost, take);
    allocations.push({ lotId: lot.id, units: take, cost: segment }); updates.push({ ...lot, available: lot.available - take });
    if (segment === null) known = false; else cost = addCost(cost, segment);
    left -= take; if (!left) break;
  }
  return { allocations, updates, missingUnits: left, cost: known && left === 0 ? cost : null };
}
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  if (value === undefined || (typeof value === 'number' && !Number.isSafeInteger(value))) fail('INVALID_PAYLOAD', 'Datos de operación inválidos.');
  return JSON.stringify(value);
}
export async function commandHash(command: Command): Promise<string> {
  validateCommand(command);
  const bytes = new TextEncoder().encode(canonical(command));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}
