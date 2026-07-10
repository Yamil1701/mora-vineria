export const GITHUB_PAGES_BASE_PATH = "/mora-vineria/";
export const GITHUB_PAGES_REDIRECT_KEY = "mora-vineria-redirect";

export function obtenerMensajeConexion(enLinea: boolean): string {
  return enLinea
    ? "Con conexión. La app puede actualizar datos y archivos cuando haga falta."
    : "Sin conexión. Podés seguir usando los datos guardados en este dispositivo.";
}

export function normalizarRutaGitHubPages(
  redirect: string | null,
  basePath = GITHUB_PAGES_BASE_PATH,
): string | null {
  if (!redirect) return null;

  const redirectLimpio = redirect.trim().replace(/^\/+/, "");

  if (!redirectLimpio) return basePath;

  const baseLimpio = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return `${baseLimpio}${redirectLimpio}`.replace(/\/+/g, "/");
}
