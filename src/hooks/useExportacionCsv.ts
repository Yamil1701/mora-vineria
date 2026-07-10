import { useState } from "react";

import {
  exportarMovimientosCsv,
  exportarProductosCsv,
  exportarVentasCsv,
  type ArchivoCsvExportado,
} from "../db";

type EstadoExportacionCsv = "idle" | "procesando" | "error";
type TipoCsv = "productos" | "ventas" | "movimientos";

function descargarArchivoCsv(archivo: ArchivoCsvExportado) {
  const blob = new Blob([`\ufeff${archivo.csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = archivo.fileName;
  link.click();

  URL.revokeObjectURL(url);
}

function obtenerMensaje(tipo: TipoCsv): string {
  if (tipo === "productos") return "CSV de productos descargado.";
  if (tipo === "ventas") return "CSV de ventas descargado.";

  return "CSV de movimientos descargado.";
}

export function useExportacionCsv() {
  const [estadoCsv, setEstadoCsv] = useState<EstadoExportacionCsv>("idle");
  const [mensajeCsv, setMensajeCsv] = useState<string | null>(null);
  const [errorCsv, setErrorCsv] = useState<string | null>(null);

  async function exportarCsv(tipo: TipoCsv) {
    try {
      setEstadoCsv("procesando");
      setMensajeCsv(null);
      setErrorCsv(null);

      const archivo = await (tipo === "productos"
        ? exportarProductosCsv()
        : tipo === "ventas"
          ? exportarVentasCsv()
          : exportarMovimientosCsv());

      descargarArchivoCsv(archivo);
      setMensajeCsv(obtenerMensaje(tipo));
    } catch (errorDesconocido) {
      setEstadoCsv("error");
      setErrorCsv(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo exportar el CSV.",
      );
      return;
    }

    setEstadoCsv("idle");
  }

  return {
    estadoCsv,
    mensajeCsv,
    errorCsv,
    exportarProductosCsv: () => exportarCsv("productos"),
    exportarVentasCsv: () => exportarCsv("ventas"),
    exportarMovimientosCsv: () => exportarCsv("movimientos"),
  };
}
