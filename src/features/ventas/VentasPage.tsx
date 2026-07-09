import { Link } from "react-router-dom";

import { MEDIOS_DE_PAGO } from "../../constants";
import { useVentas } from "../../hooks/useVentas";

function formatearPesos(valor: number): string {
  return `$${valor.toLocaleString("es-AR")}`;
}

function formatearFecha(fechaIso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fechaIso));
}

function obtenerMedioPagoLabel(value: string): string {
  return MEDIOS_DE_PAGO.find((medio) => medio.value === value)?.label ?? "Otro";
}

export function VentasPage() {
  const { ventas, cargando, error } = useVentas(40);

  const totalVentasActivas = ventas
    .filter((venta) => venta.estado === "activa")
    .reduce((total, venta) => total + venta.total, 0);

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Ventas</h1>
        <p className="mt-1 text-sm text-white/65">Historial y carga rápida de ventas.</p>
      </header>

      <Link
        to="/ventas/nueva"
        className="block rounded-3xl bg-mora-principal px-5 py-4 text-center font-semibold text-white"
      >
        Nueva venta
      </Link>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-white/50">Ventas recientes</p>
          <p className="mt-2 text-2xl font-bold text-white">{ventas.length}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-white/50">Total listado</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatearPesos(totalVentasActivas)}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Historial</h2>

        {cargando && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
            Cargando ventas...
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-mora-error/40 bg-white/[0.04] p-4 text-sm text-white/65">
            {error}
          </div>
        )}

        {!cargando && ventas.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
            Todavía no hay ventas cargadas.
          </div>
        )}

        {ventas.map((venta) => (
          <article
            key={venta.id}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">
                  {formatearFecha(venta.fechaHoraReal)}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  {obtenerMedioPagoLabel(venta.medioPago)} · Jornada {venta.fechaJornada}
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-white">{formatearPesos(venta.total)}</p>
                {venta.estado === "anulada" && (
                  <p className="mt-1 rounded-full border border-mora-error/30 px-2 py-1 text-xs text-red-100">
                    Anulada
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {venta.detalles.map((detalle) => (
                <div
                  key={detalle.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-black/15 px-3 py-2 text-sm"
                >
                  <span className="text-white/75">
                    {detalle.cantidad} x {detalle.producto?.nombre ?? "Producto eliminado"}
                  </span>
                  <span className="font-semibold text-white">
                    {formatearPesos(detalle.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {venta.observaciones && (
              <p className="mt-3 rounded-2xl bg-black/15 p-3 text-sm leading-6 text-white/60">
                {venta.observaciones}
              </p>
            )}
          </article>
        ))}
      </section>
    </section>
  );
}
