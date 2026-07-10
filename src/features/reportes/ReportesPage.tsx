import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { MEDIOS_DE_PAGO } from "../../constants";
import { obtenerResumenPorRango } from "../../db";
import type { RangoFechas, ResumenConRanking } from "../../domain/reportes";
import type { MedioPago } from "../../domain/ventas";
import { useResumenes } from "../../hooks/useResumenes";
import { formatearPesos } from "../../utils/dinero";

function obtenerMedioPagoLabel(value: MedioPago): string {
  return MEDIOS_DE_PAGO.find((medio) => medio.value === value)?.label ?? "Otro";
}

function RangoTexto({ desde, hasta }: RangoFechas) {
  return (
    <span className="text-xs text-white/45">
      {desde === hasta ? desde : `${desde} al ${hasta}`}
    </span>
  );
}

function Metrica({ label, valor }: { label: string; valor: string }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-2 text-xl font-bold text-white">{valor}</p>
    </article>
  );
}

function ResumenMetricas({ resumen }: { resumen: ResumenConRanking }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Metrica label="Total vendido" valor={formatearPesos(resumen.totalVendido)} />
      <Metrica label="Costo estimado" valor={formatearPesos(resumen.costoEstimadoVendido)} />
      <Metrica label="Ganancia bruta" valor={formatearPesos(resumen.gananciaBrutaEstimada)} />
      <Metrica label="Ganancia neta" valor={formatearPesos(resumen.gananciaNetaEstimada)} />
      <Metrica label="Reinversión" valor={formatearPesos(resumen.reinversion)} />
      <Metrica label="Gastos puntuales" valor={formatearPesos(resumen.gastosPuntuales)} />
      <Metrica label="Aportes externos" valor={formatearPesos(resumen.aportesExternos)} />
      <Metrica label="Ventas" valor={String(resumen.cantidadVentas)} />
    </div>
  );
}

function RankingProductos({ resumen }: { resumen: ResumenConRanking }) {
  return (
    <section className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <h2 className="text-lg font-semibold">Productos más vendidos</h2>
      {resumen.productosMasVendidos.length === 0 ? (
        <p className="text-sm text-white/55">Todavía no hay productos vendidos en este período.</p>
      ) : (
        <div className="space-y-2">
          {resumen.productosMasVendidos.slice(0, 5).map((producto) => (
            <div
              key={producto.productoId}
              className="flex items-center justify-between gap-3 rounded-2xl bg-black/15 px-3 py-2 text-sm"
            >
              <span className="text-white/75">{producto.nombre}</span>
              <span className="font-semibold text-white">
                {producto.cantidad} u. · {formatearPesos(producto.totalVendido)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RankingMediosPago({ resumen }: { resumen: ResumenConRanking }) {
  return (
    <section className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <h2 className="text-lg font-semibold">Medios de pago</h2>
      {resumen.mediosPagoMasUsados.length === 0 ? (
        <p className="text-sm text-white/55">Todavía no hay medios de pago para mostrar.</p>
      ) : (
        <div className="space-y-2">
          {resumen.mediosPagoMasUsados.map((medio) => (
            <div
              key={medio.medioPago}
              className="flex items-center justify-between gap-3 rounded-2xl bg-black/15 px-3 py-2 text-sm"
            >
              <span className="text-white/75">{obtenerMedioPagoLabel(medio.medioPago)}</span>
              <span className="font-semibold text-white">
                {medio.cantidadVentas} venta{medio.cantidadVentas === 1 ? "" : "s"} · {formatearPesos(medio.totalVendido)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ReportePersonalizado({ rangoInicial }: { rangoInicial: RangoFechas }) {
  const [desde, setDesde] = useState(rangoInicial.desde);
  const [hasta, setHasta] = useState(rangoInicial.hasta);
  const [resultado, setResultado] = useState<ResumenConRanking | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDesde(rangoInicial.desde);
    setHasta(rangoInicial.hasta);
  }, [rangoInicial.desde, rangoInicial.hasta]);

  async function consultarRango(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setCargando(true);
      setError(null);
      const resumen = await obtenerResumenPorRango({ desde, hasta });
      setResultado(resumen);
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo consultar ese rango.",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <div>
        <h2 className="text-lg font-semibold">Rango personalizado</h2>
        <p className="mt-1 text-sm text-white/55">
          Elegí fechas para revisar ventas, movimientos y ganancia estimada.
        </p>
      </div>

      <form className="space-y-3" onSubmit={(event) => void consultarRango(event)}>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-sm text-white/70">
            <span>Desde</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-mora-principal"
              type="date"
              value={desde}
              onChange={(event) => setDesde(event.target.value)}
              required
            />
          </label>
          <label className="space-y-1 text-sm text-white/70">
            <span>Hasta</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-mora-principal"
              type="date"
              value={hasta}
              onChange={(event) => setHasta(event.target.value)}
              required
            />
          </label>
        </div>

        <button
          className="w-full rounded-2xl bg-mora-principal px-4 py-3 text-sm font-semibold text-white transition hover:bg-mora-principal-hover disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={cargando}
        >
          {cargando ? "Consultando..." : "Consultar rango"}
        </button>
      </form>

      {error && <p className="text-sm text-mora-error">{error}</p>}

      {resultado && (
        <div className="space-y-3 pt-2">
          <ResumenMetricas resumen={resultado} />
          <RankingProductos resumen={resultado} />
          <RankingMediosPago resumen={resultado} />
        </div>
      )}
    </section>
  );
}

export function ReportesPage() {
  const { resumenes, cargando, error } = useResumenes();

  return (
    <section className="space-y-5">
      <header className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="mt-1 text-sm text-white/65">
            Resumen simple de ventas, movimientos y ganancia estimada.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            to="/reportes/pdf-mensual"
          >
            Preparar PDF mensual
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            to="/proyecciones"
          >
            Ver proyecciones
          </Link>
        </div>
      </header>

      {cargando && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
          Cargando reportes...
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-mora-error/40 bg-white/[0.04] p-4 text-sm text-white/65">
          {error}
        </div>
      )}

      {resumenes && (
        <>
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Resumen de hoy</h2>
              <RangoTexto desde={resumenes.rangoHoy.desde} hasta={resumenes.rangoHoy.hasta} />
            </div>
            <ResumenMetricas resumen={resumenes.hoy} />
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Semana del mes</h2>
              <RangoTexto desde={resumenes.rangoSemana.desde} hasta={resumenes.rangoSemana.hasta} />
            </div>
            <ResumenMetricas resumen={resumenes.semana} />
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Mes actual</h2>
              <RangoTexto desde={resumenes.rangoMes.desde} hasta={resumenes.rangoMes.hasta} />
            </div>
            <ResumenMetricas resumen={resumenes.mes} />
          </section>

          <RankingProductos resumen={resumenes.mes} />
          <RankingMediosPago resumen={resumenes.mes} />
          <ReportePersonalizado rangoInicial={resumenes.rangoMes} />

          <p className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/60">
            La ganancia es estimada. Depende del costo de compra cargado en cada producto y de que las ventas y movimientos estén al día.
          </p>
        </>
      )}
    </section>
  );
}
