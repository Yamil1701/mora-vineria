import type {
  CambioCatalogoRemoto,
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
  if (!vinculo || vinculo.estado !== "activo" || vinculo.modo !== "operacion") return false;

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
      for (const cambio of cambios) {
        const tieneCambioLocal = await db.colaSincronizacion
          .where("estado")
          .anyOf(["pendiente", "error", "enviando"])
          .filter((operacion) =>
            operacion.tipoEntidad === cambio.tipoEntidad &&
            operacion.entidadId === cambio.entidadId)
          .count();

        if (tieneCambioLocal === 0) {
          if (cambio.tipoEntidad === "categoria") {
            if (cambio.eliminada) await db.categorias.delete(cambio.entidadId);
            else if (cambio.entidad) await db.categorias.put(cambio.entidad as never);
          } else {
            if (cambio.eliminada) await db.productos.delete(cambio.entidadId);
            else if (cambio.entidad) await db.productos.put(cambio.entidad as never);
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
