import { createContext, useContext } from "react";

import type { ConfirmContextValue } from "./confirm.types";

export const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error("useConfirm debe usarse dentro de ConfirmProvider.");
  }

  return context;
}
