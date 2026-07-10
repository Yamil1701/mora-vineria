import { APP_NAME, CONFIGURACION_ID, SCHEMA_VERSION } from "../constants";
import type {
  BackupMetadata,
  BackupMoraVineria,
  Configuracion,
  ResultadoArchivoBackup,
} from "../domain/backup";
import {
  crearNombreArchivoBackup,
  obtenerUltimoCambioDatos,
} from "../domain/backup";
import { backupMoraVineriaSchema } from "../schemas";
import { crearId } from "../utils/ids";
import { db } from "./schema";

function serializarBackup(backup: BackupMoraVineria): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

export async function crearBackupJson(): Promise<ResultadoArchivoBackup> {
  const configuracion = await db.configuracion.get(CONFIGURACION_ID);

  if (!configuracion) {
    throw new Error("No se encontró la configuración local del dispositivo.");
  }

  const exportedAt = new Date().toISOString();
  const backupId = crearId("backup");

  const [
    categorias,
    productos,
    ventas,
    detalleVentas,
    movimientos,
    detalleReposiciones,
    metasMensuales,
    backupMetadataActual,
  ] = await Promise.all([
    db.categorias.toArray(),
    db.productos.toArray(),
    db.ventas.toArray(),
    db.detalleVentas.toArray(),
    db.movimientos.toArray(),
    db.detalleReposiciones.toArray(),
    db.metasMensuales.toArray(),
    db.backupMetadata.toArray(),
  ]);

  const backupBase: BackupMoraVineria = {
    app: APP_NAME,
    schemaVersion: SCHEMA_VERSION,
    backupId,
    deviceId: configuracion.deviceId,
    deviceRole: configuracion.deviceRole,
    exportedAt,
    lastDataChangeAt: exportedAt,
    data: {
      categorias,
      productos,
      ventas,
      detalleVentas,
      movimientos,
      detalleReposiciones,
      configuracion,
      metasMensuales,
      backupMetadata: backupMetadataActual,
    },
  };

  const lastDataChangeAt = obtenerUltimoCambioDatos(backupBase);

  const metadata: BackupMetadata = {
    id: crearId("backup-metadata"),
    backupId,
    exportedAt,
    schemaVersion: SCHEMA_VERSION,
    deviceId: configuracion.deviceId,
    deviceRole: configuracion.deviceRole,
    lastDataChangeAt,
  };

  const backup: BackupMoraVineria = {
    ...backupBase,
    lastDataChangeAt,
    data: {
      ...backupBase.data,
      backupMetadata: [...backupMetadataActual, metadata],
    },
  };

  await db.backupMetadata.add(metadata);

  return {
    backup,
    json: serializarBackup(backup),
    fileName: crearNombreArchivoBackup(exportedAt),
  };
}

export function leerBackupJson(contenido: string): BackupMoraVineria {
  let json: unknown;

  try {
    json = JSON.parse(contenido);
  } catch {
    throw new Error("El archivo no parece ser un respaldo JSON válido.");
  }

  const resultado = backupMoraVineriaSchema.safeParse(json);

  if (!resultado.success) {
    throw new Error("El archivo no tiene la estructura esperada de Mora Vinería.");
  }

  const backup = resultado.data as unknown as BackupMoraVineria;

  if (backup.schemaVersion !== SCHEMA_VERSION) {
    throw new Error("Este respaldo usa una versión de datos que todavía no se puede restaurar.");
  }

  return backup;
}

function crearConfiguracionRestaurada(
  backup: BackupMoraVineria,
  configuracionActual: Configuracion | undefined,
): Configuracion {
  const ahora = new Date().toISOString();
  const configuracionBackup = backup.data.configuracion;

  return {
    id: CONFIGURACION_ID,
    deviceId: configuracionActual?.deviceId ?? backup.deviceId,
    deviceRole: configuracionActual?.deviceRole ?? "consulta",
    porcentajeStockBajo: configuracionBackup?.porcentajeStockBajo ?? 20,
    porcentajeStockCritico: configuracionBackup?.porcentajeStockCritico ?? 10,
    createdAt: configuracionActual?.createdAt ?? ahora,
    updatedAt: ahora,
  };
}

export async function restaurarBackupJson(backup: BackupMoraVineria): Promise<void> {
  if (backup.schemaVersion !== SCHEMA_VERSION) {
    throw new Error("Este respaldo usa una versión de datos que todavía no se puede restaurar.");
  }

  const configuracionActual = await db.configuracion.get(CONFIGURACION_ID);
  const configuracionRestaurada = crearConfiguracionRestaurada(backup, configuracionActual);

  await db.transaction(
    "rw",
    [
      db.categorias,
      db.productos,
      db.ventas,
      db.detalleVentas,
      db.movimientos,
      db.detalleReposiciones,
      db.configuracion,
      db.metasMensuales,
      db.backupMetadata,
    ],
    async () => {
      await Promise.all([
        db.categorias.clear(),
        db.productos.clear(),
        db.ventas.clear(),
        db.detalleVentas.clear(),
        db.movimientos.clear(),
        db.detalleReposiciones.clear(),
        db.configuracion.clear(),
        db.metasMensuales.clear(),
        db.backupMetadata.clear(),
      ]);

      await Promise.all([
        db.categorias.bulkPut(backup.data.categorias),
        db.productos.bulkPut(backup.data.productos),
        db.ventas.bulkPut(backup.data.ventas),
        db.detalleVentas.bulkPut(backup.data.detalleVentas),
        db.movimientos.bulkPut(backup.data.movimientos),
        db.detalleReposiciones.bulkPut(backup.data.detalleReposiciones),
        db.configuracion.put(configuracionRestaurada),
        db.metasMensuales.bulkPut(backup.data.metasMensuales),
        db.backupMetadata.bulkPut(backup.data.backupMetadata),
      ]);
    },
  );
}
