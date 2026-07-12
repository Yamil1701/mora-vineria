import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  FieldLabel,
  Input,
  Notice,
  Panel,
  Spinner,
  TaskHeader,
  useToast,
} from "../../components/ui";
import { TurnstileAnonimo } from "../../components/TurnstileAnonimo";
import { useTurnstileAnonimo } from "../../hooks/useTurnstileAnonimo";
import { activarYVincularNegocio } from "../../sync/vinculacion";
import { descargarCodigoRecuperacion } from "../../utils/codigoRecuperacion";

export function ActivarSincronizacionPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const bloqueoRef = useRef(false);
  const proteccion = useTurnstileAnonimo();
  const [nombreNegocio, setNombreNegocio] = useState("Mora Vinería");
  const [nombreDispositivo, setNombreDispositivo] = useState("");
  const [codigoActivacion, setCodigoActivacion] = useState("");
  const [codigoRecuperacion, setCodigoRecuperacion] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarEnvio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (bloqueoRef.current) return;
    bloqueoRef.current = true;
    setGuardando(true);
    setError(null);

    try {
      const resultado = await activarYVincularNegocio({
        nombreNegocio: nombreNegocio.trim(),
        nombreDispositivo: nombreDispositivo.trim(),
        codigoActivacion: codigoActivacion.trim(),
        captchaToken: proteccion.token ?? undefined,
      });
      setCodigoRecuperacion(resultado.codigoRecuperacion);
      toast.success("Este celular ya es el dispositivo principal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo activar la sincronización.");
      bloqueoRef.current = false;
      await proteccion.revisarDespuesDeError();
    } finally {
      setGuardando(false);
    }
  }

  async function copiarCodigo() {
    if (!codigoRecuperacion) return;
    try {
      await navigator.clipboard.writeText(codigoRecuperacion);
      toast.success("Código de recuperación copiado");
    } catch {
      toast.error("No pudimos copiarlo. Mantené presionado el código para seleccionarlo.");
    }
  }

  if (codigoRecuperacion) {
    return (
      <section className="space-y-5">
        <TaskHeader title="Guardá el código de recuperación" backLabel="Sincronización" onBack={() => navigate("/configuracion/sincronizacion")} />
        <Notice tone="warning">
          Es la única forma de recuperar el control si se pierde el celular principal. No volveremos a mostrar este código.
        </Notice>
        <Panel className="space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Código de recuperación</p>
          <code className="block break-all rounded-2xl bg-black/25 p-4 text-sm leading-6 text-mora-suave select-all">
            {codigoRecuperacion}
          </code>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => void copiarCodigo()}>Copiar</Button>
            <Button variant="secondary" onClick={() => descargarCodigoRecuperacion(codigoRecuperacion)}>Descargar</Button>
          </div>
        </Panel>
        <Button fullWidth size="lg" onClick={() => navigate("/configuracion/sincronizacion", { replace: true })}>
          Ya guardé el código
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <TaskHeader
        title="Configurar el primer celular"
        description="Este dispositivo administrará los demás celulares y autorizará los emparejamientos."
        backLabel="Sincronización"
        onBack={() => navigate("/configuracion/sincronizacion")}
      />

      {error && <Notice tone="danger">{error}</Notice>}

      <form className="space-y-4" onSubmit={(event) => void manejarEnvio(event)}>
        <div className="space-y-2">
          <FieldLabel label="Nombre del negocio" htmlFor="nombre-negocio" />
          <Input id="nombre-negocio" value={nombreNegocio} onChange={(event) => setNombreNegocio(event.target.value)} maxLength={80} required />
        </div>
        <div className="space-y-2">
          <FieldLabel label="Nombre de este celular" description="Por ejemplo: Celular de Yamil." htmlFor="nombre-dispositivo" />
          <Input id="nombre-dispositivo" value={nombreDispositivo} onChange={(event) => setNombreDispositivo(event.target.value)} maxLength={60} autoComplete="off" required />
        </div>
        <div className="space-y-2">
          <FieldLabel label="Código de activación" description="Es el código generado una sola vez desde Supabase." htmlFor="codigo-activacion" />
          <Input id="codigo-activacion" value={codigoActivacion} onChange={(event) => setCodigoActivacion(event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} className="font-mono" required />
        </div>
        <TurnstileAnonimo proteccion={proteccion} />
        <Button type="submit" fullWidth size="lg" disabled={guardando || !proteccion.listo || !nombreNegocio.trim() || !nombreDispositivo.trim() || !codigoActivacion.trim()}>
          {guardando ? <><Spinner size="sm" label="Activando" /> Activando…</> : "Activar sincronización"}
        </Button>
      </form>
    </section>
  );
}
