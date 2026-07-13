import type { Categoria, Producto } from "./productos";
import type { CobroVenta, DetalleVenta, Venta } from "./ventas";
import type { DetalleReposicion, Movimiento } from "./movimientos";
import type { DiferenciaStockLocal } from "./sincronizacion";

export type ModoDispositivo = "principal" | "consulta";

export interface Configuracion {
  id: string;
  deviceId: string;
  deviceRole: ModoDispositivo;
  porcentajeStockBajo: number;
  porcentajeStockCritico: number;
  createdAt: string;
  updatedAt: string;
}

export interface MetaMensual {
  id: string;
  mes: string;
  metaVentas: number;
  createdAt: string;
  updatedAt: string;
}

export interface BackupMetadata {
  id: string;
  backupId: string;
  exportedAt: string;
  schemaVersion: number;
  deviceId: string;
  deviceRole: ModoDispositivo;
  lastDataChangeAt: string;
}

export interface BackupMoraVineria {
  app: "Mora Vinería";
  schemaVersion: number;
  backupId: string;
  deviceId: string;
  deviceRole: ModoDispositivo;
  exportedAt: string;
  lastDataChangeAt: string;
  data: {
    categorias: Categoria[];
    productos: Producto[];
    ventas: Venta[];
    detalleVentas: DetalleVenta[];
    cobrosVentas: CobroVenta[];
    diferenciasStock: DiferenciaStockLocal[];
    movimientos: Movimiento[];
    detalleReposiciones: DetalleReposicion[];
    configuracion: Configuracion | null;
    metasMensuales: MetaMensual[];
    backupMetadata: BackupMetadata[];
  };
}

export interface ResumenBackupMoraVineria {
  backupId: string;
  schemaVersion: number;
  exportedAt: string;
  lastDataChangeAt: string;
  deviceId: string;
  deviceRole: ModoDispositivo;
  cantidades: {
    categorias: number;
    productos: number;
    ventas: number;
    detalleVentas: number;
    cobrosVentas: number;
    diferenciasStock: number;
    movimientos: number;
    detalleReposiciones: number;
    metasMensuales: number;
    backupMetadata: number;
  };
}

export type ResultadoArchivoBackup = {
  backup: BackupMoraVineria;
  json: string;
  fileName: string;
};

export type EstadoRespaldo = "sin_respaldo" | "vigente" | "atrasado";

const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

export function obtenerEstadoRespaldo(
  ultimoRespaldo: string | null | undefined,
  ahora = new Date(),
): EstadoRespaldo {
  if (!ultimoRespaldo) return "sin_respaldo";
  const fecha = new Date(ultimoRespaldo).getTime();
  if (!Number.isFinite(fecha)) return "sin_respaldo";
  return ahora.getTime() - fecha > SIETE_DIAS_MS ? "atrasado" : "vigente";
}

export function crearResumenBackup(backup: BackupMoraVineria): ResumenBackupMoraVineria {
  return {
    backupId: backup.backupId,
    schemaVersion: backup.schemaVersion,
    exportedAt: backup.exportedAt,
    lastDataChangeAt: backup.lastDataChangeAt,
    deviceId: backup.deviceId,
    deviceRole: backup.deviceRole,
    cantidades: {
      categorias: backup.data.categorias.length,
      productos: backup.data.productos.length,
      ventas: backup.data.ventas.length,
      detalleVentas: backup.data.detalleVentas.length,
      cobrosVentas: backup.data.cobrosVentas.length,
      diferenciasStock: backup.data.diferenciasStock.length,
      movimientos: backup.data.movimientos.length,
      detalleReposiciones: backup.data.detalleReposiciones.length,
      metasMensuales: backup.data.metasMensuales.length,
      backupMetadata: backup.data.backupMetadata.length,
    },
  };
}

export function crearNombreArchivoBackup(exportedAt: string): string {
  const fecha = exportedAt.slice(0, 10);

  return `mora-vineria-respaldo-${fecha}.json`;
}

export function obtenerUltimaModificacionBackup(fechas: Array<string | null | undefined>): string {
  const fechasValidas = fechas
    .filter((fecha): fecha is string => Boolean(fecha))
    .map((fecha) => new Date(fecha).getTime())
    .filter((fecha) => Number.isFinite(fecha));

  if (fechasValidas.length === 0) {
    return new Date(0).toISOString();
  }

  return new Date(Math.max(...fechasValidas)).toISOString();
}

export function obtenerUltimoCambioDatos(backup: BackupMoraVineria): string {
  return obtenerUltimaModificacionBackup([
    backup.data.configuracion?.updatedAt,
    ...backup.data.categorias.map((categoria) => categoria.updatedAt),
    ...backup.data.productos.map((producto) => producto.updatedAt ?? producto.createdAt),
    ...backup.data.ventas.map((venta) => venta.updatedAt ?? venta.createdAt),
    ...backup.data.cobrosVentas.map((cobro) => cobro.updatedAt ?? cobro.createdAt),
    ...backup.data.diferenciasStock.map((diferencia) => diferencia.resueltaAt ?? diferencia.creadoAt),
    ...backup.data.movimientos.map((movimiento) => movimiento.updatedAt ?? movimiento.createdAt),
    ...backup.data.metasMensuales.map((meta) => meta.updatedAt ?? meta.createdAt),
  ]);
}
