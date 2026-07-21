import { describe, expect, it } from "vitest";

import {
  calcularEscenariosCierreMensual,
  calcularProyeccionMensual,
  crearClavePlanReposicion,
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

describe("calcularEscenariosCierreMensual", () => {
  it("devuelve un rango ordenado y explicita la baja confianza con poco historial", () => {
    const escenarios = calcularEscenariosCierreMensual({
      ventasAcumuladas: 22_400,
      ventasJornadaActual: 400,
      historialDiario: Array.from({ length: 22 }, (_, indice) => ({
        fecha: `2026-06-${String(indice + 1).padStart(2, "0")}`,
        total: (indice + 1) % 7 === 0 ? 1_600 : 1_000,
      })),
      fechaJornadaActual: "2026-07-21",
      diasDelMes: 31,
    });

    expect(escenarios.conservador).toBeLessThan(escenarios.probable);
    expect(escenarios.probable).toBeLessThan(escenarios.favorable);
    expect(escenarios.probable).toBeGreaterThan(22_400);
    expect(escenarios.diasHistorial).toBe(22);
    expect(escenarios.confianza).toBe("baja");
    expect(escenarios.diasRestantes).toBe(11);
  });

  it("limita el impacto de una aceleración reciente para evitar promesas extremas", () => {
    const historialDiario = Array.from({ length: 28 }, (_, indice) => ({
      fecha: `2026-06-${String(indice + 1).padStart(2, "0")}`,
      total: indice < 14 ? 100 : 1_000,
    }));
    const escenarios = calcularEscenariosCierreMensual({
      ventasAcumuladas: 14_000,
      ventasJornadaActual: 0,
      historialDiario,
      fechaJornadaActual: "2026-07-28",
      diasDelMes: 31,
    });

    expect(escenarios.variacionRitmoReciente).toBeGreaterThan(0);
    expect(escenarios.confianza).toBe("media");
    expect(escenarios.favorable).toBeLessThan(20_000);
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

describe("crearClavePlanReposicion", () => {
  const item = {
    productoId: "producto-1",
    nombre: "Malbec",
    estadoStock: "bajo" as const,
    stockActual: 2,
    stockObjetivo: 10,
    stockMeta: 9,
    unidadesSugeridas: 7,
    costoUnitario: 1_000,
    costoEstimado: 7_000,
    velocidadVentaDiaria: 0.5,
  };

  it("mantiene la clave si solo cambia el orden visual", () => {
    const segundo = { ...item, productoId: "producto-2", nombre: "Cabernet" };
    expect(crearClavePlanReposicion([item, segundo])).toBe(crearClavePlanReposicion([segundo, item]));
  });

  it("cambia la clave cuando cambia la propuesta de compra", () => {
    expect(crearClavePlanReposicion([item])).not.toBe(crearClavePlanReposicion([{ ...item, stockActual: 3, unidadesSugeridas: 6 }]));
  });
});
