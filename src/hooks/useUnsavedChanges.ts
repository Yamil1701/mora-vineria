import { createContext, useContext, useEffect } from "react";
import { useConfirm } from "../components/ui";

export const UnsavedChangesContext = createContext<((dirty: boolean) => void) | null>(null);

export function useUnsavedChanges(dirty: boolean) {
  const confirm = useConfirm();
  const registrarEnSheet = useContext(UnsavedChangesContext);

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

  return async () => {
    if (!dirty) return true;
    const salir = await confirm({
      title: "Salir sin guardar",
      description: "Los cambios que hiciste en este formulario se perderán.",
      confirmLabel: "Salir igualmente",
      tone: "danger",
    });
    if (salir) registrarEnSheet?.(false);
    return salir;
  };
}
