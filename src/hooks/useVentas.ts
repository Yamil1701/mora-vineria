import { useCallback, useEffect, useState } from "react";

import { listarVentasConDetalles, type VentaConDetalles } from "../db";

export function useVentas(limite = 30) {
  const [ventas, setVentas] = useState<VentaConDetalles[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarVentas = useCallback(async () => {
    try {
      setCargando(true);
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
  }, [cargarVentas]);

  return {
    ventas,
    cargando,
    error,
    recargar: cargarVentas,
  };
}
