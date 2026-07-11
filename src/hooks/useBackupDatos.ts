import { useState } from "react";

import { crearBackupJson, leerBackupJson, restaurarBackupJson } from "../db";
import type { BackupMoraVineria, ResumenBackupMoraVineria } from "../domain/backup";
import { crearResumenBackup } from "../domain/backup";
import { BACKUP_ACTUALIZADO_EVENT } from "./useEstadoRespaldo";

type EstadoBackup = "idle" | "procesando" | "error";

function descargarArchivoJson(json: string, fileName: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

async function compartirArchivoJson(json: string, fileName: string): Promise<boolean> {
  const archivo = new File([json], fileName, { type: "application/json" });
  const data: ShareData = {
    title: "Respaldo Mora Vinería",
    text: "Copia de datos de Mora Vinería.",
    files: [archivo],
  };

  if (!("share" in navigator)) return false;

  if ("canShare" in navigator && typeof navigator.canShare === "function") {
    if (!navigator.canShare(data)) return false;
  }

  await navigator.share(data);

  return true;
}

export function useBackupDatos() {
  const [estado, setEstado] = useState<EstadoBackup>("idle");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backupImportado, setBackupImportado] = useState<BackupMoraVineria | null>(null);
  const [resumenImportado, setResumenImportado] = useState<ResumenBackupMoraVineria | null>(null);

  async function exportarBackup(modo: "descargar" | "compartir") {
    try {
      setEstado("procesando");
      setError(null);
      setMensaje(null);

      const resultado = await crearBackupJson();
      window.dispatchEvent(new Event(BACKUP_ACTUALIZADO_EVENT));

      if (modo === "compartir") {
        const compartido = await compartirArchivoJson(resultado.json, resultado.fileName);

        if (compartido) {
          setMensaje("Respaldo listo para compartir.");
          return;
        }
      }

      descargarArchivoJson(resultado.json, resultado.fileName);
      setMensaje("Respaldo descargado.");
    } catch (errorDesconocido) {
      if (errorDesconocido instanceof DOMException && errorDesconocido.name === "AbortError") {
        setMensaje("No se compartió el respaldo.");
        return;
      }

      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo generar el respaldo.",
      );
    } finally {
      setEstado("idle");
    }
  }

  async function leerArchivo(file: File) {
    try {
      setEstado("procesando");
      setError(null);
      setMensaje(null);

      const texto = await file.text();
      const backup = leerBackupJson(texto);

      setBackupImportado(backup);
      setResumenImportado(crearResumenBackup(backup));
    } catch (errorDesconocido) {
      setBackupImportado(null);
      setResumenImportado(null);
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo leer el respaldo.",
      );
    } finally {
      setEstado("idle");
    }
  }

  async function restaurarBackup() {
    if (!backupImportado) return;

    try {
      setEstado("procesando");
      setError(null);
      setMensaje(null);

      await restaurarBackupJson(backupImportado);
      window.dispatchEvent(new Event(BACKUP_ACTUALIZADO_EVENT));
      setMensaje("Copia restaurada. Los datos quedaron actualizados en este dispositivo.");
      setBackupImportado(null);
      setResumenImportado(null);
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo restaurar la copia.",
      );
    } finally {
      setEstado("idle");
    }
  }

  function limpiarImportacion() {
    setBackupImportado(null);
    setResumenImportado(null);
    setError(null);
    setMensaje(null);
  }

  return {
    estado,
    mensaje,
    error,
    resumenImportado,
    exportarBackup,
    leerArchivo,
    restaurarBackup,
    limpiarImportacion,
  };
}
