import { useEffect } from "react";

import { usePreferenciasUi } from "../stores/preferenciasUi";

export function useRestaurarScroll(clave: string) {
  const posicion = usePreferenciasUi((state) => state.posicionesScroll[clave] ?? 0);
  const guardarPosicionScroll = usePreferenciasUi((state) => state.guardarPosicionScroll);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => window.scrollTo(0, posicion));

    return () => {
      window.cancelAnimationFrame(frame);
      guardarPosicionScroll(clave, window.scrollY);
    };
  }, [clave, guardarPosicionScroll, posicion]);
}
