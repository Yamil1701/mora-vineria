import { useRef, useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useNavigate } from "react-router-dom";

import { EscanerQrEmparejamiento } from "../../components/EscanerQrEmparejamiento";
import { TurnstileAnonimo } from "../../components/TurnstileAnonimo";
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
import { useTurnstileAnonimo } from "../../hooks/useTurnstileAnonimo";
import { emparejarYVincularDispositivo } from "../../sync/vinculacion";

export function VincularDispositivoPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const bloqueoRef = useRef(false);
  const proteccion = useTurnstileAnonimo();
  const [codigo, setCodigo] = useState("");
  const [nombreDispositivo, setNombreDispositivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codigoConfirmado, setCodigoConfirmado] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  function continuarConCodigo(valor: string) {
    const codigoValido = leerCodigoEmparejamiento(valor);
    if (!codigoValido) {
      setError("Escaneá un QR válido o revisá el código ingresado.");
      return;
    }
    setCodigo(codigoValido);
    setCodigoConfirmado(codigoValido);
    setError(null);
    setModalAbierto(true);
  }

  async function manejarEnvio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (bloqueoRef.current) return;
    const codigoValido = codigoConfirmado ?? leerCodigoEmparejamiento(codigo);
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
        captchaToken: proteccion.token ?? undefined,
      });
      toast.success(vinculo.modo === "consulta" ? "Celular vinculado en modo Consulta" : "Celular vinculado en modo Operación");
      setModalAbierto(false);
      navigate("/configuracion/sincronizacion", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo vincular este celular.");
      bloqueoRef.current = false;
      await proteccion.revisarDespuesDeError();
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

      <EscanerQrEmparejamiento onCodigo={continuarConCodigo} />

      {error && <Notice tone="danger">{error}</Notice>}

      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); continuarConCodigo(codigo); }}>
        <div className="space-y-2">
          <FieldLabel label="Código de emparejamiento" htmlFor="codigo-emparejamiento" />
          <Input id="codigo-emparejamiento" value={codigo} onChange={(event) => setCodigo(event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} className="font-mono" required />
        </div>
        <Button type="submit" fullWidth size="lg" disabled={!codigo.trim()}>Continuar</Button>
      </form>

      <Dialog.Root open={modalAbierto} onOpenChange={(abierto) => { if (!guardando) setModalAbierto(abierto); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="mora-dialog-overlay fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm" />
          <Dialog.Content className="mora-dialog-content fixed inset-x-4 top-1/2 z-[71] mx-auto max-h-[calc(100dvh-2rem)] max-w-sm -translate-y-1/2 overflow-y-auto rounded-[2rem] border border-white/10 bg-[#211920] p-5 shadow-2xl focus:outline-none">
            <Dialog.Title className="text-xl font-bold text-white">Nombrá este celular</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-white/60">El nombre aparecerá en celulares autorizados y ayudará a reconocer dónde se cargó cada operación.</Dialog.Description>
            {error && <div className="mt-4"><Notice tone="danger">{error}</Notice></div>}
            <form className="mt-5 space-y-4" onSubmit={(event) => void manejarEnvio(event)}>
              <div className="space-y-2">
                <FieldLabel label="Nombre de este celular" htmlFor="nombre-dispositivo" />
                <Input id="nombre-dispositivo" autoFocus value={nombreDispositivo} onChange={(event) => setNombreDispositivo(event.target.value)} maxLength={60} autoComplete="off" placeholder="Ejemplo: Celular de Yamil" required />
              </div>
              <TurnstileAnonimo proteccion={proteccion} />
              <div className="grid grid-cols-2 gap-3">
                <Dialog.Close asChild><Button type="button" variant="secondary" disabled={guardando}>Cancelar</Button></Dialog.Close>
                <Button type="submit" disabled={guardando || !proteccion.listo || !nombreDispositivo.trim()}>
                  {guardando ? <><Spinner size="sm" label="Vinculando" /> Vinculando…</> : "Vincular"}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
