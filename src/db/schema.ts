import Dexie, { type Table } from "dexie";

import type { BackupMetadata, Configuracion, MetaMensual } from "../domain/backup";
import type { Categoria, Producto } from "../domain/productos";
import type { DetalleReposicion, Movimiento } from "../domain/movimientos";
import type { DetalleVenta, Venta } from "../domain/ventas";
import type {
  ConflictoSincronizacionLocal,
  EstadoSincronizacionLocal,
  OperacionSincronizacionLocal,
  VinculoDispositivoLocal,
} from "../domain/sincronizacion";

export class MoraVineriaDatabase extends Dexie {
  categorias!: Table<Categoria, string>;
  productos!: Table<Producto, string>;
  ventas!: Table<Venta, string>;
  detalleVentas!: Table<DetalleVenta, string>;
  movimientos!: Table<Movimiento, string>;
  detalleReposiciones!: Table<DetalleReposicion, string>;
  configuracion!: Table<Configuracion, string>;
  metasMensuales!: Table<MetaMensual, string>;
  backupMetadata!: Table<BackupMetadata, string>;
  vinculoDispositivo!: Table<VinculoDispositivoLocal, string>;
  colaSincronizacion!: Table<OperacionSincronizacionLocal, string>;
  estadoSincronizacion!: Table<EstadoSincronizacionLocal, string>;
  conflictosSincronizacion!: Table<ConflictoSincronizacionLocal, string>;

  constructor(nombreBase = "mora-vineria") {
    super(nombreBase);

    this.version(1).stores({
      categorias: "id, nombre, activa, createdAt, updatedAt",
      productos:
        "id, nombre, categoriaId, estado, stockActual, stockObjetivo, createdAt, updatedAt, deletedAt",
      ventas: "id, fechaHoraReal, fechaJornada, medioPago, estado, createdAt, updatedAt",
      detalleVentas: "id, ventaId, productoId",
      movimientos: "id, fechaHoraReal, fechaJornada, tipo, estado, createdAt, updatedAt",
      detalleReposiciones: "id, movimientoId, productoId",
      configuracion: "id, deviceId, deviceRole, updatedAt",
      metasMensuales: "id, mes, createdAt, updatedAt",
      backupMetadata: "id, backupId, exportedAt, schemaVersion, deviceId",
    });

    this.version(2).stores({
      categorias: "id, nombre, activa, createdAt, updatedAt",
      productos:
        "id, nombre, categoriaId, estado, stockActual, stockObjetivo, createdAt, updatedAt, deletedAt",
      ventas: "id, fechaHoraReal, fechaJornada, medioPago, estado, createdAt, updatedAt",
      detalleVentas: "id, ventaId, productoId",
      movimientos: "id, fechaHoraReal, fechaJornada, tipo, estado, createdAt, updatedAt",
      detalleReposiciones: "id, movimientoId, productoId",
      configuracion: "id, deviceId, deviceRole, updatedAt",
      metasMensuales: "id, mes, createdAt, updatedAt",
      backupMetadata: "id, backupId, exportedAt, schemaVersion, deviceId",
      vinculoDispositivo: "id, negocioId, dispositivoRemotoId, authUserId, estado, updatedAt",
      colaSincronizacion:
        "id, negocioId, dispositivoId, estado, tipoOperacion, tipoEntidad, entidadId, creadaAt, actualizadaAt",
      estadoSincronizacion: "id, negocioId, updatedAt",
      conflictosSincronizacion:
        "id, negocioId, operacionId, estado, tipo, tipoEntidad, entidadId, creadoAt",
    });
  }
}

export const db = new MoraVineriaDatabase();
