import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { MEDIOS_DE_PAGO } from "../../constants";
import { obtenerResumenPorRango } from "../../db";
import {
  crearRangoMesReporte,
  formatearMesReporte,
  type ResumenConRanking,
} from "../../domain/reportes";
import type { MedioPago } from "../../domain/ventas";
import { formatearPesos } from "../../utils/dinero";
import { calcularFechaJornada } from "../../utils/jornadaVenta";

function obtenerMesActual(): string {
  return calcularFechaJornada(new Date()).slice(0, 7);
}

function obtenerMedioPagoLabel(value: MedioPago): string {
  return MEDIOS_DE_PAGO.find((medio) => medio.value === value)?.label ?? "Otro";
}

function MetricaPdf({ label, valor }: { label: string; valor: string }) {
  return (
    <article className="pdf-break-inside-avoid rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-zinc-950">{valor}</p>
    </article>
  );
}

function TablaProductos({ resumen }: { resumen: ResumenConRanking }) {
  return (
    <section className="pdf-break-inside-avoid space-y-3">
      <h2 className="text-lg font-bold text-zinc-950">Productos más vendidos</h2>
      {resumen.productosMasVendidos.length === 0 ? (
        <p className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
          No hay productos vendidos en este mes.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Producto</th>
                <th className="px-3 py-2 text-right font-semibold">Cantidad</th>
                <th className="px-3 py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {resumen.productosMasVendidos.slice(0, 8).map((producto) => (
                <tr key={producto.productoId}>
                  <td className="px-3 py-2 text-zinc-800">{producto.nombre}</td>
                  <td className="px-3 py-2 text-right font-medium text-zinc-950">
                    {producto.cantidad} u.
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-zinc-950">
                    {formatearPesos(producto.totalVendido)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TablaMediosPago({ resumen }: { resumen: ResumenConRanking }) {
  return (
    <section className="pdf-break-inside-avoid space-y-3">
      <h2 className="text-lg font-bold text-zinc-950">Medios de pago</h2>
      {resumen.mediosPagoMasUsados.length === 0 ? (
        <p className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
          No hay medios de pago para mostrar en este mes.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Medio</th>
                <th className="px-3 py-2 text-right font-semibold">Ventas</th>
                <th className="px-3 py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {resumen.mediosPagoMasUsados.map((medio) => (
                <tr key={medio.medioPago}>
                  <td className="px-3 py-2 text-zinc-800">{obtenerMedioPagoLabel(medio.medioPago)}</td>
                  <td className="px-3 py-2 text-right font-medium text-zinc-950">
                    {medio.cantidadVentas}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-zinc-950">
                    {formatearPesos(medio.totalVendido)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function PdfMensualPage() {
  const [mesSeleccionado, setMesSeleccionado] = useState(obtenerMesActual);
  const [resumen, setResumen] = useState<ResumenConRanking | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rango = useMemo(() => crearRangoMesReporte(mesSeleccionado), [mesSeleccionado]);
  const tituloMes = useMemo(() => formatearMesReporte(mesSeleccionado), [mesSeleccionado]);

  useEffect(() => {
    let activo = true;

    async function cargarResumenMensual() {
      try {
        setCargando(true);
        setError(null);
        const resumenMensual = await obtenerResumenPorRango(rango);
        if (activo) setResumen(resumenMensual);
      } catch (errorDesconocido) {
        if (!activo) return;
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "No se pudo preparar el PDF mensual.",
        );
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargarResumenMensual();

    return () => {
      activo = false;
    };
  }, [rango]);

  return (
    <section className="space-y-4 print:space-y-0">
      <div className="pdf-no-print flex items-center justify-between gap-3">
        <Link className="text-sm font-semibold text-white/70 hover:text-white" to="/reportes">
          ← Volver
        </Link>
        <button
          className="rounded-2xl bg-mora-principal px-4 py-2 text-sm font-semibold text-white transition hover:bg-mora-principal-hover disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={() => window.print()}
          disabled={cargando || Boolean(error)}
        >
          Imprimir o guardar PDF
        </button>
      </div>

      <div className="pdf-no-print rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <label className="space-y-1 text-sm text-white/70">
          <span>Mes del reporte</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-mora-principal"
            type="month"
            value={mesSeleccionado}
            onChange={(event) => setMesSeleccionado(event.target.value)}
          />
        </label>
      </div>

      <article className="pdf-print-page space-y-7 rounded-[2rem] bg-white p-5 text-zinc-900 shadow-xl print:rounded-none print:p-0 print:shadow-none">
        <header className="border-b border-zinc-200 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mora-principal">
            Mora Vinería
          </p>
          <h1 className="mt-2 text-3xl font-black text-zinc-950">Resumen mensual</h1>
          <p className="mt-2 text-sm text-zinc-600">
            {tituloMes} · {rango.desde} al {rango.hasta}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            Resumen de gestión generado desde los datos cargados en este dispositivo. No es un comprobante fiscal ni un reporte contable formal.
          </p>
        </header>

        {cargando && (
          <div className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
            Preparando resumen mensual...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {resumen && !cargando && !error && (
          <>
            <section className="grid grid-cols-2 gap-3 print:grid-cols-4">
              <MetricaPdf label="Total vendido" valor={formatearPesos(resumen.totalVendido)} />
              <MetricaPdf label="Costo estimado" valor={formatearPesos(resumen.costoEstimadoVendido)} />
              <MetricaPdf label="Ganancia bruta" valor={formatearPesos(resumen.gananciaBrutaEstimada)} />
              <MetricaPdf label="Ganancia neta" valor={formatearPesos(resumen.gananciaNetaEstimada)} />
              <MetricaPdf label="Gastos puntuales" valor={formatearPesos(resumen.gastosPuntuales)} />
              <MetricaPdf label="Reinversión" valor={formatearPesos(resumen.reinversion)} />
              <MetricaPdf label="Aportes externos" valor={formatearPesos(resumen.aportesExternos)} />
              <MetricaPdf label="Ventas registradas" valor={String(resumen.cantidadVentas)} />
            </section>

            <div className="grid gap-7 print:grid-cols-2 print:items-start">
              <TablaProductos resumen={resumen} />
              <TablaMediosPago resumen={resumen} />
            </div>

            <section className="pdf-break-inside-avoid rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <h2 className="text-base font-bold text-zinc-950">Observaciones</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                La ganancia es estimada. Depende del costo de compra cargado en cada producto y de que las ventas y movimientos estén al día. La reinversión y los aportes externos se muestran separados para no confundirlos con ganancia o gasto puntual.
              </p>
            </section>
          </>
        )}
      </article>
    </section>
  );
}
