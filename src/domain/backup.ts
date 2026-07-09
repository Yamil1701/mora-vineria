import type { Categoria, Producto } from "./productos";
import type { DetalleVenta, Venta } from "./ventas";
import type { DetalleReposicion, Movimiento } from "./movimientos";

export type RolDispositivo = "principal" | "consulta";

export interface Configuracion {
  id: string;
  deviceId: string;
  deviceRole: RolDispositivo;
  porcentajeStockBajo: number;
  porcentajeStockCritico: number;
  createdAt: string;
  updatedAt: string;
}

export interface MetaMensual {
  id: string;
  mes: string;
  metaVentas: number;
  createdAt: string;
  updatedAt: string;
}

export interface BackupMetadata {
  id: string;
  backupId: string;
  exportedAt: string;
  schemaVersion: number;
  deviceId: string;
  deviceRole: RolDispositivo;
  lastDataChangeAt: string;
}

export interface BackupMoraVineria {
  app: "Mora Vinería";
  schemaVersion: number;
  backupId: string;
  deviceId: string;
  deviceRole: RolDispositivo;
  exportedAt: string;
  lastDataChangeAt: string;
  data: {
    categorias: Categoria[];
    productos: Producto[];
    ventas: Venta[];
    detalleVentas: DetalleVenta[];
    movimientos: Movimiento[];
    detalleReposiciones: DetalleReposicion[];
    configuracion: Configuracion | null;
    metasMensuales: MetaMensual[];
    backupMetadata: BackupMetadata[];
  };
}