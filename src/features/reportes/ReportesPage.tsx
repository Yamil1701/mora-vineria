import { lazy, Suspense, type FormEvent, useEffect, useMemo, useState } from "react";

import { Button, ButtonLink, CardList, DelayedFallback, EmptyState, ErrorState, Input, ListSkeleton, Notice, Page, PageHeader, Panel, SectionHeader, Select, Skeleton, SummaryCard } from "../../components/ui";
import { MEDIOS_DE_PAGO } from "../../constants";
import { obtenerResumenPorRango } from "../../db";
import type { RangoFechas, ResumenConRanking, SemanaDelMes } from "../../domain/reportes";
import { useResumenes } from "../../hooks/useResumenes";
import { formatearPesos } from "../../utils/dinero";
import { calcularSemanaDelMes, crearRangoSemanaDelMes, obtenerSemanasDisponibles } from "../../utils/semanaDelMes";

const GraficosReportes = lazy(() => import("./GraficosReportes").then((modulo) => ({ default: modulo.GraficosReportes })));
type Periodo = "hoy" | "semana" | "mes" | "personalizado";
type Perspectiva = "resumen" | "productos" | "cobros";

function ResumenMetricas({ resumen }: { resumen: ResumenConRanking }) {
  return <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <SummaryCard compact label="Total vendido" value={formatearPesos(resumen.totalVendido)} />
      <SummaryCard compact label="Ganancia neta" value={formatearPesos(resumen.gananciaNetaEstimada)} />
      <SummaryCard compact label="Ventas" value={String(resumen.cantidadVentas)} />
      <SummaryCard compact label="Movimientos" value={String(resumen.cantidadMovimientos)} />
    </div>
    <details className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <summary className="min-h-12 cursor-pointer py-3 text-sm font-semibold text-mora-suave">Ver desglose estimado</summary>
      <dl className="grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-sm">
        <div><dt className="text-white/45">Costo vendido</dt><dd className="mt-1 font-semibold">{formatearPesos(resumen.costoEstimadoVendido)}</dd></div>
        <div><dt className="text-white/45">Ganancia bruta</dt><dd className="mt-1 font-semibold">{formatearPesos(resumen.gananciaBrutaEstimada)}</dd></div>
        <div><dt className="text-white/45">Reinversión</dt><dd className="mt-1 font-semibold">{formatearPesos(resumen.reinversion)}</dd></div>
        <div><dt className="text-white/45">Gastos</dt><dd className="mt-1 font-semibold">{formatearPesos(resumen.gastosPuntuales)}</dd></div>
        <div><dt className="text-white/45">Aportes</dt><dd className="mt-1 font-semibold">{formatearPesos(resumen.aportesExternos)}</dd></div>
      </dl>
    </details>
  </div>;
}

function Productos({ resumen }: { resumen: ResumenConRanking }) {
  return <div className="space-y-3"><Panel className="space-y-3"><SectionHeader title="Productos más vendidos" />{resumen.productosMasVendidos.length === 0 ? <EmptyState title="No hay productos vendidos en este período." /> : <CardList>{resumen.productosMasVendidos.slice(0, 8).map((producto) => <div key={producto.productoId} className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-black/15 px-3 py-2 text-sm"><span>{producto.nombre}</span><span className="text-right font-semibold">{producto.cantidad} u. · {formatearPesos(producto.totalVendido)}</span></div>)}</CardList>}</Panel><Suspense fallback={<DelayedFallback><Skeleton className="h-64" /></DelayedFallback>}><GraficosReportes resumen={resumen} tipo="productos" /></Suspense></div>;
}

function Cobros({ resumen }: { resumen: ResumenConRanking }) {
  return <div className="space-y-3"><Panel className="space-y-3"><SectionHeader title="Medios de pago" />{resumen.mediosPagoMasUsados.length === 0 ? <EmptyState title="No hay cobros en este período." /> : <CardList>{resumen.mediosPagoMasUsados.map((medio) => <div key={medio.medioPago} className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-black/15 px-3 py-2 text-sm"><span>{MEDIOS_DE_PAGO.find((opcion) => opcion.value === medio.medioPago)?.label ?? "Otro"}</span><span className="text-right font-semibold">{medio.cantidadVentas} · {formatearPesos(medio.totalVendido)}</span></div>)}</CardList>}</Panel><Suspense fallback={<DelayedFallback><Skeleton className="h-64" /></DelayedFallback>}><GraficosReportes resumen={resumen} tipo="medios" /></Suspense></div>;
}

export function ReportesPage() {
  const { resumenes, cargando, error, recargar } = useResumenes();
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [perspectiva, setPerspectiva] = useState<Perspectiva>("resumen");
  const [resultadoConsultado, setResultadoConsultado] = useState<ResumenConRanking | null>(null);
  const [consultando, setConsultando] = useState(false);
  const [errorConsulta, setErrorConsulta] = useState<string | null>(null);
  const fechaJornada = resumenes?.fechaJornadaActual ?? "";
  const mesActual = fechaJornada.slice(0, 7);
  const semanaActual = fechaJornada ? calcularSemanaDelMes(new Date(`${fechaJornada}T12:00:00`)) : 1;
  const [mesSemana, setMesSemana] = useState("");
  const [semana, setSemana] = useState<SemanaDelMes>(1);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const mesElegido = mesSemana || mesActual;
  const semanaElegida = mesSemana ? semana : semanaActual;
  const disponibles = mesElegido ? obtenerSemanasDisponibles(mesElegido, fechaJornada) : [];
  const rangoSemana = disponibles.includes(semanaElegida) ? crearRangoSemanaDelMes(mesElegido, semanaElegida) : null;

  const resultado = useMemo(() => {
    if (!resumenes) return null;
    if (periodo === "hoy") return resumenes.hoy;
    if (periodo === "mes") return resumenes.mes;
    return resultadoConsultado;
  }, [periodo, resultadoConsultado, resumenes]);
  const rango = periodo === "hoy" ? resumenes?.rangoHoy : periodo === "mes" ? resumenes?.rangoMes : periodo === "semana" ? rangoSemana : desde && hasta ? { desde, hasta } : null;

  useEffect(() => {
    if (!mesActual || mesSemana) return;
    setMesSemana(mesActual);
    setSemana(semanaActual);
  }, [mesActual, mesSemana, semanaActual]);

  function cambiarPeriodo(nuevo: Periodo) { setPeriodo(nuevo); setResultadoConsultado(null); setErrorConsulta(null); setPerspectiva("resumen"); }
  async function consultar(event?: FormEvent) {
    event?.preventDefault();
    const rangoConsulta: RangoFechas | null = periodo === "semana" ? rangoSemana : desde && hasta ? { desde, hasta } : null;
    if (!rangoConsulta) return;
    try { setConsultando(true); setErrorConsulta(null); setResultadoConsultado(await obtenerResumenPorRango(rangoConsulta)); }
    catch (errorDesconocido) { setErrorConsulta(errorDesconocido instanceof Error ? errorDesconocido.message : "No se pudo consultar el período."); }
    finally { setConsultando(false); }
  }

  return <Page>
    <PageHeader title="Reportes" description="Elegí un período y después la información que querés entender." action={<div className="grid grid-cols-2 gap-3"><ButtonLink variant="secondary" to="/reportes/pdf-mensual">PDF mensual</ButtonLink><ButtonLink variant="secondary" to="/proyecciones">Proyecciones</ButtonLink></div>} />
    {cargando && <DelayedFallback><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div><ListSkeleton rows={2} /></div></DelayedFallback>}{error && <ErrorState message={error} onRetry={() => void recargar()} />}
    {resumenes && <>
      <section className="grid grid-cols-2 gap-2" aria-label="Período del reporte">{(["hoy", "semana", "mes", "personalizado"] as Periodo[]).map((opcion) => <Button key={opcion} variant={periodo === opcion ? "primary" : "secondary"} aria-pressed={periodo === opcion} onClick={() => cambiarPeriodo(opcion)}>{opcion === "hoy" ? "Hoy" : opcion === "semana" ? "Semana" : opcion === "mes" ? "Mes" : "Otro rango"}</Button>)}</section>

      {(periodo === "semana" || periodo === "personalizado") && <Panel className="animate-mora-enter"><form onSubmit={(event) => void consultar(event)} className="space-y-3">
        {periodo === "semana" ? <div className="grid grid-cols-2 gap-3"><label><span className="text-sm text-white/70">Mes</span><Input type="month" max={mesActual} value={mesElegido} onChange={(event) => { const nuevoMes = event.target.value; setMesSemana(nuevoMes); const nuevas = obtenerSemanasDisponibles(nuevoMes, fechaJornada); setSemana(nuevas.at(-1) ?? 1); setResultadoConsultado(null); }} /></label><label><span className="text-sm text-white/70">Semana</span><Select value={semanaElegida} onChange={(event) => { setSemana(Number(event.target.value) as SemanaDelMes); setResultadoConsultado(null); }}>{([1,2,3,4] as SemanaDelMes[]).map((numero) => <option key={numero} value={numero} disabled={!disponibles.includes(numero)}>Semana {numero}{mesElegido === mesActual && numero === semanaActual ? " (en curso)" : disponibles.includes(numero) ? "" : " (no comenzó)"}</option>)}</Select></label></div> : <div className="grid grid-cols-2 gap-3"><label><span className="text-sm text-white/70">Desde</span><Input type="date" value={desde} onChange={(event) => { setDesde(event.target.value); setResultadoConsultado(null); }} /></label><label><span className="text-sm text-white/70">Hasta</span><Input type="date" value={hasta} onChange={(event) => { setHasta(event.target.value); setResultadoConsultado(null); }} /></label></div>}
        {rango && <p className="text-sm text-white/55">Período: {rango.desde === rango.hasta ? rango.desde : `${rango.desde} al ${rango.hasta}`}</p>}
        <Button type="submit" fullWidth disabled={consultando || !rango}>{consultando ? "Consultando..." : "Consultar período"}</Button>
      </form></Panel>}
      {errorConsulta && <ErrorState message={errorConsulta} onRetry={() => void consultar()} />}

      {resultado && <section className="space-y-4 animate-mora-enter">
        <div><h2 className="text-lg font-semibold">Resultado</h2>{rango && <p className="mt-1 text-xs text-white/45">{rango.desde === rango.hasta ? rango.desde : `${rango.desde} al ${rango.hasta}`}</p>}</div>
        <div className="grid grid-cols-3 gap-2" aria-label="Contenido del reporte"><Button size="sm" variant={perspectiva === "resumen" ? "primary" : "secondary"} onClick={() => setPerspectiva("resumen")}>Resumen</Button><Button size="sm" variant={perspectiva === "productos" ? "primary" : "secondary"} onClick={() => setPerspectiva("productos")}>Productos</Button><Button size="sm" variant={perspectiva === "cobros" ? "primary" : "secondary"} onClick={() => setPerspectiva("cobros")}>Cobros</Button></div>
        {perspectiva === "resumen" ? <ResumenMetricas resumen={resultado} /> : perspectiva === "productos" ? <Productos resumen={resultado} /> : <Cobros resumen={resultado} />}
      </section>}
      <Notice>Las ganancias son estimadas según los costos cargados. Reinversión y aportes se informan por separado.</Notice>
    </>}
  </Page>;
}
