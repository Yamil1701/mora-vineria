import { APP_NAME, CONFIGURACION_ID, SCHEMA_VERSION } from "../constants";
import type {
  BackupMetadata,
  BackupMoraVineria,
  Configuracion,
  ResultadoArchivoBackup,
} from "../domain/backup";
import type { CobroVenta, Venta } from "../domain/ventas";
import type { Producto } from "../domain/productos";
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
    cobrosVentas,
    diferenciasStock,
    movimientos,
    detalleReposiciones,
    cuentasTesoreria,
    movimientosTesoreria,
    conteosCaja,
    metasMensuales,
    backupMetadataActual,
  ] = await Promise.all([
    db.categorias.toArray(),
    db.productos.toArray(),
    db.ventas.toArray(),
    db.detalleVentas.toArray(),
    db.cobrosVentas.toArray(),
    db.diferenciasStock.toArray(),
    db.movimientos.toArray(),
    db.detalleReposiciones.toArray(),
    db.cuentasTesoreria.toArray(),
    db.movimientosTesoreria.toArray(),
    db.conteosCaja.toArray(),
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
      cobrosVentas,
      diferenciasStock,
      movimientos,
      detalleReposiciones,
      cuentasTesoreria,
      movimientosTesoreria,
      conteosCaja,
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

export async function obtenerUltimoRespaldo(): Promise<BackupMetadata | undefined> {
  return db.backupMetadata.orderBy("exportedAt").last();
}

function crearCobroMigradoDesdeVenta(venta: Venta): CobroVenta | null {
  if (!venta.medioPago || venta.total <= 0) return null;
  return {
    id: `cobro-migrado-${venta.id}`,
    ventaId: venta.id,
    fechaHoraReal: venta.fechaHoraReal,
    fechaJornada: venta.fechaJornada,
    monto: venta.total,
    medioPago: venta.medioPago,
    destinoTransferencia: venta.destinoTransferencia,
    estado: venta.estado === "anulada" ? "anulado" : "activo",
    createdAt: venta.createdAt,
    updatedAt: venta.updatedAt,
    anuladoAt: venta.estado === "anulada" ? (venta.anuladaAt ?? venta.updatedAt) : null,
    motivoAnulacion: venta.estado === "anulada" ? (venta.motivoAnulacion ?? "Venta anulada") : null,
  };
}

function migrarBackupV1(backup: BackupMoraVineria): BackupMoraVineria {
  const ventas = backup.data.ventas.map((venta) => ({
    ...venta,
    condicionPago: venta.condicionPago ?? "contado" as const,
  }));
  const cobrosVentas = ventas
    .map(crearCobroMigradoDesdeVenta)
    .filter((cobro): cobro is CobroVenta => cobro !== null);

  return {
    ...backup,
    schemaVersion: SCHEMA_VERSION,
    data: { ...backup.data, ventas, cobrosVentas, diferenciasStock: [], cuentasTesoreria: [], movimientosTesoreria: [], conteosCaja: [] },
  };
}

function migrarBackupV2(backup: BackupMoraVineria): BackupMoraVineria {
  return {
    ...backup,
    schemaVersion: SCHEMA_VERSION,
    data: { ...backup.data, cuentasTesoreria: [], movimientosTesoreria: [], conteosCaja: [] },
  };
}

function completarCompraHabitual(producto: Producto): Producto {
  const modoCompraHabitual = producto.modoCompraHabitual === "pack" ? "pack" : "unidad";
  return {
    ...producto,
    modoCompraHabitual,
    nombrePack: modoCompraHabitual === "pack" ? producto.nombrePack : undefined,
    unidadesPorPack: modoCompraHabitual === "pack" ? producto.unidadesPorPack : undefined,
  };
}

function migrarBackupV3(backup: BackupMoraVineria): BackupMoraVineria {
  return {
    ...backup,
    schemaVersion: SCHEMA_VERSION,
    data: {
      ...backup.data,
      productos: backup.data.productos.map(completarCompraHabitual),
    },
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

  const backupLeido = resultado.data as unknown as BackupMoraVineria;
  if (backupLeido.schemaVersion === 1) {
    return migrarBackupV3(migrarBackupV1({
      ...backupLeido,
      data: { ...backupLeido.data, cobrosVentas: [], diferenciasStock: [], cuentasTesoreria: [], movimientosTesoreria: [], conteosCaja: [] },
    }));
  }
  if (backupLeido.schemaVersion === 2) {
    return migrarBackupV3(migrarBackupV2({
      ...backupLeido,
      data: { ...backupLeido.data, cuentasTesoreria: [], movimientosTesoreria: [], conteosCaja: [] },
    }));
  }
  if (backupLeido.schemaVersion === 3) {
    return migrarBackupV3(backupLeido);
  }
  if (backupLeido.schemaVersion !== SCHEMA_VERSION || !Array.isArray(backupLeido.data.cobrosVentas)) {
    throw new Error("Este respaldo usa una versión de datos que todavía no se puede restaurar.");
  }
  return {
    ...backupLeido,
    data: {
      ...backupLeido.data,
      productos: backupLeido.data.productos.map(completarCompraHabitual),
      diferenciasStock: Array.isArray(backupLeido.data.diferenciasStock)
        ? backupLeido.data.diferenciasStock
        : [],
      cuentasTesoreria: Array.isArray(backupLeido.data.cuentasTesoreria) ? backupLeido.data.cuentasTesoreria : [],
      movimientosTesoreria: Array.isArray(backupLeido.data.movimientosTesoreria) ? backupLeido.data.movimientosTesoreria : [],
      conteosCaja: Array.isArray(backupLeido.data.conteosCaja) ? backupLeido.data.conteosCaja : [],
    },
  };
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
    porcentajeStockBajo: Math.max(configuracionBackup?.porcentajeStockBajo ?? 30, 30),
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
      db.cobrosVentas,
      db.diferenciasStock,
      db.movimientos,
      db.detalleReposiciones,
      db.cuentasTesoreria,
      db.movimientosTesoreria,
      db.conteosCaja,
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
        db.cobrosVentas.clear(),
        db.diferenciasStock.clear(),
        db.movimientos.clear(),
        db.detalleReposiciones.clear(),
        db.cuentasTesoreria.clear(),
        db.movimientosTesoreria.clear(),
        db.conteosCaja.clear(),
        db.configuracion.clear(),
        db.metasMensuales.clear(),
        db.backupMetadata.clear(),
      ]);

      await Promise.all([
        db.categorias.bulkPut(backup.data.categorias),
        db.productos.bulkPut(backup.data.productos),
        db.ventas.bulkPut(backup.data.ventas),
        db.detalleVentas.bulkPut(backup.data.detalleVentas),
        db.cobrosVentas.bulkPut(backup.data.cobrosVentas),
        db.diferenciasStock.bulkPut(backup.data.diferenciasStock),
        db.movimientos.bulkPut(backup.data.movimientos),
        db.detalleReposiciones.bulkPut(backup.data.detalleReposiciones),
        db.cuentasTesoreria.bulkPut(backup.data.cuentasTesoreria),
        db.movimientosTesoreria.bulkPut(backup.data.movimientosTesoreria),
        db.conteosCaja.bulkPut(backup.data.conteosCaja),
        db.configuracion.put(configuracionRestaurada),
        db.metasMensuales.bulkPut(backup.data.metasMensuales),
        db.backupMetadata.bulkPut(backup.data.backupMetadata),
      ]);
    },
  );
}
