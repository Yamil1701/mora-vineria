import { useRef, type ChangeEvent } from "react";

import { AvisoDatosLocales } from "../../components/AvisoDatosLocales";
import { RolDispositivoCard } from "../../components/RolDispositivoCard";
import { useBackupDatos } from "../../hooks/useBackupDatos";
import { useExportacionCsv } from "../../hooks/useExportacionCsv";

function formatearFecha(fechaIso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fechaIso));
}

function obtenerRolLabel(rol: string): string {
  return rol === "principal" ? "Celular principal" : "Celular de consulta";
}

export function ConfiguracionPage() {
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const {
    estado,
    mensaje,
    error,
    resumenImportado,
    exportarBackup,
    leerArchivo,
    restaurarBackup,
    limpiarImportacion,
  } = useBackupDatos();
  const {
    estadoCsv,
    mensajeCsv,
    errorCsv,
    exportarProductosCsv,
    exportarVentasCsv,
    exportarMovimientosCsv,
  } = useExportacionCsv();

  const procesando = estado === "procesando";
  const exportandoCsv = estadoCsv === "procesando";

  async function manejarArchivoSeleccionado(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    await leerArchivo(file);
    event.target.value = "";
  }

  async function confirmarRestauracion() {
    const confirma = window.confirm(
      "Esta restauración reemplaza productos, ventas, movimientos, metas y respaldos guardados en este dispositivo. El rol y el identificador de este celular se conservan. ¿Querés continuar?",
    );

    if (!confirma) return;

    await restaurarBackup();
  }

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="mt-1 text-sm text-white/65">
          Datos locales, respaldos y rol del dispositivo.
        </p>
      </header>

      <RolDispositivoCard />

      <AvisoDatosLocales />

      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <div>
          <p className="text-sm font-semibold text-white">Respaldos</p>
          <p className="mt-2 text-sm leading-6 text-white/65">
            Exportá una copia completa de los datos o restaurá una copia guardada en otro momento.
          </p>
        </div>

        {mensaje && (
          <div className="rounded-2xl border border-mora-exito/30 bg-mora-exito/10 p-3 text-sm text-green-100">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-mora-error/40 bg-mora-error/10 p-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => void exportarBackup("descargar")}
            disabled={procesando}
            className="rounded-3xl bg-mora-principal px-4 py-3 text-sm font-semibold text-white transition hover:bg-mora-principal-hover disabled:opacity-60"
          >
            {procesando ? "Preparando respaldo." : "Descargar respaldo JSON"}
          </button>

          <button
            type="button"
            onClick={() => void exportarBackup("compartir")}
            disabled={procesando}
            className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-60"
          >
            Compartir respaldo
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/10 p-4">
          <p className="text-sm font-semibold text-white">Restaurar copia</p>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Primero elegí el archivo. La app muestra un resumen antes de restaurar.
          </p>

          <input
            ref={inputFileRef}
            type="file"
            accept="application/json,.json"
            onChange={(event) => void manejarArchivoSeleccionado(event)}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => inputFileRef.current?.click()}
            disabled={procesando}
            className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Elegir archivo JSON
          </button>
        </div>

        {resumenImportado && (
          <div className="space-y-4 rounded-3xl border border-mora-advertencia/30 bg-mora-advertencia/10 p-4">
            <div>
              <p className="text-sm font-semibold text-yellow-100">Resumen de la copia</p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Revisá estos datos antes de restaurar. Esta acción reemplaza los datos actuales de este dispositivo.
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-white/45">Fecha</dt>
                <dd className="mt-1 font-semibold text-white">
                  {formatearFecha(resumenImportado.exportedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-white/45">Versión</dt>
                <dd className="mt-1 font-semibold text-white">
                  {resumenImportado.schemaVersion}
                </dd>
              </div>
              <div>
                <dt className="text-white/45">Origen</dt>
                <dd className="mt-1 font-semibold text-white">
                  {obtenerRolLabel(resumenImportado.deviceRole)}
                </dd>
              </div>
              <div>
                <dt className="text-white/45">Productos</dt>
                <dd className="mt-1 font-semibold text-white">
                  {resumenImportado.cantidades.productos}
                </dd>
              </div>
              <div>
                <dt className="text-white/45">Ventas</dt>
                <dd className="mt-1 font-semibold text-white">
                  {resumenImportado.cantidades.ventas}
                </dd>
              </div>
              <div>
                <dt className="text-white/45">Movimientos</dt>
                <dd className="mt-1 font-semibold text-white">
                  {resumenImportado.cantidades.movimientos}
                </dd>
              </div>
            </dl>

            <div className="rounded-2xl border border-white/10 bg-black/10 p-3 text-sm leading-6 text-white/65">
              Se conservan el rol y el identificador de este celular. Esto evita que dos celulares queden marcados como el mismo dispositivo.
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void confirmarRestauracion()}
                disabled={procesando}
                className="rounded-2xl bg-mora-principal px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                Restaurar copia
              </button>
              <button
                type="button"
                onClick={limpiarImportacion}
                disabled={procesando}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <div>
          <p className="text-sm font-semibold text-white">Exportar CSV</p>
          <p className="mt-2 text-sm leading-6 text-white/65">
            El respaldo JSON sigue siendo la copia principal. El CSV sirve como salida auxiliar para revisar datos en una planilla.
          </p>
        </div>

        {mensajeCsv && (
          <div className="rounded-2xl border border-mora-exito/30 bg-mora-exito/10 p-3 text-sm text-green-100">
            {mensajeCsv}
          </div>
        )}

        {errorCsv && (
          <div className="rounded-2xl border border-mora-error/40 bg-mora-error/10 p-3 text-sm text-red-100">
            {errorCsv}
          </div>
        )}

        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => void exportarProductosCsv()}
            disabled={exportandoCsv}
            className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-60"
          >
            Exportar productos CSV
          </button>
          <button
            type="button"
            onClick={() => void exportarVentasCsv()}
            disabled={exportandoCsv}
            className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-60"
          >
            Exportar ventas CSV
          </button>
          <button
            type="button"
            onClick={() => void exportarMovimientosCsv()}
            disabled={exportandoCsv}
            className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-60"
          >
            Exportar movimientos CSV
          </button>
        </div>
      </section>

    </section>
  );
}
