# Requerimientos funcionales

## Productos y categorías

Cada producto debe incluir nombre, categoría, precio de venta, costo de compra, marca y presentación opcionales, stock actual, stock objetivo, estado y observaciones.

La app debe permitir crear, editar, activar y desactivar productos. Un producto sin historial puede eliminarse; si fue usado en ventas, reposiciones o movimientos, debe conservarse y desactivarse.

Las categorías se administran de forma simple. Una categoría asociada a productos debe desactivarse en lugar de eliminarse.

La vista predeterminada es compacta y puede cambiarse a cards. Los inactivos permanecen ocultos por defecto. El listado, el detalle, la creación, la edición y la administración de categorías son vistas separadas.

## Stock

- Una venta descuenta stock.
- Una reposición aumenta stock.
- Una anulación revierte el efecto cuando es posible.
- No se permite vender ni dejar stock negativo.
- El stock bajo y crítico se calcula respecto del stock objetivo de cada producto.
- En la primera versión entregable, el ajuste manual se realiza editando el producto.
- Si se modifica manualmente `stockActual`, la interfaz debe advertir que el cambio no crea un movimiento histórico y pedir confirmación.

## Ventas

Una venta puede incluir varios productos. Debe guardar fecha/hora real, fecha de jornada, detalles, cantidades, precio aplicado, costo al momento, subtotales, total, condición de pago, cobros, observaciones y estado.

El precio se toma del producto y puede modificarse como opción secundaria. La app debe bloquear cantidades superiores al stock disponible.

Antes de guardar se muestra una confirmación compacta con productos, cantidades, medio de pago y total. El carrito se conserva localmente como borrador ante cierres o recargas, puede vaciarse manualmente y se revalida contra stock y productos al confirmar.

Al guardar se vuelve al historial y la venta nueva queda destacada con acceso a su detalle.

Una venta histórica no se elimina. Puede anularse con motivo; queda visible, deja de contar en reportes y devuelve el stock.

## Movimientos

El módulo permite:

- reposición de mercadería;
- aporte externo;
- gasto puntual;
- historial de movimientos.

El historial es la entrada principal. Registrar y revisar un movimiento se realizan en vistas separadas. Movimientos se accede desde “Más” porque su uso operativo es ocasional.

La reposición registra productos, cantidades y costos, aumenta stock y puede indicar aporte externo incluido. El aporte externo no es venta, gasto ni ganancia. La reinversión se informa separada de los gastos puntuales.

Corregir un movimiento significa anularlo con motivo, revertir su impacto y, si hace falta, registrar otro movimiento independiente. La app no debe forzar una nueva carga inmediatamente después de anular.

El movimiento anulado se conserva por defecto como trazabilidad. La eliminación definitiva se ofrece como acción secundaria dentro del detalle solo cuando esté anulado, su reversión haya terminado y no existan relaciones que necesiten conservarlo para la integridad de datos.

## Tesorería

- La configuración inicial debe copiar los saldos reales existentes sin convertirlos en ventas, aportes ni ganancias nuevas.
- Debe admitir una o más cuentas de efectivo y digitales, con una predeterminada por tipo y un fondo de cambio objetivo opcional para Caja.
- Cada cobro de venta aumenta la cuenta elegida. Reposiciones y gastos disminuyen la cuenta que paga. Los aportes externos aumentan la cuenta receptora y siguen informándose también en Movimientos y Reportes.
- Una transferencia entre cuentas propias genera una salida y una entrada vinculadas; cambia la distribución, pero no el total disponible.
- Un retiro exige importe, quién retiró y para quién o para qué fue. No cuenta como gasto del negocio ni modifica la ganancia estimada.
- Los conteos de caja guardan esperado, contado y diferencia. Si difieren, crean un ajuste trazable.
- Los movimientos de dinero no se editan ni eliminan. Las anulaciones de ventas, cobros y movimientos agregan contrapartidas y conservan el historial.
- Si Tesorería está configurada, una operación con dinero no puede guardarse sin una cuenta compatible. Las salidas manuales no pueden superar el saldo disponible.
- La tesorería se guarda primero en Dexie, participa del backup y se sincroniza automáticamente entre celulares autorizados.

## Modo del dispositivo

La configuración permite elegir:

- **Principal:** carga y modifica datos operativos.
- **Consulta:** importa copias y consulta información; no registra ventas, movimientos, anulaciones ni cambios operativos por defecto.

Es un modo del dispositivo y no un rol de usuario.

En `v0.2.0`, “Principal” se separa del permiso operativo: hay un solo dispositivo principal que administra emparejamientos y varios dispositivos vinculados en modo Operación o Consulta.

## Sincronización entre dispositivos

- La operación debe continuar sin conexión y guardarse primero en Dexie.
- Cada cambio pendiente debe conservar un identificador idempotente y el dispositivo que lo originó.
- La interfaz debe distinguir sincronizado, pendiente, sincronizando, sin conexión, error y conflicto.
- Al reconectarse, la app debe reintentar sin duplicar ventas ni movimientos.
- Los cambios remotos se descargan incrementalmente y Realtime solo actúa como aviso.
- El celular principal puede generar un emparejamiento breve, revocar dispositivos y transferir el control.
- Cada dispositivo elige un nombre que acompaña la auditoría de operaciones.
- El código de recuperación permite reemplazar un principal perdido y rota después de usarse.
- Una venta offline conflictiva se conserva y crea una diferencia de stock pendiente, sin llevar el stock disponible por debajo de cero.
- El funcionamiento normal no depende de un botón manual: la sincronización se activa al guardar, abrir o recuperar la app, volver la conexión, regresar al primer plano y recibir un aviso remoto.
- Un indicador discreto comunica al día, procesando, pendiente, sin conexión, error o conflicto; el texto completo permanece disponible en Configuración.

## Ventas fiadas y cobros

- Fiar es una condición de la venta, no un medio de pago.
- El nombre del cliente es obligatorio; la nota y el vencimiento son opcionales.
- Puede recibirse un pago inicial o fiarse el total.
- Los pagos parciales se registran como cobros independientes e inmutables; una corrección anula el cobro con motivo y conserva su historial.
- La consulta Fiadas distingue pendiente, vencida y pagada, permite buscar por cliente y muestra total cobrado y saldo.
- Anular una venta anula también sus cobros activos y conserva toda la trazabilidad.
- Reportes separa total vendido, dinero efectivamente cobrado, vendido fiado y saldo pendiente. Los medios de pago se calculan sobre cobros, no sobre el total prometido.

## Inicio

Debe priorizar el estado de la jornada, la acción de nueva venta y los productos con stock bajo o crítico. Los resúmenes semanales, mensuales, rankings y desgloses pertenecen a Reportes para evitar duplicación y sobrecarga.

## Reportes

Los reportes contemplan día actual, semana del mes, mes y rango personalizado. Deben separar total vendido, costo estimado, ganancia bruta y neta, reinversión, aportes externos y gastos puntuales.

La selección de semana debe permitir elegir mes y bloque:

- semana 1: días 1–7;
- semana 2: días 8–14;
- semana 3: días 15–21;
- semana 4: día 22 al final del mes.

No se permiten meses futuros. En el mes actual solo se habilitan las semanas que ya comenzaron según la fecha de jornada. La semana vigente puede consultarse y debe mostrarse como “en curso”.

También deben mostrar productos más vendidos y medios de pago. La interfaz muestra un período y una perspectiva por vez: resumen, productos o cobros. Los gráficos complementan el contenido textual. Una venta fiada cuenta como venta en su jornada; cada cobro cuenta como ingreso en la jornada en que se recibió.

## Proyecciones

La proyección mensual usa el promedio diario de ventas y gastos acumulados multiplicado por los días del mes. Reinversión y aportes externos se muestran por separado.

La meta mensual es una referencia. Los textos deben orientar sin presentar la proyección como certeza ni usar mensajes desmotivadores.

## Backup, restauración y copia entre dispositivos

La app debe exportar un JSON completo, compartirlo o descargarlo, validar un archivo importado, mostrar un resumen y pedir confirmación antes de reemplazar datos.

La restauración conserva el identificador y el modo del dispositivo receptor. La copia por archivo no es sincronización automática.

Los CSV son auxiliares para productos, ventas y movimientos; no reemplazan el backup.

La interfaz debe recordar crear un primer respaldo y advertir cuando hayan pasado más de siete días desde el último. A los siete días exactos todavía se considera vigente. El aviso orienta sin bloquear la operación.

## Continuidad y recuperación

Los formularios persistentes deben advertir antes de salir únicamente cuando el usuario haya realizado cambios que todavía no se guardaron. Las tareas deben impedir envíos duplicados, conservar los datos ya escritos ante errores corregibles y ofrecer una salida clara ante fallos inesperados.

La advertencia debe cubrir navegación interna, botón Atrás, gesto del sistema, cierre de sheets y recarga de la aplicación. Los errores de validación se muestran junto al campo y el foco se dirige al primero que necesita corrección.

Las cargas rápidas no deben producir parpadeos. Cuando una espera supera el umbral breve definido por la interfaz, se muestra un skeleton contextual; durante la preparación inicial prolongada se muestra una pantalla de carga propia de Mora Vinería.

## PDF mensual

Se genera localmente con una vista clara e `window.print()`. Incluye período, ventas, costos, ganancias estimadas, gastos, reinversión, aportes, productos y medios de pago. No es fiscal ni contable.

## PWA

La app debe poder instalarse, abrirse con apariencia de aplicación y funcionar offline después de la primera carga. Debe informar cuando queda lista sin conexión y cuando hay una actualización disponible.

La identidad instalada usa el símbolo propio de Mora Vinería en variantes normal y maskable. Al iniciar, la app muestra una presentación breve con identidad y progreso mientras prepara la base y los datos esenciales de Inicio; no debe revelar valores parciales ni provocar flashes de contenido.
