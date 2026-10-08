import { useEffect, useState } from "react";

/** Preferencias de consulta de la pestaña; nunca datos operativos ni backups. */
export function useEstadoSesion<T>(clave: string, inicial: T) {
  const claveStorage = `mora-consulta-v1:${clave}`;
  const [valor, cambiarValor] = useState<T>(() => {
    try {
      const guardado: unknown = JSON.parse(sessionStorage.getItem(claveStorage) ?? "null");
      return typeof guardado === typeof inicial ? guardado as T : inicial;
    } catch {
      return inicial;
    }
  });
  useEffect(() => {
    try { sessionStorage.setItem(claveStorage, JSON.stringify(valor)); } catch { /* Preferencia opcional. */ }
  }, [claveStorage, valor]);
  return [valor, cambiarValor] as const;
}
