function leerBooleano(valor: string | undefined): boolean | null {
  if (valor === "true") return true;
  if (valor === "false") return false;
  return null;
}

const configuracionExplicita = leerBooleano(import.meta.env.VITE_SYNC_ENABLED);

export const sincronizacionHabilitada =
  configuracionExplicita ?? import.meta.env.PROD;

export const modoDesarrolloSinSincronizacion =
  import.meta.env.DEV && !sincronizacionHabilitada;
