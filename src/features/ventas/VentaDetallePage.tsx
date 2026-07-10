import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Badge, Button, Notice, Panel, TaskHeader, Textarea, useConfirm, useToast } from "../../components/ui";
import { anularVenta, obtenerVentaConDetalles, type VentaConDetalles } from "../../db";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { formatearFechaVenta, formatearPesos, obtenerMedioPagoLabel } from "./ventas.ui";

export function VentaDetallePage() {
  const { ventaId = "" } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const { configuracion } = useConfiguracionLocal();
  const [venta, setVenta] = useState<VentaConDetalles | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarAnulacion, setMostrarAnulacion] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const esConsulta = configuracion?.deviceRole === "consulta";

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const resultado = await obtenerVentaConDetalles(ventaId);
      setVenta(resultado ?? null);
      setError(resultado ? null : "No encontramos esa venta.");
    } catch {
      setError("No se pudo cargar la venta.");
    } finally {
      setCargando(false);
    }
  }, [ventaId]);

  useEffect(() => void cargar(), [cargar]);

  async function confirmarAnulacion() {
    if (!motivo.trim()) {
      toast.warning("Indicá el motivo de anulación.");
      return;
    }

    const confirmado = await confirm({
      title: "Anular venta",
      description: "La venta seguirá en el historial y el stock de sus productos volverá a sumarse.",
      confirmLabel: "Anular venta",
      tone: "danger",
    });

    if (!confirmado) return;

    try {
      setGuardando(true);
      await anularVenta(ventaId, { motivoAnulacion: motivo.trim() });
      toast.success("Venta anulada", "El stock volvió a sumarse.");
      setMostrarAnulacion(false);
      setMotivo("");
      await cargar();
    } catch (errorDesconocido) {
      toast.error("No se pudo anular la venta", errorDesconocido instanceof Error ? errorDesconocido.message : undefined);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="space-y-5">
      <TaskHeader title="Detalle de venta" backLabel="Ventas" onBack={() => navigate("/ventas")} />

      {cargando && <Notice>Cargando venta...</Notice>}
      {error && <Notice tone="danger">{error}</Notice>}

      {venta && (
        <>
          <Panel className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{formatearFechaVenta(venta.fechaHoraReal)}</p>
                <p className="mt-1 text-xs text-white/50">Jornada {venta.fechaJornada}</p>
              </div>
              {venta.estado === "anulada" && <Badge tone="danger">Anulada</Badge>}
            </div>

            <div className="rounded-2xl bg-black/15 p-4">
              <p className="text-xs text-white/50">Total</p>
              <p className="mt-1 text-3xl font-bold text-white">{formatearPesos(venta.total)}</p>
              <p className="mt-2 text-sm text-white/60">{obtenerMedioPagoLabel(venta.medioPago)}</p>
            </div>

            <div className="space-y-2">
              {venta.detalles.map((detalle) => (
                <div key={detalle.id} className="flex items-start justify-between gap-3 rounded-2xl bg-black/15 p-3 text-sm">
                  <div>
                    <p className="font-medium text-white">{detalle.cantidad} × {detalle.producto?.nombre ?? "Producto eliminado"}</p>
                    {detalle.observaciones && <p className="mt-1 text-xs text-white/50">{detalle.observaciones}</p>}
                  </div>
                  <p className="font-semibold text-white">{formatearPesos(detalle.subtotal)}</p>
                </div>
              ))}
            </div>

            {venta.observaciones && <p className="text-sm leading-6 text-white/65">{venta.observaciones}</p>}
            {venta.estado === "anulada" && venta.motivoAnulacion && (
              <Notice tone="danger">Motivo de anulación: {venta.motivoAnulacion}</Notice>
            )}
          </Panel>

          {venta.estado === "activa" && !esConsulta && (
            <Panel className="space-y-3">
              {!mostrarAnulacion ? (
                <Button variant="danger" fullWidth onClick={() => setMostrarAnulacion(true)}>
                  Anular venta
                </Button>
              ) : (
                <>
                  <label className="block">
                    <span className="text-sm text-white/70">Motivo de anulación</span>
                    <Textarea value={motivo} onChange={(event) => setMotivo(event.target.value)} placeholder="Ejemplo: venta cargada por error" />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" onClick={() => { setMostrarAnulacion(false); setMotivo(""); }}>
                      Cancelar
                    </Button>
                    <Button variant="danger" disabled={guardando} onClick={() => void confirmarAnulacion()}>
                      {guardando ? "Anulando..." : "Anular"}
                    </Button>
                  </div>
                </>
              )}
            </Panel>
          )}
        </>
      )}
    </section>
  );
}
