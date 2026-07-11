import { useCallback, useEffect, useState } from "react";

import { obtenerResumenesDashboard, type ResumenesDashboard } from "../db";
import { actualizarDatosIniciales, leerDatosIniciales } from "../data/datosIniciales";

export function useResumenes() {
  const datosPrecargados = leerDatosIniciales();
  const tienePrecargaInicial = Boolean(datosPrecargados);
  const [resumenes, setResumenes] = useState<ResumenesDashboard | null>(() => datosPrecargados?.resumenes ?? null);
  const [cargando, setCargando] = useState(() => !datosPrecargados);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setCargando(true);
      setError(null);
      const resultado = await obtenerResumenesDashboard();
      setResumenes(resultado);
      actualizarDatosIniciales({ resumenes: resultado });
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
    if (!tienePrecargaInicial) void recargar();
  }, [recargar, tienePrecargaInicial]);

  return { resumenes, cargando, error, recargar };
}
