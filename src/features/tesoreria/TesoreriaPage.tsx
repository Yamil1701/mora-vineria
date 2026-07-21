import { useMemo, useState } from "react";

import { Badge, BottomSheet, Button, ButtonLink, DelayedFallback, EmptyState, ErrorState, Icon, Input, ListSkeleton, Notice, Page, PageHeader, Panel, SectionHeader, Select, SummaryCard } from "../../components/ui";
import type { MovimientoTesoreria, TipoMovimientoTesoreria } from "../../domain/tesoreria";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useTesoreria } from "../../hooks/useTesoreria";
import { formatearFechaVenta, formatearPesos } from "../ventas/ventas.ui";

const etiquetas: Record<TipoMovimientoTesoreria, string> = {
  saldo_inicial: "Saldo inicial",
  cobro_venta: "Cobro de venta",
  reposicion: "Reposición",
  gasto_puntual: "Gasto puntual",
  aporte_externo: "Aporte",
  retiro: "Retiro",
  transferencia: "Transferencia interna",
  ajuste_conteo: "Ajuste de caja",
  reversion: "Reversión",
};

function descripcionVisible(movimiento: MovimientoTesoreria): string {
  if (movimiento.tipo === "cobro_venta") return "Cobro de venta";
  return movimiento.descripcion.replace(/Cobro de venta\s+(?:venta-)?[\w-]{8,}/gi, "Cobro de venta");
}

export function TesoreriaPage() {
  const { resumen, cargando, error, recargar } = useTesoreria();
  const { configuracion } = useConfiguracionLocal();
  const [verTodo, setVerTodo] = useState(false);
  const [cuentaFiltro, setCuentaFiltro] = useState("todas");
  const [tipoFiltro, setTipoFiltro] = useState<TipoMovimientoTesoreria | "todos">("todos");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [detalle, setDetalle] = useState<MovimientoTesoreria | null>(null);
  const esConsulta = configuracion?.deviceRole === "consulta";
  const cuentasPorId = useMemo(() => new Map(resumen?.cuentas.map((cuenta) => [cuenta.id, cuenta.nombre]) ?? []), [resumen]);
  const historial = useMemo(() => {
    const movimientos = resumen?.ultimosMovimientos ?? [];
    const filtrados = movimientos.filter((movimiento) =>
      (cuentaFiltro === "todas" || movimiento.cuentaId === cuentaFiltro)
      && (tipoFiltro === "todos" || movimiento.tipo === tipoFiltro)
      && (!fechaFiltro || movimiento.fechaJornada === fechaFiltro));
    return verTodo ? filtrados : filtrados.slice(0, 10);
  }, [cuentaFiltro, fechaFiltro, resumen?.ultimosMovimientos, tipoFiltro, verTodo]);

  return (
    <Page>
      <PageHeader
        title="Tesorería"
        description="Dinero disponible, cuentas y movimientos reales del negocio."
        action={resumen?.configurada && !esConsulta ? <div className="grid grid-cols-[1.5fr_1fr] gap-3"><ButtonLink to="/tesoreria/operacion" size="lg" fullWidth>Registrar</ButtonLink><ButtonLink to="/tesoreria/conteo" size="lg" variant="secondary" fullWidth>Contar caja</ButtonLink></div> : undefined}
      />

      {cargando && <DelayedFallback><ListSkeleton rows={3} /></DelayedFallback>}
      {error && <ErrorState message={error} onRetry={() => void recargar()} />}
      {resumen && !resumen.configurada && <EmptyState title="Prepará el dinero inicial" description="Creá Caja y las demás cuentas indicando cuánto dinero real hay hoy en cada una." action={!esConsulta ? <ButtonLink to="/tesoreria/configurar">Configurar tesorería</ButtonLink> : undefined} />}

      {resumen?.configurada && <>
        <section className="grid grid-cols-3 gap-2" aria-label="Resumen de tesorería">
          <SummaryCard compact label="Disponible" value={formatearPesos(resumen.totalDisponible)} icon={<Icon name="tesoreria" className="h-4 w-4" />} />
          <SummaryCard compact label="Entró hoy" value={formatearPesos(resumen.entradasPeriodo)} icon={<Icon name="entrada" className="h-4 w-4" />} />
          <SummaryCard compact label="Salió hoy" value={formatearPesos(resumen.salidasPeriodo)} icon={<Icon name="salida" className="h-4 w-4" />} />
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3"><SectionHeader title="Cuentas" description="El saldo se calcula desde el historial." />{!esConsulta && <ButtonLink to="/tesoreria/cuentas/nueva" size="sm" variant="ghost">Agregar</ButtonLink>}</div>
          <div className="space-y-2">{resumen.cuentas.map((cuenta) => {
            const bajoObjetivo = cuenta.tipo === "efectivo" && cuenta.fondoCambioObjetivo !== undefined && cuenta.saldo < cuenta.fondoCambioObjetivo;
            return <Panel key={cuenta.id} className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-mora-principal/10 text-mora-suave"><Icon name={cuenta.tipo === "efectivo" ? "efectivo" : "tesoreria"} /></span><span><span className="block font-semibold">{cuenta.nombre}</span><span className="mt-1 block text-xs text-white/45">{cuenta.tipo === "efectivo" ? "Efectivo" : "Cuenta digital"}{cuenta.esPredeterminada ? " · Predeterminada" : ""}</span></span></div><div className="text-right"><p className="font-bold">{formatearPesos(cuenta.saldo)}</p>{bajoObjetivo && <Badge tone="warning">Bajo fondo</Badge>}</div></Panel>;
          })}</div>
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3"><SectionHeader title="Historial" description={verTodo ? "Filtrá operaciones sin salir de Tesorería." : "Últimas 10 operaciones."} />{resumen.ultimosMovimientos.length > 10 && <Button size="sm" variant="ghost" onClick={() => setVerTodo((actual) => !actual)}>{verTodo ? "Ver recientes" : "Ver todo"}</Button>}</div>
          {verTodo && <Panel className="grid gap-3 animate-mora-enter"><label><span className="text-xs text-white/55">Cuenta</span><Select value={cuentaFiltro} onChange={(event) => setCuentaFiltro(event.target.value)}><option value="todas">Todas</option>{resumen.cuentas.map((cuenta) => <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre}</option>)}</Select></label><label><span className="text-xs text-white/55">Tipo</span><Select value={tipoFiltro} onChange={(event) => setTipoFiltro(event.target.value as TipoMovimientoTesoreria | "todos")}><option value="todos">Todos</option>{Object.entries(etiquetas).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label><label><span className="text-xs text-white/55">Fecha</span><Input type="date" value={fechaFiltro} onChange={(event) => setFechaFiltro(event.target.value)} /></label></Panel>}
          {historial.length === 0 && <Notice>No hay operaciones con esos filtros.</Notice>}
          <div className="space-y-2">{historial.map((movimiento) => <button key={movimiento.id} type="button" onClick={() => setDetalle(movimiento)} className="flex min-h-20 w-full items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-left transition active:scale-[.99]"><span className="min-w-0"><span className="block text-xs font-medium text-mora-suave">{etiquetas[movimiento.tipo]}</span><span className="mt-1 block truncate font-semibold">{descripcionVisible(movimiento)}</span><span className="mt-1 block text-xs text-white/45">{cuentasPorId.get(movimiento.cuentaId) ?? "Cuenta archivada"} · {formatearFechaVenta(movimiento.fechaHoraReal)}</span></span><span className={`shrink-0 font-bold ${movimiento.direccion === "entrada" ? "text-green-200" : "text-red-100"}`}>{movimiento.direccion === "entrada" ? "+" : "−"}{formatearPesos(movimiento.monto)}</span></button>)}</div>
        </section>
      </>}

      <BottomSheet open={Boolean(detalle)} onOpenChange={(open) => { if (!open) setDetalle(null); }} title={detalle ? etiquetas[detalle.tipo] : "Detalle"} description={detalle ? formatearFechaVenta(detalle.fechaHoraReal) : undefined}>
        {detalle && <div className="space-y-4"><div className="rounded-3xl bg-black/15 p-4"><p className="text-sm text-white/55">{descripcionVisible(detalle)}</p><p className={`mt-2 text-3xl font-bold ${detalle.direccion === "entrada" ? "text-green-200" : "text-red-100"}`}>{detalle.direccion === "entrada" ? "+" : "−"}{formatearPesos(detalle.monto)}</p></div><dl className="space-y-3 rounded-2xl border border-white/10 p-4 text-sm"><div className="flex justify-between gap-3"><dt className="text-white/50">Cuenta</dt><dd className="text-right font-semibold">{cuentasPorId.get(detalle.cuentaId) ?? "Cuenta archivada"}</dd></div><div className="flex justify-between gap-3"><dt className="text-white/50">Movimiento</dt><dd className="text-right">{detalle.direccion === "entrada" ? "Entrada" : "Salida"}</dd></div>{detalle.registradoPor && <div className="flex justify-between gap-3"><dt className="text-white/50">Registró</dt><dd className="text-right">{detalle.registradoPor}</dd></div>}{detalle.destinatario && <div className="flex justify-between gap-3"><dt className="text-white/50">Destino</dt><dd className="text-right">{detalle.destinatario}</dd></div>}</dl>{detalle.observaciones && <Notice>{detalle.observaciones}</Notice>}<Button fullWidth onClick={() => setDetalle(null)}>Aceptar</Button></div>}
      </BottomSheet>
    </Page>
  );
}
