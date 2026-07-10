import { Link } from "react-router-dom";

import { AvisoDatosLocales } from "../../components/AvisoDatosLocales";
import { useResumenes } from "../../hooks/useResumenes";
import { formatearPesos } from "../../utils/dinero";

function ResumenCard({ label, valor, detalle }: { label: string; valor: string; detalle?: string }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-sm text-white/60">{label}</p>
      <p className="mt-2 text-2xl font-bold">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-white/45">{detalle}</p>}
    </article>
  );
}

function AccesoRapido({
  to,
  titulo,
  descripcion,
}: {
  to: string;
  titulo: string;
  descripcion: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.08]"
    >
      <span className="text-sm font-semibold text-white">{titulo}</span>
      <span className="mt-1 block text-xs leading-5 text-white/50">{descripcion}</span>
    </Link>
  );
}

export function InicioPage() {
  const { resumenes, cargando, error } = useResumenes();
  const productoMasVendido = resumenes?.mes.productosMasVendidos[0];

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <p className="text-sm text-mora-suave">Mora Vinería</p>
        <h1 className="text-2xl font-bold">Resumen de hoy</h1>
        <p className="text-sm text-white/65">
          Este resumen toma las ventas desde las 08:00 hasta las 07:59 del día siguiente.
        </p>
      </header>

      <Link
        to="/ventas/nueva"
        className="block rounded-3xl bg-mora-principal px-5 py-4 text-center text-base font-semibold text-white shadow-card active:bg-mora-principalActivo"
      >
        Nueva venta
      </Link>

      {cargando && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
          Cargando resumen...
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-mora-error/40 bg-white/[0.04] p-4 text-sm text-white/65">
          {error}
        </div>
      )}

      {resumenes && (
        <>
          <section className="grid gap-3">
            <ResumenCard
              label="Ventas de hoy"
              valor={formatearPesos(resumenes.hoy.totalVendido)}
              detalle={`${resumenes.hoy.cantidadVentas} venta${resumenes.hoy.cantidadVentas === 1 ? "" : "s"}`}
            />

            <ResumenCard
              label="Ganancia estimada de hoy"
              valor={formatearPesos(resumenes.hoy.gananciaBrutaEstimada)}
              detalle="Según el costo cargado en cada producto."
            />

            <ResumenCard
              label="Movimientos de hoy"
              valor={formatearPesos(
                resumenes.hoy.reinversion +
                  resumenes.hoy.aportesExternos +
                  resumenes.hoy.gastosPuntuales,
              )}
              detalle={`${resumenes.hoy.cantidadMovimientos} movimiento${resumenes.hoy.cantidadMovimientos === 1 ? "" : "s"}`}
            />
          </section>

          <section className="grid grid-cols-2 gap-3">
            <ResumenCard
              label="Ventas de la semana"
              valor={formatearPesos(resumenes.semana.totalVendido)}
            />
            <ResumenCard
              label="Ganancia semanal"
              valor={formatearPesos(resumenes.semana.gananciaBrutaEstimada)}
            />
            <ResumenCard
              label="Ventas del mes"
              valor={formatearPesos(resumenes.mes.totalVendido)}
            />
            <ResumenCard
              label="Ganancia del mes"
              valor={formatearPesos(resumenes.mes.gananciaNetaEstimada)}
              detalle="Descuenta gastos puntuales."
            />
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-white/60">Producto más vendido del mes</p>
            {productoMasVendido ? (
              <div className="mt-2">
                <p className="text-lg font-semibold text-white">{productoMasVendido.nombre}</p>
                <p className="mt-1 text-sm text-white/55">
                  {productoMasVendido.cantidad} unidad{productoMasVendido.cantidad === 1 ? "" : "es"} · {formatearPesos(productoMasVendido.totalVendido)}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-white/55">Todavía no hay ventas este mes.</p>
            )}
          </section>
        </>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Accesos rápidos</h2>
          <p className="mt-1 text-sm text-white/55">Entradas útiles sin cambiar la barra principal.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <AccesoRapido
            to="/movimientos"
            titulo="Movimientos"
            descripcion="Reposición, aportes y gastos puntuales."
          />
          <AccesoRapido
            to="/productos"
            titulo="Productos"
            descripcion="Precios, stock y categorías."
          />
          <AccesoRapido
            to="/proyecciones"
            titulo="Proyecciones"
            descripcion="Guía orientativa del mes."
          />
          <AccesoRapido
            to="/configuracion"
            titulo="Datos"
            descripcion="Respaldos, CSV y rol del celular."
          />
        </div>
      </section>

      <AvisoDatosLocales />
    </section>
  );
}
