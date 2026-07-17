import Dexie, { type Table } from "dexie";

import type { BackupMetadata, Configuracion, MetaMensual } from "../domain/backup";
import type { Categoria, Producto } from "../domain/productos";
import type { DetalleReposicion, Movimiento } from "../domain/movimientos";
import type { CobroVenta, DetalleVenta, Venta } from "../domain/ventas";
import type { ConteoCaja, CuentaTesoreria, MovimientoTesoreria } from "../domain/tesoreria";
import type {
  ConflictoSincronizacionLocal,
  DiferenciaStockLocal,
  EstadoSincronizacionLocal,
  OperacionSincronizacionLocal,
  VersionEntidadSincronizacionLocal,
  VinculoDispositivoLocal,
} from "../domain/sincronizacion";

export class MoraVineriaDatabase extends Dexie {
  categorias!: Table<Categoria, string>;
  productos!: Table<Producto, string>;
  ventas!: Table<Venta, string>;
  detalleVentas!: Table<DetalleVenta, string>;
  cobrosVentas!: Table<CobroVenta, string>;
  movimientos!: Table<Movimiento, string>;
  detalleReposiciones!: Table<DetalleReposicion, string>;
  configuracion!: Table<Configuracion, string>;
  metasMensuales!: Table<MetaMensual, string>;
  backupMetadata!: Table<BackupMetadata, string>;
  vinculoDispositivo!: Table<VinculoDispositivoLocal, string>;
  colaSincronizacion!: Table<OperacionSincronizacionLocal, string>;
  estadoSincronizacion!: Table<EstadoSincronizacionLocal, string>;
  conflictosSincronizacion!: Table<ConflictoSincronizacionLocal, string>;
  versionesSincronizacion!: Table<VersionEntidadSincronizacionLocal, string>;
  diferenciasStock!: Table<DiferenciaStockLocal, string>;
  cuentasTesoreria!: Table<CuentaTesoreria, string>;
  movimientosTesoreria!: Table<MovimientoTesoreria, string>;
  conteosCaja!: Table<ConteoCaja, string>;

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

    this.version(3).stores({
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
      estadoSincronizacion: "id, negocioId, fase, updatedAt",
      conflictosSincronizacion:
        "id, negocioId, operacionId, estado, tipo, tipoEntidad, entidadId, creadoAt",
      versionesSincronizacion:
        "id, negocioId, tipoEntidad, entidadId, versionRemota, updatedAt",
    });

    this.version(4).stores({
      categorias: "id, nombre, activa, createdAt, updatedAt",
      productos:
        "id, nombre, categoriaId, estado, stockActual, stockObjetivo, createdAt, updatedAt, deletedAt",
      ventas:
        "id, fechaHoraReal, fechaJornada, condicionPago, clienteFiadoNombre, vencimientoFiado, estado, createdAt, updatedAt",
      detalleVentas: "id, ventaId, productoId",
      cobrosVentas: "id, ventaId, fechaHoraReal, fechaJornada, medioPago, estado, createdAt, updatedAt",
      movimientos: "id, fechaHoraReal, fechaJornada, tipo, estado, createdAt, updatedAt",
      detalleReposiciones: "id, movimientoId, productoId",
      configuracion: "id, deviceId, deviceRole, updatedAt",
      metasMensuales: "id, mes, createdAt, updatedAt",
      backupMetadata: "id, backupId, exportedAt, schemaVersion, deviceId",
      vinculoDispositivo: "id, negocioId, dispositivoRemotoId, authUserId, estado, updatedAt",
      colaSincronizacion:
        "id, negocioId, dispositivoId, estado, tipoOperacion, tipoEntidad, entidadId, creadaAt, actualizadaAt",
      estadoSincronizacion: "id, negocioId, fase, updatedAt",
      conflictosSincronizacion:
        "id, negocioId, operacionId, estado, tipo, tipoEntidad, entidadId, creadoAt",
      versionesSincronizacion:
        "id, negocioId, tipoEntidad, entidadId, versionRemota, updatedAt",
      diferenciasStock: "id, productoId, estado, creadoAt",
    }).upgrade(async (transaction) => {
      const ventas = transaction.table<Venta, string>("ventas");
      const cobros = transaction.table<CobroVenta, string>("cobrosVentas");
      const ventasExistentes = await ventas.toArray();

      for (const venta of ventasExistentes) {
        await ventas.update(venta.id, { condicionPago: venta.condicionPago ?? "contado" });
        if (!venta.medioPago || venta.total <= 0) continue;

        const cobroMigrado: CobroVenta = {
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
          motivoAnulacion: venta.estado === "anulada"
            ? (venta.motivoAnulacion ?? "Venta anulada")
            : null,
        };
        await cobros.put(cobroMigrado);
      }
    });

    this.version(5).stores({
      categorias: "id, nombre, activa, createdAt, updatedAt",
      productos:
        "id, nombre, categoriaId, estado, stockActual, stockObjetivo, createdAt, updatedAt, deletedAt",
      ventas:
        "id, fechaHoraReal, fechaJornada, condicionPago, clienteFiadoNombre, vencimientoFiado, estado, createdAt, updatedAt",
      detalleVentas: "id, ventaId, productoId",
      cobrosVentas:
        "id, ventaId, fechaHoraReal, fechaJornada, medioPago, cuentaTesoreriaId, estado, createdAt, updatedAt",
      movimientos:
        "id, fechaHoraReal, fechaJornada, tipo, cuentaTesoreriaId, estado, createdAt, updatedAt",
      detalleReposiciones: "id, movimientoId, productoId",
      configuracion: "id, deviceId, deviceRole, updatedAt",
      metasMensuales: "id, mes, createdAt, updatedAt",
      backupMetadata: "id, backupId, exportedAt, schemaVersion, deviceId",
      vinculoDispositivo: "id, negocioId, dispositivoRemotoId, authUserId, estado, updatedAt",
      colaSincronizacion:
        "id, negocioId, dispositivoId, estado, tipoOperacion, tipoEntidad, entidadId, creadaAt, actualizadaAt",
      estadoSincronizacion: "id, negocioId, fase, updatedAt",
      conflictosSincronizacion:
        "id, negocioId, operacionId, estado, tipo, tipoEntidad, entidadId, creadoAt",
      versionesSincronizacion:
        "id, negocioId, tipoEntidad, entidadId, versionRemota, updatedAt",
      diferenciasStock: "id, productoId, estado, creadoAt",
      cuentasTesoreria:
        "id, nombre, tipo, estado, esPredeterminada, createdAt, updatedAt",
      movimientosTesoreria:
        "id, cuentaId, fechaHoraReal, fechaJornada, tipo, direccion, referenciaTipo, referenciaId, grupoId, createdAt",
      conteosCaja: "id, cuentaId, fechaHoraReal, fechaJornada, createdAt",
    }).upgrade(async (transaction) => {
      await transaction.table<Configuracion, string>("configuracion").toCollection().modify({
        porcentajeStockBajo: 30,
      });
    });
  }
}

export const db = new MoraVineriaDatabase();
