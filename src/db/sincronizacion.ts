import type {
  ConflictoSincronizacionLocal,
  EstadoSincronizacionLocal,
  OperacionSincronizacionLocal,
  VinculoDispositivoLocal,
} from "../domain/sincronizacion";
import { db } from "./schema";

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
    .anyOf(["pendiente", "error"])
    .sortBy("creadaAt");
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
