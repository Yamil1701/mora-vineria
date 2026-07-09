export type EstadoAlmacenamientoPersistente =
  | "no_soportado"
  | "pendiente"
  | "concedido"
  | "denegado"
  | "error";

export async function consultarAlmacenamientoPersistente(): Promise<EstadoAlmacenamientoPersistente> {
  if (!("storage" in navigator) || !("persisted" in navigator.storage)) {
    return "no_soportado";
  }

  try {
    const yaPersistente = await navigator.storage.persisted();
    return yaPersistente ? "concedido" : "pendiente";
  } catch {
    return "error";
  }
}

export async function solicitarAlmacenamientoPersistente(): Promise<EstadoAlmacenamientoPersistente> {
  if (!("storage" in navigator) || !("persist" in navigator.storage)) {
    return "no_soportado";
  }

  try {
    const concedido = await navigator.storage.persist();
    return concedido ? "concedido" : "denegado";
  } catch {
    return "error";
  }
}