import { create } from "zustand";

export type VistaProductos = "cards" | "compacta";

type PreferenciasUiState = {
  vistaProductos: VistaProductos;
  cambiarVistaProductos: (vista: VistaProductos) => void;
};

export const usePreferenciasUi = create<PreferenciasUiState>((set) => ({
  vistaProductos: "cards",
  cambiarVistaProductos: (vistaProductos) => set({ vistaProductos }),
}));
