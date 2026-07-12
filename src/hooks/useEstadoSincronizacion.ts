import { useSyncExternalStore } from "react";

import {
  obtenerEstadoSincronizacionVisible,
  suscribirEstadoSincronizacion,
} from "../sync/estado";

export function useEstadoSincronizacion() {
  return useSyncExternalStore(
    suscribirEstadoSincronizacion,
    obtenerEstadoSincronizacionVisible,
    obtenerEstadoSincronizacionVisible,
  );
}
