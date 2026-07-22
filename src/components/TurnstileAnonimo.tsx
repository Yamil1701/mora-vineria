import { Turnstile } from "@marsidev/react-turnstile";

import type { ProteccionAnonima } from "../hooks/useTurnstileAnonimo";
import { usePreferenciasUi } from "../stores/preferenciasUi";
import { Button, Notice, Panel, Spinner } from "./ui";

export function TurnstileAnonimo({ proteccion }: { proteccion: ProteccionAnonima }) {
  const tema = usePreferenciasUi((estado) => estado.tema);
  if (proteccion.estado === "no_requerido") return null;

  if (proteccion.estado === "comprobando") {
    return <Panel className="flex items-center justify-center gap-3 text-sm text-white/60"><Spinner size="sm" label="Revisando protección" /> Preparando verificación…</Panel>;
  }

  if (proteccion.estado === "sin_configuracion") {
    return <Notice tone="danger">Falta configurar <code>VITE_TURNSTILE_SITE_KEY</code> en esta versión de la app.</Notice>;
  }

  if (proteccion.estado === "error") {
    return <Notice tone="warning"><div className="flex items-center justify-between gap-3"><span>No se pudo completar la protección anti-bots.</span><Button size="sm" variant="secondary" onClick={() => void proteccion.reintentar()}>Reintentar</Button></div></Notice>;
  }

  if (!proteccion.siteKey) return null;

  return (
    <Panel className="space-y-3 overflow-hidden">
      <p className="text-xs leading-5 text-white/50">Verificación de seguridad para crear la identidad de este celular.</p>
      <Turnstile
        key={`${proteccion.version}-${tema}`}
        siteKey={proteccion.siteKey}
        onSuccess={proteccion.completar}
        onExpire={proteccion.invalidar}
        onError={() => proteccion.fallar()}
        onTimeout={proteccion.invalidar}
        onUnsupported={() => proteccion.fallar()}
        options={{
          action: "anonymous-signin",
          appearance: "interaction-only",
          language: "es",
          refreshExpired: "auto",
          refreshTimeout: "auto",
          size: "flexible",
          theme: tema === "claro" ? "light" : "dark",
        }}
        className="mx-auto min-h-[65px] w-full"
      />
    </Panel>
  );
}
