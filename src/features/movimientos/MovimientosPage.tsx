export function MovimientosPage() {
  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Movimientos</h1>
        <p className="mt-1 text-sm text-white/65">
          Reposición, aportes externos y gastos puntuales.
        </p>
      </header>

      <div className="grid gap-3">
        <button className="rounded-3xl bg-mora-principal px-5 py-4 font-semibold text-white">
          Registrar reposición
        </button>
        <button className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 font-semibold text-white">
          Registrar aporte externo
        </button>
        <button className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 font-semibold text-white">
          Registrar gasto puntual
        </button>
      </div>
    </section>
  );
}