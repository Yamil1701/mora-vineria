import Dexie, { type Table } from "dexie";

import type { BackupMetadata, Configuracion, MetaMensual } from "../domain/backup";
import type { Categoria, Producto } from "../domain/productos";
import type { DetalleReposicion, Movimiento } from "../domain/movimientos";
import type { DetalleVenta, Venta } from "../domain/ventas";

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

  constructor() {
    super("mora-vineria");

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
  }
}

export const db = new MoraVineriaDatabase();