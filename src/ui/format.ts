/** Display formatting only. All business amounts are stored as integer ARS. */
const ars = new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', maximumFractionDigits: 0, minimumFractionDigits: 0,
});
export function formatArs(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return ars.format(Math.round(value));
}
export function formatUnits(value: number | null | undefined): string {
  if (value == null || !Number.isInteger(value) || value < 0) return '—';
  return `${value} un.`;
}
