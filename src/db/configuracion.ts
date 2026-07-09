import { CONFIGURACION_ID } from "../constants";
import type { Configuracion, RolDispositivo } from "../domain/backup";
import { db } from "./schema";

export async function obtenerConfiguracion(): Promise<Configuracion | undefined> {
  return db.configuracion.get(CONFIGURACION_ID);
}

export async function actualizarRolDispositivo(
  deviceRole: RolDispositivo,
): Promise<void> {
  await db.configuracion.update(CONFIGURACION_ID, {
    deviceRole,
    updatedAt: new Date().toISOString(),
  });
}