import type { CuentaTesoreriaConSaldo } from "../../domain/tesoreria";

export interface PagoReposicionSugerido {
  cuentaTesoreriaId: string;
  monto: number;
}

export function sugerirPagoReposicion(
  total: number,
  cuentas: CuentaTesoreriaConSaldo[],
): PagoReposicionSugerido[] {
  if (total <= 0) return [];
  const ordenadas = [...cuentas]
    .filter((cuenta) => cuenta.estado === "activa" && cuenta.saldo > 0)
    .sort((a, b) => {
      if (a.tipo !== b.tipo) return a.tipo === "efectivo" ? -1 : 1;
      if (a.esPredeterminada !== b.esPredeterminada) return a.esPredeterminada ? -1 : 1;
      return b.saldo - a.saldo;
    });
  let pendiente = total;
  const pagos: PagoReposicionSugerido[] = [];
  for (const cuenta of ordenadas) {
    if (pendiente <= 0) break;
    const monto = Math.min(cuenta.saldo, pendiente);
    pagos.push({ cuentaTesoreriaId: cuenta.id, monto });
    pendiente -= monto;
  }
  return pendiente <= 0.01 && pagos.length > 1 ? pagos : [];
}
