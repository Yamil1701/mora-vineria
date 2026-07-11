import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import { Badge, Button, ButtonLink, DelayedFallback, EmptyState, ListSkeleton, Notice, Page, PageHeader, SectionHeader } from "../../components/ui";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useRestaurarScroll } from "../../hooks/useRestaurarScroll";
import { useVentas } from "../../hooks/useVentas";
import { formatearFechaVenta, formatearPesos, obtenerMedioPagoLabel } from "./ventas.ui";

export function VentasPage() {
  useRestaurarScroll("ventas");
  const { ventas, cargando, error } = useVentas(80);
  const { configuracion } = useConfiguracionLocal();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mostrarAnuladas, setMostrarAnuladas] = useState(false);
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

  const ventasVisibles = useMemo(
    () => ventas.filter((venta) => mostrarAnuladas || venta.estado === "activa"),
    [mostrarAnuladas, ventas],
  );

  return (
    <Page>
      <PageHeader
        title="Ventas"
        description="Revisá la actividad reciente y abrí una venta para ver su detalle."
        action={
          !esConsulta ? (
            <ButtonLink to="/ventas/nueva" size="lg" fullWidth>
              Nueva venta
            </ButtonLink>
          ) : undefined
        }
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <SectionHeader
            title="Historial reciente"
            description={`${ventasVisibles.length} venta${ventasVisibles.length === 1 ? "" : "s"}`}
          />
          <Button size="sm" variant={mostrarAnuladas ? "primary" : "secondary"} aria-pressed={mostrarAnuladas} onClick={() => setMostrarAnuladas((actual) => !actual)}>Anuladas</Button>
        </div>

        {cargando && <DelayedFallback><ListSkeleton rows={4} /></DelayedFallback>}
        {error && <Notice tone="danger">{error}</Notice>}
        {!cargando && ventasVisibles.length === 0 && (
          <EmptyState
            title="Todavía no hay ventas para mostrar."
            description={mostrarAnuladas ? "Probá ocultar las anuladas." : "La próxima venta aparecerá acá."}
          />
        )}

        <div className="space-y-2">
          {ventasVisibles.map((venta) => {
            const destacada = venta.id === ventaDestacadaId;
            const unidades = venta.detalles.reduce((total, detalle) => total + detalle.cantidad, 0);
            const productosResumen = venta.detalles.slice(0, 2).map((d) => `${d.cantidad} × ${d.producto?.nombre ?? "Producto"}`).join(" · ");
            const adicionales = venta.detalles.length - 2;

            return (
              <Link
                key={venta.id}
                to={`/ventas/${venta.id}`}
                state={{ backgroundLocation: location }}
                className={`block min-h-20 rounded-2xl border p-4 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-[0.99] ${
                  destacada
                    ? `${animarDestacada ? "animate-mora-highlight bg-mora-exito/10" : ""} border-mora-exito/60`
                    : "border-white/10 bg-white/[0.045] hover:bg-white/[0.075]"
                }`}
                aria-label={`Ver venta de ${formatearPesos(venta.total)} del ${formatearFechaVenta(venta.fechaHoraReal)}`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block text-sm font-semibold text-white">{productosResumen}{adicionales > 0 ? ` · +${adicionales} más` : ""}</span>
                    <span className="mt-1 block text-xs text-white/55">{obtenerMedioPagoLabel(venta.medioPago)} · {unidades} unidad{unidades === 1 ? "" : "es"}</span>
                    <span className="mt-1 block text-[11px] text-white/35">{formatearFechaVenta(venta.fechaHoraReal)}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-lg font-bold text-white">{formatearPesos(venta.total)}</span>
                    {venta.estado === "anulada" && <Badge tone="danger">Anulada</Badge>}
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
