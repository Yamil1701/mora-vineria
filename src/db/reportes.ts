import { endOfMonth, format } from "date-fns";

import type { Producto } from "../domain/productos";
import {
  calcularResumenConRanking,
  type DetalleVentaParaResumen,
  type MovimientoParaResumen,
  type RangoFechas,
  type ResumenConRanking,
  type VentaParaResumen,
} from "../domain/reportes";
import { calcularTotalCobrado, type CobroVenta, type DetalleVenta, type Venta } from "../domain/ventas";
import { calcularFechaJornada } from "../utils/jornadaVenta";
import { calcularSemanaDelMes, crearRangoSemanaDelMes } from "../utils/semanaDelMes";
import { db } from "./schema";

export interface ResumenesDashboard {
  fechaJornadaActual: string;
  rangoHoy: RangoFechas;
  rangoSemana: RangoFechas;
  rangoMes: RangoFechas;
  hoy: ResumenConRanking;
  semana: ResumenConRanking;
  mes: ResumenConRanking;
}

function formatearFechaJornada(fecha: Date): string {
  return format(fecha, "yyyy-MM-dd");
}

function crearFechaDesdeJornada(fechaJornada: string): Date {
  const [anio = "0", mes = "1", dia = "1"] = fechaJornada.split("-");

  return new Date(Number(anio), Number(mes) - 1, Number(dia));
}

function obtenerRangoHoy(fecha: Date): RangoFechas {
  const fechaJornadaActual = calcularFechaJornada(fecha);

  return {
    desde: fechaJornadaActual,
    hasta: fechaJornadaActual,
  };
}

function obtenerRangoSemanaDelMes(fechaJornada: string): RangoFechas {
  const fecha = crearFechaDesdeJornada(fechaJornada);
  const semana = calcularSemanaDelMes(fecha);

  return crearRangoSemanaDelMes(fechaJornada.slice(0, 7), semana);
}

function obtenerRangoMes(fechaJornada: string): RangoFechas {
  const fecha = crearFechaDesdeJornada(fechaJornada);
  const anio = fecha.getFullYear();
  const mes = fecha.getMonth();

  return {
    desde: formatearFechaJornada(new Date(anio, mes, 1)),
    hasta: formatearFechaJornada(endOfMonth(fecha)),
  };
}

function normalizarRango(rango: RangoFechas): RangoFechas {
  return rango.desde <= rango.hasta ? rango : { desde: rango.hasta, hasta: rango.desde };
}

function mapearDetalleParaResumen(
  detalle: DetalleVenta,
  productosPorId: Map<string, Producto>,
): DetalleVentaParaResumen {
  return {
    productoId: detalle.productoId,
    productoNombre: productosPorId.get(detalle.productoId)?.nombre,
    cantidad: detalle.cantidad,
    costoUnitarioAlMomento: detalle.costoUnitarioAlMomento,
    subtotal: detalle.subtotal,
  };
}

async function listarVentasParaResumen(rango: RangoFechas): Promise<VentaParaResumen[]> {
  const rangoNormalizado = normalizarRango(rango);
  const ventas = await db.ventas
    .where("fechaJornada")
    .between(rangoNormalizado.desde, rangoNormalizado.hasta, true, true)
    .toArray();

  if (ventas.length === 0) return [];

  const ventaIds = ventas.map((venta) => venta.id);
  const [detalles, cobros] = await Promise.all([
    db.detalleVentas.where("ventaId").anyOf(ventaIds).toArray(),
    db.cobrosVentas.where("ventaId").anyOf(ventaIds).toArray(),
  ]);
  const productoIds = Array.from(new Set(detalles.map((detalle) => detalle.productoId)));
  const productosResultado = await db.productos.bulkGet(productoIds);
  const productosPorId = new Map<string, Producto>();

  for (const producto of productosResultado) {
    if (producto) productosPorId.set(producto.id, producto);
  }

  const detallesPorVenta = new Map<string, DetalleVentaParaResumen[]>();

  for (const detalle of detalles) {
    const grupo = detallesPorVenta.get(detalle.ventaId) ?? [];
    grupo.push(mapearDetalleParaResumen(detalle, productosPorId));
    detallesPorVenta.set(detalle.ventaId, grupo);
  }

  return ventas.map((venta: Venta) => ({
    estado: venta.estado,
    condicionPago: venta.condicionPago ?? "contado",
    total: venta.total,
    totalCobrado: calcularTotalCobrado(cobros.filter((cobro) => cobro.ventaId === venta.id)),
    detalles: detallesPorVenta.get(venta.id) ?? [],
  }));
}

async function listarCobrosParaResumen(rango: RangoFechas): Promise<CobroVenta[]> {
  const rangoNormalizado = normalizarRango(rango);
  return db.cobrosVentas
    .where("fechaJornada")
    .between(rangoNormalizado.desde, rangoNormalizado.hasta, true, true)
    .toArray();
}

async function listarMovimientosParaResumen(
  rango: RangoFechas,
): Promise<MovimientoParaResumen[]> {
  const rangoNormalizado = normalizarRango(rango);
  const movimientos = await db.movimientos
    .where("fechaJornada")
    .between(rangoNormalizado.desde, rangoNormalizado.hasta, true, true)
    .toArray();

  return movimientos.map((movimiento) => ({
    estado: movimiento.estado,
    tipo: movimiento.tipo,
    monto: movimiento.monto,
    aporteExternoIncluido: movimiento.aporteExternoIncluido,
  }));
}

export async function obtenerResumenPorRango(rango: RangoFechas): Promise<ResumenConRanking> {
  const [ventas, movimientos, cobros] = await Promise.all([
    listarVentasParaResumen(rango),
    listarMovimientosParaResumen(rango),
    listarCobrosParaResumen(rango),
  ]);

  return calcularResumenConRanking(ventas, movimientos, cobros);
}

export async function obtenerResumenesDashboard(
  fecha: Date = new Date(),
): Promise<ResumenesDashboard> {
  const fechaJornadaActual = calcularFechaJornada(fecha);
  const rangoHoy = obtenerRangoHoy(fecha);
  const rangoSemana = obtenerRangoSemanaDelMes(fechaJornadaActual);
  const rangoMes = obtenerRangoMes(fechaJornadaActual);
  const [hoy, semana, mes] = await Promise.all([
    obtenerResumenPorRango(rangoHoy),
    obtenerResumenPorRango(rangoSemana),
    obtenerResumenPorRango(rangoMes),
  ]);

  return {
    fechaJornadaActual,
    rangoHoy,
    rangoSemana,
    rangoMes,
    hoy,
    semana,
    mes,
  };
}
