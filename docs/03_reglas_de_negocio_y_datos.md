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

Los datos operativos viven en IndexedDB mediante Dexie. `localStorage` se usa únicamente para el identificador estable del dispositivo.

El esquema actual es versión 1. Cualquier cambio estructural debe:

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

Mientras `schemaVersion` sea 1, los cambios deben mantener la forma actual del backup. Si cambia la forma obligatoria de una entidad, se incrementará la versión y se definirá explícitamente si se migran copias anteriores.

Nunca describir la exportación/importación como nube o sincronización automática.
