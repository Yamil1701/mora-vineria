export type TipoDispositivoRemoto = "principal" | "vinculado";
export type ModoDispositivoRemoto = "operacion" | "consulta";
export type EstadoDispositivoRemoto = "activo" | "revocado";

export type EstadoOperacionSincronizacion =
  | "pendiente"
  | "enviando"
  | "sincronizada"
  | "conflicto"
  | "error";

export type EstadoConflictoSincronizacion = "pendiente" | "resuelto";

export interface VinculoDispositivoLocal {
  id: "vinculo-actual";
  negocioId: string;
  dispositivoRemotoId: string;
  authUserId: string;
  nombreDispositivo: string;
  tipo: TipoDispositivoRemoto;
  modo: ModoDispositivoRemoto;
  estado: EstadoDispositivoRemoto;
  vinculadoAt: string;
  updatedAt: string;
}

export interface OperacionSincronizacionLocal {
  id: string;
  negocioId: string;
  dispositivoId: string;
  tipoOperacion: string;
  tipoEntidad: string;
  entidadId: string;
  payload: unknown;
  estado: EstadoOperacionSincronizacion;
  intentos: number;
  creadaAt: string;
  actualizadaAt: string;
  ultimoIntentoAt?: string | null;
  ultimoError?: string | null;
}

export interface EstadoSincronizacionLocal {
  id: "estado-actual";
  negocioId?: string | null;
  ultimoCursorRemoto: number;
  ultimaSincronizacionAt?: string | null;
  ultimoError?: string | null;
  updatedAt: string;
}

export interface ConflictoSincronizacionLocal {
  id: string;
  negocioId: string;
  operacionId: string;
  tipo: string;
  tipoEntidad: string;
  entidadId: string;
  detalle: unknown;
  estado: EstadoConflictoSincronizacion;
  creadoAt: string;
  resueltoAt?: string | null;
}

export interface ResultadoActivacionNegocio {
  negocioId: string;
  dispositivoId: string;
  codigoRecuperacion: string;
}

export interface ResultadoCodigoEmparejamiento {
  codigo: string;
  venceAt: string;
  modo: ModoDispositivoRemoto;
}

export interface ResultadoEmparejamiento {
  negocioId: string;
  dispositivoId: string;
  tipo: TipoDispositivoRemoto;
  modo: ModoDispositivoRemoto;
}

export interface DispositivoRemoto {
  id: string;
  negocioId: string;
  nombre: string;
  tipo: TipoDispositivoRemoto;
  modo: ModoDispositivoRemoto;
  estado: EstadoDispositivoRemoto;
  creadoAt: string;
  ultimaActividadAt?: string | null;
}
