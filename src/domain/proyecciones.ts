import type { ResumenReporte } from "./reportes";

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
}

function dividirSeguro(total: number, divisor: number): number {
  if (divisor <= 0) return 0;

  return total / divisor;
}

function proyectarMensual(totalAcumulado: number, diasTranscurridos: number, diasDelMes: number): number {
  return dividirSeguro(totalAcumulado, diasTranscurridos) * diasDelMes;
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

  if (proyeccion.proyeccionVentasMes >= proyeccion.metaVentas) {
    return "La proyección viene acompañando la meta mensual.";
  }

  return "Todavía hay margen para acercarse a la meta. Los próximos días fuertes pueden cambiar la proyección.";
}
