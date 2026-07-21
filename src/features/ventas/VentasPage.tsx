import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import {
  Badge,
  Button,
  ButtonLink,
  DelayedFallback,
  EmptyState,
  ErrorState,
  Input,
  ListSkeleton,
  Page,
  PageHeader,
  Select,
  SectionHeader,
} from "../../components/ui";
import { MEDIOS_DE_PAGO } from "../../constants";
import { obtenerEstadoFiado, type EstadoFiado } from "../../domain/ventas";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useRestaurarScroll } from "../../hooks/useRestaurarScroll";
import { useVentas } from "../../hooks/useVentas";
import { calcularFechaJornada } from "../../utils/jornadaVenta";
import {
  filtrarVentasHistorial,
  obtenerSiguienteLimiteVentas,
  type MedioPagoHistorial,
  type PeriodoHistorialVentas,
} from "./historialVentas";
import { formatearFechaSimple, formatearFechaVenta, formatearPesos, obtenerMedioPagoLabel } from "./ventas.ui";

type VistaVentas = "historial" | "fiadas";
type FiltroFiado = "pendientes" | "vencidas" | "pagadas" | "todas";

const etiquetasEstado: Record<EstadoFiado, string> = {
  pendiente: "Pendiente",
  vencida: "Vencida",
  pagada: "Pagada",
  excedida: "Revisar cobros",
  anulada: "Anulada",
};

export function VentasPage() {
  useRestaurarScroll("ventas");
  const { ventas, cargando, error, recargar } = useVentas();
  const { configuracion } = useConfiguracionLocal();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [vista, setVista] = useState<VistaVentas>("historial");
  const [mostrarAnuladas, setMostrarAnuladas] = useState(false);
  const [filtroFiado, setFiltroFiado] = useState<FiltroFiado>("pendientes");
  const [busquedaHistorial, setBusquedaHistorial] = useState("");
  const [busquedaFiados, setBusquedaFiados] = useState("");
  const [periodoHistorial, setPeriodoHistorial] = useState<PeriodoHistorialVentas>("todos");
  const [medioPagoHistorial, setMedioPagoHistorial] = useState<MedioPagoHistorial>("todos");
  const fechaJornadaActual = calcularFechaJornada(new Date());
  const [desdeHistorial, setDesdeHistorial] = useState(fechaJornadaActual);
  const [hastaHistorial, setHastaHistorial] = useState(fechaJornadaActual);
  const [limiteVisible, setLimiteVisible] = useState(15);
  const ventaDestacadaId = searchParams.get("destacada");
  const claveDestacada = ventaDestacadaId ? `mora-venta-destacada-${ventaDestacadaId}` : null;
  const [animarDestacada, setAnimarDestacada] = useState(() => Boolean(claveDestacada && !sessionStorage.getItem(claveDestacada)));
  const esConsulta = configuracion?.deviceRole === "consulta";

  useEffect(() => {
    if (!claveDestacada || !ventaDestacadaId) return;
    sessionStorage.setItem(claveDestacada, "1");
    const finAnimacion = window.setTimeout(() => setAnimarDestacada(false), 1500);
    const limpiarUrl = window.setTimeout(() => setSearchParams({}, { replace: true }), 2200);
    return () => { window.clearTimeout(finAnimacion); window.clearTimeout(limpiarUrl); };
  }, [claveDestacada, setSearchParams, ventaDestacadaId]);

  const ventasHistorial = useMemo(() => filtrarVentasHistorial(ventas, {
    busqueda: busquedaHistorial,
    periodo: periodoHistorial,
    medioPago: medioPagoHistorial,
    mostrarAnuladas,
    desde: desdeHistorial,
    hasta: hastaHistorial,
  }, fechaJornadaActual), [
    busquedaHistorial,
    desdeHistorial,
    fechaJornadaActual,
    hastaHistorial,
    medioPagoHistorial,
    mostrarAnuladas,
    periodoHistorial,
    ventas,
  ]);
  const ventasFiadas = useMemo(() => {
    const texto = busquedaFiados.trim().toLocaleLowerCase("es-AR");
    return ventas.filter((venta) => {
      if ((venta.condicionPago ?? "contado") !== "fiado") return false;
      const estadoFiado = obtenerEstadoFiado(venta, venta.cobros);
      if (estadoFiado === "anulada") return false;
      if (filtroFiado === "pendientes" && !["pendiente", "vencida", "excedida"].includes(estadoFiado)) return false;
      if (filtroFiado === "vencidas" && estadoFiado !== "vencida") return false;
      if (filtroFiado === "pagadas" && estadoFiado !== "pagada") return false;
      if (texto && ![venta.clienteFiadoNombre, venta.clienteFiadoNota]
        .filter(Boolean).join(" ").toLocaleLowerCase("es-AR").includes(texto)) return false;
      return true;
    });
  }, [busquedaFiados, filtroFiado, ventas]);
  const resumenFiados = useMemo(() => ventas
    .filter((venta) => (venta.condicionPago ?? "contado") === "fiado" && venta.estado === "activa")
    .reduce((resumen, venta) => ({
      total: resumen.total + venta.total,
      cobrado: resumen.cobrado + venta.totalCobrado,
      saldo: resumen.saldo + Math.max(0, venta.saldo),
    }), { total: 0, cobrado: 0, saldo: 0 }), [ventas]);
  const ventasFiltradas = vista === "historial" ? ventasHistorial : ventasFiadas;
  const ventasVisibles = ventasFiltradas.slice(0, limiteVisible);
  const hayMas = limiteVisible < ventasFiltradas.length;

  useEffect(() => { setLimiteVisible(15); }, [
    busquedaFiados,
    busquedaHistorial,
    desdeHistorial,
    filtroFiado,
    hastaHistorial,
    medioPagoHistorial,
    mostrarAnuladas,
    periodoHistorial,
    vista,
  ]);

  const hayFiltrosHistorial = Boolean(
    busquedaHistorial || periodoHistorial !== "todos" || medioPagoHistorial !== "todos" || mostrarAnuladas,
  );
  const limpiarFiltrosHistorial = () => {
    setBusquedaHistorial("");
    setPeriodoHistorial("todos");
    setMedioPagoHistorial("todos");
    setMostrarAnuladas(false);
    setDesdeHistorial(fechaJornadaActual);
    setHastaHistorial(fechaJornadaActual);
  };

  return (
    <Page>
      <PageHeader
        title="Ventas"
        description="Historial, ventas fiadas y cobros pendientes."
        action={!esConsulta ? <ButtonLink to="/ventas/nueva" size="lg" fullWidth>Nueva venta</ButtonLink> : undefined}
      />

      <div className="grid grid-cols-2 gap-2" aria-label="Contenido de ventas">
        <Button variant={vista === "historial" ? "primary" : "secondary"} aria-pressed={vista === "historial"} onClick={() => setVista("historial")}>Historial</Button>
        <Button variant={vista === "fiadas" ? "primary" : "secondary"} aria-pressed={vista === "fiadas"} onClick={() => setVista("fiadas")}>Fiadas</Button>
      </div>

      <section className="space-y-3">
        {vista === "historial" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <SectionHeader title="Historial reciente" description={`${ventasFiltradas.length} venta${ventasFiltradas.length === 1 ? "" : "s"}`} />
              {hayFiltrosHistorial && <Button size="sm" variant="ghost" onClick={limpiarFiltrosHistorial}>Limpiar</Button>}
            </div>
            <Input
              type="search"
              value={busquedaHistorial}
              onChange={(event) => setBusquedaHistorial(event.target.value)}
              placeholder="Buscar producto, marca o presentación"
              aria-label="Buscar en el historial de ventas"
            />
            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className="sr-only">Período</span>
                <Select value={periodoHistorial} onChange={(event) => setPeriodoHistorial(event.target.value as PeriodoHistorialVentas)}>
                  <option value="todos">Cualquier fecha</option>
                  <option value="hoy">Hoy</option>
                  <option value="semana">Esta semana</option>
                  <option value="mes">Este mes</option>
                  <option value="personalizado">Elegir período</option>
                </Select>
              </label>
              <label>
                <span className="sr-only">Forma de cobro</span>
                <Select value={medioPagoHistorial} onChange={(event) => setMedioPagoHistorial(event.target.value as MedioPagoHistorial)}>
                  <option value="todos">Cualquier cobro</option>
                  {MEDIOS_DE_PAGO.map((medio) => <option key={medio.value} value={medio.value}>{medio.label}</option>)}
                </Select>
              </label>
            </div>
            {periodoHistorial === "personalizado" && (
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3 animate-mora-enter">
                <label><span className="mb-1 block text-xs text-white/55">Desde</span><Input type="date" max={hastaHistorial || fechaJornadaActual} value={desdeHistorial} onChange={(event) => setDesdeHistorial(event.target.value)} /></label>
                <label><span className="mb-1 block text-xs text-white/55">Hasta</span><Input type="date" min={desdeHistorial || undefined} max={fechaJornadaActual} value={hastaHistorial} onChange={(event) => setHastaHistorial(event.target.value)} /></label>
              </div>
            )}
            <div className="flex justify-end">
              <Button size="sm" variant={mostrarAnuladas ? "primary" : "secondary"} aria-pressed={mostrarAnuladas} onClick={() => setMostrarAnuladas((actual) => !actual)}>Anuladas</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <SectionHeader title="Ventas fiadas" description="Buscá por cliente y revisá los saldos." />
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm"><div><p className="text-xs text-white/45">Pendiente total</p><p className="mt-1 font-bold text-yellow-100">{formatearPesos(resumenFiados.saldo)}</p></div><div><p className="text-xs text-white/45">Ya cobrado</p><p className="mt-1 font-bold text-green-100">{formatearPesos(resumenFiados.cobrado)}</p></div></div>
            <Input type="search" value={busquedaFiados} onChange={(event) => setBusquedaFiados(event.target.value)} placeholder="Buscar cliente" />
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">
              {(["pendientes", "vencidas", "pagadas", "todas"] as FiltroFiado[]).map((filtro) => (
                <Button key={filtro} size="sm" variant={filtroFiado === filtro ? "primary" : "secondary"} aria-pressed={filtroFiado === filtro} onClick={() => setFiltroFiado(filtro)} className="shrink-0">
                  {filtro === "pendientes" ? "Pendientes" : filtro === "vencidas" ? "Vencidas" : filtro === "pagadas" ? "Pagadas" : "Todas"}
                </Button>
              ))}
            </div>
          </div>
        )}

        {cargando && <DelayedFallback><ListSkeleton rows={4} /></DelayedFallback>}
        {error && <ErrorState message={error} onRetry={() => void recargar()} />}
        {!cargando && ventasVisibles.length === 0 && (
          <EmptyState
            title={vista === "fiadas" ? "No hay ventas fiadas con este filtro." : hayFiltrosHistorial ? "No encontramos ventas." : "Todavía no hay ventas para mostrar."}
            description={vista === "fiadas" ? "Las ventas con saldo pendiente aparecerán acá." : hayFiltrosHistorial ? "Probá cambiar la búsqueda o limpiar los filtros." : "La próxima venta aparecerá acá."}
            action={vista === "historial" && hayFiltrosHistorial
              ? <Button variant="secondary" onClick={limpiarFiltrosHistorial}>Limpiar filtros</Button>
              : vista === "historial" && !esConsulta ? <ButtonLink to="/ventas/nueva">Registrar primera venta</ButtonLink> : undefined}
          />
        )}

        <div className="space-y-2">
          {ventasVisibles.map((venta) => {
            const destacada = venta.id === ventaDestacadaId;
            const unidades = venta.detalles.reduce((total, detalle) => total + detalle.cantidad, 0);
            const productosResumen = venta.detalles.slice(0, 2).map((detalle) => `${detalle.cantidad} × ${detalle.producto?.nombre ?? "Producto"}`).join(" · ");
            const adicionales = venta.detalles.length - 2;
            const esFiada = (venta.condicionPago ?? "contado") === "fiado";
            const estadoFiado = esFiada ? obtenerEstadoFiado(venta, venta.cobros) : null;
            const cobrosActivos = venta.cobros.filter((cobro) => cobro.estado === "activo");
            const primerCobro = cobrosActivos[0];
            const medioPagoVenta = cobrosActivos.length > 1 ? "Pago combinado" : obtenerMedioPagoLabel(primerCobro?.medioPago ?? venta.medioPago);

            return (
              <Link
                key={venta.id}
                to={`/ventas/${venta.id}`}
                state={{ backgroundLocation: location }}
                className={`block min-h-20 rounded-2xl border p-4 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-[0.99] ${destacada ? `${animarDestacada ? "animate-mora-highlight bg-mora-exito/10" : ""} border-mora-exito/60` : "border-white/10 bg-white/[0.045] hover:bg-white/[0.075]"}`}
                aria-label={`Ver venta de ${formatearPesos(venta.total)} del ${formatearFechaVenta(venta.fechaHoraReal)}`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">{vista === "fiadas" ? (venta.clienteFiadoNombre ?? "Cliente") : `${productosResumen}${adicionales > 0 ? ` · +${adicionales} más` : ""}`}</span>
                    <span className="mt-1 block text-xs text-white/55">{vista === "fiadas" ? productosResumen : `${esFiada ? "Fiada" : medioPagoVenta} · ${unidades} unidad${unidades === 1 ? "" : "es"}`}</span>
                    {vista === "fiadas" && <span className="mt-1 block text-[11px] text-white/45">Cobrado {formatearPesos(venta.totalCobrado)} de {formatearPesos(venta.total)}</span>}
                    <span className="mt-1 block text-[11px] text-white/35">{formatearFechaVenta(venta.fechaHoraReal)}{esFiada && venta.vencimientoFiado ? ` · Vence ${formatearFechaSimple(venta.vencimientoFiado)}` : ""}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-lg font-bold text-white">{formatearPesos(vista === "fiadas" ? Math.max(0, venta.saldo) : venta.total)}</span>
                    {vista === "fiadas" && <span className="mb-1 block text-[10px] text-white/40">saldo</span>}
                    {venta.estado === "anulada" ? <Badge tone="danger">Anulada</Badge> : estadoFiado && <Badge tone={estadoFiado === "pagada" ? "success" : estadoFiado === "pendiente" ? "warning" : "danger"}>{etiquetasEstado[estadoFiado]}</Badge>}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
        {hayMas && <Button variant="secondary" fullWidth onClick={() => setLimiteVisible((actual) => obtenerSiguienteLimiteVentas(actual, ventasFiltradas.length))}>Ver más ventas</Button>}
      </section>
    </Page>
  );
}
