import { useEffect, useRef, useState } from "react";

import { leerCodigoEmparejamiento } from "../domain/sincronizacion";
import { Button, Notice, Spinner } from "./ui";

type ControlesEscaner = { stop: () => void };

export function EscanerQrEmparejamiento({
  onCodigo,
}: {
  onCodigo: (codigo: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlesRef = useRef<ControlesEscaner | null>(null);
  const [estado, setEstado] = useState<"inactivo" | "abriendo" | "activo" | "error">("inactivo");
  const [mensaje, setMensaje] = useState<string | null>(null);

  function detener() {
    controlesRef.current?.stop();
    controlesRef.current = null;
    setEstado("inactivo");
  }

  useEffect(() => () => controlesRef.current?.stop(), []);

  async function iniciar() {
    if (!navigator.mediaDevices?.getUserMedia || !videoRef.current) {
      setMensaje("Este navegador no permite usar la cámara. Ingresá el código manualmente.");
      setEstado("error");
      return;
    }

    setEstado("abriendo");
    setMensaje(null);
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const lector = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 180 });
      const controles = await lector.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } }, audio: false },
        videoRef.current,
        (resultado) => {
          if (!resultado) return;
          const codigo = leerCodigoEmparejamiento(resultado.getText());
          if (!codigo) {
            setMensaje("Ese QR no pertenece a Mora Vinería.");
            return;
          }
          controlesRef.current?.stop();
          controlesRef.current = null;
          onCodigo(codigo);
        },
      );
      controlesRef.current = controles;
      setEstado("activo");
    } catch {
      setMensaje("No pudimos abrir la cámara. Revisá el permiso o usá el código manual.");
      setEstado("error");
    }
  }

  return (
    <section className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-black/30">
        <video
          ref={videoRef}
          muted
          playsInline
          aria-label="Vista de la cámara para escanear el QR"
          className="h-full w-full object-cover"
        />
        {estado !== "activo" && (
          <div className="absolute inset-0 flex items-center justify-center p-5 text-center text-sm text-white/55">
            {estado === "abriendo" ? <Spinner label="Abriendo cámara" /> : "El QR se escanea únicamente cuando abrís la cámara."}
          </div>
        )}
        {estado === "activo" && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-[14%] rounded-3xl border-2 border-mora-suave/80 shadow-[0_0_0_999px_rgba(0,0,0,.18)]" />
        )}
      </div>

      {mensaje && <Notice tone="warning">{mensaje}</Notice>}

      {estado === "activo" ? (
        <Button variant="secondary" fullWidth onClick={detener}>Cerrar cámara</Button>
      ) : (
        <Button variant="secondary" fullWidth onClick={() => void iniciar()} disabled={estado === "abriendo"}>
          {estado === "abriendo" ? "Abriendo cámara…" : "Escanear QR"}
        </Button>
      )}
    </section>
  );
}
