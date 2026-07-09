export function formatearPesos(valor: number): string {
  return `$${valor.toLocaleString("es-AR")}`;
}
