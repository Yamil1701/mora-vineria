import { useCallback, useEffect, useMemo, useState } from "react";

import { obtenerAuthUserIdActual } from "../sync/dispositivos";
import { leerSiteKeyTurnstile } from "../sync/turnstile";

export type EstadoTurnstileAnonimo =
  | "comprobando"
  | "no_requerido"
  | "pendiente"
  | "verificado"
  | "sin_configuracion"
  | "error";

export function useTurnstileAnonimo() {
  const siteKey = useMemo(() => leerSiteKeyTurnstile(import.meta.env), []);
  const [estado, setEstado] = useState<EstadoTurnstileAnonimo>("comprobando");
  const [token, setToken] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const comprobar = useCallback(async (reiniciar = false) => {
    setEstado("comprobando");
    setToken(null);
    try {
      const authUserId = await obtenerAuthUserIdActual();
      if (authUserId) {
        setEstado("no_requerido");
        return;
      }
      if (!siteKey) {
        setEstado("sin_configuracion");
        return;
      }
      if (reiniciar) setVersion((actual) => actual + 1);
      setEstado("pendiente");
    } catch {
      setEstado("error");
    }
  }, [siteKey]);

  useEffect(() => { void comprobar(); }, [comprobar]);

  return {
    estado,
    siteKey,
    token,
    version,
    listo: estado === "no_requerido" || estado === "verificado",
    completar: (nuevoToken: string) => {
      setToken(nuevoToken);
      setEstado("verificado");
    },
    invalidar: () => {
      setToken(null);
      setEstado("pendiente");
    },
    fallar: () => {
      setToken(null);
      setEstado("error");
    },
    reintentar: () => comprobar(true),
    revisarDespuesDeError: () => comprobar(true),
  };
}

export type ProteccionAnonima = ReturnType<typeof useTurnstileAnonimo>;
