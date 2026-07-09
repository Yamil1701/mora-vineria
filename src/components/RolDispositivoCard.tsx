import { useState } from "react";

import type { RolDispositivo } from "../domain/backup";
import { useConfiguracionLocal } from "../hooks/useConfiguracionLocal";

const opciones: Array<{
  value: RolDispositivo;
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

export function RolDispositivoCard() {
  const { configuracion, estado, cambiarRolDispositivo } = useConfiguracionLocal();
  const [guardando, setGuardando] = useState(false);

  async function manejarCambio(deviceRole: RolDispositivo) {
    if (deviceRole === configuracion?.deviceRole) return;

    setGuardando(true);

    try {
      await cambiarRolDispositivo(deviceRole);
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
        <p className="text-sm font-semibold text-white">Rol del dispositivo</p>
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
        En esta etapa el rol queda guardado. El bloqueo de acciones para el celular de consulta se aplicará cuando existan formularios de carga.
      </p>
    </section>
  );
}