import { useCallback, useEffect, useState } from "react";

import { obtenerResumenesDashboard, type ResumenesDashboard } from "../db";

export function useResumenes() {
  const [resumenes, setResumenes] = useState<ResumenesDashboard | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const resultado = await obtenerResumenesDashboard();
      setResumenes(resultado);
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo cargar el resumen.",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { resumenes, cargando, error, recargar };
}
