import type {
  CambioCatalogoRemoto,
  CambioSincronizacionRemoto,
  ConflictoSincronizacionLocal,
  EstadoSincronizacionLocal,
  OperacionSincronizacionLocal,
  PayloadOperacionCatalogo,
  TipoEntidadCatalogo,
  TipoOperacionCatalogo,
  VersionEntidadSincronizacionLocal,
  VinculoDispositivoLocal,
} from "../domain/sincronizacion";
import {
  DATOS_CATALOGO_ACTUALIZADOS_EVENT,
  SINCRONIZACION_PENDIENTE_EVENT,
} from "../constants";
import type { SnapshotCatalogoRemoto } from "../domain/sincronizacion";
import { crearId } from "../utils/ids";
import { db, type MoraVineriaDatabase } from "./schema";

export async function obtenerVinculoDispositivo(): Promise<VinculoDispositivoLocal | undefined> {
  return db.vinculoDispositivo.get("vinculo-actual");
}

export async function guardarVinculoDispositivo(
  vinculo: VinculoDispositivoLocal,
): Promise<void> {
  await db.vinculoDispositivo.put(vinculo);
}

export async function quitarVinculoDispositivo(): Promise<void> {
  await db.vinculoDispositivo.delete("vinculo-actual");
}

export async function encolarOperacionSincronizacion(
  operacion: OperacionSincronizacionLocal,
): Promise<void> {
  await db.colaSincronizacion.add(operacion);
}

export async function encolarOperacionOperativaLocal(input: {
  id: string;
  tipoOperacion: string;
  tipoEntidad: "venta" | "cobro_venta" | "movimiento";
  entidadId: string;
  payload: unknown;
  creadaAt: string;
}, base: MoraVineriaDatabase = db): Promise<boolean> {
  const vinculo = await base.vinculoDispositivo.get("vinculo-actual");
  if (!vinculo) return false;
  if (vinculo.estado === "revocado") {
    throw new Error("Este celular fue revocado. Volvé a vincularlo para cargar cambios.");
  }
  if (vinculo.modo !== "operacion") return false;
  await base.colaSincronizacion.add({
    id: input.id,
    negocioId: vinculo.negocioId,
    dispositivoId: vinculo.dispositivoRemotoId,
    tipoOperacion: input.tipoOperacion,
    tipoEntidad: input.tipoEntidad,
    entidadId: input.entidadId,
    payload: input.payload,
    estado: "pendiente",
    intentos: 0,
    creadaAt: input.creadaAt,
    actualizadaAt: input.creadaAt,
    ultimoIntentoAt: null,
    ultimoError: null,
  });
  return true;
}

export async function listarOperacionesPendientes(): Promise<OperacionSincronizacionLocal[]> {
  return db.colaSincronizacion
    .where("estado")
    .anyOf(["pendiente", "error", "enviando"])
    .sortBy("creadaAt");
}

export async function contarOperacionesPendientes(): Promise<number> {
  return db.colaSincronizacion.where("estado").anyOf(["pendiente", "error", "enviando"]).count();
}

export async function marcarOperacionEnviando(operacionId: string): Promise<void> {
  const ahora = new Date().toISOString();
  await db.colaSincronizacion.update(operacionId, {
    estado: "enviando",
    ultimoIntentoAt: ahora,
    actualizadaAt: ahora,
  });
}

export async function marcarOperacionSincronizada(operacionId: string): Promise<void> {
  await db.colaSincronizacion.delete(operacionId);
}

export async function marcarOperacionConConflicto(
  operacionId: string,
  conflicto: ConflictoSincronizacionLocal,
): Promise<void> {
  await db.transaction(
    "rw",
    db.colaSincronizacion,
    db.conflictosSincronizacion,
    async () => {
      await db.colaSincronizacion.delete(operacionId);
      await db.conflictosSincronizacion.put(conflicto);
    },
  );
}

export async function marcarOperacionConError(
  operacionId: string,
  mensaje: string,
): Promise<void> {
  const operacion = await db.colaSincronizacion.get(operacionId);
  if (!operacion) return;
  const ahora = new Date().toISOString();
  await db.colaSincronizacion.update(operacionId, {
    estado: "error",
    intentos: operacion.intentos + 1,
    ultimoError: mensaje,
    actualizadaAt: ahora,
  });
}

export function claveVersionEntidad(
  tipoEntidad: TipoEntidadCatalogo,
  entidadId: string,
): string {
  return `${tipoEntidad}:${entidadId}`;
}

export async function obtenerVersionEntidad(
  tipoEntidad: TipoEntidadCatalogo,
  entidadId: string,
): Promise<VersionEntidadSincronizacionLocal | undefined> {
  return db.versionesSincronizacion.get(claveVersionEntidad(tipoEntidad, entidadId));
}

export async function guardarVersionEntidad(
  negocioId: string,
  tipoEntidad: TipoEntidadCatalogo,
  entidadId: string,
  versionRemota: number,
): Promise<void> {
  await db.versionesSincronizacion.put({
    id: claveVersionEntidad(tipoEntidad, entidadId),
    negocioId,
    tipoEntidad,
    entidadId,
    versionRemota,
    updatedAt: new Date().toISOString(),
  });
}

export async function encolarCambioCatalogoLocal(input: {
  tipoEntidad: TipoEntidadCatalogo;
  entidadId: string;
  tipoOperacion: TipoOperacionCatalogo;
  entidad: unknown | null;
}, base: MoraVineriaDatabase = db): Promise<boolean> {
  const vinculo = await base.vinculoDispositivo.get("vinculo-actual");
  if (!vinculo) return false;
  if (vinculo.estado === "revocado") {
    throw new Error("Este celular fue revocado. Volvé a vincularlo para cargar cambios.");
  }
  if (vinculo.modo !== "operacion") return false;

  const version = await base.versionesSincronizacion.get(
    claveVersionEntidad(input.tipoEntidad, input.entidadId),
  );
  const pendientes = await base.colaSincronizacion
    .where("estado")
    .anyOf(["pendiente", "error"])
    .filter((operacion) =>
      operacion.tipoEntidad === input.tipoEntidad && operacion.entidadId === input.entidadId)
    .toArray();
  const existente = pendientes[0];
  const baseVersion = version?.versionRemota ?? 0;

  if (input.tipoOperacion === "eliminar" && existente && baseVersion === 0) {
    await base.colaSincronizacion.delete(existente.id);
    await base.versionesSincronizacion.delete(
      claveVersionEntidad(input.tipoEntidad, input.entidadId),
    );
    return true;
  }

  const ahora = new Date().toISOString();
  const payloadExistente = existente?.payload as PayloadOperacionCatalogo | undefined;
  const payload: PayloadOperacionCatalogo = {
    baseVersion: payloadExistente?.baseVersion ?? baseVersion,
    entidad: input.entidad,
  };

  if (existente) {
    await base.colaSincronizacion.update(existente.id, {
      tipoOperacion: input.tipoOperacion,
      payload,
      estado: "pendiente",
      intentos: 0,
      actualizadaAt: ahora,
      ultimoError: null,
    });
    return true;
  }

  await base.colaSincronizacion.add({
    id: crearId("operacion"),
    negocioId: vinculo.negocioId,
    dispositivoId: vinculo.dispositivoRemotoId,
    tipoOperacion: input.tipoOperacion,
    tipoEntidad: input.tipoEntidad,
    entidadId: input.entidadId,
    payload,
    estado: "pendiente",
    intentos: 0,
    creadaAt: ahora,
    actualizadaAt: ahora,
    ultimoIntentoAt: null,
    ultimoError: null,
  });
  return true;
}

export function notificarSincronizacionPendiente(): void {
  window.dispatchEvent(new Event(SINCRONIZACION_PENDIENTE_EVENT));
}

export async function aplicarCambiosCatalogoRemotos(
  negocioId: string,
  cambios: CambioCatalogoRemoto[],
): Promise<void> {
  await db.transaction(
    "rw",
    db.categorias,
    db.productos,
    db.versionesSincronizacion,
    db.colaSincronizacion,
    async () => {
      const pendientes = await db.colaSincronizacion
        .where("estado")
        .anyOf(["pendiente", "error", "enviando"])
        .toArray();
      for (const cambio of cambios) {
        const tieneCambioLocal = pendientes.some((operacion) =>
          operacion.tipoEntidad === cambio.tipoEntidad &&
          operacion.entidadId === cambio.entidadId);

        if (!tieneCambioLocal) {
          if (cambio.tipoEntidad === "categoria") {
            if (cambio.eliminada) await db.categorias.delete(cambio.entidadId);
            else if (cambio.entidad) await db.categorias.put(cambio.entidad as never);
          } else {
            if (cambio.eliminada) await db.productos.delete(cambio.entidadId);
            else if (cambio.entidad) {
              const producto = cambio.entidad as { id: string; stockActual: number };
              const ajustePendiente = pendientes.reduce(
                (total, operacion) => total + ajusteStockDeOperacion(operacion, producto.id),
                0,
              );
              await db.productos.put({
                ...producto,
                stockActual: Math.max(0, producto.stockActual + ajustePendiente),
              } as never);
            }
          }
        }
        await guardarVersionEntidad(
          negocioId,
          cambio.tipoEntidad,
          cambio.entidadId,
          cambio.version,
        );
      }
    },
  );
  window.dispatchEvent(new Event(DATOS_CATALOGO_ACTUALIZADOS_EVENT));
}

function ventaIdDeOperacion(operacion: OperacionSincronizacionLocal): string | null {
  if (operacion.tipoEntidad === "venta") return operacion.entidadId;
  if (operacion.tipoEntidad !== "cobro_venta") return null;
  const payload = operacion.payload as { cobro?: { ventaId?: unknown } };
  return typeof payload.cobro?.ventaId === "string" ? payload.cobro.ventaId : null;
}

export async function aplicarCambiosOperativosRemotos(
  cambios: CambioSincronizacionRemoto[],
): Promise<void> {
  const operativos = cambios.filter((cambio) =>
    cambio.tipoEntidad === "venta"
    || cambio.tipoEntidad === "movimiento"
    || cambio.tipoEntidad === "diferencia_stock");
  if (!operativos.length) return;

  await db.transaction(
    "rw",
    [
      db.ventas,
      db.detalleVentas,
      db.cobrosVentas,
      db.movimientos,
      db.detalleReposiciones,
      db.diferenciasStock,
      db.colaSincronizacion,
    ],
    async () => {
      const pendientes = await db.colaSincronizacion
        .where("estado")
        .anyOf(["pendiente", "error", "enviando"])
        .toArray();

      for (const cambio of operativos) {
        if (cambio.tipoEntidad === "venta") {
          const operacionesVenta = pendientes.filter((operacion) =>
            ventaIdDeOperacion(operacion) === cambio.entidadId);
          if (operacionesVenta.some((operacion) => operacion.tipoEntidad === "venta")) continue;
          if (!cambio.entidad || cambio.eliminada) continue;

          const venta = cambio.entidad.venta as never;
          const detalles = cambio.entidad.detalles as never[];
          const cobrosRemotos = cambio.entidad.cobros as Array<{ id: string }>;
          const cobrosPendientes = operacionesVenta
            .filter((operacion) => operacion.tipoEntidad === "cobro_venta")
            .map((operacion) => (operacion.payload as { cobro?: unknown }).cobro)
            .filter(Boolean) as Array<{ id: string }>;
          const cobrosPorId = new Map(cobrosRemotos.map((cobro) => [cobro.id, cobro]));
          for (const cobro of cobrosPendientes) cobrosPorId.set(cobro.id, cobro);

          await db.ventas.put(venta);
          await db.detalleVentas.where("ventaId").equals(cambio.entidadId).delete();
          if (detalles.length) await db.detalleVentas.bulkPut(detalles);
          await db.cobrosVentas.where("ventaId").equals(cambio.entidadId).delete();
          if (cobrosPorId.size) await db.cobrosVentas.bulkPut(Array.from(cobrosPorId.values()) as never[]);
          continue;
        }

        if (cambio.tipoEntidad === "movimiento") {
          const tienePendiente = pendientes.some((operacion) =>
            operacion.tipoEntidad === "movimiento" && operacion.entidadId === cambio.entidadId);
          if (tienePendiente) continue;
          if (cambio.eliminada || !cambio.entidad) {
            await db.detalleReposiciones.where("movimientoId").equals(cambio.entidadId).delete();
            await db.movimientos.delete(cambio.entidadId);
          } else {
            await db.movimientos.put(cambio.entidad.movimiento as never);
            await db.detalleReposiciones.where("movimientoId").equals(cambio.entidadId).delete();
            if (cambio.entidad.detalles.length) {
              await db.detalleReposiciones.bulkPut(cambio.entidad.detalles as never[]);
            }
          }
          continue;
        }

        if (cambio.entidad) await db.diferenciasStock.put(cambio.entidad);
      }
    },
  );
  window.dispatchEvent(new Event(DATOS_CATALOGO_ACTUALIZADOS_EVENT));
}

function ajusteStockDeOperacion(
  operacion: OperacionSincronizacionLocal,
  productoId: string,
): number {
  const payload = operacion.payload as {
    detalles?: Array<{ productoId?: string; cantidad?: number }>;
  };
  const cantidad = (payload.detalles ?? [])
    .filter((detalle) => detalle.productoId === productoId)
    .reduce((total, detalle) => total + Number(detalle.cantidad ?? 0), 0);
  if (!cantidad) return 0;
  if (operacion.tipoEntidad === "venta") {
    return operacion.tipoOperacion === "registrar" ? -cantidad
      : operacion.tipoOperacion === "anular" ? cantidad : 0;
  }
  if (operacion.tipoEntidad === "movimiento") {
    return operacion.tipoOperacion === "registrar" ? cantidad
      : operacion.tipoOperacion === "anular" ? -cantidad : 0;
  }
  return 0;
}

export async function calcularStockLocalConPendientes(
  productoId: string,
  stockRemoto: number,
): Promise<number> {
  const operaciones = await listarOperacionesPendientes();
  const ajuste = operaciones.reduce(
    (total, operacion) => total + ajusteStockDeOperacion(operacion, productoId),
    0,
  );
  return Math.max(0, stockRemoto + ajuste);
}

export async function reemplazarCatalogoDesdeSnapshot(
  negocioId: string,
  snapshot: SnapshotCatalogoRemoto,
): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.categorias,
      db.productos,
      db.versionesSincronizacion,
      db.colaSincronizacion,
      db.estadoSincronizacion,
      db.conflictosSincronizacion,
    ],
    async () => {
      await Promise.all([
        db.productos.clear(),
        db.categorias.clear(),
        db.versionesSincronizacion.clear(),
      ]);
      await db.colaSincronizacion
        .filter((operacion) =>
          operacion.tipoEntidad === "categoria" || operacion.tipoEntidad === "producto")
        .delete();

      if (snapshot.categorias.length) {
        await db.categorias.bulkPut(snapshot.categorias.map((item) => item.entidad as never));
      }
      if (snapshot.productos.length) {
        await db.productos.bulkPut(snapshot.productos.map((item) => item.entidad as never));
      }
      const ahora = new Date().toISOString();
      await db.versionesSincronizacion.bulkPut([
        ...snapshot.categorias.map((item) => ({
          id: claveVersionEntidad("categoria", (item.entidad as { id: string }).id),
          negocioId,
          tipoEntidad: "categoria" as const,
          entidadId: (item.entidad as { id: string }).id,
          versionRemota: item.version,
          updatedAt: ahora,
        })),
        ...snapshot.productos.map((item) => ({
          id: claveVersionEntidad("producto", (item.entidad as { id: string }).id),
          negocioId,
          tipoEntidad: "producto" as const,
          entidadId: (item.entidad as { id: string }).id,
          versionRemota: item.version,
          updatedAt: ahora,
        })),
      ]);
      await db.estadoSincronizacion.put({
        id: "estado-actual",
        negocioId,
        ultimoCursorRemoto: snapshot.cursor,
        catalogoInicializado: true,
        ultimaSincronizacionAt: ahora,
        fase: "sincronizado",
        pendientes: 0,
        conflictos: await db.conflictosSincronizacion.where("estado").equals("pendiente").count(),
        ultimoError: null,
        updatedAt: ahora,
      });
    },
  );
  window.dispatchEvent(new Event(DATOS_CATALOGO_ACTUALIZADOS_EVENT));
}

export async function actualizarBaseDeOperacionesPendientes(
  tipoEntidad: TipoEntidadCatalogo,
  entidadId: string,
  versionRemota: number,
): Promise<void> {
  const operaciones = await db.colaSincronizacion
    .where("estado")
    .anyOf(["pendiente", "error"])
    .filter((operacion) =>
      operacion.tipoEntidad === tipoEntidad && operacion.entidadId === entidadId)
    .toArray();

  await Promise.all(operaciones.map((operacion) => {
    const payload = operacion.payload as PayloadOperacionCatalogo;
    return db.colaSincronizacion.update(operacion.id, {
      payload: { ...payload, baseVersion: versionRemota },
      actualizadaAt: new Date().toISOString(),
    });
  }));
}

export async function guardarEstadoSincronizacion(
  estado: EstadoSincronizacionLocal,
): Promise<void> {
  await db.estadoSincronizacion.put(estado);
}

export async function obtenerEstadoSincronizacion(): Promise<EstadoSincronizacionLocal | undefined> {
  return db.estadoSincronizacion.get("estado-actual");
}

export async function guardarConflictoSincronizacion(
  conflicto: ConflictoSincronizacionLocal,
): Promise<void> {
  await db.conflictosSincronizacion.put(conflicto);
}

export async function listarConflictosPendientes(): Promise<ConflictoSincronizacionLocal[]> {
  return db.conflictosSincronizacion.where("estado").equals("pendiente").sortBy("creadoAt");
}

export async function marcarConflictoLocalResuelto(conflictoId: string): Promise<void> {
  await db.conflictosSincronizacion.update(conflictoId, {
    estado: "resuelto",
    resueltoAt: new Date().toISOString(),
  });
}
