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
  SectionHeader,
} from "../../components/ui";
import { obtenerEstadoFiado, type EstadoFiado } from "../../domain/ventas";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useRestaurarScroll } from "../../hooks/useRestaurarScroll";
import { useVentas } from "../../hooks/useVentas";
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
  const { ventas, cargando, error, recargar } = useVentas(120);
  const { configuracion } = useConfiguracionLocal();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [vista, setVista] = useState<VistaVentas>("historial");
  const [mostrarAnuladas, setMostrarAnuladas] = useState(false);
  const [filtroFiado, setFiltroFiado] = useState<FiltroFiado>("pendientes");
  const [busqueda, setBusqueda] = useState("");
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

  const ventasHistorial = useMemo(
    () => ventas.filter((venta) => mostrarAnuladas || venta.estado === "activa"),
    [mostrarAnuladas, ventas],
  );
  const ventasFiadas = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es-AR");
    return ventas.filter((venta) => {
      if ((venta.condicionPago ?? "contado") !== "fiado") return false;
      const estadoFiado = obtenerEstadoFiado(venta, venta.cobros);
      if (filtroFiado === "pendientes" && !["pendiente", "vencida", "excedida"].includes(estadoFiado)) return false;
      if (filtroFiado === "vencidas" && estadoFiado !== "vencida") return false;
      if (filtroFiado === "pagadas" && estadoFiado !== "pagada") return false;
      if (texto && ![venta.clienteFiadoNombre, venta.clienteFiadoNota]
        .filter(Boolean).join(" ").toLocaleLowerCase("es-AR").includes(texto)) return false;
      return true;
    });
  }, [busqueda, filtroFiado, ventas]);
  const ventasVisibles = vista === "historial" ? ventasHistorial : ventasFiadas;

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
          <div className="flex items-center justify-between gap-3">
            <SectionHeader title="Historial reciente" description={`${ventasVisibles.length} venta${ventasVisibles.length === 1 ? "" : "s"}`} />
            <Button size="sm" variant={mostrarAnuladas ? "primary" : "secondary"} aria-pressed={mostrarAnuladas} onClick={() => setMostrarAnuladas((actual) => !actual)}>Anuladas</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <SectionHeader title="Ventas fiadas" description="Buscá por cliente y revisá los saldos." />
            <Input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar cliente" />
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
            title={vista === "fiadas" ? "No hay ventas fiadas con este filtro." : "Todavía no hay ventas para mostrar."}
            description={vista === "fiadas" ? "Las ventas con saldo pendiente aparecerán acá." : mostrarAnuladas ? "Probá ocultar las anuladas." : "La próxima venta aparecerá acá."}
            action={vista === "historial" && !mostrarAnuladas && !esConsulta ? <ButtonLink to="/ventas/nueva">Registrar primera venta</ButtonLink> : undefined}
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
            const primerCobro = venta.cobros.find((cobro) => cobro.estado === "activo");

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
                    <span className="mt-1 block text-xs text-white/55">{vista === "fiadas" ? productosResumen : `${esFiada ? "Fiada" : obtenerMedioPagoLabel(primerCobro?.medioPago ?? venta.medioPago)} · ${unidades} unidad${unidades === 1 ? "" : "es"}`}</span>
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
      </section>
    </Page>
  );
}
