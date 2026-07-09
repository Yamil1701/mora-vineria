import { useCallback, useEffect, useState } from "react";

import {
  guardarMetaMensual,
  obtenerProyeccionMensualActual,
  type ProyeccionMensualActual,
} from "../db";

export function useProyeccionMensual() {
  const [proyeccionActual, setProyeccionActual] = useState<ProyeccionMensualActual | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardandoMeta, setGuardandoMeta] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const resultado = await obtenerProyeccionMensualActual();
      setProyeccionActual(resultado);
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo cargar la proyección.",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  const guardarMeta = useCallback(
    async (metaVentas: number) => {
      if (!proyeccionActual) return;

      try {
        setGuardandoMeta(true);
        setError(null);
        await guardarMetaMensual(proyeccionActual.mes, metaVentas);
        await recargar();
      } catch (errorDesconocido) {
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "No se pudo guardar la meta mensual.",
        );
      } finally {
        setGuardandoMeta(false);
      }
    },
    [proyeccionActual, recargar],
  );

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return {
    proyeccionActual,
    cargando,
    guardandoMeta,
    error,
    guardarMeta,
    recargar,
  };
}
