import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";
import { useConfirm } from "../components/ui";

export interface UnsavedChangesSheetBridge {
  setDirty: (dirty: boolean) => void;
  registerPermitNavigation: (permit: (() => void) | null) => void;
}

export const UnsavedChangesContext = createContext<UnsavedChangesSheetBridge | null>(null);

export function useUnsavedChanges(dirty: boolean) {
  const confirm = useConfirm();
  const sheetBridge = useContext(UnsavedChangesContext);
  const permitirNavegacion = useRef(false);
  const confirmando = useRef(false);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    const cambiaRuta = `${currentLocation.pathname}${currentLocation.search}`
      !== `${nextLocation.pathname}${nextLocation.search}`;
    if (!cambiaRuta) return false;
    if (permitirNavegacion.current) {
      permitirNavegacion.current = false;
      return false;
    }
    return dirty;
  });

  const pedirConfirmacion = useCallback(() => confirm({
    title: "Salir sin guardar",
    description: "Los cambios que hiciste en este formulario se perderán.",
    confirmLabel: "Salir igualmente",
    tone: "danger",
  }), [confirm]);

  const permitirSiguienteNavegacion = useCallback(() => {
    permitirNavegacion.current = true;
    sheetBridge?.setDirty(false);
  }, [sheetBridge]);

  useEffect(() => {
    sheetBridge?.setDirty(dirty);
    return () => sheetBridge?.setDirty(false);
  }, [dirty, sheetBridge]);

  useEffect(() => {
    sheetBridge?.registerPermitNavigation(permitirSiguienteNavegacion);
    return () => sheetBridge?.registerPermitNavigation(null);
  }, [permitirSiguienteNavegacion, sheetBridge]);

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
        sheetBridge?.setDirty(false);
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }).finally(() => { confirmando.current = false; });
  }, [blocker, pedirConfirmacion, sheetBridge]);

  const confirmarSalida = async () => {
    if (!dirty) return true;
    const salir = await pedirConfirmacion();
    if (salir) permitirSiguienteNavegacion();
    return salir;
  };

  return { confirmarSalida, permitirSiguienteNavegacion };
}
