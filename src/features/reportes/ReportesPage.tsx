import { MEDIOS_DE_PAGO } from "../../constants";
import type { MedioPago } from "../../domain/ventas";
import { useResumenes } from "../../hooks/useResumenes";
import { formatearPesos } from "../../utils/dinero";

function obtenerMedioPagoLabel(value: MedioPago): string {
  return MEDIOS_DE_PAGO.find((medio) => medio.value === value)?.label ?? "Otro";
}

function RangoTexto({ desde, hasta }: { desde: string; hasta: string }) {
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

export function ReportesPage() {
  const { resumenes, cargando, error } = useResumenes();

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="mt-1 text-sm text-white/65">
          Resumen simple de ventas, movimientos y ganancia estimada.
        </p>
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

            <div className="grid grid-cols-2 gap-3">
              <Metrica label="Total vendido" valor={formatearPesos(resumenes.hoy.totalVendido)} />
              <Metrica
                label="Ganancia bruta"
                valor={formatearPesos(resumenes.hoy.gananciaBrutaEstimada)}
              />
              <Metrica label="Gastos puntuales" valor={formatearPesos(resumenes.hoy.gastosPuntuales)} />
              <Metrica
                label="Ganancia neta"
                valor={formatearPesos(resumenes.hoy.gananciaNetaEstimada)}
              />
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Semana del mes</h2>
              <RangoTexto desde={resumenes.rangoSemana.desde} hasta={resumenes.rangoSemana.hasta} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Metrica label="Total vendido" valor={formatearPesos(resumenes.semana.totalVendido)} />
              <Metrica
                label="Ganancia neta"
                valor={formatearPesos(resumenes.semana.gananciaNetaEstimada)}
              />
              <Metrica label="Reinversión" valor={formatearPesos(resumenes.semana.reinversion)} />
              <Metrica label="Aportes externos" valor={formatearPesos(resumenes.semana.aportesExternos)} />
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Mes actual</h2>
              <RangoTexto desde={resumenes.rangoMes.desde} hasta={resumenes.rangoMes.hasta} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Metrica label="Total vendido" valor={formatearPesos(resumenes.mes.totalVendido)} />
              <Metrica
                label="Costo estimado"
                valor={formatearPesos(resumenes.mes.costoEstimadoVendido)}
              />
              <Metrica
                label="Ganancia bruta"
                valor={formatearPesos(resumenes.mes.gananciaBrutaEstimada)}
              />
              <Metrica
                label="Ganancia neta"
                valor={formatearPesos(resumenes.mes.gananciaNetaEstimada)}
              />
              <Metrica label="Reinversión" valor={formatearPesos(resumenes.mes.reinversion)} />
              <Metrica label="Gastos puntuales" valor={formatearPesos(resumenes.mes.gastosPuntuales)} />
            </div>
          </section>

          <section className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <h2 className="text-lg font-semibold">Productos más vendidos</h2>
            {resumenes.mes.productosMasVendidos.length === 0 ? (
              <p className="text-sm text-white/55">Todavía no hay productos vendidos este mes.</p>
            ) : (
              <div className="space-y-2">
                {resumenes.mes.productosMasVendidos.slice(0, 5).map((producto) => (
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

          <section className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <h2 className="text-lg font-semibold">Medios de pago</h2>
            {resumenes.mes.mediosPagoMasUsados.length === 0 ? (
              <p className="text-sm text-white/55">Todavía no hay medios de pago para mostrar.</p>
            ) : (
              <div className="space-y-2">
                {resumenes.mes.mediosPagoMasUsados.map((medio) => (
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

          <p className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/60">
            La ganancia es estimada. Depende del costo de compra cargado en cada producto y de que las ventas y movimientos estén al día.
          </p>
        </>
      )}
    </section>
  );
}
