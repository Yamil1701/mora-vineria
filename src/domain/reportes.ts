import type { Movimiento, TipoMovimiento } from "./movimientos";
import type { CobroVenta, DetalleVenta, MedioPago, Venta } from "./ventas";

export type SemanaDelMes = 1 | 2 | 3 | 4;

export interface RangoFechas {
  desde: string;
  hasta: string;
}

export interface DetalleVentaParaResumen
  extends Pick<DetalleVenta, "productoId" | "cantidad" | "costoUnitarioAlMomento" | "subtotal"> {
  productoNombre?: string;
}

export interface VentaParaResumen extends Pick<Venta, "estado" | "total" | "condicionPago"> {
  detalles: DetalleVentaParaResumen[];
  totalCobrado?: number;
}

export type CobroParaResumen = Pick<CobroVenta, "estado" | "medioPago" | "monto">;

export type MovimientoParaResumen = Pick<
  Movimiento,
  "estado" | "tipo" | "monto" | "aporteExternoIncluido"
>;

export interface ResumenReporte {
  totalVendido: number;
  costoEstimadoVendido: number;
  gananciaBrutaEstimada: number;
  gastosPuntuales: number;
  reinversion: number;
  aportesExternos: number;
  gananciaNetaEstimada: number;
  cantidadVentas: number;
  cantidadMovimientos: number;
  totalCobrado: number;
  vendidoFiado: number;
  saldoPendiente: number;
}

export interface ProductoVendidoResumen {
  productoId: string;
  nombre: string;
  cantidad: number;
  totalVendido: number;
}

export interface MedioPagoResumen {
  medioPago: MedioPago;
  cantidadCobros: number;
  totalVendido: number;
}

export interface ResumenConRanking extends ResumenReporte {
  productosMasVendidos: ProductoVendidoResumen[];
  mediosPagoMasUsados: MedioPagoResumen[];
}


export function crearRangoMesReporte(mes: string): RangoFechas {
  if (!/^\d{4}-\d{2}$/.test(mes)) {
    throw new Error("El mes del reporte no tiene un formato válido.");
  }

  const [anioTexto, mesTexto] = mes.split("-");
  const anio = Number(anioTexto);
  const mesNumero = Number(mesTexto);

  if (!Number.isInteger(anio) || !Number.isInteger(mesNumero) || mesNumero < 1 || mesNumero > 12) {
    throw new Error("El mes del reporte no tiene un formato válido.");
  }

  const ultimoDia = new Date(anio, mesNumero, 0).getDate();

  return {
    desde: `${anioTexto}-${mesTexto}-01`,
    hasta: `${anioTexto}-${mesTexto}-${String(ultimoDia).padStart(2, "0")}`,
  };
}

export function formatearMesReporte(mes: string): string {
  const rango = crearRangoMesReporte(mes);
  const [anioTexto, mesTexto] = rango.desde.split("-");
  const fecha = new Date(Number(anioTexto), Number(mesTexto) - 1, 1);

  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(fecha);
}

export function crearResumenVacio(): ResumenReporte {
  return {
    totalVendido: 0,
    costoEstimadoVendido: 0,
    gananciaBrutaEstimada: 0,
    gastosPuntuales: 0,
    reinversion: 0,
    aportesExternos: 0,
    gananciaNetaEstimada: 0,
    cantidadVentas: 0,
    cantidadMovimientos: 0,
    totalCobrado: 0,
    vendidoFiado: 0,
    saldoPendiente: 0,
  };
}

function sumarMovimientosPorTipo(
  movimientos: MovimientoParaResumen[],
  tipo: TipoMovimiento,
): number {
  return movimientos
    .filter((movimiento) => movimiento.estado === "activo" && movimiento.tipo === tipo)
    .reduce((total, movimiento) => total + movimiento.monto, 0);
}

export function calcularCostoEstimadoVendido(ventas: VentaParaResumen[]): number {
  return ventas
    .filter((venta) => venta.estado === "activa")
    .flatMap((venta) => venta.detalles)
    .reduce(
      (total, detalle) => total + detalle.costoUnitarioAlMomento * detalle.cantidad,
      0,
    );
}

export function calcularAportesExternos(movimientos: MovimientoParaResumen[]): number {
  return movimientos
    .filter((movimiento) => movimiento.estado === "activo")
    .reduce((total, movimiento) => {
      if (movimiento.tipo === "aporte_externo") return total + movimiento.monto;
      if (movimiento.tipo === "reposicion") {
        return total + (movimiento.aporteExternoIncluido ?? 0);
      }

      return total;
    }, 0);
}

export function calcularResumenReporte(
  ventas: VentaParaResumen[],
  movimientos: MovimientoParaResumen[],
): ResumenReporte {
  const ventasActivas = ventas.filter((venta) => venta.estado === "activa");
  const movimientosActivos = movimientos.filter((movimiento) => movimiento.estado === "activo");
  const totalVendido = ventasActivas.reduce((total, venta) => total + venta.total, 0);
  const costoEstimadoVendido = calcularCostoEstimadoVendido(ventasActivas);
  const gananciaBrutaEstimada = totalVendido - costoEstimadoVendido;
  const gastosPuntuales = sumarMovimientosPorTipo(movimientosActivos, "gasto_puntual");
  const reinversion = sumarMovimientosPorTipo(movimientosActivos, "reposicion");
  const aportesExternos = calcularAportesExternos(movimientosActivos);
  const vendidoFiado = ventasActivas
    .filter((venta) => venta.condicionPago === "fiado")
    .reduce((total, venta) => total + venta.total, 0);
  const saldoPendiente = ventasActivas
    .filter((venta) => venta.condicionPago === "fiado")
    .reduce((total, venta) => total + Math.max(0, venta.total - (venta.totalCobrado ?? 0)), 0);

  return {
    totalVendido,
    costoEstimadoVendido,
    gananciaBrutaEstimada,
    gastosPuntuales,
    reinversion,
    aportesExternos,
    gananciaNetaEstimada: gananciaBrutaEstimada - gastosPuntuales,
    cantidadVentas: ventasActivas.length,
    cantidadMovimientos: movimientosActivos.length,
    totalCobrado: ventasActivas.reduce((total, venta) => total + (venta.totalCobrado ?? venta.total), 0),
    vendidoFiado,
    saldoPendiente,
  };
}

export function calcularProductosMasVendidos(
  ventas: VentaParaResumen[],
): ProductoVendidoResumen[] {
  const productos = new Map<string, ProductoVendidoResumen>();

  for (const venta of ventas) {
    if (venta.estado !== "activa") continue;

    for (const detalle of venta.detalles) {
      const productoActual = productos.get(detalle.productoId) ?? {
        productoId: detalle.productoId,
        nombre: detalle.productoNombre ?? "Producto eliminado",
        cantidad: 0,
        totalVendido: 0,
      };

      productoActual.cantidad += detalle.cantidad;
      productoActual.totalVendido += detalle.subtotal;
      productos.set(detalle.productoId, productoActual);
    }
  }

  return Array.from(productos.values()).sort((a, b) => {
    if (b.cantidad !== a.cantidad) return b.cantidad - a.cantidad;

    return b.totalVendido - a.totalVendido;
  });
}

export function calcularMediosPagoMasUsados(cobros: CobroParaResumen[]): MedioPagoResumen[] {
  const medios = new Map<MedioPago, MedioPagoResumen>();

  for (const cobro of cobros) {
    if (cobro.estado !== "activo") continue;

    const medioNormalizado: MedioPago = cobro.medioPago === "mercado_pago" ? "transferencia" : cobro.medioPago;
    const medioActual = medios.get(medioNormalizado) ?? {
      medioPago: medioNormalizado,
      cantidadCobros: 0,
      totalVendido: 0,
    };

    medioActual.cantidadCobros += 1;
    medioActual.totalVendido += cobro.monto;
    medios.set(medioNormalizado, medioActual);
  }

  return Array.from(medios.values()).sort((a, b) => {
    if (b.totalVendido !== a.totalVendido) return b.totalVendido - a.totalVendido;

    return b.cantidadCobros - a.cantidadCobros;
  });
}

export function calcularResumenConRanking(
  ventas: VentaParaResumen[],
  movimientos: MovimientoParaResumen[],
  cobros: CobroParaResumen[] = [],
): ResumenConRanking {
  const totalCobrado = cobros
    .filter((cobro) => cobro.estado === "activo")
    .reduce((total, cobro) => total + cobro.monto, 0);
  return {
    ...calcularResumenReporte(ventas, movimientos),
    totalCobrado,
    productosMasVendidos: calcularProductosMasVendidos(ventas),
    mediosPagoMasUsados: calcularMediosPagoMasUsados(cobros),
  };
}
