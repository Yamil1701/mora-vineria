import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { EscanerQrEmparejamiento } from "../../components/EscanerQrEmparejamiento";
import {
  Button,
  FieldLabel,
  Input,
  Notice,
  Spinner,
  TaskHeader,
  useToast,
} from "../../components/ui";
import { leerCodigoEmparejamiento } from "../../domain/sincronizacion";
import { emparejarYVincularDispositivo } from "../../sync/vinculacion";

export function VincularDispositivoPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const bloqueoRef = useRef(false);
  const [codigo, setCodigo] = useState("");
  const [nombreDispositivo, setNombreDispositivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarEnvio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (bloqueoRef.current) return;
    const codigoValido = leerCodigoEmparejamiento(codigo);
    if (!codigoValido) {
      setError("Escaneá un QR válido o revisá el código ingresado.");
      return;
    }

    bloqueoRef.current = true;
    setGuardando(true);
    setError(null);
    try {
      const vinculo = await emparejarYVincularDispositivo({
        codigo: codigoValido,
        nombreDispositivo: nombreDispositivo.trim(),
      });
      toast.success(vinculo.modo === "consulta" ? "Celular vinculado en modo Consulta" : "Celular vinculado en modo Operación");
      navigate("/configuracion/sincronizacion", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo vincular este celular.");
      bloqueoRef.current = false;
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="space-y-5">
      <TaskHeader
        title="Vincular este celular"
        description="Escaneá el QR que muestra el dispositivo principal. También podés ingresar el código manualmente."
        backLabel="Sincronización"
        onBack={() => navigate("/configuracion/sincronizacion")}
      />

      <EscanerQrEmparejamiento onCodigo={(valor) => { setCodigo(valor); setError(null); }} />

      {error && <Notice tone="danger">{error}</Notice>}

      <form className="space-y-4" onSubmit={(event) => void manejarEnvio(event)}>
        <div className="space-y-2">
          <FieldLabel label="Código de emparejamiento" htmlFor="codigo-emparejamiento" />
          <Input id="codigo-emparejamiento" value={codigo} onChange={(event) => setCodigo(event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} className="font-mono" required />
        </div>
        <div className="space-y-2">
          <FieldLabel label="Nombre de este celular" description="Este nombre aparecerá en la auditoría." htmlFor="nombre-dispositivo" />
          <Input id="nombre-dispositivo" value={nombreDispositivo} onChange={(event) => setNombreDispositivo(event.target.value)} maxLength={60} autoComplete="off" required />
        </div>
        <Button type="submit" fullWidth size="lg" disabled={guardando || !nombreDispositivo.trim() || !codigo.trim()}>
          {guardando ? <><Spinner size="sm" label="Vinculando" /> Vinculando…</> : "Vincular dispositivo"}
        </Button>
      </form>
    </section>
  );
}
