import type { RangoFechas, SemanaDelMes } from "../domain/reportes";

const SEMANAS_DEL_MES: SemanaDelMes[] = [1, 2, 3, 4];

export function calcularSemanaDelMes(fecha: Date): SemanaDelMes {
  const dia = fecha.getDate();

  if (dia <= 7) return 1;
  if (dia <= 14) return 2;
  if (dia <= 21) return 3;

  return 4;
}

function formatearFecha(anio: number, mes: number, dia: number): string {
  return `${String(anio).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function crearRangoSemanaDelMes(
  mesSeleccionado: string,
  semana: SemanaDelMes,
): RangoFechas {
  const coincidencia = /^(\d{4})-(\d{2})$/.exec(mesSeleccionado);

  if (!coincidencia) {
    throw new Error("El mes seleccionado no tiene un formato válido.");
  }

  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);

  if (anio < 1 || mes < 1 || mes > 12) {
    throw new Error("El mes seleccionado no es válido.");
  }

  if (![1, 2, 3, 4].includes(semana)) {
    throw new Error("La semana seleccionada no es válida.");
  }

  const diaDesde = semana === 1 ? 1 : semana === 2 ? 8 : semana === 3 ? 15 : 22;
  const ultimoDia = new Date(anio, mes, 0).getDate();
  const diaHasta = semana === 1 ? 7 : semana === 2 ? 14 : semana === 3 ? 21 : ultimoDia;

  return {
    desde: formatearFecha(anio, mes, diaDesde),
    hasta: formatearFecha(anio, mes, diaHasta),
  };
}

export function obtenerSemanasDisponibles(
  mesSeleccionado: string,
  fechaJornadaActual: string,
): SemanaDelMes[] {
  const mesActual = fechaJornadaActual.slice(0, 7);
  const coincidenciaFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fechaJornadaActual);

  crearRangoSemanaDelMes(mesSeleccionado, 1);

  if (!coincidenciaFecha) {
    throw new Error("La fecha de jornada actual no es válida.");
  }

  if (mesSeleccionado < mesActual) {
    return [...SEMANAS_DEL_MES];
  }

  if (mesSeleccionado > mesActual) {
    return [];
  }

  const anio = Number(coincidenciaFecha[1]);
  const mes = Number(coincidenciaFecha[2]);
  const dia = Number(coincidenciaFecha[3]);
  const semanaActual = calcularSemanaDelMes(new Date(anio, mes - 1, dia));

  return SEMANAS_DEL_MES.filter((semana) => semana <= semanaActual);
}
