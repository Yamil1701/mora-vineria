import type { MedioPago } from "./ventas";

export type TipoMovimiento = "reposicion" | "aporte_externo" | "gasto_puntual";

export type EstadoMovimiento = "activo" | "anulado";

export interface Movimiento {
  id: string;
  fechaHoraReal: string;
  fechaJornada: string;
  tipo: TipoMovimiento;
  descripcion: string;
  monto: number;
  medioPago?: MedioPago;
  estado: EstadoMovimiento;
  observaciones?: string;
  aporteExternoIncluido?: number;
  createdAt: string;
  updatedAt: string;
  anuladoAt?: string | null;
  motivoAnulacion?: string | null;
}

export interface DetalleReposicion {
  id: string;
  movimientoId: string;
  productoId: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

export function calcularSubtotalReposicion(cantidad: number, costoUnitario: number): number {
  return cantidad * costoUnitario;
}

export function calcularTotalReposicion(
  detalles: Array<Pick<DetalleReposicion, "cantidad" | "costoUnitario">>,
): number {
  return detalles.reduce(
    (total, detalle) => total + calcularSubtotalReposicion(detalle.cantidad, detalle.costoUnitario),
    0,
  );
}

export function calcularStockLuegoDeReposicion(stockActual: number, cantidadRepuesta: number): number {
  return stockActual + cantidadRepuesta;
}

export function calcularStockLuegoDeAnularReposicion(
  stockActual: number,
  cantidadRepuesta: number,
): number {
  return stockActual - cantidadRepuesta;
}

export function puedeEliminarMovimientoAnulado(
  movimiento: Pick<Movimiento, "estado" | "anuladoAt">,
): boolean {
  return movimiento.estado === "anulado" && Boolean(movimiento.anuladoAt);
}
