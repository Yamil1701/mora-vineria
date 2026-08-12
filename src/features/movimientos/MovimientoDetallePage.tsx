import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Badge, Button, DelayedFallback, ErrorState, FieldLabel, ListSkeleton, Notice, Page, Panel, Skeleton, TaskHeader, Textarea, useConfirm, useToast } from "../../components/ui";
import { anularMovimiento, confirmarReposicion, eliminarMovimientoAnulado, obtenerMovimientoConDetalles, type MovimientoConDetalles } from "../../db";
import { puedeEliminarMovimientoAnulado, type TipoMovimiento } from "../../domain/movimientos";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { formatearFechaVenta, formatearPesos, obtenerMedioPagoLabel } from "../ventas/ventas.ui";

const labels: Record<TipoMovimiento, string> = { reposicion: "Reposición", aporte_externo: "Aporte externo", gasto_puntual: "Gasto puntual" };

export function MovimientoDetallePage() {
  const { movimientoId = "" } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const { configuracion } = useConfiguracionLocal();
  const [movimiento, setMovimiento] = useState<MovimientoConDetalles | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [procesando, setProcesando] = useState(false);
  const esConsulta = configuracion?.deviceRole === "consulta";

  const cargar = useCallback(async () => {
    try { setCargando(true); const resultado = await obtenerMovimientoConDetalles(movimientoId); setMovimiento(resultado ?? null); setError(resultado ? null : "No encontramos ese movimiento."); }
    catch { setError("No se pudo cargar el movimiento."); }
    finally { setCargando(false); }
  }, [movimientoId]);
  useEffect(() => void cargar(), [cargar]);

  async function anular() {
    if (!motivo.trim()) { toast.warning("Indicá el motivo de anulación."); return; }
    const confirmado = await confirm({
      title: "Anular movimiento",
      description: movimiento?.estado === "pendiente"
        ? "La reposición pendiente quedará anulada sin modificar stock ni Tesorería."
        : "Quedará en el historial. Si es una reposición confirmada, se revertirán el stock y sus movimientos de Tesorería.",
      confirmLabel: "Anular movimiento",
      tone: "danger",
    });
    if (!confirmado) return;
    try { setProcesando(true); await anularMovimiento(movimientoId, { motivoAnulacion: motivo.trim() }); toast.success("Movimiento anulado"); setAnulando(false); await cargar(); }
    catch (errorDesconocido) { toast.error("No se pudo anular", errorDesconocido instanceof Error ? errorDesconocido.message : undefined); }
    finally { setProcesando(false); }
  }

  async function confirmarRecibido() {
    if (!movimiento || movimiento.tipo !== "reposicion") return;
    const confirmado = await confirm({
      title: "Confirmar mercadería recibida",
      description: `${movimiento.detallesReposicion.length} producto${movimiento.detallesReposicion.length === 1 ? "" : "s"} · ${formatearPesos(movimiento.monto)}. Se actualizarán el stock y la Tesorería.`,
      confirmLabel: "Confirmar recibido",
    });
    if (!confirmado) return;
    try {
      setProcesando(true);
      await confirmarReposicion(movimiento.id);
      toast.success("Reposición confirmada");
      await cargar();
    } catch (errorDesconocido) {
      toast.error("No se pudo confirmar", errorDesconocido instanceof Error ? errorDesconocido.message : undefined);
    } finally {
      setProcesando(false);
    }
  }

  async function eliminar() {
    const confirmado = await confirm({ title: "Eliminar movimiento anulado", description: "Esta acción es definitiva y elimina su trazabilidad.", confirmLabel: "Eliminar definitivamente", tone: "danger" });
    if (!confirmado) return;
    try { setProcesando(true); await eliminarMovimientoAnulado(movimientoId); toast.success("Movimiento eliminado"); navigate("/movimientos", { replace: true }); }
    catch (errorDesconocido) { toast.error("No se pudo eliminar", errorDesconocido instanceof Error ? errorDesconocido.message : undefined); }
    finally { setProcesando(false); }
  }

  return (
    <Page>
      <TaskHeader title="Detalle del movimiento" backLabel="Movimientos" onBack={() => navigate("/movimientos")} />
      {cargando && <DelayedFallback><div className="space-y-3"><Skeleton className="h-28" /><ListSkeleton rows={2} /></div></DelayedFallback>}{error && <ErrorState message={error} onRetry={() => void cargar()} />}
      {movimiento && <>
        <Panel className="space-y-4">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-mora-suave">{labels[movimiento.tipo]}</p><h2 className="mt-1 text-xl font-bold">{movimiento.descripcion}</h2><p className="mt-1 text-xs text-white/50">{formatearFechaVenta(movimiento.fechaHoraReal)}</p></div><div>{movimiento.estado === "pendiente" && <Badge tone="warning">Pendiente</Badge>}{movimiento.estado === "anulado" && <Badge tone="danger">Anulado</Badge>}</div></div>
          {movimiento.estado === "pendiente" && <Notice tone="warning">Todavía no modifica el stock ni el dinero disponible. Revisá lo recibido antes de confirmarla.</Notice>}
          <div className="rounded-2xl bg-black/15 p-4"><p className="text-xs text-white/50">Monto</p><p className="mt-1 text-3xl font-bold">{formatearPesos(movimiento.monto)}</p>{movimiento.medioPago && <p className="mt-2 text-sm text-white/60">{obtenerMedioPagoLabel(movimiento.medioPago)}</p>}</div>
          {movimiento.detallesReposicion.map((detalle) => <div key={detalle.id} className="flex justify-between gap-3 rounded-2xl bg-black/15 p-3 text-sm"><span><span className="block">{detalle.cantidad} × {detalle.producto?.nombre ?? "Producto eliminado"}</span>{detalle.cantidadBultos && detalle.unidadesPorBulto && detalle.costoPorBulto ? <span className="mt-1 block text-xs text-white/45">{detalle.cantidadBultos} {detalle.cantidadBultos === 1 ? "pack" : "packs"} de {detalle.unidadesPorBulto} · {formatearPesos(detalle.costoPorBulto)} cada uno</span> : null}</span><span className="font-semibold">{formatearPesos(detalle.subtotal)}</span></div>)}
          {movimiento.aporteExternoIncluido !== undefined && <p className="text-sm text-white/65">Aporte externo incluido: {formatearPesos(movimiento.aporteExternoIncluido)}</p>}
          {movimiento.observaciones && <p className="text-sm leading-6 text-white/65">{movimiento.observaciones}</p>}
          {movimiento.motivoAnulacion && <Notice tone="danger">Motivo de anulación: {movimiento.motivoAnulacion}</Notice>}
        </Panel>
        {!esConsulta && <section className="space-y-3 border-t border-white/10 pt-5">
          {movimiento.tipo === "reposicion" && movimiento.estado === "pendiente" && !anulando && <><Button fullWidth disabled={procesando} onClick={() => void confirmarRecibido()}>Confirmar recibido</Button><Button variant="secondary" fullWidth disabled={procesando} onClick={() => navigate(`/movimientos/${movimiento.id}/editar`)}>Corregir lo recibido</Button></>}
          {movimiento.estado !== "anulado" && (!anulando ? <Button variant="danger" fullWidth onClick={() => setAnulando(true)}>Anular movimiento</Button> : <><div><FieldLabel label="Motivo de anulación" htmlFor="motivo-anulacion" /><Textarea id="motivo-anulacion" value={motivo} onChange={(event) => setMotivo(event.target.value)} /></div><div className="grid grid-cols-2 gap-3"><Button variant="secondary" onClick={() => setAnulando(false)}>Cancelar</Button><Button variant="danger" disabled={procesando} onClick={() => void anular()}>Anular</Button></div></>)}
          {puedeEliminarMovimientoAnulado(movimiento) && <Button variant="danger" fullWidth disabled={procesando} onClick={() => void eliminar()}>Eliminar definitivamente</Button>}
        </section>}
      </>}
    </Page>
  );
}
