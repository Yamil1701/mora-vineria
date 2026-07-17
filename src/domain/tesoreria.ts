export type TipoCuentaTesoreria = "efectivo" | "digital";
export type EstadoCuentaTesoreria = "activa" | "archivada";
export type DireccionMovimientoTesoreria = "entrada" | "salida";
export type TipoMovimientoTesoreria =
  | "saldo_inicial"
  | "cobro_venta"
  | "reposicion"
  | "gasto_puntual"
  | "aporte_externo"
  | "retiro"
  | "transferencia"
  | "ajuste_conteo"
  | "reversion";

export type TipoReferenciaTesoreria =
  | "venta"
  | "cobro_venta"
  | "movimiento"
  | "transferencia"
  | "conteo_caja"
  | "movimiento_tesoreria";

export interface CuentaTesoreria {
  id: string;
  nombre: string;
  tipo: TipoCuentaTesoreria;
  estado: EstadoCuentaTesoreria;
  esPredeterminada: boolean;
  fondoCambioObjetivo?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MovimientoTesoreria {
  id: string;
  cuentaId: string;
  fechaHoraReal: string;
  fechaJornada: string;
  tipo: TipoMovimientoTesoreria;
  direccion: DireccionMovimientoTesoreria;
  monto: number;
  descripcion: string;
  referenciaTipo?: TipoReferenciaTesoreria;
  referenciaId?: string;
  grupoId?: string;
  registradoPor?: string;
  destinatario?: string;
  observaciones?: string;
  createdAt: string;
}

export interface ConteoCaja {
  id: string;
  cuentaId: string;
  fechaHoraReal: string;
  fechaJornada: string;
  montoEsperado: number;
  montoContado: number;
  diferencia: number;
  detalleDenominaciones?: Record<string, number>;
  observaciones?: string;
  movimientoAjusteId?: string;
  createdAt: string;
}

export interface CuentaTesoreriaConSaldo extends CuentaTesoreria {
  saldo: number;
}

export interface ResumenTesoreria {
  configurada: boolean;
  totalDisponible: number;
  cuentas: CuentaTesoreriaConSaldo[];
  ultimosMovimientos: MovimientoTesoreria[];
  entradasPeriodo: number;
  salidasPeriodo: number;
}

export function impactoMovimiento(movimiento: Pick<MovimientoTesoreria, "direccion" | "monto">): number {
  return movimiento.direccion === "entrada" ? movimiento.monto : -movimiento.monto;
}

export function calcularSaldoCuenta(movimientos: Array<Pick<MovimientoTesoreria, "direccion" | "monto">>): number {
  return movimientos.reduce((saldo, movimiento) => saldo + impactoMovimiento(movimiento), 0);
}

export function calcularDiferenciaConteo(montoEsperado: number, montoContado: number): number {
  return montoContado - montoEsperado;
}

export function obtenerDireccionReversion(
  direccionOriginal: DireccionMovimientoTesoreria,
): DireccionMovimientoTesoreria {
  return direccionOriginal === "entrada" ? "salida" : "entrada";
}
