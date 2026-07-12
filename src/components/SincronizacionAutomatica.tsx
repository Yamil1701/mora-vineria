import { useEffect } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { SINCRONIZACION_PENDIENTE_EVENT } from "../constants";
import { useVinculoDispositivo } from "../hooks/useVinculoDispositivo";
import {
  quitarSuscripcionCatalogo,
  suscribirAvisosCatalogo,
} from "../sync/catalogo";
import {
  indicarSinConfiguracion,
  indicarSinConexion,
  sincronizarCatalogo,
} from "../sync/motorCatalogo";

const INTERVALO_RECUPERACION_MS = 45_000;

export function SincronizacionAutomatica() {
  const { estado, vinculo } = useVinculoDispositivo();

  useEffect(() => {
    if (!vinculo || (estado !== "vinculado" && estado !== "error")) {
      if (estado !== "cargando") indicarSinConfiguracion();
      return;
    }

    const ejecutar = () => {
      if (navigator.onLine) void sincronizarCatalogo(vinculo);
      else void indicarSinConexion();
    };
    const alVolver = () => {
      if (document.visibilityState === "visible") ejecutar();
    };

    let canal: RealtimeChannel | null = null;
    const conectarCanal = () => {
      if (!canal && navigator.onLine) {
        canal = suscribirAvisosCatalogo(vinculo.negocioId, ejecutar);
      }
    };
    const alConectar = () => {
      conectarCanal();
      ejecutar();
    };
    const alDesconectar = () => {
      if (canal) {
        void quitarSuscripcionCatalogo(canal);
        canal = null;
      }
      ejecutar();
    };

    conectarCanal();
    ejecutar();
    const intervalo = window.setInterval(ejecutar, INTERVALO_RECUPERACION_MS);
    window.addEventListener("online", alConectar);
    window.addEventListener("offline", alDesconectar);
    window.addEventListener("focus", ejecutar);
    window.addEventListener("visibilitychange", alVolver);
    window.addEventListener(SINCRONIZACION_PENDIENTE_EVENT, ejecutar);

    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("online", alConectar);
      window.removeEventListener("offline", alDesconectar);
      window.removeEventListener("focus", ejecutar);
      window.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener(SINCRONIZACION_PENDIENTE_EVENT, ejecutar);
      if (canal) void quitarSuscripcionCatalogo(canal);
    };
  }, [estado, vinculo]);

  return null;
}
