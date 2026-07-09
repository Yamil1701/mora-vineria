import { describe, expect, it } from "vitest";

import {
  crearNombreArchivoBackup,
  crearResumenBackup,
  obtenerUltimaModificacionBackup,
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
      productos: [],
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
      detalleVentas: [],
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
