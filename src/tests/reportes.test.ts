import { describe, expect, it } from "vitest";

import {
  calcularAportesExternos,
  calcularProductosMasVendidos,
  calcularResumenReporte,
} from "../domain/reportes";

describe("calcularResumenReporte", () => {
  it("calcula venta, costo, ganancias y movimientos sin contar anulados", () => {
    const resumen = calcularResumenReporte(
      [
        {
          estado: "activa",
          medioPago: "efectivo",
          total: 10000,
          detalles: [
            {
              productoId: "producto-1",
              productoNombre: "Malbec",
              cantidad: 2,
              costoUnitarioAlMomento: 3000,
              subtotal: 10000,
            },
          ],
        },
        {
          estado: "anulada",
          medioPago: "transferencia",
          total: 5000,
          detalles: [
            {
              productoId: "producto-2",
              productoNombre: "Cerveza",
              cantidad: 1,
              costoUnitarioAlMomento: 2000,
              subtotal: 5000,
            },
          ],
        },
      ],
      [
        {
          estado: "activo",
          tipo: "gasto_puntual",
          monto: 1000,
        },
        {
          estado: "activo",
          tipo: "reposicion",
          monto: 4000,
          aporteExternoIncluido: 1500,
        },
        {
          estado: "anulado",
          tipo: "aporte_externo",
          monto: 8000,
        },
      ],
    );

    expect(resumen.totalVendido).toBe(10000);
    expect(resumen.costoEstimadoVendido).toBe(6000);
    expect(resumen.gananciaBrutaEstimada).toBe(4000);
    expect(resumen.gastosPuntuales).toBe(1000);
    expect(resumen.reinversion).toBe(4000);
    expect(resumen.aportesExternos).toBe(1500);
    expect(resumen.gananciaNetaEstimada).toBe(3000);
    expect(resumen.cantidadVentas).toBe(1);
    expect(resumen.cantidadMovimientos).toBe(2);
  });
});

describe("calcularAportesExternos", () => {
  it("suma aportes directos y aportes incluidos en reposiciones", () => {
    expect(
      calcularAportesExternos([
        {
          estado: "activo",
          tipo: "aporte_externo",
          monto: 5000,
        },
        {
          estado: "activo",
          tipo: "reposicion",
          monto: 12000,
          aporteExternoIncluido: 3000,
        },
      ]),
    ).toBe(8000);
  });
});

describe("calcularProductosMasVendidos", () => {
  it("ordena productos por cantidad vendida y usa ventas activas", () => {
    const productos = calcularProductosMasVendidos([
      {
        estado: "activa",
        medioPago: "efectivo",
        total: 12000,
        detalles: [
          {
            productoId: "producto-1",
            productoNombre: "Malbec",
            cantidad: 2,
            costoUnitarioAlMomento: 3000,
            subtotal: 10000,
          },
          {
            productoId: "producto-2",
            productoNombre: "Cerveza",
            cantidad: 4,
            costoUnitarioAlMomento: 500,
            subtotal: 2000,
          },
        ],
      },
      {
        estado: "anulada",
        medioPago: "efectivo",
        total: 20000,
        detalles: [
          {
            productoId: "producto-3",
            productoNombre: "Espumante",
            cantidad: 10,
            costoUnitarioAlMomento: 1000,
            subtotal: 20000,
          },
        ],
      },
    ]);

    expect(productos[0]).toMatchObject({
      productoId: "producto-2",
      nombre: "Cerveza",
      cantidad: 4,
    });
    expect(productos).toHaveLength(2);
  });
});
