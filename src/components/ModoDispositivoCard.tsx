import { useState } from "react";

import type { ModoDispositivo } from "../domain/backup";
import { useConfiguracionLocal } from "../hooks/useConfiguracionLocal";
import { useConfirm, useToast } from "./ui";

const opciones: Array<{
  value: ModoDispositivo;
  titulo: string;
  descripcion: string;
}> = [
  {
    value: "principal",
    titulo: "Celular principal",
    descripcion: "Permite cargar ventas, productos y movimientos.",
  },
  {
    value: "consulta",
    titulo: "Celular de consulta",
    descripcion: "Pensado para ver datos importados desde una copia.",
  },
];

export function ModoDispositivoCard() {
  const confirm = useConfirm();
  const toast = useToast();
  const { configuracion, estado, cambiarModoDispositivo } = useConfiguracionLocal();
  const [guardando, setGuardando] = useState(false);

  async function manejarCambio(deviceRole: ModoDispositivo) {
    if (deviceRole === configuracion?.deviceRole) return;

    const opcion = opciones.find((item) => item.value === deviceRole);
    const confirmado = await confirm({
      title: `Cambiar a ${opcion?.titulo.toLocaleLowerCase("es-AR") ?? "otro modo"}`,
      description: deviceRole === "consulta"
        ? "Las acciones de venta, productos y movimientos quedarán ocultas en este dispositivo."
        : "Este dispositivo podrá volver a registrar ventas, productos y movimientos.",
      confirmLabel: "Cambiar modo",
    });
    if (!confirmado) return;

    setGuardando(true);

    try {
      await cambiarModoDispositivo(deviceRole);
      toast.success("Modo del dispositivo actualizado");
    } finally {
      setGuardando(false);
    }
  }

  if (estado === "cargando") {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
        Cargando configuración del dispositivo...
      </section>
    );
  }

  if (estado === "error" || !configuracion) {
    return (
      <section className="rounded-3xl border border-mora-error/40 bg-white/[0.04] p-4 text-sm text-white/65">
        No se pudo leer la configuración del dispositivo.
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <div>
        <p className="text-sm font-semibold text-white">Modo del dispositivo</p>
        <p className="mt-2 text-sm leading-6 text-white/65">
          Este dato ayuda a distinguir el celular donde se cargan datos del celular usado solo para consultar.
        </p>
      </div>

      <div className="grid gap-3">
        {opciones.map((opcion) => {
          const activo = configuracion.deviceRole === opcion.value;

          return (
            <button
              key={opcion.value}
              type="button"
              onClick={() => void manejarCambio(opcion.value)}
              disabled={guardando}
              className={[
                "rounded-3xl border p-4 text-left transition disabled:opacity-60",
                activo
                  ? "border-mora-principal bg-mora-principal/15"
                  : "border-white/10 bg-black/10 hover:bg-white/[0.06]",
              ].join(" ")}
            >
              <span className="block text-sm font-semibold text-white">
                {opcion.titulo}
              </span>
              <span className="mt-1 block text-sm leading-5 text-white/60">
                {opcion.descripcion}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs leading-5 text-white/45">
        En modo consulta podés revisar datos, pero las acciones operativas quedan bloqueadas.
      </p>
    </section>
  );
}
