export function ConfiguracionPage() {
  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="mt-1 text-sm text-white/65">
          Datos locales, respaldos y rol del dispositivo.
        </p>
      </header>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
        Tus datos se guardan en este dispositivo. Te recomendamos hacer respaldos seguido.
      </div>
    </section>
  );
}