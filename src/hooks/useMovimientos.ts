import { useCallback, useEffect, useState } from "react";

import { listarMovimientosConDetalles, type MovimientoConDetalles } from "../db";

export function useMovimientos(limite = 40) {
  const [movimientos, setMovimientos] = useState<MovimientoConDetalles[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarMovimientos = useCallback(async () => {
    try {
      setCargando(true);
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
  }, [cargarMovimientos]);

  return {
    movimientos,
    cargando,
    error,
    recargar: cargarMovimientos,
  };
}
