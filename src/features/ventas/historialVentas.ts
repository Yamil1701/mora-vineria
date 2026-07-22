import { format, startOfWeek } from "date-fns";

import type { VentaConDetalles } from "../../db";
import type { MedioPago } from "../../domain/ventas";

export type PeriodoHistorialVentas = "todos" | "hoy" | "semana" | "mes" | "personalizado";
export type MedioPagoHistorial = "todos" | MedioPago;

export interface FiltrosHistorialVentas {
  busqueda: string;
  periodo: PeriodoHistorialVentas;
  medioPago: MedioPagoHistorial;
  mostrarAnuladas: boolean;
  desde: string;
  hasta: string;
}

function normalizarTexto(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR")
    .trim();
}

function obtenerRangoPeriodo(
  periodo: PeriodoHistorialVentas,
  fechaJornadaActual: string,
  desde: string,
  hasta: string,
): { desde?: string; hasta?: string } {
  if (periodo === "todos") return {};
  if (periodo === "hoy") return { desde: fechaJornadaActual, hasta: fechaJornadaActual };
  if (periodo === "mes") {
    return { desde: `${fechaJornadaActual.slice(0, 7)}-01`, hasta: fechaJornadaActual };
  }
  if (periodo === "semana") {
    const inicio = startOfWeek(new Date(`${fechaJornadaActual}T12:00:00`), { weekStartsOn: 1 });
    return { desde: format(inicio, "yyyy-MM-dd"), hasta: fechaJornadaActual };
  }
  return { desde: desde || undefined, hasta: hasta || undefined };
}

function coincideMedioPago(venta: VentaConDetalles, filtro: MedioPagoHistorial): boolean {
  if (filtro === "todos") return true;
  const medios = venta.cobros
    .filter((cobro) => cobro.estado === "activo")
    .map((cobro) => cobro.medioPago);

  if (medios.length === 0 && venta.medioPago) medios.push(venta.medioPago);
  if (filtro === "transferencia") {
    return medios.some((medio) => medio === "transferencia" || medio === "mercado_pago");
  }
  return medios.includes(filtro);
}

export function filtrarVentasHistorial(
  ventas: VentaConDetalles[],
  filtros: FiltrosHistorialVentas,
  fechaJornadaActual: string,
): VentaConDetalles[] {
  const texto = normalizarTexto(filtros.busqueda);
  const rango = obtenerRangoPeriodo(filtros.periodo, fechaJornadaActual, filtros.desde, filtros.hasta);

  return ventas.filter((venta) => {
    if (filtros.mostrarAnuladas ? venta.estado !== "anulada" : venta.estado !== "activa") return false;
    if (rango.desde && venta.fechaJornada < rango.desde) return false;
    if (rango.hasta && venta.fechaJornada > rango.hasta) return false;
    if (!coincideMedioPago(venta, filtros.medioPago)) return false;
    if (!texto) return true;

    return venta.detalles.some((detalle) => normalizarTexto([
      detalle.producto?.nombre,
      detalle.producto?.marca,
      detalle.producto?.presentacion,
    ].filter(Boolean).join(" ")).includes(texto));
  });
}

export function obtenerSiguienteLimiteVentas(limiteActual: number, total: number): number {
  return Math.min(limiteActual + 15, total);
}
