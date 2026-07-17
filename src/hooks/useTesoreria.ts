import { useCallback, useEffect, useState } from "react";

import { DATOS_CATALOGO_ACTUALIZADOS_EVENT } from "../constants";
import { obtenerResumenTesoreria } from "../db";
import type { ResumenTesoreria } from "../domain/tesoreria";

export function useTesoreria() {
  const [resumen, setResumen] = useState<ResumenTesoreria | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setCargando(true);
      setError(null);
      setResumen(await obtenerResumenTesoreria());
    } catch {
      setError("No se pudo cargar la tesorería.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
    const actualizar = () => void recargar(true);
    window.addEventListener(DATOS_CATALOGO_ACTUALIZADOS_EVENT, actualizar);
    return () => window.removeEventListener(DATOS_CATALOGO_ACTUALIZADOS_EVENT, actualizar);
  }, [recargar]);

  return { resumen, cargando, error, recargar };
}
