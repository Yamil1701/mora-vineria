import { Link } from "react-router-dom";

export function VentasPage() {
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

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
        Todavía no hay ventas cargadas.
      </div>
    </section>
  );
}