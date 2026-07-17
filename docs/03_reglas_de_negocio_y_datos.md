# Reglas de negocio y datos

## Jornada de venta

La jornada comienza a las 08:00 y termina a las 07:59 del día siguiente.

- Desde las 08:00, la actividad pertenece a la fecha calendario actual.
- Antes de las 08:00, pertenece a la fecha anterior.
- Ventas y movimientos conservan `fechaHoraReal` y `fechaJornada`.
- Dashboard, reportes, proyecciones y PDF agrupan por `fechaJornada`.

En la interfaz usar “Resumen de hoy”, “Ventas de hoy” y “Movimientos de hoy”. Evitar “día operativo”.

## Stock

Cada producto tiene `stockActual` y `stockObjetivo`.

- Sin stock: `stockActual <= 0`.
- Crítico: hasta 10 % del objetivo.
- Bajo: más de 10 % y hasta 30 %.
- Disponible: más de 30 %.

Los porcentajes pertenecen a la configuración local y comienzan en 10/30. Como el stock se expresa en unidades enteras, los límites se redondean hacia abajo. Por ejemplo, 2 de 8 y 8 de 30 son stock bajo. No usar un umbral fijo global en unidades.

La venta y reposición actualizan stock dentro de la misma transacción que sus registros. Una operación debe completarse entera o no modificar nada.

El ajuste manual mediante edición de producto no crea trazabilidad propia. Por eso debe mostrar una advertencia y confirmación. Si el uso real necesita auditoría de ajustes, se deberá diseñar una entidad o tipo de movimiento antes de implementarlo.

## Borrados y anulaciones

### Productos

- Sin historial: eliminación definitiva permitida.
- Con historial: desactivar y conservar.

### Ventas

- Nunca se eliminan definitivamente en el MVP.
- La anulación exige motivo, conserva el registro, lo excluye de cálculos y revierte stock.

### Movimientos

- La corrección normal es anular con motivo y revertir impacto.
- Registrar un reemplazo es opcional e independiente.
- El registro anulado se conserva por defecto.
- Solo puede eliminarse definitivamente si ya está anulado, la reversión fue completa y no rompe relaciones ni explicaciones históricas.

Una reposición no se puede anular si al retirar las unidades repuestas el stock quedaría negativo.

Cuando una reposición se carga por pack o bulto, el stock aumenta por `cantidad de bultos × unidades por bulto`, mientras el gasto conserva exactamente `cantidad de bultos × costo por bulto`. El costo unitario promedio puede tener decimales internos y no debe redondear ni alterar el total pagado.

## Cálculos

```text
costo estimado vendido = suma(costo al momento × cantidad)
ganancia bruta estimada = total vendido - costo estimado vendido
ganancia neta estimada = ganancia bruta estimada - gastos puntuales
```

Reinversión y aportes externos se informan aparte. Las ventas y movimientos anulados no participan.

Los costos del detalle de venta son una fotografía del momento. Cambiar luego el costo del producto no modifica reportes históricos.

## Tesorería operativa

Tesorería responde cuánto dinero real del negocio hay y dónde está. No redefine ventas, costos ni ganancias.

- Los saldos se calculan sumando entradas y restando salidas del libro; no se guarda un saldo mutable como autoridad.
- El saldo inicial es una fotografía de dinero preexistente. No es venta, aporte nuevo ni ganancia del período.
- El fondo de cambio objetivo es una referencia, no dinero inmóvil: Caja puede subir o bajar y la interfaz advierte si queda por debajo.
- Cobros, reposiciones, gastos y aportes toman la fecha y jornada de su operación de origen.
- Transferir entre cuentas propias tiene impacto total cero.
- Un retiro de la dueña reduce dinero disponible, pero no se clasifica como gasto operativo.
- Un conteo ajusta el libro a la realidad mediante un movimiento separado; nunca reescribe movimientos anteriores.
- Anular agrega una reversión con dirección contraria. Reintentar la misma referencia no puede duplicar el movimiento ni la reversión.
- Una salida operativa o manual no puede dejar saldo negativo. Las reversiones y el conteo sí pueden revelar un saldo o diferencia que requiera revisión: la trazabilidad prevalece sobre ocultar el problema.

Para el traspaso inicial vigente: Caja se carga con `$156.600` (`$52.400` de fondo de cambio y `$104.200` reservados para reposición) y Brubank con `$87.900`. La reposición posterior de `$104.200` se registra como reposición pagada desde Caja; no se crea un aporte ficticio.

## Proyección

```text
promedio diario = acumulado / días transcurridos
proyección mensual = promedio diario × días del mes
```

Se aplica por separado a ventas, ganancia neta y gastos puntuales. Es orientativa y puede variar por clima, feriados, fines de semana, eventos y ritmo comercial.

## Persistencia

Los datos operativos viven en IndexedDB mediante Dexie. `localStorage` se usa para el identificador estable del dispositivo y para preferencias o borradores temporales de interfaz que no forman parte del historial ni del backup.

El borrador de venta guarda identificadores, cantidades, precios aplicados, medio de pago y observaciones. No reserva stock, no constituye una venta y debe revalidarse antes de escribir datos operativos.

Las ventas nuevas agrupan Mercado Pago, Brubank, Naranja X y otros destinos bajo `transferencia`. El destino se guarda como dato opcional. Los registros históricos `mercado_pago` siguen siendo válidos y se presentan como transferencia recibida en Mercado Pago. “Pagan con” y el vuelto son una ayuda transitoria: no forman parte de la venta ni del respaldo.

El contrato operativo y de backup actual es versión 3. Dexie v2 agregó vínculo, cola, cursor y conflictos; Dexie v3 agregó versiones remotas por entidad; Dexie v4 agregó cobros de ventas y diferencias de stock; Dexie v5 agrega cuentas, libro de tesorería y conteos de caja, y migra el umbral bajo de 20 % a 30 %. La metadata de vínculo, sesión, cursor, versiones y outbox no forma parte del backup. Cualquier cambio estructural operativo debe:

1. agregar una nueva versión Dexie;
2. definir migración de datos existentes;
3. revisar índices y transacciones;
4. revisar schemas de validación;
5. decidir compatibilidad del JSON;
6. agregar pruebas de migración y restauración.

## Backup

El backup JSON contiene datos, versión de esquema, identificador de la copia, dispositivo de origen, fecha de exportación y última modificación real de datos.

`exportedAt` y `lastDataChangeAt` tienen significados distintos. Exportar una copia no debe alterar artificialmente la fecha del último cambio operativo.

Antes de restaurar:

- validar JSON y estructura;
- exigir versión compatible;
- mostrar resumen;
- advertir que reemplaza los datos locales;
- pedir confirmación.

La restauración es transaccional y conserva `deviceId` y modo del dispositivo receptor.

## Compatibilidad

`schemaVersion` 3 incluye cuentas, movimientos de tesorería y conteos. Las copias v1 se migran al leerlas: cada venta histórica pagada genera un cobro equivalente y adopta condición contado. Las copias v1 y v2 se completan con tesorería vacía para que el usuario configure los saldos reales; no se intentan inferir desde ventas históricas. `destinoTransferencia` continúa opcional.

Nunca describir la exportación/importación como nube o sincronización automática.

## Sincronización offline

Supabase es la fuente remota compartida y Dexie conserva la copia de trabajo. Una operación local no se considera confirmada remotamente hasta recibir su mismo identificador desde el servidor.

- La cola de salida es metadata del dispositivo y no se incluye en backups.
- Reintentar una operación con el mismo ID no puede repetir su efecto.
- El orden remoto se determina mediante una secuencia del servidor; la hora del celular se conserva como dato auditado, no como autoridad de orden.
- Revocar un dispositivo impide nuevas lecturas y escrituras remotas, pero no borra su auditoría.
- La sincronización nunca mezcla automáticamente dos bases iniciales: el principal realiza una migración inicial explícita.
- Ventas y movimientos son hechos; una actualización posterior no los reemplaza por “última escritura gana”.
- Si falta stock al aplicar una venta offline, se conserva la venta, el stock disponible queda en cero y se registra el faltante para conciliación.
- Categorías y productos se sincronizan como agregados versionados. Las escrituras locales y su operación de cola se guardan en una misma transacción Dexie.
- Registrar o anular ventas, cobros y movimientos guarda el hecho local y su operación de salida en la misma transacción Dexie.
- Configurar cuentas, registrar dinero o contar Caja guarda el libro local y una operación idempotente en la misma transacción Dexie.
- El servidor serializa salidas concurrentes por cuenta y rechaza las que superarían el saldo compartido.
- Los cobros nunca se editan: se registran o se anulan con motivo. Dos cobros simultáneos que superen el total crean un conflicto visible.
- El principal concilia un faltante ingresando el stock contado; la resolución queda ordenada en el mismo flujo incremental.
- El cursor solo avanza después de aplicar por completo el lote remoto en Dexie.
- Realtime puede perderse sin perder datos: arranque, foco, reconexión y recuperación periódica vuelven a consultar el cursor.
- Un conflicto de catálogo nunca se resuelve automáticamente por hora del celular ni por última escritura.
