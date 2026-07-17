export type MedioPago = "efectivo" | "transferencia" | "tarjeta" | "mercado_pago" | "otro";
export type DestinoTransferencia = "mercado_pago" | "brubank" | "naranja_x" | "otro";
export type CondicionPago = "contado" | "fiado";

export type EstadoVenta = "activa" | "anulada";
export type EstadoCobroVenta = "activo" | "anulado";
export type EstadoFiado = "pendiente" | "vencida" | "pagada" | "excedida" | "anulada";

export interface Venta {
  id: string;
  fechaHoraReal: string;
  fechaJornada: string;
  medioPago?: MedioPago;
  destinoTransferencia?: DestinoTransferencia;
  condicionPago?: CondicionPago;
  clienteFiadoNombre?: string;
  clienteFiadoNota?: string;
  vencimientoFiado?: string;
  total: number;
  estado: EstadoVenta;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
  anuladaAt?: string | null;
  motivoAnulacion?: string | null;
}

export interface CobroVenta {
  id: string;
  ventaId: string;
  fechaHoraReal: string;
  fechaJornada: string;
  monto: number;
  medioPago: MedioPago;
  destinoTransferencia?: DestinoTransferencia;
  cuentaTesoreriaId?: string;
  estado: EstadoCobroVenta;
  createdAt: string;
  updatedAt: string;
  anuladoAt?: string | null;
  motivoAnulacion?: string | null;
}

export function obtenerCondicionPago(venta: Pick<Venta, "condicionPago">): CondicionPago {
  return venta.condicionPago ?? "contado";
}

export function calcularTotalCobrado(cobros: Array<Pick<CobroVenta, "monto" | "estado">>): number {
  return cobros
    .filter((cobro) => cobro.estado === "activo")
    .reduce((total, cobro) => total + cobro.monto, 0);
}

export function calcularSaldoVenta(
  totalVenta: number,
  cobros: Array<Pick<CobroVenta, "monto" | "estado">>,
): number {
  return totalVenta - calcularTotalCobrado(cobros);
}

export function obtenerEstadoFiado(
  venta: Pick<Venta, "estado" | "total" | "vencimientoFiado">,
  cobros: Array<Pick<CobroVenta, "monto" | "estado">>,
  hoy = new Date().toISOString().slice(0, 10),
): EstadoFiado {
  if (venta.estado === "anulada") return "anulada";
  const saldo = calcularSaldoVenta(venta.total, cobros);
  if (saldo < 0) return "excedida";
  if (saldo === 0) return "pagada";
  if (venta.vencimientoFiado && venta.vencimientoFiado < hoy) return "vencida";
  return "pendiente";
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
