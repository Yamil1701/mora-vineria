import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Badge, ButtonLink, EmptyState, Notice, Page, PageHeader, SectionHeader } from "../../components/ui";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useRestaurarScroll } from "../../hooks/useRestaurarScroll";
import { useVentas } from "../../hooks/useVentas";
import { formatearFechaVenta, formatearPesos, obtenerMedioPagoLabel } from "./ventas.ui";

export function VentasPage() {
  useRestaurarScroll("ventas");
  const { ventas, cargando, error } = useVentas(80);
  const { configuracion } = useConfiguracionLocal();
  const [searchParams] = useSearchParams();
  const [mostrarAnuladas, setMostrarAnuladas] = useState(false);
  const ventaDestacadaId = searchParams.get("destacada");
  const esConsulta = configuracion?.deviceRole === "consulta";

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

      {ventaDestacadaId && (
        <Notice tone="success">
          Venta guardada. La destacamos en el historial para que puedas revisarla.
        </Notice>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <SectionHeader
            title="Historial reciente"
            description={`${ventasVisibles.length} venta${ventasVisibles.length === 1 ? "" : "s"}`}
          />
          <label className="flex min-h-12 items-center gap-2 rounded-2xl px-2 text-xs text-white/70">
            <input
              type="checkbox"
              checked={mostrarAnuladas}
              onChange={(event) => setMostrarAnuladas(event.target.checked)}
              className="h-5 w-5 accent-mora-principal"
            />
            Ver anuladas
          </label>
        </div>

        {cargando && <Notice>Cargando ventas...</Notice>}
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

            return (
              <Link
                key={venta.id}
                to={`/ventas/${venta.id}`}
                className={`block min-h-20 rounded-2xl border p-4 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-[0.99] ${
                  destacada
                    ? "animate-mora-highlight border-mora-exito/60 bg-mora-exito/10"
                    : "border-white/10 bg-white/[0.045] hover:bg-white/[0.075]"
                }`}
                aria-label={`Ver venta de ${formatearPesos(venta.total)} del ${formatearFechaVenta(venta.fechaHoraReal)}`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block text-sm font-semibold text-white">
                      {formatearFechaVenta(venta.fechaHoraReal)}
                    </span>
                    <span className="mt-1 block text-xs text-white/55">
                      {obtenerMedioPagoLabel(venta.medioPago)} · {unidades} unidad{unidades === 1 ? "" : "es"}
                    </span>
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
