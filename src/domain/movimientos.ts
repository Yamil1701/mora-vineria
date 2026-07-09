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