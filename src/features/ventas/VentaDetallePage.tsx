import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Badge,
  BottomSheet,
  Button,
  DelayedFallback,
  ErrorState,
  Input,
  ListSkeleton,
  Notice,
  Panel,
  Skeleton,
  TaskHeader,
  Textarea,
  useConfirm,
  useToast,
} from "../../components/ui";
import { DESTINOS_TRANSFERENCIA, MEDIOS_DE_PAGO } from "../../constants";
import {
  anularCobroVenta,
  anularVenta,
  obtenerVentaConDetalles,
  registrarCobroVenta,
  type VentaConDetalles,
} from "../../db";
import { obtenerEstadoFiado, type CobroVenta, type DestinoTransferencia, type MedioPago } from "../../domain/ventas";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { formatearFechaSimple, formatearFechaVenta, formatearPesos, obtenerDestinoTransferenciaLabel, obtenerMedioPagoLabel } from "./ventas.ui";

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
  const [sheetCobro, setSheetCobro] = useState(false);
  const [cobroAAnular, setCobroAAnular] = useState<CobroVenta | null>(null);
  const [montoCobro, setMontoCobro] = useState(0);
  const [medioPagoCobro, setMedioPagoCobro] = useState<MedioPago>("efectivo");
  const [destinoCobro, setDestinoCobro] = useState<DestinoTransferencia | undefined>();
  const [motivoCobro, setMotivoCobro] = useState("");
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
  const cobrosActivos = useMemo(() => venta?.cobros.filter((cobro) => cobro.estado === "activo") ?? [], [venta]);
  const esFiada = (venta?.condicionPago ?? "contado") === "fiado";
  const estadoFiado = venta && esFiada ? obtenerEstadoFiado(venta, venta.cobros) : null;

  function abrirNuevoCobro() {
    if (!venta || venta.saldo <= 0) return;
    setCobroAAnular(null);
    setMontoCobro(venta.saldo);
    setMedioPagoCobro("efectivo");
    setDestinoCobro(undefined);
    setMotivoCobro("");
    setSheetCobro(true);
  }

  function abrirAnulacionCobro(cobro: CobroVenta) {
    setCobroAAnular(cobro);
    setMotivoCobro("");
    setSheetCobro(true);
  }

  async function confirmarNuevoCobro() {
    if (!venta || guardando) return;
    const aceptado = await confirm({
      title: "Confirmar cobro",
      description: `${obtenerMedioPagoLabel(medioPagoCobro)} · ${formatearPesos(montoCobro)}. El pago quedará en el historial y reducirá el saldo.`,
      confirmLabel: "Registrar cobro",
    });
    if (!aceptado) return;
    try {
      setGuardando(true);
      await registrarCobroVenta(venta.id, { monto: montoCobro, medioPago: medioPagoCobro, destinoTransferencia: destinoCobro });
      toast.success("Cobro registrado");
      setSheetCobro(false);
      await cargar();
    } catch (errorDesconocido) {
      toast.error("No se pudo registrar el cobro", errorDesconocido instanceof Error ? errorDesconocido.message : undefined);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarAnulacionCobro() {
    if (!cobroAAnular || !motivoCobro.trim() || guardando) {
      if (!motivoCobro.trim()) toast.warning("Indicá por qué anulás el cobro.");
      return;
    }
    const aceptado = await confirm({
      title: "Anular cobro",
      description: `El cobro de ${formatearPesos(cobroAAnular.monto)} seguirá visible y el saldo de la venta volverá a aumentar.`,
      confirmLabel: "Anular cobro",
      tone: "danger",
    });
    if (!aceptado) return;
    try {
      setGuardando(true);
      await anularCobroVenta(cobroAAnular.id, { motivoAnulacion: motivoCobro.trim() });
      toast.success("Cobro anulado");
      setSheetCobro(false);
      await cargar();
    } catch (errorDesconocido) {
      toast.error("No se pudo anular el cobro", errorDesconocido instanceof Error ? errorDesconocido.message : undefined);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarAnulacion() {
    if (!motivo.trim()) {
      toast.warning("Indicá el motivo de anulación.");
      return;
    }
    const confirmado = await confirm({
      title: "Anular venta",
      description: venta && venta.totalCobrado > 0
        ? `Hay ${formatearPesos(venta.totalCobrado)} cobrados. Confirmá que el dinero fue devuelto: la venta y sus cobros dejarán de contar y el stock volverá a sumarse.`
        : "La venta seguirá en el historial y el stock de sus productos volverá a sumarse.",
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
      {cargando && <DelayedFallback><div className="space-y-3"><Skeleton className="h-32" /><ListSkeleton rows={2} /></div></DelayedFallback>}
      {error && <ErrorState message={error} onRetry={() => void cargar()} />}

      {venta && (
        <>
          <Panel className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-sm font-semibold text-white">{formatearFechaVenta(venta.fechaHoraReal)}</p><p className="mt-1 text-xs text-white/50">Jornada {venta.fechaJornada}</p></div>
              {venta.estado === "anulada" ? <Badge tone="danger">Anulada</Badge> : estadoFiado && <Badge tone={estadoFiado === "pagada" ? "success" : estadoFiado === "pendiente" ? "warning" : "danger"}>{estadoFiado === "pagada" ? "Pagada" : estadoFiado === "vencida" ? "Vencida" : estadoFiado === "excedida" ? "Revisar cobros" : "Fiada"}</Badge>}
            </div>

            <div className="rounded-2xl bg-black/15 p-4">
              <p className="text-xs text-white/50">Total</p><p className="mt-1 text-3xl font-bold text-white">{formatearPesos(venta.total)}</p>
              {!esFiada && <p className="mt-2 text-sm text-white/60">{obtenerMedioPagoLabel(cobrosActivos[0]?.medioPago ?? venta.medioPago)}</p>}
            </div>

            <div className="space-y-2">
              {venta.detalles.map((detalle) => <div key={detalle.id} className="flex items-start justify-between gap-3 rounded-2xl bg-black/15 p-3 text-sm"><div><p className="font-medium text-white">{detalle.cantidad} × {detalle.producto?.nombre ?? "Producto eliminado"}</p>{detalle.observaciones && <p className="mt-1 text-xs text-white/50">{detalle.observaciones}</p>}</div><p className="font-semibold text-white">{formatearPesos(detalle.subtotal)}</p></div>)}
            </div>
            {venta.observaciones && <p className="text-sm leading-6 text-white/65">{venta.observaciones}</p>}
            {venta.estado === "anulada" && venta.motivoAnulacion && <Notice tone="danger">Motivo de anulación: {venta.motivoAnulacion}</Notice>}
          </Panel>

          {esFiada && (
            <Panel className="space-y-4">
              <div><p className="text-sm text-white/45">Cliente</p><p className="mt-1 text-lg font-semibold">{venta.clienteFiadoNombre}</p>{venta.clienteFiadoNota && <p className="mt-1 text-sm text-white/55">{venta.clienteFiadoNota}</p>}{venta.vencimientoFiado && <p className="mt-2 text-xs text-white/45">Vencimiento: {formatearFechaSimple(venta.vencimientoFiado)}</p>}</div>
              <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-black/15 p-3"><p className="text-xs text-white/45">Cobrado</p><p className="mt-1 text-lg font-bold">{formatearPesos(venta.totalCobrado)}</p></div><div className="rounded-2xl bg-mora-advertencia/10 p-3"><p className="text-xs text-yellow-100/70">Saldo</p><p className="mt-1 text-lg font-bold text-yellow-100">{formatearPesos(Math.max(0, venta.saldo))}</p></div></div>
              {venta.saldo < 0 && <Notice tone="danger">Hay {formatearPesos(Math.abs(venta.saldo))} cobrados de más. Anulá el cobro incorrecto y registralo nuevamente.</Notice>}
              {venta.estado === "activa" && venta.saldo > 0 && !esConsulta && <Button fullWidth onClick={abrirNuevoCobro}>Registrar pago</Button>}
            </Panel>
          )}

          <Panel className="space-y-3">
            <p className="font-semibold">Cobros</p>
            {venta.cobros.length === 0 && <p className="text-sm text-white/50">Todavía no se recibió dinero por esta venta.</p>}
            {venta.cobros.map((cobro) => (
              <div key={cobro.id} className="rounded-2xl bg-black/15 p-3">
                <div className="flex items-start justify-between gap-3"><div><p className={`font-semibold ${cobro.estado === "anulado" ? "text-white/40 line-through" : "text-white"}`}>{formatearPesos(cobro.monto)}</p><p className="mt-1 text-xs text-white/45">{obtenerMedioPagoLabel(cobro.medioPago)} · {formatearFechaVenta(cobro.fechaHoraReal)}</p>{cobro.medioPago === "transferencia" && cobro.destinoTransferencia && <p className="mt-1 text-xs text-white/35">Recibida en {obtenerDestinoTransferenciaLabel(cobro.destinoTransferencia)}</p>}</div>{cobro.estado === "anulado" ? <Badge tone="danger">Anulado</Badge> : venta.estado === "activa" && !esConsulta && <Button size="sm" variant="ghost" onClick={() => abrirAnulacionCobro(cobro)}>Anular</Button>}</div>
                {cobro.estado === "anulado" && cobro.motivoAnulacion && <p className="mt-2 text-xs text-red-100/70">{cobro.motivoAnulacion}</p>}
              </div>
            ))}
          </Panel>

          {venta.estado === "activa" && !esConsulta && <section className="space-y-3 border-t border-white/10 pt-5">{!mostrarAnulacion ? <Button variant="danger" fullWidth onClick={() => setMostrarAnulacion(true)}>Anular venta</Button> : <><label className="block"><span className="text-sm text-white/70">Motivo de anulación</span><Textarea value={motivo} onChange={(event) => setMotivo(event.target.value)} placeholder="Ejemplo: venta cargada por error" /></label><div className="grid grid-cols-2 gap-3"><Button variant="secondary" onClick={() => { setMostrarAnulacion(false); setMotivo(""); }}>Cancelar</Button><Button variant="danger" disabled={guardando} onClick={() => void confirmarAnulacion()}>{guardando ? "Anulando..." : "Anular"}</Button></div></>}</section>}
        </>
      )}

      <BottomSheet open={sheetCobro} onOpenChange={setSheetCobro} title={cobroAAnular ? "Anular cobro" : "Registrar pago"} description={cobroAAnular ? formatearPesos(cobroAAnular.monto) : venta ? `Saldo ${formatearPesos(Math.max(0, venta.saldo))}` : undefined}>
        {cobroAAnular ? (
          <div className="space-y-4"><Notice tone="warning">El cobro seguirá visible y el saldo pendiente volverá a aumentar.</Notice><label className="block"><span className="text-sm text-white/70">Motivo</span><Textarea value={motivoCobro} onChange={(event) => setMotivoCobro(event.target.value)} placeholder="Ejemplo: importe cargado por error" /></label><Button variant="danger" fullWidth disabled={guardando || !motivoCobro.trim()} onClick={() => void confirmarAnulacionCobro()}>{guardando ? "Anulando…" : "Anular cobro"}</Button></div>
        ) : (
          <div className="space-y-4"><label className="block"><span className="text-sm text-white/70">Importe</span><Input value={montoCobro || ""} inputMode="numeric" onChange={(event) => setMontoCobro(Number(event.target.value))} /></label><div className="flex flex-wrap gap-2">{MEDIOS_DE_PAGO.map((opcion) => <Button key={opcion.value} size="sm" variant={medioPagoCobro === opcion.value ? "primary" : "secondary"} onClick={() => { setMedioPagoCobro(opcion.value); if (opcion.value !== "transferencia") setDestinoCobro(undefined); }}>{opcion.label}</Button>)}</div>{medioPagoCobro === "transferencia" && <div className="space-y-2"><p className="text-sm text-white/70">¿Dónde recibís el dinero?</p><div className="flex flex-wrap gap-2">{DESTINOS_TRANSFERENCIA.map((opcion) => <Button key={opcion.value} size="sm" variant={destinoCobro === opcion.value ? "primary" : "secondary"} onClick={() => setDestinoCobro(opcion.value)}>{opcion.label}</Button>)}</div></div>}<Button fullWidth disabled={guardando || montoCobro <= 0 || Boolean(venta && montoCobro > venta.saldo) || (medioPagoCobro === "transferencia" && !destinoCobro)} onClick={() => void confirmarNuevoCobro()}>{guardando ? "Guardando…" : "Registrar cobro"}</Button></div>
        )}
      </BottomSheet>
    </section>
  );
}
