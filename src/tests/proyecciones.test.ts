import { describe, expect, it } from "vitest";

import {
  calcularProyeccionMensual,
  obtenerMensajeMeta,
} from "../domain/proyecciones";

describe("calcularProyeccionMensual", () => {
  it("proyecta ventas, gastos y ganancia neta según los días transcurridos", () => {
    const proyeccion = calcularProyeccionMensual({
      resumenAcumulado: {
        totalVendido: 100000,
        gastosPuntuales: 10000,
        reinversion: 25000,
        aportesExternos: 5000,
        gananciaNetaEstimada: 40000,
      },
      diasTranscurridos: 10,
      diasDelMes: 30,
    });

    expect(proyeccion.promedioDiarioVentas).toBe(10000);
    expect(proyeccion.proyeccionVentasMes).toBe(300000);
    expect(proyeccion.promedioDiarioGastosPuntuales).toBe(1000);
    expect(proyeccion.proyeccionGastosPuntualesMes).toBe(30000);
    expect(proyeccion.proyeccionGananciaNetaMes).toBe(120000);
    expect(proyeccion.reinversionAcumulada).toBe(25000);
    expect(proyeccion.aportesExternosAcumulados).toBe(5000);
  });

  it("calcula avance contra meta mensual cuando existe meta", () => {
    const proyeccion = calcularProyeccionMensual({
      resumenAcumulado: {
        totalVendido: 150000,
        gastosPuntuales: 0,
        reinversion: 0,
        aportesExternos: 0,
        gananciaNetaEstimada: 60000,
      },
      diasTranscurridos: 15,
      diasDelMes: 30,
      metaVentas: 300000,
    });

    expect(proyeccion.proyeccionVentasMes).toBe(300000);
    expect(proyeccion.porcentajeMetaProyectado).toBe(100);
    expect(proyeccion.diferenciaMetaProyectada).toBe(0);
  });
});

describe("obtenerMensajeMeta", () => {
  it("muestra un mensaje orientativo cuando falta meta", () => {
    const proyeccion = calcularProyeccionMensual({
      resumenAcumulado: {
        totalVendido: 0,
        gastosPuntuales: 0,
        reinversion: 0,
        aportesExternos: 0,
        gananciaNetaEstimada: 0,
      },
      diasTranscurridos: 1,
      diasDelMes: 30,
    });

    expect(obtenerMensajeMeta(proyeccion)).toContain("referencia");
  });
});
