import { endOfMonth, format } from "date-fns";

import type { MetaMensual } from "../domain/backup";
import {
  calcularProyeccionMensual,
  type ProyeccionMensual,
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
}

function crearFechaDesdeJornada(fechaJornada: string): Date {
  const [anio = "0", mes = "1", dia = "1"] = fechaJornada.split("-");

  return new Date(Number(anio), Number(mes) - 1, Number(dia));
}

function obtenerMes(fechaJornada: string): string {
  return format(crearFechaDesdeJornada(fechaJornada), "yyyy-MM");
}

function obtenerRangoMesAcumulado(fechaJornada: string) {
  const fecha = crearFechaDesdeJornada(fechaJornada);
  const desde = format(new Date(fecha.getFullYear(), fecha.getMonth(), 1), "yyyy-MM-dd");

  return {
    desde,
    hasta: fechaJornada,
  };
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

export async function obtenerProyeccionMensualActual(
  fecha: Date = new Date(),
): Promise<ProyeccionMensualActual> {
  const fechaJornadaActual = calcularFechaJornada(fecha);
  const fechaJornada = crearFechaDesdeJornada(fechaJornadaActual);
  const mes = obtenerMes(fechaJornadaActual);
  const rangoAcumulado = obtenerRangoMesAcumulado(fechaJornadaActual);
  const [resumenAcumulado, metaMensual] = await Promise.all([
    obtenerResumenPorRango(rangoAcumulado),
    obtenerMetaMensual(mes),
  ]);

  return {
    mes,
    fechaJornadaActual,
    rangoAcumulado,
    metaMensual,
    proyeccion: calcularProyeccionMensual({
      resumenAcumulado,
      diasTranscurridos: fechaJornada.getDate(),
      diasDelMes: endOfMonth(fechaJornada).getDate(),
      metaVentas: metaMensual?.metaVentas,
    }),
  };
}
