import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge, Button, DelayedFallback, EmptyState, ErrorState, Icon, Input, Notice, Page, PageHeader, Panel, SectionHeader, Skeleton, SummaryCard } from "../../components/ui";
import { crearClavePlanReposicion, obtenerMensajeMeta, type ItemPlanReposicion } from "../../domain/proyecciones";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useProyeccionMensual } from "../../hooks/useProyeccionMensual";
import { useTesoreria } from "../../hooks/useTesoreria";
import { usePreferenciasUi } from "../../stores/preferenciasUi";
import { formatearPesos } from "../../utils/dinero";
import { guardarPropuestaReposicion } from "./propuestaReposicion";

function Metrica({ label, valor, ayuda }: { label: string; valor: string; ayuda?: string }) {
  return <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-xs text-white/50">{label}</p><p className="mt-2 text-xl font-bold">{valor}</p>{ayuda && <p className="mt-1 text-xs leading-5 text-white/45">{ayuda}</p>}</article>;
}

function ajustarPlanAlPresupuesto(items: ItemPlanReposicion[], presupuesto: number): ItemPlanReposicion[] {
  if (!Number.isFinite(presupuesto)) return items;
  let disponible = Math.max(0, presupuesto);
  const seleccion: ItemPlanReposicion[] = [];

  for (const item of items) {
    if (item.costoEstimado <= disponible) {
      seleccion.push(item);
      disponible -= item.costoEstimado;
      continue;
    }
    const bloque = item.unidadesPorPack ?? 1;
    const costoBloque = bloque * item.costoUnitario;
    const bloquesPosibles = costoBloque > 0 ? Math.floor(disponible / costoBloque) : 0;
    if (bloquesPosibles <= 0) continue;
    const unidadesSugeridas = bloquesPosibles * bloque;
    seleccion.push({
      ...item,
      unidadesSugeridas,
      packsSugeridos: item.unidadesPorPack ? bloquesPosibles : undefined,
      costoEstimado: unidadesSugeridas * item.costoUnitario,
    });
    disponible -= unidadesSugeridas * item.costoUnitario;
  }
  return seleccion;
}

const etiquetaStock = { sin_stock: "Sin stock", critico: "Crítico", bajo: "Bajo" } as const;

export function ProyeccionesPage() {
  const navigate = useNavigate();
  const { configuracion } = useConfiguracionLocal();
  const { resumen: tesoreria } = useTesoreria();
  const { proyeccionActual, cargando, guardandoMeta, error, guardarMeta, recargar } = useProyeccionMensual();
  const resguardoCaja = usePreferenciasUi((estado) => estado.resguardoCajaReposicion);
  const cambiarResguardoCaja = usePreferenciasUi((estado) => estado.cambiarResguardoCajaReposicion);
  const productosNoReponer = usePreferenciasUi((estado) => estado.productosNoReponer);
  const sincronizarPlanReposicion = usePreferenciasUi((estado) => estado.sincronizarPlanReposicion);
  const cambiarProductoNoReponer = usePreferenciasUi((estado) => estado.cambiarProductoNoReponer);
  const [metaVentas, setMetaVentas] = useState("");
  const [mensajeMeta, setMensajeMeta] = useState<string | null>(null);
  const [distribucion, setDistribucion] = useState<Record<string, string>>({});
  const soloConsulta = configuracion?.deviceRole === "consulta";
  const clavePlan = useMemo(
    () => crearClavePlanReposicion(proyeccionActual?.planReposicion ?? []),
    [proyeccionActual?.planReposicion],
  );

  useEffect(() => {
    if (!proyeccionActual) return;
    sincronizarPlanReposicion(clavePlan);
  }, [clavePlan, proyeccionActual, sincronizarPlanReposicion]);

  useEffect(() => {
    if (!proyeccionActual) return;
    setMetaVentas(proyeccionActual.metaMensual?.metaVentas ? String(proyeccionActual.metaMensual.metaVentas) : "");
    setMensajeMeta(obtenerMensajeMeta(proyeccionActual.proyeccion));
  }, [proyeccionActual]);

  const cuentas = useMemo(() => tesoreria?.cuentas ?? [], [tesoreria?.cuentas]);
  const caja = cuentas.find((cuenta) => cuenta.tipo === "efectivo" && cuenta.esPredeterminada)
    ?? cuentas.find((cuenta) => cuenta.tipo === "efectivo");
  const disponibleCaja = Math.max(0, (caja?.saldo ?? 0) - resguardoCaja);
  const presupuestoTotal = tesoreria?.configurada
    ? disponibleCaja + cuentas.filter((cuenta) => cuenta.tipo === "digital").reduce((total, cuenta) => total + Math.max(0, cuenta.saldo), 0)
    : Number.POSITIVE_INFINITY;
  const itemsIncluidos = useMemo(() => (proyeccionActual?.planReposicion ?? []).filter((item) => !productosNoReponer.includes(item.productoId)), [productosNoReponer, proyeccionActual?.planReposicion]);
  const itemsExcluidos = useMemo(() => (proyeccionActual?.planReposicion ?? []).filter((item) => productosNoReponer.includes(item.productoId)), [productosNoReponer, proyeccionActual?.planReposicion]);
  const planCompra = useMemo(() => ajustarPlanAlPresupuesto(itemsIncluidos, presupuestoTotal), [itemsIncluidos, presupuestoTotal]);
  const totalPlan = planCompra.reduce((total, item) => total + item.costoEstimado, 0);
  const costoRecomendadoCompleto = itemsIncluidos.reduce((total, item) => total + item.costoEstimado, 0);

  const distribucionSugerida = useMemo(() => {
    let restante = totalPlan;
    const sugerida: Record<string, string> = {};
    if (caja && restante > 0) {
      const monto = Math.min(restante, disponibleCaja);
      if (monto > 0) sugerida[caja.id] = String(Math.round(monto));
      restante -= monto;
    }
    for (const cuenta of cuentas.filter((item) => item.tipo === "digital")) {
      if (restante <= 0) break;
      const monto = Math.min(restante, Math.max(0, cuenta.saldo));
      if (monto > 0) sugerida[cuenta.id] = String(Math.round(monto));
      restante -= monto;
    }
    return sugerida;
  }, [caja, cuentas, disponibleCaja, totalPlan]);
  const claveDistribucion = JSON.stringify(distribucionSugerida);

  useEffect(() => {
    setDistribucion(JSON.parse(claveDistribucion) as Record<string, string>);
  }, [claveDistribucion]);

  const totalDistribuido = Object.values(distribucion).reduce((total, monto) => total + (Number(monto) || 0), 0);
  const distribucionExcedeSaldo = cuentas.some((cuenta) => {
    const monto = Number(distribucion[cuenta.id]) || 0;
    const disponible = cuenta.id === caja?.id ? disponibleCaja : Math.max(0, cuenta.saldo);
    return monto < 0 || monto > disponible + 0.01;
  });
  const distribucionValida = !tesoreria?.configurada
    || (!distribucionExcedeSaldo && Math.abs(totalDistribuido - totalPlan) < 0.01);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!soloConsulta) await guardarMeta(Number(metaVentas || 0));
  }

  function prepararReposicion() {
    if (!planCompra.length || !distribucionValida) return;
    guardarPropuestaReposicion({
      items: planCompra.map((item) => item.unidadesPorPack && item.packsSugeridos ? {
        productoId: item.productoId,
        modoCarga: "bultos",
        cantidad: item.unidadesSugeridas,
        costoUnitario: item.costoUnitario,
        cantidadBultos: item.packsSugeridos,
        unidadesPorBulto: item.unidadesPorPack,
        costoPorBulto: item.unidadesPorPack * item.costoUnitario,
      } : {
        productoId: item.productoId,
        modoCarga: "unidades",
        cantidad: item.unidadesSugeridas,
        costoUnitario: item.costoUnitario,
      }),
      pagos: tesoreria?.configurada ? Object.entries(distribucion)
        .filter(([, monto]) => Number(monto) > 0)
        .map(([cuentaTesoreriaId, monto]) => ({ cuentaTesoreriaId, monto: Number(monto) })) : [],
      creadaAt: new Date().toISOString(),
    });
    navigate("/movimientos/nuevo?tipo=reposicion&desde=proyeccion");
  }

  const proyeccion = proyeccionActual?.proyeccion;
  const confianza = proyeccion?.confianza ?? "baja";

  return <Page>
    <PageHeader title="Proyecciones" description="Ritmo del mes, meta y una propuesta práctica de reposición." />
    {cargando && <DelayedFallback><div className="grid grid-cols-2 gap-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div></DelayedFallback>}
    {error && <ErrorState message={error} onRetry={() => void recargar()} />}
    {proyeccionActual && proyeccion && <>
      <Notice tone={confianza === "baja" ? "warning" : "neutral"}><div className="flex items-start gap-3"><Icon name="tendencia" className="mt-0.5 h-5 w-5 shrink-0" /><p>Orientación con {proyeccion.diasHistorial ?? 0} jornadas completas y confianza {confianza}. El cierre se muestra como rango porque todavía puede cambiar.</p></div></Notice>

      <Panel className="space-y-4">
        <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Meta mensual</h2><p className="mt-1 text-sm text-white/55">Avance real y ritmo necesario.</p></div>{proyeccion.metaVentas && <Badge tone={proyeccion.estadoRitmoMeta === "por_debajo" ? "warning" : "success"}>{Math.round(proyeccion.porcentajeMetaActual ?? 0)}%</Badge>}</div>
        <form className="space-y-3" onSubmit={(event) => void guardar(event)}><label className="block"><span className="text-sm text-white/70">Meta de ventas</span><Input type="number" min="0" step="1" value={metaVentas} onChange={(event) => setMetaVentas(event.target.value)} disabled={soloConsulta || guardandoMeta} placeholder="Ej: 1500000" /></label><Button type="submit" fullWidth variant="secondary" disabled={soloConsulta || guardandoMeta}>{guardandoMeta ? "Guardando…" : "Guardar meta"}</Button></form>
        {proyeccion.metaVentas && <><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-mora-principal transition-all" style={{ width: `${Math.min(100, Math.max(0, proyeccion.porcentajeMetaActual ?? 0))}%` }} /></div><div className="grid grid-cols-2 gap-3"><Metrica label="Vendido" valor={formatearPesos(proyeccion.ventasAcumuladas)} ayuda={`de ${formatearPesos(proyeccion.metaVentas)}`} /><Metrica label="Falta por día" valor={formatearPesos(proyeccion.ritmoNecesarioMeta ?? 0)} ayuda={`Ritmo reciente ${formatearPesos(proyeccion.ritmoActualMeta ?? 0)}`} /></div></>}
        {mensajeMeta && <Notice>{mensajeMeta}</Notice>}
      </Panel>

      <section className="space-y-3">
        <SectionHeader title="Cierre mensual orientativo" description="Tres escenarios sobre el mismo ritmo observado." />
        <SummaryCard label="Escenario probable" value={formatearPesos(proyeccion.escenarioProbable ?? proyeccion.proyeccionVentasMes)} detail="Pondera días de la semana, ritmo reciente y precios actuales." icon={<Icon name="tendencia" />} />
        <div className="grid grid-cols-2 gap-3"><Metrica label="Conservador" valor={formatearPesos(proyeccion.escenarioConservador ?? 0)} /><Metrica label="Favorable" valor={formatearPesos(proyeccion.escenarioFavorable ?? 0)} /></div>
        <details className="rounded-2xl border border-white/10 bg-white/[0.035] p-3"><summary className="min-h-12 cursor-pointer py-3 text-sm font-semibold text-mora-suave">Datos usados</summary><dl className="grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-sm"><div><dt className="text-white/45">Promedio histórico</dt><dd className="mt-1 font-semibold">{formatearPesos(proyeccion.promedioDiarioVentas)}</dd></div><div><dt className="text-white/45">Últimos 14 días</dt><dd className="mt-1 font-semibold">{formatearPesos(proyeccion.promedioDiarioReciente ?? 0)}</dd></div><div><dt className="text-white/45">Cambio reciente</dt><dd className="mt-1 font-semibold">{(proyeccion.variacionRitmoReciente ?? 0) >= 0 ? "+" : ""}{Math.round(proyeccion.variacionRitmoReciente ?? 0)}%</dd></div><div><dt className="text-white/45">Jornadas completas</dt><dd className="mt-1 font-semibold">{proyeccion.diasHistorial ?? 0}</dd></div></dl>{proyeccionActual.productosSinStockConDemanda > 0 && <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-5 text-yellow-100/75">Hay {proyeccionActual.productosSinStockConDemanda} producto{proyeccionActual.productosSinStockConDemanda === 1 ? "" : "s"} sin stock que tenía{proyeccionActual.productosSinStockConDemanda === 1 ? "" : "n"} salida reciente. La app lo señala, pero no inventa ventas perdidas.</p>}</details>
      </section>

      <section className="space-y-3">
        <SectionHeader title="Propuesta de reposición" description="Solo stock bajo o crítico, hasta el 90% del objetivo y redondeado a packs conocidos." />
        {proyeccionActual.planReposicion.length === 0 ? <EmptyState title="No hay productos para reponer ahora." description="El stock bajo o crítico aparecerá acá." /> : <>
          <details className="rounded-2xl border border-white/10 bg-white/[0.035] p-3"><summary className="min-h-12 cursor-pointer py-3 text-sm font-semibold text-mora-suave">Resguardo de Caja</summary><label className="block border-t border-white/10 pt-3"><span className="text-sm text-white/65">Dejar disponible en el negocio</span><Input className="mt-2" inputMode="numeric" value={resguardoCaja} onChange={(event) => cambiarResguardoCaja(Number(event.target.value))} disabled={soloConsulta} /></label><p className="mt-2 text-xs text-white/45">Caja utilizable: {formatearPesos(disponibleCaja)}{caja ? ` de ${formatearPesos(caja.saldo)}` : ""}.</p></details>

          <div className="space-y-2">{itemsIncluidos.map((item) => <Panel key={item.productoId} className="space-y-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{item.nombre}</p><p className="mt-1 text-xs text-white/45">{item.stockActual} de {item.stockObjetivo} · meta {item.stockMeta}</p></div><Badge tone={item.estadoStock === "bajo" ? "warning" : "danger"}>{etiquetaStock[item.estadoStock]}</Badge></div><div className="flex items-end justify-between gap-3"><div><p className="text-sm">{item.packsSugeridos ? `${item.packsSugeridos} pack${item.packsSugeridos === 1 ? "" : "s"} de ${item.unidadesPorPack}` : `${item.unidadesSugeridas} unidades`}</p><p className="mt-1 text-xs text-white/45">{item.velocidadVentaDiaria > 0 ? `${item.velocidadVentaDiaria.toFixed(1)} u. por día` : "Sin salida reciente suficiente"}</p></div><p className="font-bold">{formatearPesos(item.costoEstimado)}</p></div><Button size="sm" variant="ghost" disabled={soloConsulta} onClick={() => cambiarProductoNoReponer(item.productoId, true)}>No reponer por ahora</Button></Panel>)}</div>

          {itemsExcluidos.length > 0 && <details className="rounded-2xl border border-white/10 p-3"><summary className="min-h-12 cursor-pointer py-3 text-sm text-white/60">No reponer por ahora ({itemsExcluidos.length})</summary><div className="space-y-2 border-t border-white/10 pt-3">{itemsExcluidos.map((item) => <div key={item.productoId} className="flex items-center justify-between gap-3"><span className="text-sm">{item.nombre}</span><Button size="sm" variant="ghost" onClick={() => cambiarProductoNoReponer(item.productoId, false)}>Volver a incluir</Button></div>)}</div></details>}

          {costoRecomendadoCompleto > totalPlan && <Notice tone="warning">El dinero disponible no alcanza para llevar todo al 90%. La propuesta prioriza primero stock sin unidades, crítico y productos con mayor salida.</Notice>}

          {planCompra.length > 0 && <Panel className="space-y-4 border-mora-principal/25"><div className="flex items-end justify-between gap-3"><div><p className="text-sm text-white/50">Compra propuesta</p><p className="mt-1 text-2xl font-bold">{formatearPesos(totalPlan)}</p></div><p className="text-right text-xs text-white/45">{planCompra.length} producto{planCompra.length === 1 ? "" : "s"}</p></div>{tesoreria?.configurada && <div className="space-y-3 border-t border-white/10 pt-4"><p className="text-sm font-semibold">Distribución entre cuentas</p>{cuentas.map((cuenta) => <label key={cuenta.id} className="grid grid-cols-[1fr_8rem] items-center gap-3"><span className="text-sm"><span className="block">{cuenta.nombre}</span><span className="mt-1 block text-xs text-white/40">{cuenta.tipo === "efectivo" && cuenta.id === caja?.id ? `usable ${formatearPesos(disponibleCaja)}` : `saldo ${formatearPesos(cuenta.saldo)}`}</span></span><Input inputMode="numeric" value={distribucion[cuenta.id] ?? ""} placeholder="0" onChange={(event) => setDistribucion((actual) => ({ ...actual, [cuenta.id]: event.target.value }))} /></label>)}<div className="flex justify-between border-t border-white/10 pt-3 text-sm"><span className="text-white/55">Distribuido</span><strong className={distribucionValida ? "text-green-100" : "text-yellow-100"}>{formatearPesos(totalDistribuido)} de {formatearPesos(totalPlan)}</strong></div>{distribucionExcedeSaldo && <p className="text-xs leading-5 text-yellow-100">Una cuenta supera su saldo utilizable. Ajustá la distribución para conservar el resguardo de Caja.</p>}</div>}<Button size="lg" fullWidth disabled={soloConsulta || !distribucionValida} onClick={prepararReposicion}>Revisar como reposición</Button></Panel>}
        </>}
      </section>
    </>}
  </Page>;
}
