import type { EstadoSincronizacionVisible } from "../domain/sincronizacion";

let estadoActual: EstadoSincronizacionVisible = {
  fase: "sin_configurar",
  pendientes: 0,
  conflictos: 0,
  ultimaSincronizacionAt: null,
  mensaje: null,
};

const listeners = new Set<() => void>();

export function obtenerEstadoSincronizacionVisible(): EstadoSincronizacionVisible {
  return estadoActual;
}

export function publicarEstadoSincronizacion(
  estado: EstadoSincronizacionVisible,
): void {
  estadoActual = estado;
  listeners.forEach((listener) => listener());
}

export function suscribirEstadoSincronizacion(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
