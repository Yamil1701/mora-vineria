import { describe, expect, it } from "vitest";

import { leerBackupJson } from "../db";
import {
  crearNombreArchivoBackup,
  crearResumenBackup,
  obtenerUltimaModificacionBackup,
  obtenerUltimoCambioDatos,
  type BackupMoraVineria,
} from "../domain/backup";

function crearBackupBase(): BackupMoraVineria {
  return {
    app: "Mora Vinería",
    schemaVersion: 1,
    backupId: "backup-1",
    deviceId: "device-1",
    deviceRole: "principal",
    exportedAt: "2026-07-09T20:00:00.000Z",
    lastDataChangeAt: "2026-07-09T19:45:00.000Z",
    data: {
      categorias: [
        {
          id: "categoria-1",
          nombre: "Vinos",
          activa: true,
          createdAt: "2026-07-09T19:00:00.000Z",
          updatedAt: "2026-07-09T19:00:00.000Z",
        },
      ],
      productos: [
        {
          id: "producto-1",
          nombre: "Malbec",
          categoriaId: "categoria-1",
          precioVenta: 8000,
          costoCompra: 5500,
          marca: "Mora",
          presentacion: "750 ml",
          stockActual: 5,
          stockObjetivo: 12,
          estado: "activo",
          observaciones: "Producto de prueba",
          createdAt: "2026-07-09T19:00:00.000Z",
          updatedAt: "2026-07-09T19:00:00.000Z",
        },
      ],
      ventas: [
        {
          id: "venta-1",
          fechaHoraReal: "2026-07-09T20:00:00.000Z",
          fechaJornada: "2026-07-09",
          medioPago: "efectivo",
          total: 5000,
          estado: "activa",
          createdAt: "2026-07-09T20:00:00.000Z",
          updatedAt: "2026-07-09T20:00:00.000Z",
        },
      ],
      detalleVentas: [
        {
          id: "detalle-venta-1",
          ventaId: "venta-1",
          productoId: "producto-1",
          cantidad: 1,
          precioUnitarioAplicado: 8000,
          costoUnitarioAlMomento: 5500,
          subtotal: 8000,
          observaciones: "Precio normal",
        },
      ],
      movimientos: [],
      detalleReposiciones: [],
      configuracion: null,
      metasMensuales: [],
      backupMetadata: [],
    },
  };
}

describe("crearResumenBackup", () => {
  it("resume cantidades principales del respaldo", () => {
    const resumen = crearResumenBackup(crearBackupBase());

    expect(resumen.cantidades.categorias).toBe(1);
    expect(resumen.cantidades.productos).toBe(1);
    expect(resumen.cantidades.ventas).toBe(1);
    expect(resumen.deviceRole).toBe("principal");
  });
});

describe("crearNombreArchivoBackup", () => {
  it("crea un nombre de archivo estable con fecha", () => {
    expect(crearNombreArchivoBackup("2026-07-09T20:00:00.000Z")).toBe(
      "mora-vineria-respaldo-2026-07-09.json",
    );
  });
});

describe("obtenerUltimaModificacionBackup", () => {
  it("devuelve la fecha válida más reciente", () => {
    expect(
      obtenerUltimaModificacionBackup([
        "2026-07-09T20:00:00.000Z",
        undefined,
        "2026-07-10T01:00:00.000Z",
      ]),
    ).toBe("2026-07-10T01:00:00.000Z");
  });
});

describe("obtenerUltimoCambioDatos", () => {
  it("no confunde la fecha de exportación con un cambio operativo", () => {
    const backup = crearBackupBase();
    backup.exportedAt = "2026-07-11T12:00:00.000Z";
    backup.data.backupMetadata = [
      {
        id: "metadata-1",
        backupId: "backup-anterior",
        exportedAt: "2026-07-11T11:00:00.000Z",
        schemaVersion: 1,
        deviceId: "device-1",
        deviceRole: "principal",
        lastDataChangeAt: "2026-07-09T20:00:00.000Z",
      },
    ];

    expect(obtenerUltimoCambioDatos(backup)).toBe("2026-07-09T20:00:00.000Z");
  });
});

describe("leerBackupJson", () => {
  it("conserva todos los campos de las entidades al validar el respaldo", () => {
    const backup = crearBackupBase();
    const backupLeido = leerBackupJson(JSON.stringify(backup));

    expect(backupLeido.data.productos[0]).toMatchObject({
      id: "producto-1",
      nombre: "Malbec",
      precioVenta: 8000,
      stockActual: 5,
      estado: "activo",
    });
    expect(backupLeido.data.detalleVentas[0]).toMatchObject({
      id: "detalle-venta-1",
      ventaId: "venta-1",
      cantidad: 1,
      subtotal: 8000,
    });
    expect(backupLeido.data.ventas[0]).toMatchObject({
      id: "venta-1",
      total: 5000,
      medioPago: "efectivo",
    });
  });
});
