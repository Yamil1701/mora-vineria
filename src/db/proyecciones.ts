import { eachDayOfInterval, endOfMonth, format, subDays } from "date-fns";

import type { MetaMensual } from "../domain/backup";
import { calcularEstadoStock } from "../domain/productos";
import {
  calcularEscenariosCierreMensual,
  calcularProyeccionMensual,
  type ItemPlanReposicion,
  type ProyeccionMensual,
  type VentaDiariaProyeccion,
} from "../domain/proyecciones";
import { calcularFechaJornada } from "../utils/jornadaVenta";
import { obtenerResumenPorRango } from "./reportes";
import { db } from "./schema";

export interface ProyeccionMensualActual {
  mes: string;
  fechaJornadaActual: string;
  rangoAcumulado: {
    desde: string;
    hasta: string;
  };
  metaMensual: MetaMensual | null;
  proyeccion: ProyeccionMensual;
  planReposicion: ItemPlanReposicion[];
  productosSinStockConDemanda: number;
}

interface DatosRitmoVentas {
  historialDiario: VentaDiariaProyeccion[];
  ventasJornadaActual: number;
  velocidadPorProducto: Map<string, number>;
}

function crearFechaDesdeJornada(fechaJornada: string): Date {
  const [anio = "0", mes = "1", dia = "1"] = fechaJornada.split("-");
  return new Date(Number(anio), Number(mes) - 1, Number(dia), 12);
}

function obtenerMes(fechaJornada: string): string {
  return format(crearFechaDesdeJornada(fechaJornada), "yyyy-MM");
}

function obtenerRangoMesAcumulado(fechaJornada: string) {
  const fecha = crearFechaDesdeJornada(fechaJornada);
  const desde = format(new Date(fecha.getFullYear(), fecha.getMonth(), 1), "yyyy-MM-dd");
  return { desde, hasta: fechaJornada };
}

export async function obtenerMetaMensual(mes: string): Promise<MetaMensual | null> {
  return (await db.metasMensuales.get(mes)) ?? null;
}

export async function guardarMetaMensual(mes: string, metaVentas: number): Promise<void> {
  if (!Number.isFinite(metaVentas) || metaVentas < 0) {
    throw new Error("La meta mensual no puede ser negativa.");
  }

  const ahora = new Date().toISOString();
  const metaActual = await db.metasMensuales.get(mes);

  await db.metasMensuales.put({
    id: mes,
    mes,
    metaVentas,
    createdAt: metaActual?.createdAt ?? ahora,
    updatedAt: ahora,
  });
}

async function obtenerDatosRitmoVentas(fechaJornadaActual: string): Promise<DatosRitmoVentas> {
  const ventas = (await db.ventas.toArray()).filter((venta) => venta.estado === "activa");
  if (!ventas.length) {
    return { historialDiario: [], ventasJornadaActual: 0, velocidadPorProducto: new Map() };
  }

  const ventaIds = ventas.map((venta) => venta.id);
  const detalles = await db.detalleVentas.where("ventaId").anyOf(ventaIds).toArray();
  const productos = await db.productos.bulkGet(Array.from(new Set(detalles.map((detalle) => detalle.productoId))));
  const productosPorId = new Map(productos.filter((producto) => Boolean(producto)).map((producto) => [producto!.id, producto!]));
  const detallesPorVenta = new Map<string, typeof detalles>();
  for (const detalle of detalles) {
    detallesPorVenta.set(detalle.ventaId, [...(detallesPorVenta.get(detalle.ventaId) ?? []), detalle]);
  }

  const fechaActual = crearFechaDesdeJornada(fechaJornadaActual);
  const fechaFin = subDays(fechaActual, 1);
  const ventasCompletas = ventas.filter((venta) => venta.fechaJornada < fechaJornadaActual);
  const primeraFecha = ventasCompletas.map((venta) => venta.fechaJornada).sort()[0];
  const fechaInicioDisponible = primeraFecha ? crearFechaDesdeJornada(primeraFecha) : fechaFin;
  const fechaInicio = fechaInicioDisponible > subDays(fechaActual, 90)
    ? fechaInicioDisponible
    : subDays(fechaActual, 90);
  const totalesAjustados = new Map<string, number>();

  for (const venta of ventasCompletas) {
    if (venta.fechaJornada < format(fechaInicio, "yyyy-MM-dd")) continue;
    const detallesVenta = detallesPorVenta.get(venta.id) ?? [];
    const totalAjustado = detallesVenta.length
      ? detallesVenta.reduce((total, detalle) => total + detalle.cantidad * (productosPorId.get(detalle.productoId)?.precioVenta ?? detalle.precioUnitarioAplicado), 0)
      : venta.total;
    totalesAjustados.set(venta.fechaJornada, (totalesAjustados.get(venta.fechaJornada) ?? 0) + totalAjustado);
  }

  const historialDiario = fechaInicio <= fechaFin
    ? eachDayOfInterval({ start: fechaInicio, end: fechaFin }).map((fecha) => {
      const id = format(fecha, "yyyy-MM-dd");
      return { fecha: id, total: totalesAjustados.get(id) ?? 0 };
    })
    : [];
  const ventasJornadaActual = ventas
    .filter((venta) => venta.fechaJornada === fechaJornadaActual)
    .reduce((total, venta) => total + venta.total, 0);

  const inicioVelocidad = format(subDays(fechaActual, Math.min(30, Math.max(1, historialDiario.length))), "yyyy-MM-dd");
  const ventasVelocidad = new Set(ventasCompletas
    .filter((venta) => venta.fechaJornada >= inicioVelocidad)
    .map((venta) => venta.id));
  const unidadesPorProducto = new Map<string, number>();
  for (const detalle of detalles) {
    if (!ventasVelocidad.has(detalle.ventaId)) continue;
    unidadesPorProducto.set(detalle.productoId, (unidadesPorProducto.get(detalle.productoId) ?? 0) + detalle.cantidad);
  }
  const divisorVelocidad = Math.max(1, Math.min(30, historialDiario.length));
  const velocidadPorProducto = new Map(Array.from(unidadesPorProducto, ([productoId, unidades]) => [productoId, unidades / divisorVelocidad]));

  return { historialDiario, ventasJornadaActual, velocidadPorProducto };
}

async function obtenerPlanReposicion(velocidadPorProducto: Map<string, number>): Promise<ItemPlanReposicion[]> {
  const [productos, movimientos, detalles] = await Promise.all([
    db.productos.where("estado").equals("activo").toArray(),
    db.movimientos.where("tipo").equals("reposicion").and((movimiento) => movimiento.estado === "activo").toArray(),
    db.detalleReposiciones.toArray(),
  ]);
  const fechaMovimiento = new Map(movimientos.map((movimiento) => [movimiento.id, movimiento.fechaHoraReal]));
  const ultimoPackPorProducto = new Map<string, number>();
  for (const detalle of [...detalles].sort((a, b) => (fechaMovimiento.get(b.movimientoId) ?? "").localeCompare(fechaMovimiento.get(a.movimientoId) ?? ""))) {
    if (!fechaMovimiento.has(detalle.movimientoId) || ultimoPackPorProducto.has(detalle.productoId)) continue;
    if (detalle.unidadesPorBulto && detalle.unidadesPorBulto > 0) ultimoPackPorProducto.set(detalle.productoId, detalle.unidadesPorBulto);
  }

  return productos.flatMap((producto): ItemPlanReposicion[] => {
    const estadoStock = calcularEstadoStock(producto.stockActual, producto.stockObjetivo);
    if (estadoStock === "disponible") return [];
    const stockMeta = Math.ceil(producto.stockObjetivo * 0.9);
    const faltantes = Math.max(0, stockMeta - producto.stockActual);
    if (!faltantes) return [];
    const unidadesPorPack = ultimoPackPorProducto.get(producto.id);
    const packsSugeridos = unidadesPorPack ? Math.ceil(faltantes / unidadesPorPack) : undefined;
    const unidadesSugeridas = unidadesPorPack && packsSugeridos ? unidadesPorPack * packsSugeridos : faltantes;
    return [{
      productoId: producto.id,
      nombre: producto.nombre,
      estadoStock,
      stockActual: producto.stockActual,
      stockObjetivo: producto.stockObjetivo,
      stockMeta,
      unidadesSugeridas,
      unidadesPorPack,
      packsSugeridos,
      costoUnitario: producto.costoCompra,
      costoEstimado: unidadesSugeridas * producto.costoCompra,
      velocidadVentaDiaria: velocidadPorProducto.get(producto.id) ?? 0,
    }];
  }).sort((a, b) => {
    const urgencia = { sin_stock: 3, critico: 2, bajo: 1 } as const;
    return urgencia[b.estadoStock] - urgencia[a.estadoStock]
      || b.velocidadVentaDiaria - a.velocidadVentaDiaria
      || a.nombre.localeCompare(b.nombre, "es-AR");
  });
}

export async function obtenerProyeccionMensualActual(fecha: Date = new Date()): Promise<ProyeccionMensualActual> {
  const fechaJornadaActual = calcularFechaJornada(fecha);
  const fechaJornada = crearFechaDesdeJornada(fechaJornadaActual);
  const mes = obtenerMes(fechaJornadaActual);
  const rangoAcumulado = obtenerRangoMesAcumulado(fechaJornadaActual);
  const [resumenAcumulado, metaMensual, datosRitmo] = await Promise.all([
    obtenerResumenPorRango(rangoAcumulado),
    obtenerMetaMensual(mes),
    obtenerDatosRitmoVentas(fechaJornadaActual),
  ]);
  const diasDelMes = endOfMonth(fechaJornada).getDate();
  const escenarios = calcularEscenariosCierreMensual({
    ventasAcumuladas: resumenAcumulado.totalVendido,
    ventasJornadaActual: datosRitmo.ventasJornadaActual,
    historialDiario: datosRitmo.historialDiario,
    fechaJornadaActual,
    diasDelMes,
  });
  const base = calcularProyeccionMensual({
    resumenAcumulado,
    diasTranscurridos: fechaJornada.getDate(),
    diasDelMes,
    metaVentas: metaMensual?.metaVentas,
  });
  const meta = metaMensual?.metaVentas && metaMensual.metaVentas > 0 ? metaMensual.metaVentas : undefined;
  const faltanteMeta = meta ? Math.max(0, meta - resumenAcumulado.totalVendido) : undefined;
  const ritmoNecesarioMeta = faltanteMeta !== undefined ? faltanteMeta / Math.max(1, escenarios.diasRestantes) : undefined;
  const ritmoActualMeta = escenarios.promedioDiarioReciente || escenarios.promedioDiarioHistorico;
  const relacionRitmo = ritmoNecesarioMeta && ritmoNecesarioMeta > 0 ? ritmoActualMeta / ritmoNecesarioMeta : 1;
  const planReposicion = await obtenerPlanReposicion(datosRitmo.velocidadPorProducto);

  return {
    mes,
    fechaJornadaActual,
    rangoAcumulado,
    metaMensual,
    planReposicion,
    productosSinStockConDemanda: planReposicion.filter((item) => item.estadoStock === "sin_stock" && item.velocidadVentaDiaria > 0).length,
    proyeccion: {
      ...base,
      proyeccionVentasMes: escenarios.probable,
      escenarioConservador: escenarios.conservador,
      escenarioProbable: escenarios.probable,
      escenarioFavorable: escenarios.favorable,
      confianza: escenarios.confianza,
      diasHistorial: escenarios.diasHistorial,
      promedioDiarioVentas: escenarios.promedioDiarioHistorico,
      promedioDiarioReciente: escenarios.promedioDiarioReciente,
      variacionRitmoReciente: escenarios.variacionRitmoReciente,
      porcentajeMetaActual: meta ? (resumenAcumulado.totalVendido / meta) * 100 : undefined,
      faltanteMeta,
      ritmoNecesarioMeta,
      ritmoActualMeta,
      estadoRitmoMeta: !meta
        ? "sin_meta"
        : relacionRitmo > 1.1 ? "por_encima" : relacionRitmo >= 0.9 ? "en_ritmo" : "por_debajo",
      porcentajeMetaProyectado: meta ? (escenarios.probable / meta) * 100 : undefined,
      diferenciaMetaProyectada: meta ? escenarios.probable - meta : undefined,
    },
  };
}
