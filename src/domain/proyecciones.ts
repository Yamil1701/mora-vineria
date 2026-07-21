import type { ResumenReporte } from "./reportes";
import type { EstadoStock } from "./productos";

export interface ParametrosProyeccionMensual {
  resumenAcumulado: Pick<
    ResumenReporte,
    | "totalVendido"
    | "gastosPuntuales"
    | "reinversion"
    | "aportesExternos"
    | "gananciaNetaEstimada"
  >;
  diasTranscurridos: number;
  diasDelMes: number;
  metaVentas?: number;
}

export interface ProyeccionMensual {
  ventasAcumuladas: number;
  promedioDiarioVentas: number;
  proyeccionVentasMes: number;
  gastosPuntualesAcumulados: number;
  promedioDiarioGastosPuntuales: number;
  proyeccionGastosPuntualesMes: number;
  gananciaNetaAcumulada: number;
  promedioDiarioGananciaNeta: number;
  proyeccionGananciaNetaMes: number;
  reinversionAcumulada: number;
  aportesExternosAcumulados: number;
  diasTranscurridos: number;
  diasDelMes: number;
  metaVentas?: number;
  porcentajeMetaProyectado?: number;
  diferenciaMetaProyectada?: number;
  escenarioConservador?: number;
  escenarioProbable?: number;
  escenarioFavorable?: number;
  confianza?: "baja" | "media" | "alta";
  diasHistorial?: number;
  promedioDiarioReciente?: number;
  variacionRitmoReciente?: number;
  porcentajeMetaActual?: number;
  faltanteMeta?: number;
  ritmoNecesarioMeta?: number;
  ritmoActualMeta?: number;
  estadoRitmoMeta?: "sin_meta" | "por_encima" | "en_ritmo" | "por_debajo";
}

export interface VentaDiariaProyeccion {
  fecha: string;
  total: number;
}

export interface EscenariosCierreMensual {
  conservador: number;
  probable: number;
  favorable: number;
  promedioDiarioHistorico: number;
  promedioDiarioReciente: number;
  variacionRitmoReciente: number;
  diasHistorial: number;
  diasRestantes: number;
  confianza: "baja" | "media" | "alta";
}

export interface ItemPlanReposicion {
  productoId: string;
  nombre: string;
  estadoStock: Exclude<EstadoStock, "disponible">;
  stockActual: number;
  stockObjetivo: number;
  stockMeta: number;
  unidadesSugeridas: number;
  unidadesPorPack?: number;
  packsSugeridos?: number;
  costoUnitario: number;
  costoEstimado: number;
  velocidadVentaDiaria: number;
}

export function crearClavePlanReposicion(items: ItemPlanReposicion[]): string {
  return [...items]
    .sort((a, b) => a.productoId.localeCompare(b.productoId))
    .map((item) => [
      item.productoId,
      item.stockActual,
      item.stockMeta,
      item.unidadesSugeridas,
      item.unidadesPorPack ?? 0,
      item.costoUnitario,
    ].join(":"))
    .join("|");
}

function dividirSeguro(total: number, divisor: number): number {
  if (divisor <= 0) return 0;

  return total / divisor;
}

function proyectarMensual(totalAcumulado: number, diasTranscurridos: number, diasDelMes: number): number {
  return dividirSeguro(totalAcumulado, diasTranscurridos) * diasDelMes;
}

function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, valor));
}

function promedio(valores: number[]): number {
  return valores.length ? valores.reduce((total, valor) => total + valor, 0) / valores.length : 0;
}

function fechaLocal(fecha: string): Date {
  return new Date(`${fecha}T12:00:00`);
}

export function calcularEscenariosCierreMensual(input: {
  ventasAcumuladas: number;
  ventasJornadaActual: number;
  historialDiario: VentaDiariaProyeccion[];
  fechaJornadaActual: string;
  diasDelMes: number;
}): EscenariosCierreMensual {
  const historial = [...input.historialDiario].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const valores = historial.map((dia) => Math.max(0, dia.total));
  const ultimos14 = valores.slice(-14);
  const anteriores14 = valores.slice(-28, -14);
  const promedioHistorico = promedio(valores);
  const promedioReciente = promedio(ultimos14);
  const promedioAnterior = promedio(anteriores14);
  const tendenciaCruda = promedioAnterior > 0
    ? promedioReciente / promedioAnterior
    : promedioReciente > 0 ? 1.1 : 1;
  const factorTendencia = limitar(tendenciaCruda, 0.75, 1.25);
  const porDiaSemana = new Map<number, number[]>();

  for (const dia of historial) {
    const numero = fechaLocal(dia.fecha).getDay();
    porDiaSemana.set(numero, [...(porDiaSemana.get(numero) ?? []), Math.max(0, dia.total)]);
  }

  const actual = fechaLocal(input.fechaJornadaActual);
  const ultimoDia = new Date(actual.getFullYear(), actual.getMonth(), input.diasDelMes, 12);
  let esperadoRestante = 0;
  let diasRestantes = 0;

  for (let cursor = new Date(actual); cursor <= ultimoDia; cursor.setDate(cursor.getDate() + 1)) {
    diasRestantes += 1;
    const valoresSemana = porDiaSemana.get(cursor.getDay()) ?? [];
    const promedioSemana = promedio(valoresSemana);
    const base = valoresSemana.length >= 2
      ? promedioSemana * 0.55 + promedioReciente * 0.3 + promedioHistorico * 0.15
      : promedioSemana * 0.35 + promedioReciente * 0.35 + promedioHistorico * 0.3;
    const esperadoDia = base * (0.65 + factorTendencia * 0.35);
    esperadoRestante += cursor.toDateString() === actual.toDateString()
      ? Math.max(0, esperadoDia - input.ventasJornadaActual)
      : esperadoDia;
  }

  const diasHistorial = historial.length;
  const confianza = diasHistorial < 28 ? "baja" : diasHistorial < 60 ? "media" : "alta";
  const probable = input.ventasAcumuladas + esperadoRestante;

  return {
    conservador: input.ventasAcumuladas + esperadoRestante * 0.85,
    probable,
    favorable: input.ventasAcumuladas + esperadoRestante * 1.15,
    promedioDiarioHistorico: promedioHistorico,
    promedioDiarioReciente: promedioReciente,
    variacionRitmoReciente: promedioHistorico > 0
      ? ((promedioReciente / promedioHistorico) - 1) * 100
      : 0,
    diasHistorial,
    diasRestantes,
    confianza,
  };
}

export function calcularProyeccionMensual({
  resumenAcumulado,
  diasTranscurridos,
  diasDelMes,
  metaVentas,
}: ParametrosProyeccionMensual): ProyeccionMensual {
  const diasUsados = Math.max(1, diasTranscurridos);
  const ventasAcumuladas = resumenAcumulado.totalVendido;
  const gastosPuntualesAcumulados = resumenAcumulado.gastosPuntuales;
  const gananciaNetaAcumulada = resumenAcumulado.gananciaNetaEstimada;
  const proyeccionVentasMes = proyectarMensual(ventasAcumuladas, diasUsados, diasDelMes);
  const proyeccionGastosPuntualesMes = proyectarMensual(
    gastosPuntualesAcumulados,
    diasUsados,
    diasDelMes,
  );
  const proyeccionGananciaNetaMes = proyectarMensual(
    gananciaNetaAcumulada,
    diasUsados,
    diasDelMes,
  );
  const tieneMeta = metaVentas !== undefined && metaVentas > 0;

  return {
    ventasAcumuladas,
    promedioDiarioVentas: dividirSeguro(ventasAcumuladas, diasUsados),
    proyeccionVentasMes,
    gastosPuntualesAcumulados,
    promedioDiarioGastosPuntuales: dividirSeguro(gastosPuntualesAcumulados, diasUsados),
    proyeccionGastosPuntualesMes,
    gananciaNetaAcumulada,
    promedioDiarioGananciaNeta: dividirSeguro(gananciaNetaAcumulada, diasUsados),
    proyeccionGananciaNetaMes,
    reinversionAcumulada: resumenAcumulado.reinversion,
    aportesExternosAcumulados: resumenAcumulado.aportesExternos,
    diasTranscurridos: diasUsados,
    diasDelMes,
    metaVentas: tieneMeta ? metaVentas : undefined,
    porcentajeMetaProyectado: tieneMeta ? (proyeccionVentasMes / metaVentas) * 100 : undefined,
    diferenciaMetaProyectada: tieneMeta ? proyeccionVentasMes - metaVentas : undefined,
  };
}

export function obtenerMensajeMeta(proyeccion: ProyeccionMensual): string {
  if (!proyeccion.metaVentas || proyeccion.metaVentas <= 0) {
    return "Podés cargar una meta mensual para tener una referencia de seguimiento.";
  }

  if (proyeccion.estadoRitmoMeta === "por_encima") {
    return "El ritmo reciente está por encima del necesario para alcanzar la meta.";
  }

  if (proyeccion.estadoRitmoMeta === "en_ritmo") {
    return "El ritmo reciente está cerca de lo necesario para alcanzar la meta.";
  }

  if (proyeccion.estadoRitmoMeta === "por_debajo") {
    return "Para alcanzar la meta hace falta aumentar el promedio diario durante lo que queda del mes.";
  }

  if (proyeccion.proyeccionVentasMes >= proyeccion.metaVentas) {
    return "La orientación de cierre viene acompañando la meta mensual.";
  }

  return "Todavía hay margen para acercarse a la meta. Los próximos días fuertes pueden cambiar la proyección.";
}
