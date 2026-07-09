import { useState } from "react";
import { Link } from "react-router-dom";

import { MEDIOS_DE_PAGO } from "../../constants";
import { anularVenta } from "../../db";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
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
  const { ventas, cargando, error, recargar } = useVentas(40);
  const { configuracion } = useConfiguracionLocal();
  const [ventaAnulandoId, setVentaAnulandoId] = useState<string | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardandoAnulacion, setGuardandoAnulacion] = useState(false);

  const esConsulta = configuracion?.deviceRole === "consulta";

  const totalVentasActivas = ventas
    .filter((venta) => venta.estado === "activa")
    .reduce((total, venta) => total + venta.total, 0);

  async function confirmarAnulacion(ventaId: string) {
    const motivo = motivoAnulacion.trim();

    if (esConsulta) {
      setMensaje(
        "Este celular está configurado como consulta. Para anular ventas, usá el celular principal.",
      );
      return;
    }

    if (!motivo) {
      setMensaje("Indicá el motivo de anulación.");
      return;
    }

    const confirmar = window.confirm(
      "¿Anular esta venta? El stock de los productos se va a recuperar.",
    );

    if (!confirmar) return;

    try {
      setGuardandoAnulacion(true);
      setMensaje(null);
      await anularVenta(ventaId, { motivoAnulacion: motivo });
      setVentaAnulandoId(null);
      setMotivoAnulacion("");
      setMensaje("Venta anulada. El stock volvió a sumarse.");
      await recargar();
    } catch (errorDesconocido) {
      const textoError =
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo anular la venta.";
      setMensaje(textoError);
    } finally {
      setGuardandoAnulacion(false);
    }
  }

  function abrirAnulacion(ventaId: string) {
    setMensaje(null);
    setVentaAnulandoId((actual) => (actual === ventaId ? null : ventaId));
    setMotivoAnulacion("");
  }

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

      {esConsulta && (
        <div className="rounded-3xl border border-mora-advertencia/30 bg-mora-advertencia/10 p-4 text-sm leading-6 text-yellow-100">
          Este celular está como consulta. Podés revisar ventas, pero no anularlas desde acá.
        </div>
      )}

      {mensaje && (
        <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-white/70">
          {mensaje}
        </p>
      )}

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

            {venta.estado === "anulada" && venta.motivoAnulacion && (
              <p className="mt-3 rounded-2xl border border-mora-error/25 bg-mora-error/10 p-3 text-sm leading-6 text-red-100">
                Motivo de anulación: {venta.motivoAnulacion}
              </p>
            )}

            {venta.estado === "activa" && (
              <div className="mt-4 border-t border-white/10 pt-3">
                {ventaAnulandoId === venta.id ? (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-xs text-white/55">Motivo de anulación</span>
                      <textarea
                        value={motivoAnulacion}
                        onChange={(event) => setMotivoAnulacion(event.target.value)}
                        className="mt-1 min-h-20 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-mora-principal"
                        placeholder="Ejemplo: venta cargada por error"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setVentaAnulandoId(null);
                          setMotivoAnulacion("");
                        }}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white"
                      >
                        Cancelar
                      </button>

                      <button
                        type="button"
                        onClick={() => void confirmarAnulacion(venta.id)}
                        disabled={guardandoAnulacion || esConsulta}
                        className="rounded-2xl border border-mora-error/40 bg-mora-error/15 px-3 py-2 text-sm font-semibold text-red-100 disabled:opacity-60"
                      >
                        {guardandoAnulacion ? "Anulando..." : "Anular"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => abrirAnulacion(venta.id)}
                    disabled={esConsulta}
                    className="text-sm font-semibold text-red-100 disabled:opacity-50"
                  >
                    Anular venta
                  </button>
                )}
              </div>
            )}
          </article>
        ))}
      </section>
    </section>
  );
}
