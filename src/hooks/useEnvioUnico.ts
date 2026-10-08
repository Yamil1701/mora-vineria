import { useCallback, useRef } from "react";

/** Serializa la confirmación y la escritura, incluso antes del siguiente render. */
export function useEnvioUnico() {
  const enCurso = useRef(false);
  return useCallback(async (operacion: () => Promise<void>) => {
    if (enCurso.current) return;
    enCurso.current = true;
    try { await operacion(); }
    finally { enCurso.current = false; }
  }, []);
}
