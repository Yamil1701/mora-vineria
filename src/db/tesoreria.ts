import type { MedioPago } from "../domain/ventas";
import {
  calcularDiferenciaConteo,
  calcularSaldoCuenta,
  obtenerDireccionReversion,
  type ConteoCaja,
  type CuentaTesoreria,
  type CuentaTesoreriaConSaldo,
  type MovimientoTesoreria,
  type ResumenTesoreria,
  type TipoMovimientoTesoreria,
  type TipoReferenciaTesoreria,
} from "../domain/tesoreria";
import {
  configuracionTesoreriaFormSchema,
  conteoCajaFormSchema,
  operacionTesoreriaFormSchema,
  type ConfiguracionTesoreriaFormValues,
  type ConteoCajaFormValues,
  type OperacionTesoreriaFormValues,
} from "../schemas";
import { crearId } from "../utils/ids";
import { calcularFechaJornada } from "../utils/jornadaVenta";
import { db, type MoraVineriaDatabase } from "./schema";
import {
  encolarOperacionOperativaLocal,
  notificarSincronizacionPendiente,
} from "./sincronizacion";

type DatosTesoreriaSincronizables = {
  cuentas: CuentaTesoreria[];
  movimientos: MovimientoTesoreria[];
  conteos: ConteoCaja[];
};

async function encolarTesoreria(
  datos: DatosTesoreriaSincronizables,
  fecha: string,
  base: MoraVineriaDatabase = db,
): Promise<boolean> {
  const entidadId = datos.movimientos[0]?.grupoId
    ?? datos.movimientos[0]?.id
    ?? datos.cuentas[0]?.id
    ?? datos.conteos[0]?.id
    ?? crearId("tesoreria");
  return encolarOperacionOperativaLocal({
    id: crearId("operacion"),
    tipoOperacion: "registrar",
    tipoEntidad: "tesoreria",
    entidadId,
    payload: datos,
    creadaAt: fecha,
  }, base);
}

async function saldoCuenta(cuentaId: string, base: MoraVineriaDatabase = db): Promise<number> {
  const movimientos = await base.movimientosTesoreria.where("cuentaId").equals(cuentaId).toArray();
  return calcularSaldoCuenta(movimientos);
}

export async function listarCuentasTesoreria(
  incluirArchivadas = false,
  base: MoraVineriaDatabase = db,
): Promise<CuentaTesoreriaConSaldo[]> {
  const cuentas = await base.cuentasTesoreria.orderBy("createdAt").toArray();
  const movimientos = await base.movimientosTesoreria.toArray();
  return cuentas
    .filter((cuenta) => incluirArchivadas || cuenta.estado === "activa")
    .map((cuenta) => ({
      ...cuenta,
      saldo: calcularSaldoCuenta(movimientos.filter((movimiento) => movimiento.cuentaId === cuenta.id)),
    }));
}

export async function obtenerResumenTesoreria(
  fecha: Date = new Date(),
  base: MoraVineriaDatabase = db,
): Promise<ResumenTesoreria> {
  const cuentas = await listarCuentasTesoreria(false, base);
  const fechaJornada = calcularFechaJornada(fecha);
  const [ultimosMovimientos, movimientosPeriodo] = await Promise.all([
    base.movimientosTesoreria.orderBy("fechaHoraReal").reverse().limit(40).toArray(),
    base.movimientosTesoreria.where("fechaJornada").equals(fechaJornada).toArray(),
  ]);
  return {
    configurada: cuentas.length > 0,
    totalDisponible: cuentas.reduce((total, cuenta) => total + cuenta.saldo, 0),
    cuentas,
    ultimosMovimientos,
    entradasPeriodo: movimientosPeriodo
      .filter((movimiento) => movimiento.direccion === "entrada")
      .reduce((total, movimiento) => total + movimiento.monto, 0),
    salidasPeriodo: movimientosPeriodo
      .filter((movimiento) => movimiento.direccion === "salida")
      .reduce((total, movimiento) => total + movimiento.monto, 0),
  };
}

export async function configurarTesoreria(
  values: ConfiguracionTesoreriaFormValues,
  fecha: Date = new Date(),
  base: MoraVineriaDatabase = db,
): Promise<void> {
  const validacion = configuracionTesoreriaFormSchema.safeParse(values);
  if (!validacion.success) {
    throw new Error(validacion.error.issues[0]?.message ?? "Revisá las cuentas iniciales.");
  }
  if (await base.cuentasTesoreria.count()) {
    throw new Error("La tesorería ya fue configurada. Agregá cuentas desde su pantalla principal.");
  }
  const ahora = fecha.toISOString();
  const jornada = calcularFechaJornada(fecha);
  const cuentas: CuentaTesoreria[] = validacion.data.cuentas.map((cuenta, indice) => ({
    id: cuenta.id ?? crearId("cuenta-tesoreria"),
    nombre: cuenta.nombre,
    tipo: cuenta.tipo,
    estado: "activa",
    esPredeterminada: cuenta.esPredeterminada
      || (
        !validacion.data.cuentas.some((item) => item.tipo === cuenta.tipo && item.esPredeterminada)
        && validacion.data.cuentas.findIndex((item) => item.tipo === cuenta.tipo) === indice
      ),
    fondoCambioObjetivo: cuenta.tipo === "efectivo" ? cuenta.fondoCambioObjetivo : undefined,
    createdAt: ahora,
    updatedAt: ahora,
  }));
  const movimientos: MovimientoTesoreria[] = cuentas.flatMap((cuenta, indice) => {
    const saldoInicial = validacion.data.cuentas[indice]?.saldoInicial ?? 0;
    return saldoInicial > 0 ? [{
      id: crearId("movimiento-tesoreria"),
      cuentaId: cuenta.id,
      fechaHoraReal: ahora,
      fechaJornada: jornada,
      tipo: "saldo_inicial" as const,
      direccion: "entrada" as const,
      monto: saldoInicial,
      descripcion: `Saldo inicial de ${cuenta.nombre}`,
      createdAt: ahora,
    }] : [];
  });
  let encolada = false;
  await base.transaction("rw", [
    base.cuentasTesoreria,
    base.movimientosTesoreria,
    base.vinculoDispositivo,
    base.colaSincronizacion,
  ], async () => {
    await base.cuentasTesoreria.bulkAdd(cuentas);
    if (movimientos.length) await base.movimientosTesoreria.bulkAdd(movimientos);
    encolada = await encolarTesoreria({ cuentas, movimientos, conteos: [] }, ahora, base);
  });
  if (encolada) notificarSincronizacionPendiente();
}

export async function agregarCuentaTesoreria(input: {
  nombre: string;
  tipo: "efectivo" | "digital";
  saldoInicial: number;
  fondoCambioObjetivo?: number;
}, fecha: Date = new Date(), base: MoraVineriaDatabase = db): Promise<string> {
  const validacion = configuracionTesoreriaFormSchema.safeParse({
    cuentas: [{ ...input, esPredeterminada: false }],
  });
  if (!validacion.success) throw new Error(validacion.error.issues[0]?.message ?? "Revisá la cuenta.");
  const existentes = await base.cuentasTesoreria.toArray();
  if (existentes.some((cuenta) => cuenta.nombre.trim().toLocaleLowerCase("es-AR") === input.nombre.trim().toLocaleLowerCase("es-AR"))) {
    throw new Error("Ya existe una cuenta con ese nombre.");
  }
  const ahora = fecha.toISOString();
  const cuenta: CuentaTesoreria = {
    id: crearId("cuenta-tesoreria"), nombre: input.nombre.trim(), tipo: input.tipo,
    estado: "activa", esPredeterminada: !existentes.some((item) => item.tipo === input.tipo && item.estado === "activa"),
    fondoCambioObjetivo: input.tipo === "efectivo" ? input.fondoCambioObjetivo : undefined,
    createdAt: ahora, updatedAt: ahora,
  };
  const movimientos: MovimientoTesoreria[] = input.saldoInicial > 0 ? [{
    id: crearId("movimiento-tesoreria"), cuentaId: cuenta.id,
    fechaHoraReal: ahora, fechaJornada: calcularFechaJornada(fecha), tipo: "saldo_inicial",
    direccion: "entrada", monto: input.saldoInicial, descripcion: `Saldo inicial de ${cuenta.nombre}`,
    createdAt: ahora,
  }] : [];
  let encolada = false;
  await base.transaction("rw", [base.cuentasTesoreria, base.movimientosTesoreria, base.vinculoDispositivo, base.colaSincronizacion], async () => {
    await base.cuentasTesoreria.add(cuenta);
    if (movimientos.length) await base.movimientosTesoreria.bulkAdd(movimientos);
    encolada = await encolarTesoreria({ cuentas: [cuenta], movimientos, conteos: [] }, ahora, base);
  });
  if (encolada) notificarSincronizacionPendiente();
  return cuenta.id;
}

export async function resolverCuentaTesoreriaParaPago(
  medioPago: MedioPago,
  cuentaSolicitada?: string,
  base: MoraVineriaDatabase = db,
): Promise<CuentaTesoreria | null> {
  const cuentas = await base.cuentasTesoreria.where("estado").equals("activa").toArray();
  if (!cuentas.length) return null;
  if (cuentaSolicitada) {
    const cuenta = cuentas.find((item) => item.id === cuentaSolicitada);
    if (!cuenta) throw new Error("La cuenta elegida ya no está disponible.");
    return cuenta;
  }
  const tipo = medioPago === "efectivo" ? "efectivo" : "digital";
  const cuenta = cuentas.find((item) => item.tipo === tipo && item.esPredeterminada)
    ?? cuentas.find((item) => item.tipo === tipo);
  if (!cuenta) {
    throw new Error(`No hay una cuenta ${tipo === "efectivo" ? "de efectivo" : "digital"} disponible.`);
  }
  return cuenta;
}

export async function registrarMovimientoTesoreriaAutomatico(input: {
  cuentaId?: string;
  medioPago: MedioPago;
  tipo: TipoMovimientoTesoreria;
  direccion: "entrada" | "salida";
  monto: number;
  descripcion: string;
  referenciaTipo: TipoReferenciaTesoreria;
  referenciaId: string;
  fecha: Date;
}, base: MoraVineriaDatabase = db): Promise<MovimientoTesoreria | null> {
  const cuenta = await resolverCuentaTesoreriaParaPago(input.medioPago, input.cuentaId, base);
  if (!cuenta) return null;
  if (input.direccion === "salida" && await saldoCuenta(cuenta.id, base) < input.monto) {
    throw new Error(`El saldo de ${cuenta.nombre} no alcanza para registrar esta salida.`);
  }
  const ahora = input.fecha.toISOString();
  const existente = await base.movimientosTesoreria
    .where("referenciaId").equals(input.referenciaId)
    .filter((movimiento) => movimiento.tipo === input.tipo && movimiento.direccion === input.direccion)
    .first();
  if (existente) return existente;
  const movimiento: MovimientoTesoreria = {
    id: crearId("movimiento-tesoreria"), cuentaId: cuenta.id,
    fechaHoraReal: ahora, fechaJornada: calcularFechaJornada(input.fecha),
    tipo: input.tipo, direccion: input.direccion, monto: input.monto,
    descripcion: input.descripcion, referenciaTipo: input.referenciaTipo,
    referenciaId: input.referenciaId, createdAt: ahora,
  };
  await base.movimientosTesoreria.add(movimiento);
  await encolarTesoreria({ cuentas: [], movimientos: [movimiento], conteos: [] }, ahora, base);
  return movimiento;
}

export async function revertirMovimientosTesoreriaPorReferencia(input: {
  referenciaTipo: TipoReferenciaTesoreria;
  referenciaId: string;
  motivo: string;
  fecha: Date;
}, base: MoraVineriaDatabase = db): Promise<MovimientoTesoreria[]> {
  const originales = await base.movimientosTesoreria
    .where("referenciaId").equals(input.referenciaId)
    .filter((movimiento) => movimiento.referenciaTipo === input.referenciaTipo && movimiento.tipo !== "reversion")
    .toArray();
  const reversiones: MovimientoTesoreria[] = [];
  for (const original of originales) {
    const yaRevertido = await base.movimientosTesoreria
      .where("referenciaId").equals(original.id)
      .filter((movimiento) => movimiento.tipo === "reversion")
      .first();
    if (yaRevertido) continue;
    const ahora = input.fecha.toISOString();
    reversiones.push({
      id: crearId("movimiento-tesoreria"), cuentaId: original.cuentaId,
      fechaHoraReal: ahora, fechaJornada: calcularFechaJornada(input.fecha), tipo: "reversion",
      direccion: obtenerDireccionReversion(original.direccion), monto: original.monto,
      descripcion: `Reversión: ${original.descripcion}`, referenciaTipo: "movimiento_tesoreria",
      referenciaId: original.id, grupoId: original.grupoId, observaciones: input.motivo,
      createdAt: ahora,
    });
  }
  if (reversiones.length) {
    await base.movimientosTesoreria.bulkAdd(reversiones);
    await encolarTesoreria({ cuentas: [], movimientos: reversiones, conteos: [] }, input.fecha.toISOString(), base);
  }
  return reversiones;
}

export async function registrarOperacionTesoreria(
  values: OperacionTesoreriaFormValues,
  fecha: Date = new Date(),
  base: MoraVineriaDatabase = db,
): Promise<void> {
  const validacion = operacionTesoreriaFormSchema.safeParse(values);
  if (!validacion.success) throw new Error(validacion.error.issues[0]?.message ?? "Revisá la operación.");
  const operacion = validacion.data;
  const ahora = fecha.toISOString();
  const jornada = calcularFechaJornada(fecha);
  const grupoId = crearId("grupo-tesoreria");
  const movimientos: MovimientoTesoreria[] = [];
  const cuentaOrigenId = operacion.tipo === "transferencia" ? operacion.cuentaOrigenId : operacion.cuentaId;
  const cuentaOrigen = await base.cuentasTesoreria.get(cuentaOrigenId);
  if (!cuentaOrigen || cuentaOrigen.estado !== "activa") throw new Error("La cuenta elegida no está disponible.");
  if ((operacion.tipo === "retiro" || operacion.tipo === "transferencia") && await saldoCuenta(cuentaOrigen.id, base) < operacion.monto) {
    throw new Error(`El saldo de ${cuentaOrigen.nombre} no alcanza para esta operación.`);
  }
  if (operacion.tipo === "transferencia") {
    const destino = await base.cuentasTesoreria.get(operacion.cuentaDestinoId);
    if (!destino || destino.estado !== "activa") throw new Error("La cuenta de destino no está disponible.");
    movimientos.push(
      { id: crearId("movimiento-tesoreria"), cuentaId: cuentaOrigen.id, fechaHoraReal: ahora, fechaJornada: jornada, tipo: "transferencia", direccion: "salida", monto: operacion.monto, descripcion: operacion.descripcion, referenciaTipo: "transferencia", referenciaId: grupoId, grupoId, registradoPor: operacion.registradoPor, observaciones: operacion.observaciones, createdAt: ahora },
      { id: crearId("movimiento-tesoreria"), cuentaId: destino.id, fechaHoraReal: ahora, fechaJornada: jornada, tipo: "transferencia", direccion: "entrada", monto: operacion.monto, descripcion: operacion.descripcion, referenciaTipo: "transferencia", referenciaId: grupoId, grupoId, registradoPor: operacion.registradoPor, observaciones: operacion.observaciones, createdAt: ahora },
    );
  } else {
    movimientos.push({
      id: crearId("movimiento-tesoreria"), cuentaId: cuentaOrigen.id,
      fechaHoraReal: ahora, fechaJornada: jornada, tipo: operacion.tipo,
      direccion: "salida",
      monto: operacion.monto, descripcion: operacion.descripcion,
      registradoPor: operacion.registradoPor,
      destinatario: operacion.tipo === "retiro" ? operacion.destinatario : undefined,
      observaciones: operacion.observaciones, createdAt: ahora,
    });
  }
  let encolada = false;
  await base.transaction("rw", [base.movimientosTesoreria, base.vinculoDispositivo, base.colaSincronizacion], async () => {
    await base.movimientosTesoreria.bulkAdd(movimientos);
    encolada = await encolarTesoreria({ cuentas: [], movimientos, conteos: [] }, ahora, base);
  });
  if (encolada) notificarSincronizacionPendiente();
}

export async function registrarConteoCaja(
  values: ConteoCajaFormValues,
  fecha: Date = new Date(),
  base: MoraVineriaDatabase = db,
): Promise<ConteoCaja> {
  const validacion = conteoCajaFormSchema.safeParse(values);
  if (!validacion.success) throw new Error(validacion.error.issues[0]?.message ?? "Revisá el conteo.");
  const cuenta = await base.cuentasTesoreria.get(validacion.data.cuentaId);
  if (!cuenta || cuenta.estado !== "activa" || cuenta.tipo !== "efectivo") {
    throw new Error("Elegí una cuenta de efectivo activa.");
  }
  const esperado = await saldoCuenta(cuenta.id, base);
  const diferencia = calcularDiferenciaConteo(esperado, validacion.data.montoContado);
  const ahora = fecha.toISOString();
  const ajuste: MovimientoTesoreria | null = diferencia === 0 ? null : {
    id: crearId("movimiento-tesoreria"), cuentaId: cuenta.id,
    fechaHoraReal: ahora, fechaJornada: calcularFechaJornada(fecha), tipo: "ajuste_conteo",
    direccion: diferencia > 0 ? "entrada" : "salida", monto: Math.abs(diferencia),
    descripcion: "Ajuste por conteo de caja", referenciaTipo: "conteo_caja",
    referenciaId: "pendiente", observaciones: validacion.data.observaciones, createdAt: ahora,
  };
  const conteo: ConteoCaja = {
    id: crearId("conteo-caja"), cuentaId: cuenta.id,
    fechaHoraReal: ahora, fechaJornada: calcularFechaJornada(fecha),
    montoEsperado: esperado, montoContado: validacion.data.montoContado, diferencia,
    detalleDenominaciones: validacion.data.detalleDenominaciones,
    observaciones: validacion.data.observaciones, movimientoAjusteId: ajuste?.id,
    createdAt: ahora,
  };
  if (ajuste) ajuste.referenciaId = conteo.id;
  let encolada = false;
  await base.transaction("rw", [base.conteosCaja, base.movimientosTesoreria, base.vinculoDispositivo, base.colaSincronizacion], async () => {
    await base.conteosCaja.add(conteo);
    if (ajuste) await base.movimientosTesoreria.add(ajuste);
    encolada = await encolarTesoreria({ cuentas: [], movimientos: ajuste ? [ajuste] : [], conteos: [conteo] }, ahora, base);
  });
  if (encolada) notificarSincronizacionPendiente();
  return conteo;
}
