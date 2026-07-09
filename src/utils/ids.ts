export function crearId(prefijo: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefijo}-${crypto.randomUUID()}`;
  }

  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}