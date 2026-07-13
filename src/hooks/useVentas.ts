import { useCallback, useEffect, useState } from "react";

import { listarVentasConDetalles, type VentaConDetalles } from "../db";
import { DATOS_CATALOGO_ACTUALIZADOS_EVENT } from "../constants";

export function useVentas(limite = 30) {
  const [ventas, setVentas] = useState<VentaConDetalles[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarVentas = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setCargando(true);
      setError(null);
      setVentas(await listarVentasConDetalles({ limite }));
    } catch {
      setError("No se pudieron cargar las ventas.");
    } finally {
      setCargando(false);
    }
  }, [limite]);

  useEffect(() => {
    void cargarVentas();
    const actualizar = () => void cargarVentas(true);
    window.addEventListener(DATOS_CATALOGO_ACTUALIZADOS_EVENT, actualizar);
    return () => window.removeEventListener(DATOS_CATALOGO_ACTUALIZADOS_EVENT, actualizar);
  }, [cargarVentas]);

  return {
    ventas,
    cargando,
    error,
    recargar: cargarVentas,
  };
}
