export function ReportesPage() {
  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="mt-1 text-sm text-white/65">
          Resumen de hoy, semana del mes, mes y rango personalizado.
        </p>
      </header>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
        Los reportes se conectarán cuando tengamos ventas, movimientos y productos.
      </div>
    </section>
  );
}