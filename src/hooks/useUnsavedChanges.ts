import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";
import { useConfirm } from "../components/ui";

export const UnsavedChangesContext = createContext<((dirty: boolean) => void) | null>(null);

export function useUnsavedChanges(dirty: boolean) {
  const confirm = useConfirm();
  const registrarEnSheet = useContext(UnsavedChangesContext);
  const permitirNavegacion = useRef(false);
  const confirmando = useRef(false);
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    dirty
    && !permitirNavegacion.current
    && `${currentLocation.pathname}${currentLocation.search}` !== `${nextLocation.pathname}${nextLocation.search}`,
  );

  const pedirConfirmacion = useCallback(() => confirm({
    title: "Salir sin guardar",
    description: "Los cambios que hiciste en este formulario se perderán.",
    confirmLabel: "Salir igualmente",
    tone: "danger",
  }), [confirm]);

  const permitirSiguienteNavegacion = useCallback(() => {
    permitirNavegacion.current = true;
    registrarEnSheet?.(false);
    window.setTimeout(() => { permitirNavegacion.current = false; }, 0);
  }, [registrarEnSheet]);

  useEffect(() => {
    registrarEnSheet?.(dirty);
    return () => registrarEnSheet?.(false);
  }, [dirty, registrarEnSheet]);

  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (blocker.state !== "blocked" || confirmando.current) return;
    confirmando.current = true;
    void pedirConfirmacion().then((salir) => {
      if (salir) {
        permitirSiguienteNavegacion();
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }).finally(() => { confirmando.current = false; });
  }, [blocker, pedirConfirmacion, permitirSiguienteNavegacion]);

  const confirmarSalida = async () => {
    if (!dirty) return true;
    const salir = await pedirConfirmacion();
    if (salir) permitirSiguienteNavegacion();
    return salir;
  };

  return { confirmarSalida, permitirSiguienteNavegacion };
}
