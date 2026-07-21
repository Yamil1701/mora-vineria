import { lazy, Suspense, type FormEvent, useEffect, useMemo, useState } from "react";

import {
  BottomSheet,
  Button,
  ButtonLink,
  CardList,
  DelayedFallback,
  EmptyState,
  ErrorState,
  Icon,
  Input,
  ListSkeleton,
  Page,
  PageHeader,
  Panel,
  SectionHeader,
  Select,
  Skeleton,
  SummaryCard,
} from "../../components/ui";
import { MEDIOS_DE_PAGO } from "../../constants";
import { obtenerResumenPorRango } from "../../db";
import type { RangoFechas, ResumenConRanking, SemanaDelMes } from "../../domain/reportes";
import { useResumenes } from "../../hooks/useResumenes";
import { formatearPesos } from "../../utils/dinero";
import { calcularSemanaDelMes, crearRangoSemanaDelMes, obtenerSemanasDisponibles } from "../../utils/semanaDelMes";

const GraficosReportes = lazy(() => import("./GraficosReportes").then((modulo) => ({ default: modulo.GraficosReportes })));
const colores = ["#D7268F", "#28D970", "#3BA7FF", "#F5B82E", "#9B7BFF", "#F27D52"];
type Periodo = "hoy" | "semana" | "mes" | "personalizado";
type PeriodoRapido = Exclude<Periodo, "personalizado">;
type Perspectiva = "resumen" | "productos" | "cobros";
type SelectorEspecial = "semana" | "personalizado";

function textoRango(rango: RangoFechas): string {
  return rango.desde === rango.hasta ? rango.desde : `${rango.desde} al ${rango.hasta}`;
}

function ResumenMetricas({ resumen }: { resumen: ResumenConRanking }) {
  return <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <SummaryCard compact label="Total vendido" value={formatearPesos(resumen.totalVendido)} icon={<Icon name="ventas" className="h-4 w-4" />} />
      <SummaryCard compact label="Ganancia neta" value={formatearPesos(resumen.gananciaNetaEstimada)} icon={<Icon name="tendencia" className="h-4 w-4" />} />
      <SummaryCard compact label="Ventas" value={String(resumen.cantidadVentas)} icon={<Icon name="reportes" className="h-4 w-4" />} />
      <SummaryCard compact label="Movimientos" value={String(resumen.cantidadMovimientos)} icon={<Icon name="movimientos" className="h-4 w-4" />} />
    </div>
    <details className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <summary className="min-h-12 cursor-pointer py-3 text-sm font-semibold text-mora-suave">Ver desglose estimado</summary>
      <dl className="grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-sm">
        <div><dt className="text-white/45">Costo vendido</dt><dd className="mt-1 font-semibold">{formatearPesos(resumen.costoEstimadoVendido)}</dd></div>
        <div><dt className="text-white/45">Ganancia bruta</dt><dd className="mt-1 font-semibold">{formatearPesos(resumen.gananciaBrutaEstimada)}</dd></div>
        <div><dt className="text-white/45">Reinversión</dt><dd className="mt-1 font-semibold">{formatearPesos(resumen.reinversion)}</dd></div>
        <div><dt className="text-white/45">Gastos</dt><dd className="mt-1 font-semibold">{formatearPesos(resumen.gastosPuntuales)}</dd></div>
        <div><dt className="text-white/45">Aportes</dt><dd className="mt-1 font-semibold">{formatearPesos(resumen.aportesExternos)}</dd></div>
        <div><dt className="text-white/45">Vendido fiado</dt><dd className="mt-1 font-semibold">{formatearPesos(resumen.vendidoFiado)}</dd></div>
        <div><dt className="text-white/45">Saldo pendiente</dt><dd className="mt-1 font-semibold">{formatearPesos(resumen.saldoPendiente)}</dd></div>
      </dl>
    </details>
  </div>;
}

function Productos({ resumen }: { resumen: ResumenConRanking }) {
  return <div className="space-y-3">
    <Panel className="space-y-3">
      <SectionHeader title="Productos más vendidos" />
      {resumen.productosMasVendidos.length === 0
        ? <EmptyState title="No hay productos vendidos en este período." />
        : <CardList>{resumen.productosMasVendidos.slice(0, 8).map((producto, index) => <div key={producto.productoId} className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-black/15 px-3 py-2 text-sm"><span className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colores[index % colores.length] }} /><span className="truncate">{producto.nombre}</span></span><span className="shrink-0 text-right font-semibold">{producto.cantidad} u. · {formatearPesos(producto.totalVendido)}</span></div>)}</CardList>}
    </Panel>
    <Suspense fallback={<DelayedFallback><Skeleton className="h-64" /></DelayedFallback>}><GraficosReportes resumen={resumen} tipo="productos" /></Suspense>
  </div>;
}

function Cobros({ resumen }: { resumen: ResumenConRanking }) {
  return <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <SummaryCard compact label="Cobrado" value={formatearPesos(resumen.totalCobrado)} icon={<Icon name="entrada" className="h-4 w-4" />} />
      <SummaryCard compact label="Saldo fiado" value={formatearPesos(resumen.saldoPendiente)} icon={<Icon name="tendencia" className="h-4 w-4" />} />
    </div>
    <Panel className="space-y-3">
      <SectionHeader title="Medios de pago" />
      {resumen.mediosPagoMasUsados.length === 0
        ? <EmptyState title="No hay cobros en este período." />
        : <CardList>{resumen.mediosPagoMasUsados.map((medio, index) => <div key={medio.medioPago} className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-black/15 px-3 py-2 text-sm"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colores[(index + 1) % colores.length] }} />{MEDIOS_DE_PAGO.find((opcion) => opcion.value === medio.medioPago)?.label ?? "Otro"}</span><span className="text-right font-semibold">{medio.cantidadCobros} · {formatearPesos(medio.totalVendido)}</span></div>)}</CardList>}
    </Panel>
    <Suspense fallback={<DelayedFallback><Skeleton className="h-64" /></DelayedFallback>}><GraficosReportes resumen={resumen} tipo="medios" /></Suspense>
  </div>;
}

export function ReportesPage() {
  const { resumenes, cargando, error, recargar } = useResumenes();
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [perspectiva, setPerspectiva] = useState<Perspectiva>("resumen");
  const [resultadoConsultado, setResultadoConsultado] = useState<ResumenConRanking | null>(null);
  const [rangoConsultado, setRangoConsultado] = useState<RangoFechas | null>(null);
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [selectorEspecial, setSelectorEspecial] = useState<SelectorEspecial>("semana");
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
    if (periodo === "semana" && !resultadoConsultado) return resumenes.semana;
    return resultadoConsultado;
  }, [periodo, resultadoConsultado, resumenes]);
  const rango = periodo === "hoy"
    ? resumenes?.rangoHoy
    : periodo === "mes"
      ? resumenes?.rangoMes
      : periodo === "semana" && !resultadoConsultado
        ? resumenes?.rangoSemana
        : rangoConsultado;

  useEffect(() => {
    if (!mesActual || mesSemana) return;
    setMesSemana(mesActual);
    setSemana(semanaActual);
  }, [mesActual, mesSemana, semanaActual]);

  function cambiarPeriodoRapido(nuevo: PeriodoRapido) {
    setPeriodo(nuevo);
    setResultadoConsultado(null);
    setRangoConsultado(null);
    setErrorConsulta(null);
    setPerspectiva("resumen");
    if (nuevo === "semana") {
      setMesSemana(mesActual);
      setSemana(semanaActual);
    }
  }

  async function consultarEspecial(event?: FormEvent) {
    event?.preventDefault();
    const rangoConsulta = selectorEspecial === "semana" ? rangoSemana : desde && hasta ? { desde, hasta } : null;
    if (!rangoConsulta) return;
    try {
      setConsultando(true);
      setErrorConsulta(null);
      setResultadoConsultado(await obtenerResumenPorRango(rangoConsulta));
      setRangoConsultado(rangoConsulta);
      setPeriodo(selectorEspecial);
      setPerspectiva("resumen");
      setSelectorAbierto(false);
    } catch (errorDesconocido) {
      setErrorConsulta(errorDesconocido instanceof Error ? errorDesconocido.message : "No se pudo consultar el período.");
    } finally {
      setConsultando(false);
    }
  }

  return <Page>
    <PageHeader title="Reportes" description="Elegí un período y después la información que querés entender." />
    {cargando && <DelayedFallback><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div><ListSkeleton rows={2} /></div></DelayedFallback>}
    {error && <ErrorState message={error} onRetry={() => void recargar()} />}
    {resumenes && <>
      <section className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.035] p-3" aria-label="Período del reporte">
        <div className="grid grid-cols-3 gap-2">
          {(["hoy", "semana", "mes"] as PeriodoRapido[]).map((opcion) => <Button key={opcion} size="sm" variant={periodo === opcion ? "primary" : "secondary"} aria-pressed={periodo === opcion} onClick={() => cambiarPeriodoRapido(opcion)}>{opcion === "hoy" ? "Hoy" : opcion === "semana" ? "Semana" : "Mes"}</Button>)}
        </div>
        <Button variant={periodo === "personalizado" || Boolean(resultadoConsultado) ? "primary" : "ghost"} size="sm" fullWidth leftIcon={<Icon name="filtro" className="h-4 w-4" />} onClick={() => { setSelectorEspecial(periodo === "personalizado" ? "personalizado" : "semana"); setSelectorAbierto(true); }}>Elegir período</Button>
        {rango && <p className="border-t border-white/10 pt-3 text-center text-xs text-white/50">{textoRango(rango)}</p>}
      </section>

      {errorConsulta && <ErrorState message={errorConsulta} onRetry={() => void consultarEspecial()} />}

      {resultado && <section className="space-y-4 animate-mora-enter">
        <div><h2 className="text-lg font-semibold">Resultado</h2>{rango && <p className="mt-1 text-xs text-white/45">{textoRango(rango)}</p>}</div>
        <div className="grid grid-cols-3 gap-2" aria-label="Contenido del reporte"><Button size="sm" variant={perspectiva === "resumen" ? "primary" : "secondary"} onClick={() => setPerspectiva("resumen")}>Resumen</Button><Button size="sm" variant={perspectiva === "productos" ? "primary" : "secondary"} onClick={() => setPerspectiva("productos")}>Productos</Button><Button size="sm" variant={perspectiva === "cobros" ? "primary" : "secondary"} onClick={() => setPerspectiva("cobros")}>Cobros</Button></div>
        {perspectiva === "resumen" ? <ResumenMetricas resumen={resultado} /> : perspectiva === "productos" ? <Productos resumen={resultado} /> : <Cobros resumen={resultado} />}
      </section>}

      <section id="pdf-mensual" className="scroll-mt-5 border-t border-white/10 pt-5">
        <Panel className="flex items-center justify-between gap-4">
          <div><p className="font-semibold">PDF mensual</p><p className="mt-1 text-sm leading-5 text-white/50">Prepará el informe de un mes para imprimirlo o guardarlo.</p></div>
          <ButtonLink to="/reportes/pdf-mensual" size="sm" variant="secondary">Abrir</ButtonLink>
        </Panel>
      </section>

      <BottomSheet open={selectorAbierto} onOpenChange={setSelectorAbierto} title="Elegir período" description="Consultá otra semana o definí fechas específicas.">
        <form className="space-y-4" onSubmit={(event) => void consultarEspecial(event)}>
          <div className="grid grid-cols-2 gap-2"><Button size="sm" variant={selectorEspecial === "semana" ? "primary" : "secondary"} onClick={() => setSelectorEspecial("semana")}>Semana del mes</Button><Button size="sm" variant={selectorEspecial === "personalizado" ? "primary" : "secondary"} onClick={() => setSelectorEspecial("personalizado")}>Fechas</Button></div>
          {selectorEspecial === "semana"
            ? <div className="grid grid-cols-2 gap-3"><label><span className="text-sm text-white/70">Mes</span><Input type="month" max={mesActual} value={mesElegido} onChange={(event) => { const nuevoMes = event.target.value; setMesSemana(nuevoMes); const nuevas = obtenerSemanasDisponibles(nuevoMes, fechaJornada); setSemana(nuevas.at(-1) ?? 1); }} /></label><label><span className="text-sm text-white/70">Semana</span><Select value={semanaElegida} onChange={(event) => setSemana(Number(event.target.value) as SemanaDelMes)}>{([1, 2, 3, 4] as SemanaDelMes[]).map((numero) => <option key={numero} value={numero} disabled={!disponibles.includes(numero)}>Semana {numero}{mesElegido === mesActual && numero === semanaActual ? " (en curso)" : disponibles.includes(numero) ? "" : " (no comenzó)"}</option>)}</Select></label></div>
            : <div className="grid grid-cols-2 gap-3"><label><span className="text-sm text-white/70">Desde</span><Input type="date" max={fechaJornada} value={desde} onChange={(event) => setDesde(event.target.value)} /></label><label><span className="text-sm text-white/70">Hasta</span><Input type="date" max={fechaJornada} value={hasta} onChange={(event) => setHasta(event.target.value)} /></label></div>}
          <Button type="submit" fullWidth disabled={consultando || (selectorEspecial === "semana" ? !rangoSemana : !desde || !hasta)}>{consultando ? "Consultando…" : "Ver período"}</Button>
        </form>
      </BottomSheet>
    </>}
  </Page>;
}
