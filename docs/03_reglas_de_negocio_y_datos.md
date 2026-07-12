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
- Bajo: más de 10 % y hasta 20 %.
- Disponible: más de 20 %.

Los porcentajes pertenecen a la configuración local y comienzan en 10/20. No usar un umbral fijo global en unidades.

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

## Cálculos

```text
costo estimado vendido = suma(costo al momento × cantidad)
ganancia bruta estimada = total vendido - costo estimado vendido
ganancia neta estimada = ganancia bruta estimada - gastos puntuales
```

Reinversión y aportes externos se informan aparte. Las ventas y movimientos anulados no participan.

Los costos del detalle de venta son una fotografía del momento. Cambiar luego el costo del producto no modifica reportes históricos.

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

El contrato operativo y de backup actual es versión 1. Dexie v2 agregó vínculo, cola, cursor y conflictos; Dexie v3 agrega versiones remotas por entidad. Estas tablas no forman parte del backup. Cualquier cambio estructural operativo debe:

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

Mientras `schemaVersion` sea 1, los cambios deben mantener la forma actual del backup. `destinoTransferencia` es opcional y preserva copias anteriores. Si cambia la forma obligatoria de una entidad, se incrementará la versión y se definirá explícitamente si se migran copias anteriores.

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
- El cursor solo avanza después de aplicar por completo el lote remoto en Dexie.
- Realtime puede perderse sin perder datos: arranque, foco, reconexión y recuperación periódica vuelven a consultar el cursor.
- Un conflicto de catálogo nunca se resuelve automáticamente por hora del celular ni por última escritura.
