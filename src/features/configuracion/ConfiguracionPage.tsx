import { AvisoDatosLocales } from "../../components/AvisoDatosLocales";

export function ConfiguracionPage() {
  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="mt-1 text-sm text-white/65">
          Datos locales, respaldos y rol del dispositivo.
        </p>
      </header>

      <AvisoDatosLocales />

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-semibold text-white">Respaldos</p>
        <p className="mt-2 text-sm leading-6 text-white/65">
          La exportación y restauración de respaldos se implementará en una próxima capa.
        </p>
      </section>
    </section>
  );
}