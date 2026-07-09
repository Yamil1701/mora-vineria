import { useAlmacenamientoPersistente } from "../hooks/useAlmacenamientoPersistente";

export function AvisoDatosLocales() {
  const { estado, cargando, solicitar } = useAlmacenamientoPersistente();

  const textoEstado = {
    concedido: "El navegador intenta conservar estos datos en este dispositivo.",
    pendiente: "Podés activar una protección extra para que el navegador no borre estos datos automáticamente.",
    denegado: "No se pudo activar la protección extra. Los respaldos siguen siendo importantes.",
    no_soportado: "Este navegador no permite activar protección extra de almacenamiento.",
    error: "No se pudo consultar el estado del almacenamiento.",
  }[estado];

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-sm font-semibold text-white">Datos locales</p>

      <p className="mt-2 text-sm leading-6 text-white/65">
        Tus datos se guardan en este dispositivo. Te recomendamos hacer respaldos seguido.
      </p>

      <p className="mt-2 text-xs leading-5 text-white/45">{textoEstado}</p>

      {estado === "pendiente" && (
        <button
          type="button"
          onClick={solicitar}
          disabled={cargando}
          className="mt-4 w-full rounded-2xl bg-mora-principal px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {cargando ? "Revisando..." : "Activar protección extra"}
        </button>
      )}
    </section>
  );
}