import {
  aplicarCambiosCatalogoRemotos,
  aplicarCambiosOperativosRemotos,
  actualizarBaseDeOperacionesPendientes,
  contarOperacionesPendientes,
  db,
  guardarEstadoSincronizacion,
  listarConflictosPendientes,
  listarOperacionesPendientes,
  marcarOperacionConConflicto,
  marcarOperacionConError,
  marcarOperacionEnviando,
  marcarOperacionSincronizada,
  marcarConflictoLocalResuelto,
  obtenerEstadoSincronizacion,
  reemplazarCatalogoDesdeSnapshot,
} from "../db";
import type {
  CambioCatalogoRemoto,
  CambioSincronizacionRemoto,
  EstadoSincronizacionLocal,
  EstadoSincronizacionVisible,
  ResultadoOperacionRemota,
  VinculoDispositivoLocal,
} from "../domain/sincronizacion";
import { crearId } from "../utils/ids";
import {
  enviarOperacionesCatalogo,
  inicializarCatalogoRemoto,
  listarConflictosCatalogoRemotos,
  obtenerCambiosCatalogo,
  obtenerSnapshotCatalogoRemoto,
} from "./catalogo";
import {
  enviarOperacionesOperativas,
  listarConflictosOperativosRemotos,
} from "./operaciones";
import { publicarEstadoSincronizacion } from "./estado";

let cicloEnCurso: Promise<void> | null = null;

async function contarConflictos(): Promise<number> {
  return (await listarConflictosPendientes()).length;
}

function esCambioCatalogo(cambio: CambioSincronizacionRemoto): cambio is CambioCatalogoRemoto {
  return cambio.tipoEntidad === "categoria" || cambio.tipoEntidad === "producto";
}

async function aplicarCambios(
  vinculo: VinculoDispositivoLocal,
  cambios: CambioSincronizacionRemoto[],
): Promise<void> {
  const catalogo = cambios.filter(esCambioCatalogo);
  if (catalogo.length) await aplicarCambiosCatalogoRemotos(vinculo.negocioId, catalogo);
  await aplicarCambiosOperativosRemotos(cambios);
}

async function publicar(
  fase: EstadoSincronizacionVisible["fase"],
  mensaje: string | null = null,
  conflictosForzados?: number,
): Promise<void> {
  const [pendientes, conflictosLocales, estado] = await Promise.all([
    contarOperacionesPendientes(),
    contarConflictos(),
    obtenerEstadoSincronizacion(),
  ]);
  const conflictos = conflictosForzados ?? conflictosLocales;
  const visible = {
    fase,
    pendientes,
    conflictos,
    ultimaSincronizacionAt: estado?.ultimaSincronizacionAt ?? null,
    mensaje,
  } satisfies EstadoSincronizacionVisible;
  publicarEstadoSincronizacion(visible);
  if (estado?.negocioId) {
    await guardarEstadoSincronizacion({
      ...estado,
      fase,
      pendientes,
      conflictos,
      ultimoError: fase === "error" ? mensaje : null,
      updatedAt: new Date().toISOString(),
    });
  }
}

async function asegurarBootstrap(vinculo: VinculoDispositivoLocal): Promise<boolean> {
  const estado = await obtenerEstadoSincronizacion();
  if (estado?.negocioId === vinculo.negocioId && estado.catalogoInicializado) return true;

  let snapshot = await obtenerSnapshotCatalogoRemoto();
  if (!snapshot.inicializado && vinculo.tipo === "principal") {
    const [categorias, productos] = await Promise.all([
      db.categorias.toArray(),
      db.productos.toArray(),
    ]);
    snapshot = await inicializarCatalogoRemoto({
      operacionId: `catalogo-inicial-${vinculo.negocioId}`,
      categorias,
      productos,
    });
  }
  if (!snapshot.inicializado) {
    await publicar("alerta", "Esperando que el celular principal prepare los datos compartidos.");
    return false;
  }
  await reemplazarCatalogoDesdeSnapshot(vinculo.negocioId, snapshot);
  return true;
}

async function procesarResultadoPropio(
  vinculo: VinculoDispositivoLocal,
  resultado: ResultadoOperacionRemota,
): Promise<void> {
  if (resultado.estado === "aplicada") {
    await marcarOperacionSincronizada(resultado.operacionId);
    await aplicarCambios(vinculo, resultado.cambios);
    for (const cambio of resultado.cambios.filter(esCambioCatalogo)) {
      await actualizarBaseDeOperacionesPendientes(
        cambio.tipoEntidad,
        cambio.entidadId,
        cambio.version,
      );
    }
    return;
  }

  if (resultado.estado === "conflicto") {
    const operacionLocal = await db.colaSincronizacion.get(resultado.operacionId);
    await marcarOperacionConConflicto(resultado.operacionId, {
      id: resultado.conflictoId ?? crearId("conflicto"),
      negocioId: vinculo.negocioId,
      operacionId: resultado.operacionId,
      tipo: resultado.codigoError ?? "conflicto",
      tipoEntidad: operacionLocal?.tipoEntidad ?? "catalogo",
      entidadId: operacionLocal?.entidadId ?? "desconocida",
      detalle: { mensaje: resultado.detalleError },
      estado: "pendiente",
      creadoAt: new Date().toISOString(),
    });
    return;
  }

  await marcarOperacionConError(
    resultado.operacionId,
    resultado.detalleError ?? "La operación remota no pudo aplicarse.",
  );
}

async function pull(vinculo: VinculoDispositivoLocal): Promise<void> {
  let estado = await obtenerEstadoSincronizacion();
  let hayMas = true;
  while (hayMas) {
    const lote = await obtenerCambiosCatalogo(estado?.ultimoCursorRemoto ?? 0);
    for (const operacion of lote.operaciones) {
      if (operacion.conflictoResueltoId) {
        await marcarConflictoLocalResuelto(operacion.conflictoResueltoId);
      }
      if (operacion.estado === "aplicada" && operacion.cambios.length) {
        await aplicarCambios(vinculo, operacion.cambios);
      }
    }
    const ahora = new Date().toISOString();
    estado = {
      id: "estado-actual",
      negocioId: vinculo.negocioId,
      ultimoCursorRemoto: lote.cursor,
      catalogoInicializado: true,
      ultimaSincronizacionAt: ahora,
      ultimoError: null,
      updatedAt: ahora,
    } satisfies EstadoSincronizacionLocal;
    await guardarEstadoSincronizacion(estado);
    hayMas = lote.hayMas;
  }
}

async function push(vinculo: VinculoDispositivoLocal): Promise<void> {
  if (vinculo.modo !== "operacion") return;
  const todas = await listarOperacionesPendientes();
  const catalogo = todas.filter((operacion) =>
    operacion.tipoEntidad === "categoria" || operacion.tipoEntidad === "producto").slice(0, 50);
  const operativas = todas.filter((operacion) =>
    operacion.tipoEntidad === "venta"
    || operacion.tipoEntidad === "cobro_venta"
    || operacion.tipoEntidad === "movimiento").slice(0, 25);
  const pendientes = [...catalogo, ...operativas];
  if (!pendientes.length) return;

  await Promise.all(pendientes.map((operacion) => marcarOperacionEnviando(operacion.id)));
  try {
    const resultados = [
      ...(catalogo.length ? await enviarOperacionesCatalogo(catalogo) : []),
      ...(operativas.length ? await enviarOperacionesOperativas(operativas) : []),
    ];
    for (const resultado of resultados) {
      await procesarResultadoPropio(vinculo, resultado);
    }
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "No se pudo enviar el lote.";
    await Promise.all(pendientes.map((operacion) =>
      marcarOperacionConError(operacion.id, mensaje)));
    throw error;
  }
}

async function ejecutar(vinculo: VinculoDispositivoLocal): Promise<void> {
  if (!navigator.onLine) {
    await publicar("sin_conexion");
    return;
  }
  await publicar("sincronizando");
  try {
    if (!await asegurarBootstrap(vinculo)) return;
    await pull(vinculo);
    await push(vinculo);
    await pull(vinculo);
    const pendientes = await contarOperacionesPendientes();
    const conflictos = vinculo.tipo === "principal"
      ? (await Promise.all([
          listarConflictosCatalogoRemotos(),
          listarConflictosOperativosRemotos(),
        ])).reduce((total, lista) => total + lista.length, 0)
      : await contarConflictos();
    await publicar(
      conflictos > 0 ? "alerta" : pendientes > 0 ? "pendiente" : "sincronizado",
      conflictos > 0 ? "Hay cambios que necesitan revisión." : null,
      conflictos,
    );
  } catch (error) {
    await publicar(
      "error",
      error instanceof Error ? error.message : "No se pudo sincronizar.",
    );
  }
}

export function sincronizarCatalogo(vinculo: VinculoDispositivoLocal): Promise<void> {
  if (cicloEnCurso) return cicloEnCurso;
  cicloEnCurso = ejecutar(vinculo).finally(() => {
    cicloEnCurso = null;
  });
  return cicloEnCurso;
}

export async function indicarSinConexion(): Promise<void> {
  await publicar("sin_conexion");
}

export function indicarSinConfiguracion(): void {
  publicarEstadoSincronizacion({
    fase: "sin_configurar",
    pendientes: 0,
    conflictos: 0,
    ultimaSincronizacionAt: null,
    mensaje: null,
  });
}
