import { useCallback, useEffect, useState } from "react";

import { obtenerUltimoRespaldo } from "../db";
import { obtenerEstadoRespaldo, type EstadoRespaldo } from "../domain/backup";
import type { BackupMetadata } from "../domain/backup";

export const BACKUP_ACTUALIZADO_EVENT = "mora:backup-actualizado";

export function useEstadoRespaldo() {
  const [estado, setEstado] = useState<EstadoRespaldo | null>(null);
  const [ultimoRespaldo, setUltimoRespaldo] = useState<BackupMetadata | null>(null);

  const cargar = useCallback(async () => {
    try {
      const ultimo = await obtenerUltimoRespaldo();
      setUltimoRespaldo(ultimo ?? null);
      setEstado(obtenerEstadoRespaldo(ultimo?.exportedAt));
    } catch {
      setEstado(null);
      setUltimoRespaldo(null);
    }
  }, []);

  useEffect(() => {
    void cargar();
    window.addEventListener(BACKUP_ACTUALIZADO_EVENT, cargar);
    return () => window.removeEventListener(BACKUP_ACTUALIZADO_EVENT, cargar);
  }, [cargar]);

  return { estado, ultimoRespaldo };
}
