import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";

import { Badge, Button, Notice, Panel, Spinner, TaskHeader, useToast } from "../../components/ui";
import type { ModoDispositivoRemoto, ResultadoCodigoEmparejamiento } from "../../domain/sincronizacion";
import { crearContenidoQrEmparejamiento } from "../../domain/sincronizacion";
import { generarCodigoEmparejamiento } from "../../sync/dispositivos";

export function GenerarEmparejamientoPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [modo, setModo] = useState<ModoDispositivoRemoto>("operacion");
  const [resultado, setResultado] = useState<ResultadoCodigoEmparejamiento | null>(null);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ahora, setAhora] = useState(0);

  useEffect(() => {
    if (!resultado) return;
    const intervalo = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(intervalo);
  }, [resultado]);

  const segundosRestantes = resultado
    ? Math.max(0, Math.ceil((new Date(resultado.venceAt).getTime() - ahora) / 1000))
    : 0;
  const vencido = Boolean(resultado && segundosRestantes === 0);

  async function generar() {
    setGenerando(true);
    setError(null);
    try {
      setResultado(await generarCodigoEmparejamiento(modo));
      setAhora(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el QR.");
    } finally {
      setGenerando(false);
    }
  }

  async function copiarCodigo() {
    if (!resultado) return;
    try {
      await navigator.clipboard.writeText(resultado.codigo);
      toast.success("Código copiado");
    } catch {
      toast.error("No pudimos copiarlo. Seleccionalo manualmente.");
    }
  }

  return (
    <section className="space-y-5">
      <TaskHeader
        title="Vincular otro celular"
        description="Elegí qué podrá hacer el nuevo dispositivo y mostrá este QR en persona."
        backLabel="Sincronización"
        onBack={() => navigate("/configuracion/sincronizacion")}
      />

      <section className="space-y-3">
        <p className="text-sm font-medium text-white/80">Modo del nuevo celular</p>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => { setModo("operacion"); setResultado(null); }} className={`min-h-20 rounded-3xl border p-3 text-left transition ${modo === "operacion" ? "border-mora-principal bg-mora-principal/15" : "border-white/10 bg-white/[0.04]"}`}>
            <span className="block text-sm font-semibold">Operación</span>
            <span className="mt-1 block text-xs leading-5 text-white/55">Puede vender y cargar datos.</span>
          </button>
          <button type="button" onClick={() => { setModo("consulta"); setResultado(null); }} className={`min-h-20 rounded-3xl border p-3 text-left transition ${modo === "consulta" ? "border-mora-principal bg-mora-principal/15" : "border-white/10 bg-white/[0.04]"}`}>
            <span className="block text-sm font-semibold">Consulta</span>
            <span className="mt-1 block text-xs leading-5 text-white/55">Solo revisa la información.</span>
          </button>
        </div>
      </section>

      {error && <Notice tone="danger">{error}</Notice>}

      {resultado && !vencido ? (
        <Panel className="space-y-4 text-center">
          <div className="flex items-center justify-between gap-3 text-left">
            <Badge tone={resultado.modo === "operacion" ? "success" : "info"}>{resultado.modo === "operacion" ? "Operación" : "Consulta"}</Badge>
            <span className="text-xs text-white/50">Vence en {segundosRestantes}s</span>
          </div>
          <figure aria-label="Código QR de emparejamiento" className="mx-auto w-fit rounded-[2rem] bg-[#fff7fb] p-4">
            <QRCodeSVG
              value={crearContenidoQrEmparejamiento(resultado.codigo)}
              size={224}
              level="M"
              bgColor="#fff7fb"
              fgColor="#28101f"
              marginSize={1}
            />
          </figure>
          <code className="block break-all text-xs leading-5 text-white/55 select-all">{resultado.codigo}</code>
          <Button variant="secondary" fullWidth onClick={() => void copiarCodigo()}>Copiar código manual</Button>
        </Panel>
      ) : (
        <Notice tone={vencido ? "warning" : "neutral"}>
          {vencido ? "El código venció. Generá uno nuevo para continuar." : "El QR durará cinco minutos y podrá usarse una sola vez."}
        </Notice>
      )}

      <Button fullWidth size="lg" onClick={() => void generar()} disabled={generando}>
        {generando ? <><Spinner size="sm" label="Generando" /> Generando…</> : resultado ? "Generar un código nuevo" : "Generar QR"}
      </Button>
    </section>
  );
}
