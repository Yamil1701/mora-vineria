export type SemanaDelMes = 1 | 2 | 3 | 4;

export interface RangoFechas {
  desde: string;
  hasta: string;
}

export interface ResumenReporte {
  totalVendido: number;
  costoEstimadoVendido: number;
  gananciaBrutaEstimada: number;
  gastosPuntuales: number;
  reinversion: number;
  aportesExternos: number;
  gananciaNetaEstimada: number;
}