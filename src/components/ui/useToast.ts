import { createContext, useContext } from "react";

import type { ToastContextValue } from "./toast.types";

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider.");
  }

  return context;
}
