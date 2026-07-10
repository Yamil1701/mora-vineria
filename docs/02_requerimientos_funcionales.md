# Requerimientos funcionales

## Productos y categorías

Cada producto debe incluir nombre, categoría, precio de venta, costo de compra, marca y presentación opcionales, stock actual, stock objetivo, estado y observaciones.

La app debe permitir crear, editar, activar y desactivar productos. Un producto sin historial puede eliminarse; si fue usado en ventas, reposiciones o movimientos, debe conservarse y desactivarse.

Las categorías se administran de forma simple. Una categoría asociada a productos debe desactivarse en lugar de eliminarse.

La vista predeterminada usa cards. Debe existir una vista compacta opcional. Los inactivos permanecen ocultos por defecto.

## Stock

- Una venta descuenta stock.
- Una reposición aumenta stock.
- Una anulación revierte el efecto cuando es posible.
- No se permite vender ni dejar stock negativo.
- El stock bajo y crítico se calcula respecto del stock objetivo de cada producto.
- En la primera versión entregable, el ajuste manual se realiza editando el producto.
- Si se modifica manualmente `stockActual`, la interfaz debe advertir que el cambio no crea un movimiento histórico y pedir confirmación.

## Ventas

Una venta puede incluir varios productos. Debe guardar fecha/hora real, fecha de jornada, detalles, cantidades, precio aplicado, costo al momento, subtotales, total, medio de pago, observaciones y estado.

El precio se toma del producto y puede modificarse como opción secundaria. La app debe bloquear cantidades superiores al stock disponible.

Antes de guardar se muestra una confirmación compacta con productos, cantidades, medio de pago y total. Al guardar, el formulario queda listo para una nueva venta.

Una venta histórica no se elimina. Puede anularse con motivo; queda visible, deja de contar en reportes y devuelve el stock.

## Movimientos

La pantalla agrupa:

- reposición de mercadería;
- aporte externo;
- gasto puntual;
- historial de movimientos.

La reposición registra productos, cantidades y costos, aumenta stock y puede indicar aporte externo incluido. El aporte externo no es venta, gasto ni ganancia. La reinversión se informa separada de los gastos puntuales.

Corregir un movimiento significa anularlo con motivo, revertir su impacto y, si hace falta, registrar otro movimiento independiente. La app no debe forzar una nueva carga inmediatamente después de anular.

El movimiento anulado se conserva por defecto como trazabilidad. La eliminación definitiva puede ofrecerse como acción secundaria solo cuando esté anulado, su reversión haya terminado y no existan relaciones que necesiten conservarlo para la integridad de datos. Esta eliminación sigue pendiente de implementación.

## Modo del dispositivo

La configuración permite elegir:

- **Principal:** carga y modifica datos operativos.
- **Consulta:** importa copias y consulta información; no registra ventas, movimientos, anulaciones ni cambios operativos por defecto.

Es un modo del dispositivo y no un rol de usuario.

## Dashboard

Debe mostrar:

- resumen, ventas, ganancia estimada y movimientos de hoy;
- ventas y ganancia de la semana actual del mes;
- ventas, movimientos y ganancia del mes;
- producto más vendido del mes;
- accesos a nueva venta, movimientos, productos, reportes, proyecciones y datos.

## Reportes

Los reportes contemplan día actual, semana del mes, mes y rango personalizado. Deben separar total vendido, costo estimado, ganancia bruta y neta, reinversión, aportes externos y gastos puntuales.

La selección de semana debe permitir elegir mes y bloque:

- semana 1: días 1–7;
- semana 2: días 8–14;
- semana 3: días 15–21;
- semana 4: día 22 al final del mes.

No se permiten meses futuros. En el mes actual solo se habilitan las semanas que ya comenzaron según la fecha de jornada. La semana vigente puede consultarse y debe mostrarse como “en curso”.

También deben mostrar productos más vendidos y medios de pago. Los gráficos son parte de la evolución planificada de reportes, no una condición para usar el núcleo actual.

## Proyecciones

La proyección mensual usa el promedio diario de ventas y gastos acumulados multiplicado por los días del mes. Reinversión y aportes externos se muestran por separado.

La meta mensual es una referencia. Los textos deben orientar sin presentar la proyección como certeza ni usar mensajes desmotivadores.

## Backup, restauración y copia entre dispositivos

La app debe exportar un JSON completo, compartirlo o descargarlo, validar un archivo importado, mostrar un resumen y pedir confirmación antes de reemplazar datos.

La restauración conserva el identificador y el modo del dispositivo receptor. La copia por archivo no es sincronización automática.

Los CSV son auxiliares para productos, ventas y movimientos; no reemplazan el backup.

## PDF mensual

Se genera localmente con una vista clara e `window.print()`. Incluye período, ventas, costos, ganancias estimadas, gastos, reinversión, aportes, productos y medios de pago. No es fiscal ni contable.

## PWA

La app debe poder instalarse, abrirse con apariencia de aplicación y funcionar offline después de la primera carga. Debe informar cuando queda lista sin conexión y cuando hay una actualización disponible.
