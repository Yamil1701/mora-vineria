import { CONFIGURACION_ID } from "../constants";
import type { Configuracion, ModoDispositivo } from "../domain/backup";
import { db } from "./schema";

export async function obtenerConfiguracion(): Promise<Configuracion | undefined> {
  return db.configuracion.get(CONFIGURACION_ID);
}

export async function actualizarModoDispositivo(
  deviceRole: ModoDispositivo,
): Promise<void> {
  await db.configuracion.update(CONFIGURACION_ID, {
    deviceRole,
    updatedAt: new Date().toISOString(),
  });
}
