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
export type TipoEntidadCatalogo = "categoria" | "producto";
export type TipoOperacionCatalogo = "upsert" | "eliminar";
export type FaseSincronizacion =
  | "sin_configurar"
  | "sincronizado"
  | "pendiente"
  | "sincronizando"
  | "sin_conexion"
  | "alerta"
  | "error";

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
  fase?: FaseSincronizacion;
  pendientes?: number;
  conflictos?: number;
  catalogoInicializado?: boolean;
  updatedAt: string;
}

export interface VersionEntidadSincronizacionLocal {
  id: string;
  negocioId: string;
  tipoEntidad: TipoEntidadCatalogo;
  entidadId: string;
  versionRemota: number;
  updatedAt: string;
}

export interface PayloadOperacionCatalogo {
  baseVersion: number;
  entidad: unknown | null;
}

export interface CambioCatalogoRemoto {
  tipoEntidad: TipoEntidadCatalogo;
  entidadId: string;
  version: number;
  eliminada: boolean;
  entidad: unknown | null;
}

export interface ResultadoOperacionRemota {
  operacionId: string;
  secuencia: number;
  estado: "aplicada" | "conflicto" | "error";
  cambios: CambioCatalogoRemoto[];
  codigoError?: string | null;
  detalleError?: string | null;
  conflictoId?: string | null;
  conflictoResueltoId?: string | null;
  dispositivoId?: string | null;
}

export interface SnapshotCatalogoRemoto {
  inicializado: boolean;
  cursor: number;
  categorias: Array<{ entidad: unknown; version: number; eliminada: boolean }>;
  productos: Array<{ entidad: unknown; version: number; eliminada: boolean }>;
}

export interface LoteCambiosRemotos {
  cursor: number;
  hayMas: boolean;
  operaciones: ResultadoOperacionRemota[];
}

export interface EstadoSincronizacionVisible {
  fase: FaseSincronizacion;
  pendientes: number;
  conflictos: number;
  ultimaSincronizacionAt?: string | null;
  mensaje?: string | null;
}

export interface ConflictoCatalogoRemoto {
  id: string;
  tipo: string;
  tipoEntidad: string;
  entidadId: string;
  detalle: unknown;
  creadoAt: string;
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

const PREFIJO_QR_EMPAREJAMIENTO = "mora-vineria:emparejar:";
const CODIGO_EMPAREJAMIENTO_REGEX = /^[a-f0-9]{36}$/i;

export function crearContenidoQrEmparejamiento(codigo: string): string {
  const normalizado = codigo.trim().toLowerCase();
  if (!CODIGO_EMPAREJAMIENTO_REGEX.test(normalizado)) {
    throw new Error("El código de emparejamiento no es válido.");
  }
  return `${PREFIJO_QR_EMPAREJAMIENTO}${normalizado}`;
}

export function leerCodigoEmparejamiento(valor: string): string | null {
  const normalizado = valor.trim();
  const codigo = normalizado.toLowerCase().startsWith(PREFIJO_QR_EMPAREJAMIENTO)
    ? normalizado.slice(PREFIJO_QR_EMPAREJAMIENTO.length)
    : normalizado;
  return CODIGO_EMPAREJAMIENTO_REGEX.test(codigo) ? codigo.toLowerCase() : null;
}
