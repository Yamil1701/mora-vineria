export type MedioPago = "efectivo" | "transferencia" | "tarjeta" | "mercado_pago" | "otro";
export type DestinoTransferencia = "mercado_pago" | "brubank" | "naranja_x" | "otro";

export type EstadoVenta = "activa" | "anulada";

export interface Venta {
  id: string;
  fechaHoraReal: string;
  fechaJornada: string;
  medioPago: MedioPago;
  destinoTransferencia?: DestinoTransferencia;
  total: number;
  estado: EstadoVenta;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
  anuladaAt?: string | null;
  motivoAnulacion?: string | null;
}

export function calcularVuelto(total: number, pagaCon: number): number | null {
  if (!Number.isFinite(pagaCon) || pagaCon < total) return null;
  return pagaCon - total;
}

export interface DetalleVenta {
  id: string;
  ventaId: string;
  productoId: string;
  cantidad: number;
  precioUnitarioAplicado: number;
  costoUnitarioAlMomento: number;
  subtotal: number;
  observaciones?: string;
}

export function calcularSubtotalDetalleVenta(
  cantidad: number,
  precioUnitarioAplicado: number,
): number {
  return cantidad * precioUnitarioAplicado;
}

export function calcularTotalVenta(
  detalles: Array<Pick<DetalleVenta, "cantidad" | "precioUnitarioAplicado">>,
): number {
  return detalles.reduce(
    (total, detalle) =>
      total + calcularSubtotalDetalleVenta(detalle.cantidad, detalle.precioUnitarioAplicado),
    0,
  );
}

export function calcularStockLuegoDeAnularVenta(
  stockActual: number,
  cantidadVendida: number,
): number {
  return stockActual + cantidadVendida;
}
