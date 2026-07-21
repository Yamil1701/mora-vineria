export const CLAVE_PROPUESTA_REPOSICION = "mora-vineria-propuesta-reposicion";

export interface ItemPropuestaReposicion {
  productoId: string;
  modoCarga: "unidades" | "bultos";
  cantidad: number;
  costoUnitario: number;
  cantidadBultos?: number;
  unidadesPorBulto?: number;
  costoPorBulto?: number;
}

export interface PagoPropuestaReposicion {
  cuentaTesoreriaId: string;
  monto: number;
}

export interface PropuestaReposicionGuardada {
  items: ItemPropuestaReposicion[];
  pagos: PagoPropuestaReposicion[];
  creadaAt: string;
}

export function guardarPropuestaReposicion(propuesta: PropuestaReposicionGuardada): void {
  sessionStorage.setItem(CLAVE_PROPUESTA_REPOSICION, JSON.stringify(propuesta));
}

export function leerPropuestaReposicion(): PropuestaReposicionGuardada | null {
  const valor = sessionStorage.getItem(CLAVE_PROPUESTA_REPOSICION);
  if (!valor) return null;
  try {
    const propuesta = JSON.parse(valor) as PropuestaReposicionGuardada;
    if (!Array.isArray(propuesta.items) || !Array.isArray(propuesta.pagos)) return null;
    return propuesta;
  } catch {
    return null;
  }
}

export function quitarPropuestaReposicion(): void {
  sessionStorage.removeItem(CLAVE_PROPUESTA_REPOSICION);
}
