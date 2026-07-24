import { describe, expect, it } from "vitest";

import type { CuentaTesoreriaConSaldo } from "../domain/tesoreria";
import {
  obtenerCargaHabitualReposicion,
  sugerirPagoReposicion,
} from "../features/movimientos/reposicion.ui";

const cuenta = (
  id: string,
  tipo: CuentaTesoreriaConSaldo["tipo"],
  saldo: number,
  esPredeterminada = false,
): CuentaTesoreriaConSaldo => ({
  id,
  nombre: id,
  tipo,
  saldo,
  estado: "activa",
  esPredeterminada,
  createdAt: "2026-07-21T00:00:00.000Z",
  updatedAt: "2026-07-21T00:00:00.000Z",
});

describe("sugerirPagoReposicion", () => {
  it("usa primero efectivo y completa el faltante con la cuenta digital", () => {
    expect(sugerirPagoReposicion(104_200, [
      cuenta("tarjeta", "digital", 80_000, true),
      cuenta("caja", "efectivo", 52_400, true),
    ])).toEqual([
      { cuentaTesoreriaId: "caja", monto: 52_400 },
      { cuentaTesoreriaId: "tarjeta", monto: 51_800 },
    ]);
  });

  it("no propone una distribución si una cuenta de efectivo alcanza", () => {
    expect(sugerirPagoReposicion(40_000, [
      cuenta("caja", "efectivo", 52_400, true),
      cuenta("tarjeta", "digital", 80_000, true),
    ])).toEqual([]);
  });

  it("no propone un pago que igualmente dejaría saldo faltante", () => {
    expect(sugerirPagoReposicion(150_000, [
      cuenta("caja", "efectivo", 52_400, true),
      cuenta("tarjeta", "digital", 80_000, true),
    ])).toEqual([]);
  });
});

describe("obtenerCargaHabitualReposicion", () => {
  it("autocompleta packs con las unidades configuradas en el producto", () => {
    expect(obtenerCargaHabitualReposicion({
      modoCompraHabitual: "pack",
      unidadesPorPack: 10,
    })).toEqual({
      modoCarga: "bultos",
      unidadesPorBulto: 10,
    });
  });

  it("mantiene carga por unidad para productos anteriores o configurados así", () => {
    expect(obtenerCargaHabitualReposicion({})).toEqual({
      modoCarga: "unidades",
      unidadesPorBulto: 1,
    });
  });
});
