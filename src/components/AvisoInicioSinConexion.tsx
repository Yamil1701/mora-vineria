import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useState } from "react";

import { Button } from "./ui";

const CLAVE_AVISO_OFFLINE = "mora-vineria:aviso-inicio-offline:v1";
const inicioSinConexion = typeof navigator !== "undefined" && !navigator.onLine;

function avisoYaVisto(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_AVISO_OFFLINE) === "entendido";
  } catch {
    return false;
  }
}

export function AvisoInicioSinConexion() {
  const [abierto, setAbierto] = useState(() => inicioSinConexion && !avisoYaVisto());

  function confirmar() {
    try {
      window.localStorage.setItem(CLAVE_AVISO_OFFLINE, "entendido");
    } catch {
      // El aviso puede cerrarse aunque el navegador no permita persistir la preferencia.
    }
    setAbierto(false);
  }

  return (
    <AlertDialog.Root open={abierto}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="mora-dialog-overlay pdf-no-print fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <AlertDialog.Content className="mora-dialog-content pdf-no-print fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-[2rem] border border-white/10 bg-mora-fondo p-5 text-white shadow-card outline-none">
          <AlertDialog.Title className="text-lg font-bold leading-6">Estás usando la app sin conexión</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-6 text-white/65">
            Podés seguir trabajando con los datos guardados en este celular. La luz de sincronización te avisará cuando vuelva la conexión.
          </AlertDialog.Description>
          <AlertDialog.Action asChild>
            <Button fullWidth className="mt-5" onClick={confirmar}>Entendido</Button>
          </AlertDialog.Action>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
