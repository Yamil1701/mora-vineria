import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CondicionPago, DestinoTransferencia, MedioPago } from "../domain/ventas";

export type VistaProductos = "cards" | "compacta";

export interface ItemBorradorVenta {
  productoId: string;
  cantidad: number;
  precioUnitarioAplicado: number;
  observaciones?: string;
}

interface BorradorVenta {
  items: ItemBorradorVenta[];
  condicionPago: CondicionPago;
  medioPago: MedioPago;
  destinoTransferencia?: DestinoTransferencia;
  pagoCombinado: boolean;
  montoPagoPrincipal: number;
  medioPagoSecundario: MedioPago;
  destinoTransferenciaSecundario?: DestinoTransferencia;
  montoCobradoInicial: number;
  clienteFiadoNombre: string;
  clienteFiadoNota: string;
  vencimientoFiado: string;
  observaciones: string;
  actualizadoAt: string | null;
}

type PreferenciasUiState = {
  vistaProductos: VistaProductos;
  cambiarVistaProductos: (vista: VistaProductos) => void;
  borradorVenta: BorradorVenta;
  actualizarBorradorVenta: (borrador: Omit<BorradorVenta, "actualizadoAt">) => void;
  vaciarBorradorVenta: () => void;
  posicionesScroll: Record<string, number>;
  guardarPosicionScroll: (clave: string, posicion: number) => void;
};

const borradorInicial: BorradorVenta = {
  items: [],
  condicionPago: "contado",
  medioPago: "efectivo",
  pagoCombinado: false,
  montoPagoPrincipal: 0,
  medioPagoSecundario: "transferencia",
  montoCobradoInicial: 0,
  clienteFiadoNombre: "",
  clienteFiadoNota: "",
  vencimientoFiado: "",
  observaciones: "",
  actualizadoAt: null,
};

export const usePreferenciasUi = create<PreferenciasUiState>()(
  persist(
    (set) => ({
      vistaProductos: "compacta",
      cambiarVistaProductos: (vistaProductos) => set({ vistaProductos }),
      borradorVenta: borradorInicial,
      actualizarBorradorVenta: (borrador) =>
        set({
          borradorVenta: {
            ...borrador,
            actualizadoAt: new Date().toISOString(),
          },
        }),
      vaciarBorradorVenta: () => set({ borradorVenta: borradorInicial }),
      posicionesScroll: {},
      guardarPosicionScroll: (clave, posicion) =>
        set((state) => ({
          posicionesScroll: {
            ...state.posicionesScroll,
            [clave]: posicion,
          },
        })),
    }),
    {
      name: "mora-vineria-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        vistaProductos: state.vistaProductos,
        borradorVenta: state.borradorVenta,
      }),
    },
  ),
);
