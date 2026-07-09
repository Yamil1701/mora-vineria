import { Link } from "react-router-dom";

import { AvisoDatosLocales } from "../../components/AvisoDatosLocales";

export function InicioPage() {
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

      <div className="grid gap-3">
        <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm text-white/60">Ventas de hoy</p>
          <p className="mt-2 text-2xl font-bold">$0</p>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm text-white/60">Ganancia estimada de hoy</p>
          <p className="mt-2 text-2xl font-bold">$0</p>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm text-white/60">Movimientos de hoy</p>
          <p className="mt-2 text-2xl font-bold">$0</p>
        </article>
      </div>

      <AvisoDatosLocales />
    </section>
  );
}