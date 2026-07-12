import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Button, FieldLabel, Input, Notice, Panel, Spinner, TaskHeader, useToast } from "../../components/ui";
import { recuperarYVincularPrincipal } from "../../sync/vinculacion";
import { descargarCodigoRecuperacion } from "../../utils/codigoRecuperacion";

export function RecuperarPrincipalPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const bloqueoRef = useRef(false);
  const [codigo, setCodigo] = useState("");
  const [nombreDispositivo, setNombreDispositivo] = useState("");
  const [codigoNuevo, setCodigoNuevo] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarEnvio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (bloqueoRef.current) return;
    bloqueoRef.current = true;
    setGuardando(true);
    setError(null);
    try {
      const resultado = await recuperarYVincularPrincipal({
        codigoRecuperacion: codigo.trim(),
        nombreDispositivo: nombreDispositivo.trim(),
      });
      setCodigoNuevo(resultado.codigoRecuperacion);
      toast.success("Control principal recuperado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo recuperar el dispositivo principal.");
      bloqueoRef.current = false;
    } finally {
      setGuardando(false);
    }
  }

  async function copiarCodigo() {
    if (!codigoNuevo) return;
    try {
      await navigator.clipboard.writeText(codigoNuevo);
      toast.success("Nuevo código copiado");
    } catch {
      toast.error("No pudimos copiarlo. Seleccionalo manualmente.");
    }
  }

  if (codigoNuevo) {
    return (
      <section className="space-y-5">
        <TaskHeader title="Guardá el nuevo código" backLabel="Sincronización" onBack={() => navigate("/configuracion/sincronizacion")} />
        <Notice tone="warning">El código anterior dejó de funcionar. Guardá este nuevo código fuera del celular.</Notice>
        <Panel className="space-y-4 text-center">
          <code className="block break-all rounded-2xl bg-black/25 p-4 text-sm leading-6 text-mora-suave select-all">{codigoNuevo}</code>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => void copiarCodigo()}>Copiar</Button>
            <Button variant="secondary" onClick={() => descargarCodigoRecuperacion(codigoNuevo)}>Descargar</Button>
          </div>
        </Panel>
        <Button fullWidth size="lg" onClick={() => navigate("/configuracion/sincronizacion", { replace: true })}>Ya guardé el código</Button>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <TaskHeader
        title="Recuperar celular principal"
        description="El principal anterior quedará revocado y este celular tomará el control."
        backLabel="Sincronización"
        onBack={() => navigate("/configuracion/sincronizacion")}
      />
      <Notice tone="warning">Usá esta opción solo si perdiste el acceso al dispositivo principal actual.</Notice>
      {error && <Notice tone="danger">{error}</Notice>}
      <form className="space-y-4" onSubmit={(event) => void manejarEnvio(event)}>
        <div className="space-y-2">
          <FieldLabel label="Código de recuperación" htmlFor="codigo-recuperacion" />
          <Input id="codigo-recuperacion" value={codigo} onChange={(event) => setCodigo(event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} className="font-mono" required />
        </div>
        <div className="space-y-2">
          <FieldLabel label="Nombre de este celular" htmlFor="nombre-dispositivo" />
          <Input id="nombre-dispositivo" value={nombreDispositivo} onChange={(event) => setNombreDispositivo(event.target.value)} maxLength={60} required />
        </div>
        <Button type="submit" variant="warning" fullWidth size="lg" disabled={guardando || !codigo.trim() || !nombreDispositivo.trim()}>
          {guardando ? <><Spinner size="sm" label="Recuperando" /> Recuperando…</> : "Recuperar como principal"}
        </Button>
      </form>
    </section>
  );
}
