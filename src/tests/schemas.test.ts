import { describe, expect, it } from "vitest";

import {
  backupMoraVineriaSchema,
  productoFormSchema,
  ventaFormSchema,
} from "../schemas";

describe("productoFormSchema", () => {
  it("acepta un producto válido", () => {
    const resultado = productoFormSchema.safeParse({
      nombre: "Vino Malbec",
      categoriaId: "categoria-1",
      precioVenta: 8500,
      costoCompra: 5200,
      marca: "Mora",
      presentacion: "750 ml",
      stockActual: 12,
      stockObjetivo: 50,
      observaciones: "",
    });

    expect(resultado.success).toBe(true);
  });

  it("rechaza producto sin stock objetivo", () => {
    const resultado = productoFormSchema.safeParse({
      nombre: "Vino Malbec",
      categoriaId: "categoria-1",
      precioVenta: 8500,
      costoCompra: 5200,
      stockActual: 12,
      stockObjetivo: 0,
    });

    expect(resultado.success).toBe(false);
  });
});

describe("ventaFormSchema", () => {
  it("rechaza venta sin productos", () => {
    const resultado = ventaFormSchema.safeParse({
      medioPago: "efectivo",
      detalles: [],
    });

    expect(resultado.success).toBe(false);
  });

  it("acepta una venta válida", () => {
    const resultado = ventaFormSchema.safeParse({
      medioPago: "transferencia",
      destinoTransferencia: "brubank",
      detalles: [
        {
          productoId: "producto-1",
          cantidad: 2,
          precioUnitarioAplicado: 5000,
        },
      ],
    });

    expect(resultado.success).toBe(true);
  });

  it("exige destino para una transferencia", () => {
    const resultado = ventaFormSchema.safeParse({ medioPago: "transferencia", detalles: [{ productoId: "producto-1", cantidad: 1, precioUnitarioAplicado: 5000 }] });
    expect(resultado.success).toBe(false);
  });

  it("acepta fiar una parte y exige el nombre del cliente", () => {
    const base = {
      condicionPago: "fiado",
      montoCobradoInicial: 2000,
      medioPago: "efectivo",
      detalles: [{ productoId: "producto-1", cantidad: 1, precioUnitarioAplicado: 5000 }],
    };
    expect(ventaFormSchema.safeParse(base).success).toBe(false);
    expect(ventaFormSchema.safeParse({ ...base, clienteFiadoNombre: "Ana" }).success).toBe(true);
  });
});

describe("backupMoraVineriaSchema", () => {
  it("acepta una estructura base de backup válida", () => {
    const resultado = backupMoraVineriaSchema.safeParse({
      app: "Mora Vinería",
      schemaVersion: 1,
      backupId: "backup-1",
      deviceId: "device-1",
      deviceRole: "principal",
      exportedAt: "2026-07-09T20:00:00.000Z",
      lastDataChangeAt: "2026-07-09T19:30:00.000Z",
      data: {
        categorias: [],
        productos: [],
        ventas: [],
        detalleVentas: [],
        movimientos: [],
        detalleReposiciones: [],
        configuracion: null,
        metasMensuales: [],
        backupMetadata: [],
      },
    });

    expect(resultado.success).toBe(true);
  });
});
