type EntornoTurnstile = {
  VITE_TURNSTILE_SITE_KEY?: string;
};

export function leerSiteKeyTurnstile(entorno: EntornoTurnstile): string | null {
  const siteKey = entorno.VITE_TURNSTILE_SITE_KEY?.trim();
  return siteKey || null;
}
