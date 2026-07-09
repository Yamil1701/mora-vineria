export type MedioPago = "efectivo" | "transferencia" | "tarjeta" | "mercado_pago" | "otro";

export type EstadoVenta = "activa" | "anulada";

export interface Venta {
  id: string;
  fechaHoraReal: string;
  fechaJornada: string;
  medioPago: MedioPago;
  total: number;
  estado: EstadoVenta;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
  anuladaAt?: string | null;
  motivoAnulacion?: string | null;
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