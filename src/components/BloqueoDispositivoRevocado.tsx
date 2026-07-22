import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useVinculoDispositivo } from "../hooks/useVinculoDispositivo";
import { prepararNuevaVinculacion } from "../sync/vinculacion";
import { BrandMark } from "./Brand";
import { Button, ButtonLink, Spinner } from "./ui";

const RUTAS_PERMITIDAS = [
  "/configuracion/respaldos",
];

export function BloqueoDispositivoRevocado() {
  const { estado } = useVinculoDispositivo();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [preparando, setPreparando] = useState(false);

  if (estado !== "revocado" || RUTAS_PERMITIDAS.some((ruta) => pathname.startsWith(ruta))) {
    return null;
  }

  async function volverAVincular() {
    setPreparando(true);
    try {
      await prepararNuevaVinculacion();
      navigate("/configuracion/sincronizacion/vincular", { replace: true });
    } finally {
      setPreparando(false);
    }
  }

  return (
    <div className="pdf-no-print fixed inset-0 z-[90] flex items-center justify-center bg-mora-fondo/92 p-5 backdrop-blur-md" role="alertdialog" aria-modal="true" aria-labelledby="titulo-revocado">
      <section className="w-full max-w-sm rounded-[2rem] border border-red-400/30 bg-mora-superficieElevada p-6 text-center shadow-2xl">
        <BrandMark appIcon className="mx-auto h-16 w-16 rounded-2xl opacity-80" />
        <h1 id="titulo-revocado" className="mt-4 text-xl font-bold text-white">Este celular fue revocado</h1>
        <p className="mt-2 text-sm leading-6 text-white/60">Los datos guardados siguen en este dispositivo, pero ya no se pueden cargar ni modificar operaciones hasta volver a vincularlo.</p>
        <div className="mt-5 space-y-3">
          <Button fullWidth disabled={preparando} onClick={() => void volverAVincular()}>
            {preparando ? <><Spinner size="sm" label="Preparando" /> Preparando…</> : "Volver a vincular"}
          </Button>
          <ButtonLink fullWidth variant="secondary" to="/configuracion/respaldos">Exportar un respaldo</ButtonLink>
        </div>
      </section>
    </div>
  );
}
