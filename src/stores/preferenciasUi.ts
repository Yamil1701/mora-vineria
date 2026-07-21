import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CondicionPago, DestinoTransferencia, MedioPago } from "../domain/ventas";

export type VistaProductos = "cards" | "compacta";
export type TemaApp = "oscuro" | "claro";

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
  ultimoPdfMensualAtendido: string | null;
  marcarPdfMensualAtendido: (mes: string) => void;
  tema: TemaApp;
  cambiarTema: (tema: TemaApp) => void;
  resguardoCajaReposicion: number;
  cambiarResguardoCajaReposicion: (monto: number) => void;
  productosNoReponer: string[];
  clavePlanReposicion: string | null;
  sincronizarPlanReposicion: (clave: string) => void;
  cambiarProductoNoReponer: (productoId: string, excluir: boolean) => void;
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
      ultimoPdfMensualAtendido: null,
      marcarPdfMensualAtendido: (ultimoPdfMensualAtendido) => set({ ultimoPdfMensualAtendido }),
      tema: "oscuro",
      cambiarTema: (tema) => set({ tema }),
      resguardoCajaReposicion: 50_000,
      cambiarResguardoCajaReposicion: (resguardoCajaReposicion) => set({
        resguardoCajaReposicion: Math.max(0, Math.round(resguardoCajaReposicion || 0)),
      }),
      productosNoReponer: [],
      clavePlanReposicion: null,
      sincronizarPlanReposicion: (clavePlanReposicion) => set((state) => state.clavePlanReposicion === clavePlanReposicion
        ? state
        : { clavePlanReposicion, productosNoReponer: [] }),
      cambiarProductoNoReponer: (productoId, excluir) => set((state) => ({
        productosNoReponer: excluir
          ? Array.from(new Set([...state.productosNoReponer, productoId]))
          : state.productosNoReponer.filter((id) => id !== productoId),
      })),
    }),
    {
      name: "mora-vineria-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        vistaProductos: state.vistaProductos,
        borradorVenta: state.borradorVenta,
        ultimoPdfMensualAtendido: state.ultimoPdfMensualAtendido,
        tema: state.tema,
        resguardoCajaReposicion: state.resguardoCajaReposicion,
        productosNoReponer: state.productosNoReponer,
        clavePlanReposicion: state.clavePlanReposicion,
      }),
    },
  ),
);
