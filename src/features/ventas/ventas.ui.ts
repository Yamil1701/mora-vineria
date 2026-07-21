import { MEDIOS_DE_PAGO } from "../../constants";

export interface ItemPrecioVenta {
  productoId: string;
  cantidad: number;
  precioUnitarioAplicado: number;
  observaciones?: string;
}

export function calcularTotalLista(
  items: ItemPrecioVenta[],
  preciosPorProducto: ReadonlyMap<string, number>,
): number {
  return items.reduce(
    (total, item) => total + item.cantidad * (preciosPorProducto.get(item.productoId) ?? item.precioUnitarioAplicado),
    0,
  );
}

export function aplicarDescuentoTotal(
  items: ItemPrecioVenta[],
  preciosPorProducto: ReadonlyMap<string, number>,
  descuentoSolicitado: number,
): ItemPrecioVenta[] {
  const totalLista = calcularTotalLista(items, preciosPorProducto);
  const descuento = Math.min(Math.max(0, Math.round(descuentoSolicitado)), Math.max(0, totalLista - 1));
  if (!items.length || descuento <= 0 || totalLista <= 0) {
    return items.map((item) => ({
      ...item,
      precioUnitarioAplicado: preciosPorProducto.get(item.productoId) ?? item.precioUnitarioAplicado,
    }));
  }

  const totalFinal = totalLista - descuento;
  let subtotalAcumulado = 0;

  return items.map((item, indice) => {
    const precioLista = preciosPorProducto.get(item.productoId) ?? item.precioUnitarioAplicado;
    const ultimo = indice === items.length - 1;
    const precioAplicado = ultimo
      ? (totalFinal - subtotalAcumulado) / item.cantidad
      : precioLista * (totalFinal / totalLista);
    const precioRedondeado = Math.max(1, Math.round(precioAplicado));
    subtotalAcumulado += precioRedondeado * item.cantidad;
    return { ...item, precioUnitarioAplicado: precioRedondeado };
  });
}

export function formatearPesos(valor: number): string {
  return `$${valor.toLocaleString("es-AR")}`;
}

export function formatearFechaVenta(fechaIso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fechaIso));
}

export function obtenerMedioPagoLabel(value?: string): string {
  if (!value) return "Sin cobro inicial";
  if (value === "mercado_pago") return "Transferencia · Mercado Pago";
  return MEDIOS_DE_PAGO.find((medio) => medio.value === value)?.label ?? "Otro";
}

export function formatearFechaSimple(fecha: string): string {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(`${fecha}T12:00:00`));
}

export function obtenerDestinoTransferenciaLabel(value?: string): string | undefined {
  return ({ mercado_pago: "Mercado Pago", brubank: "Brubank", naranja_x: "Naranja X", otro: "Otro" } as Record<string, string>)[value ?? ""];
}
