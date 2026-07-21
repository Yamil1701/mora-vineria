import { useCallback, useEffect, useState } from "react";

import { listarMovimientosConDetalles, type MovimientoConDetalles } from "../db";
import { DATOS_CATALOGO_ACTUALIZADOS_EVENT } from "../constants";

export function useMovimientos(limite?: number) {
  const [movimientos, setMovimientos] = useState<MovimientoConDetalles[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarMovimientos = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setCargando(true);
      setError(null);
      const resultado = await listarMovimientosConDetalles({ limite });
      setMovimientos(resultado);
    } catch {
      setError("No se pudieron cargar los movimientos.");
    } finally {
      setCargando(false);
    }
  }, [limite]);

  useEffect(() => {
    void cargarMovimientos();
    const actualizar = () => void cargarMovimientos(true);
    window.addEventListener(DATOS_CATALOGO_ACTUALIZADOS_EVENT, actualizar);
    return () => window.removeEventListener(DATOS_CATALOGO_ACTUALIZADOS_EVENT, actualizar);
  }, [cargarMovimientos]);

  return {
    movimientos,
    cargando,
    error,
    recargar: cargarMovimientos,
  };
}
