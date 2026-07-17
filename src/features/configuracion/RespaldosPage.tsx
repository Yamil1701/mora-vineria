import { useRef, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Button, ErrorState, Notice, Panel, Spinner, TaskHeader, useConfirm } from "../../components/ui";
import { useBackupDatos } from "../../hooks/useBackupDatos";
import { useEstadoRespaldo } from "../../hooks/useEstadoRespaldo";

const formatearFecha = (fecha: string) => new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(fecha));

export function RespaldosPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { estado, mensaje, error, resumenImportado, exportarBackup, leerArchivo, restaurarBackup, limpiarImportacion } = useBackupDatos();
  const { ultimoRespaldo, estado: estadoRespaldo } = useEstadoRespaldo();
  const procesando = estado === "procesando";
  async function seleccionar(event: ChangeEvent<HTMLInputElement>) { const archivo = event.target.files?.[0]; if (archivo) await leerArchivo(archivo); event.target.value = ""; }
  async function restaurar() {
    const confirmado = await confirm({ title: "Restaurar copia", description: "Se reemplazarán productos, ventas, movimientos, tesorería, metas y respaldos. El identificador y modo de este dispositivo se conservarán.", confirmLabel: "Restaurar copia", tone: "danger" });
    if (confirmado) await restaurarBackup();
  }
  return <section className="space-y-5">
    <TaskHeader title="Respaldos" description="JSON es la copia completa y recuperable de Mora Vinería." backLabel="Configuración" onBack={() => navigate("/configuracion")} />
    {estadoRespaldo && estadoRespaldo !== "vigente" && (
      <Notice tone="warning">
        {estadoRespaldo === "sin_respaldo"
          ? "Todavía no creaste un respaldo. Hacé una primera copia para poder recuperar tus datos si la necesitás."
          : "Tu último respaldo tiene más de 7 días. Te recomendamos crear una copia actualizada."}
      </Notice>
    )}
    {mensaje && <Notice tone="success">{mensaje}</Notice>}{error && <ErrorState message={error} onRetry={() => resumenImportado ? void restaurar() : inputRef.current?.click()} />}
    <Panel className="space-y-4"><div><h2 className="text-lg font-semibold">Crear una copia</h2><p className="mt-1 text-sm leading-6 text-white/60">Guardala fuera de este dispositivo para poder recuperar los datos.</p>{ultimoRespaldo && <p className="mt-2 text-xs text-white/45">Último respaldo: {formatearFecha(ultimoRespaldo.exportedAt)}</p>}</div><Button size="lg" fullWidth leftIcon={procesando ? <Spinner size="sm" label="Preparando respaldo" /> : undefined} disabled={procesando} onClick={() => void exportarBackup("descargar")}>{procesando ? "Preparando respaldo…" : "Descargar respaldo JSON"}</Button><Button variant="secondary" fullWidth disabled={procesando} onClick={() => void exportarBackup("compartir")}>Compartir respaldo</Button></Panel>
    <Panel className="space-y-4"><div><h2 className="text-lg font-semibold">Restaurar una copia</h2><p className="mt-1 text-sm leading-6 text-white/60">Primero vas a revisar un resumen. Nada se reemplaza al elegir el archivo.</p></div><input ref={inputRef} type="file" accept="application/json,.json" onChange={(event) => void seleccionar(event)} className="hidden" /><Button variant="secondary" fullWidth disabled={procesando} onClick={() => inputRef.current?.click()}>Elegir archivo JSON</Button></Panel>
    {resumenImportado && <Panel className="animate-mora-enter space-y-4 border-mora-advertencia/30 bg-mora-advertencia/10"><div><h2 className="text-lg font-semibold text-yellow-100">Revisá la copia</h2><p className="mt-1 text-sm text-white/65">Esta acción reemplazará los datos operativos actuales.</p></div><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-white/45">Fecha</dt><dd className="mt-1 font-semibold">{formatearFecha(resumenImportado.exportedAt)}</dd></div><div><dt className="text-white/45">Origen</dt><dd className="mt-1 font-semibold">{resumenImportado.deviceRole === "principal" ? "Principal" : "Consulta"}</dd></div><div><dt className="text-white/45">Productos</dt><dd className="mt-1 font-semibold">{resumenImportado.cantidades.productos}</dd></div><div><dt className="text-white/45">Ventas</dt><dd className="mt-1 font-semibold">{resumenImportado.cantidades.ventas}</dd></div><div><dt className="text-white/45">Movimientos</dt><dd className="mt-1 font-semibold">{resumenImportado.cantidades.movimientos}</dd></div><div><dt className="text-white/45">Cuentas</dt><dd className="mt-1 font-semibold">{resumenImportado.cantidades.cuentasTesoreria}</dd></div><div><dt className="text-white/45">Versión</dt><dd className="mt-1 font-semibold">{resumenImportado.schemaVersion}</dd></div></dl><Notice>Se conservarán el identificador y el modo de este dispositivo.</Notice><div className="grid grid-cols-2 gap-3"><Button variant="secondary" disabled={procesando} onClick={limpiarImportacion}>Cancelar</Button><Button variant="danger" disabled={procesando} onClick={() => void restaurar()}>Restaurar</Button></div></Panel>}
  </section>;
}
