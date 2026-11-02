# Guion de QA masivo móvil · Mora RC1

**Todos los casos están QA físico pendiente. Ninguno fue aprobado por el usuario.** Las pruebas automáticas están en otro informe.

No hagas esta ronda en la v25 pública ni con dinero, clientes o mercadería reales. Usá una candidata HTTPS de QA indicada expresamente por el responsable técnico y una copia descartable. La misión no publicó ese entorno. No limpies tu navegador habitual para preparar la prueba.

Teléfono: ______ · Sistema/versión: ______ · Navegador: ______ · Versión/commit candidato: ______ · Fecha: ______ · Origen/enlace usado: ______

Guardá una copia antes de empezar. El fixture complejo adjunto se llama `Mora-QA-restauracion-v28.json`: productos QA RECUPERACIÓN 1 ($3.500) y 2 ($4.000), historia ficticia y una preparación de gasto de $100. Si necesitás reiniciar, usá otro espacio descartable vacío; nunca borres el único origen ni mezcles con datos reales. Para la secuencia C creá el producto QA TELÉFONO y anotá cada cambio.

En cada caso completá observado, estado y captura. Estados permitidos: pendiente / aprobado por mí / falló / no pude probar / requiere decisión. Una falla P0 frena aceptación de datos; podés continuar otros casos con otra copia para reunir problemas. P1 afecta uso/lectura/instalación. Si no existe todavía la integración remota, sus pruebas se indican bloqueadas: no improvisar cuentas ni credenciales.

## Parte A — Primera impresión

### A01 · Abrir Mora y reconocer el inicio

Prioridad: **P1** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Candidata vacía o fixture descartable.

**Pasos:** Abrí el enlace candidato indicado para QA. Mirá el encabezado, resumen y botón de nueva venta.

**Esperado:** Se reconoce Mora oscura y fucsia. El título explica dónde estás. No aparece una promesa de guardado remoto.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### A02 · Recorrer la barra inferior

Prioridad: **P1** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Inicio abierto.

**Pasos:** Tocá Ventas, +, Caja y Más; volvé a Inicio. Repetí sosteniendo el teléfono con una mano.

**Esperado:** Los cuatro destinos y nueva venta responden; se identifica la sección actual. El pulgar alcanza las acciones principales.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### A03 · Leer con brillo bajo y alto

Prioridad: **P1** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Inicio, cobro y Más disponibles.

**Pasos:** Probá brillo bajo y alto. Leé importes, texto secundario, advertencias y botones deshabilitados. Anotá lo difícil de leer.

**Esperado:** Total, etiquetas y estados se distinguen sin esfuerzo. No depende sólo del color.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### A04 · Zoom 200 % y desplazamiento

Prioridad: **P1** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Datos → Restaurar una copia, con fixture elegido.

**Pasos:** Ampliá a 200 % con la opción de accesibilidad del navegador o gesto disponible. Recorré de principio a fin y buscá confirmar/cambiar archivo. Volvé al tamaño habitual.

**Esperado:** Podés leer el resumen y alcanzar las acciones. No hay un botón tapado o contenido imposible de recorrer. Anotá si el navegador no permite ese zoom.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### A05 · Volver y conservar contexto

Prioridad: **P1** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Catálogo con al menos dos productos.

**Pasos:** Buscá QA RECUPERACIÓN 1, abrí el producto, bajá al final y volvé. Entrá a otra sección y regresá. Probá Volver del encabezado y del teléfono.

**Esperado:** La navegación tiene sentido y recupera búsqueda/contexto; no confirma ni borra una operación al volver.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### A06 · Formulario y teclado real

Prioridad: **P1** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Una venta preparada para cobrar.

**Pasos:** Tocá el importe recibido, escribí y cambiá de campo. Abrí/cerrá el teclado. Girá el teléfono si lo usás así.

**Esperado:** Se ve el campo activo; el botón final queda accesible mediante scroll o al cerrar teclado. Lo escrito no desaparece.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

## Parte B — Ventas

### B01 · Elegir productos y favoritos

Prioridad: **P1** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Fixture complejo recuperado en candidata descartable.

**Pasos:** En + buscá QA RECUPERACIÓN 1. Revisá identidad/presentación. Elegilo como favorito desde la opción disponible, volvé y agregalo.

**Esperado:** Se selecciona el producto correcto; favorito y cantidad quedan claros. No se confunden presentaciones.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### B02 · Carrito compacto y precio propio

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Producto 1 a $3.500, carrito vacío.

**Pasos:** Agregá una unidad; abrí carrito. Cambiá el precio de esa línea a $4.000. Volvé a productos y al carrito.

**Esperado:** Una unidad, total $4.000. El cambio es de esta venta y no altera silenciosamente el catálogo. Después de terminar, una venta nueva usa precio de catálogo.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### B03 · Cobrar efectivo y dar vuelto

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Carrito del caso B02, total $4.000.

**Pasos:** Cobrá en efectivo; escribí $5.000, revisá vuelto $1.000 y confirmá. Tocá dos veces seguidas el botón final.

**Esperado:** Un solo comprobante y una sola venta; stock disminuye una unidad y caja aumenta $4.000, no $5.000. El vuelto es $1.000.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### B04 · Comprobante y nueva venta

Prioridad: **P1** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Venta B03 registrada.

**Pasos:** Leé comprobante, abrí su detalle y regresá. Tocá Otra venta o Inicio apenas termina.

**Esperado:** Producto, precio y cobro coinciden. Navegás sin un bloqueo artificial. La venta anterior no se repite.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### B05 · Transferencia pendiente

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Carrito nuevo de una unidad del producto 1 a $3.500.

**Pasos:** Elegí Transferencia y Brubank. Dejala por verificar y registrá. Revisá Ventas y Caja. Luego, sólo en este ensayo, marcá que se acreditó.

**Esperado:** Antes de verificar: una venta $3.500 y cobro pendiente, sin ingreso confirmado. Después: mismo número de venta y un solo ingreso a Brubank.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### B06 · Transferencia ya acreditada

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Otra venta nueva de $3.500.

**Pasos:** Elegí Transferencia, cuenta de prueba y Ya se acreditó. Confirmá una vez; volvé a abrir el detalle.

**Esperado:** Un solo cobro confirmado y una venta; no permite acreditar dos veces el mismo tramo.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### B07 · Cobro mixto

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Una venta nueva de $3.500.

**Pasos:** En Más opciones elegí Mixto. Poné efectivo $1.000, recibido $2.000 y transferencia $2.500 pendiente. Confirmá; verificá después la transferencia.

**Esperado:** Vuelto $1.000; entra sólo $1.000 a efectivo al principio. Luego entra $2.500 a la cuenta elegida, sin otra venta ni descuento de stock.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### B08 · Parte fiada

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Una venta nueva de $3.500.

**Pasos:** Más opciones → Una parte fiada. Dejá $1.000 a nombre QA TELÉFONO; cobrá $2.500 en efectivo y confirmá.

**Esperado:** Una sola venta $3.500, cobro $2.500 y fiado $1.000. Stock baja una unidad.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### B09 · Fiado completo

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Una venta nueva de $3.500.

**Pasos:** Más opciones → Fiado; escribí QA FIADO COMPLETO. Confirmá y revisá Caja/Fiados.

**Esperado:** Deuda $3.500, sin ingreso de dinero y sin una segunda venta.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### B10 · Venta física con faltante

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Usar una copia descartable; producto con stock cero o cantidad de carrito superior al registro. No usar mercadería real.

**Pasos:** Agregá más unidades que las registradas. Leé el aviso, volvé y cambiá cantidad. Confirmá deliberadamente Los tengo, continuar sólo para simular disponibilidad física. Cobrá.

**Esperado:** El aviso nombra producto y unidades faltantes. Una aceptación vieja no sirve para otra cantidad. La venta se conserva con diferencia/revisión y costo desconocido; no inventa existencias ni costos.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### B11 · Cerrar durante una venta preparada

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Carrito nuevo, sin confirmar el cobro.

**Pasos:** Elegí producto, ajustá precio/medio y cerrá la pestaña o app instalada. Reabrí desde el mismo origen.

**Esperado:** El trabajo preparado se recupera; todavía no existe una venta cobrada. Al confirmar una vez aparece un solo registro.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### B12 · Corregir precio o cuenta

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Venta de efectivo B03 identificada; guardar copia previa.

**Pasos:** Abrí detalle → Corregir venta. Probá Cuenta del cobro a Mercado Pago con motivo QA. Leé los efectos antes de confirmar. En una copia aparte probá precio/cantidad y revisá si corresponde deuda, dinero o revisión.

**Esperado:** Conserva original/motivo. La cuenta cambia sin cobro nuevo y dice Sin cambios en el dinero cobrado. Corrección ambigua queda pendiente, sin forzar stock/costo.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

## Parte C — Mercadería

### C01 · Crear un producto descartable

Prioridad: **P1** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Catálogo, candidata descartable.

**Pasos:** Creá QA TELÉFONO 750 ml, variedad Malbec, precio $3.500; no cargues datos reales. Guardá, buscá y abrí el producto.

**Esperado:** Identidad/presentación/precio legibles y consistentes; un solo producto tras guardar y reabrir.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### C02 · Stock inicial sin compra

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Producto QA TELÉFONO sin historia.

**Pasos:** Inventario → Registrar stock inicial. Elegí 20 unidades y costo total conocido $40.000. Revisá y confirmá.

**Esperado:** Stock 20, lote con costo $2.000 por unidad; no aparece venta, recepción ni salida de dinero.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### C03 · Conteo que disminuye stock

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Producto C02 con 20 unidades registradas.

**Pasos:** Inventario → Contar. Escribí 19; pasá directamente al motivo y escribí Conteo QA. Guardá.

**Esperado:** No pierde foco ni texto. Stock 19, diferencia -1 e historial con motivo. No cambia dinero ni ventas.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### C04 · Rotura

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Producto C03 con 19 unidades.

**Pasos:** Contá 18, elegí Rotura o pérdida, escribí Botella rota QA y guardá.

**Esperado:** Stock 18 e historial de pérdida; conserva asignaciones anteriores y no crea una venta.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### C05 · Conteo con costo desconocido

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Copia descartable del producto anterior.

**Pasos:** Registrá una unidad encontrada de más sin informar costo. Revisá Inventario y luego un reporte con venta de esa unidad cuando corresponda.

**Esperado:** No inventa un costo cero ni recalcula costos históricos. Indica costo pendiente y ganancia total no determinada si afecta ventas.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### C06 · Revisar diferencia con evidencia

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Fixture con revisión pendiente o caso B10.

**Pasos:** Abrí la diferencia, revisá venta de origen. Volvé sin confirmar si no hay evidencia. En una copia separada completá evidencia comprobada y su efecto.

**Esperado:** Volver conserva la revisión. Sólo una confirmación con evidencia produce el efecto admitido y conserva historia. No hay resolución automática por una compra nueva.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### C07 · Pedido sin recepción

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Reposición existente; producto QA con presentación de compra definida.

**Pasos:** Realizá un pedido de una caja de 6 unidades al proveedor QA. Revisalo, guardalo y marcalo enviado.

**Esperado:** Pedido y unidades pendientes claros. Stock, lotes y dinero no cambian por pedir o enviar.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### C08 · Recibir una entrega parcial

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Pedido C07 de 6 unidades.

**Pasos:** Recibí sólo 2 unidades reales de prueba con costo total $4.000; dejá sin pagar y confirmá. Revisá lo pendiente del pedido.

**Esperado:** Stock suma 2 y nace un lote de 2 con costo real; faltan 4 por recibir. No se ingresa toda la caja ni sale dinero.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### C09 · Pago posterior de recepción

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Recepción C08 pendiente de $4.000.

**Pasos:** Abrí recepción → Registrar pago. Indicá $1.000 desde efectivo y marcá que ya se pagó. Reabrí, registrá los $3.000 restantes y probá tocar dos veces al confirmar.

**Esperado:** Dos pagos que suman $4.000; pendiente cero. No se recibe mercadería otra vez ni se duplica el egreso.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### C10 · Cerrar resto de pedido

Prioridad: **P1** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Pedido C07 aún con 4 unidades pendientes.

**Pasos:** Usá la opción contextual de cerrar lo pendiente, revisá la confirmación y aceptá en esta copia.

**Esperado:** Sólo cierra el resto del pedido. No inventa recepción, costo ni pago.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

## Parte D — Caja y reportes

### D01 · Leer saldos y cuentas

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Copia del fixture; registrar saldo inicial observado por cuenta.

**Pasos:** Abrí Caja, elegí cuentas, revisá referencia y movimientos. Compará con cobros confirmados y pagos del ensayo.

**Esperado:** Saldos explicables. Una transferencia por verificar no aparece como cobro confirmado. Aportes y ventas se distinguen.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### D02 · Gasto pagado

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Caja, saldo observado anotado.

**Pasos:** Registrá gasto QA $100 desde efectivo y motivo Descartable QA. Guardá y reabrí historial.

**Esperado:** Un egreso de $100 con motivo; no otra venta ni movimiento de stock.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### D03 · Aporte y retiro

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Caja de prueba.

**Pasos:** Registrá aporte $500 y retiro $200 desde la misma cuenta, cada uno con motivo QA.

**Esperado:** Dos movimientos distintos; variación neta +$300. No aumentan ni reducen ventas comerciales.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### D04 · Traspaso entre cuentas

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Caja de prueba, dos cuentas disponibles.

**Pasos:** Mové $300 de efectivo a Mercado Pago. Revisá ambas cuentas y el total; probá elegir la misma cuenta de origen/destino.

**Esperado:** Una baja y una suba de $300, total sin cambio. Rechaza traspaso a la misma cuenta.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### D05 · Abono parcial y final

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Fiado B08 por $1.000 pendiente.

**Pasos:** Ventas → Fiados → QA TELÉFONO. Aboná $400 en efectivo, reabrí y aboná $600. Buscá la venta original.

**Esperado:** Saldo $600 y después $0; dos abonos, una venta original y sin nuevo descuento de stock. No permite abonar más del saldo.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### D06 · Control de cuenta

Prioridad: **P1** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Saldo de referencia registrado de forma explícita para el ensayo.

**Pasos:** Abrí el control de la cuenta. Indicá lo contado; revisá diferencia e historial.

**Esperado:** Distingue saldo esperado y contado. Registrar un control no inventa un cobro, gasto o traspaso.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### D07 · Reporte mensual y meta

Prioridad: **P1** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Fixture complejo, mes octubre 2026.

**Pasos:** Más → Reportes → Mes → octubre de 2026. Mirá vendido/cobrado/costos. Cambiá meta a $60.000 y reabrí.

**Esperado:** Período legible; vendido no se confunde con cobrado. Falta costo → ganancia total pendiente. Meta guardada sin proyecciones.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### D08 · Informe PDF en el teléfono

Prioridad: **P1** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Reporte D07.

**Pasos:** Abrí Informe mensual → Imprimir o guardar PDF. Guardalo, abrilo con el visor del teléfono y recorré todas las páginas.

**Esperado:** PDF A4 legible, blanco, con período/cifras, sin barra inferior ni botones, sin cortar cifras/filas; costos faltantes explícitos. Anotá número de páginas.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

## Parte E — Datos y aplicación

### E01 · Guardar copia JSON externa

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Estado descartable con ventas/abonos/conteos.

**Pasos:** Datos y respaldo → Descargar respaldo JSON. Elegí una carpeta del teléfono. Buscá el archivo con el administrador de archivos.

**Esperado:** El archivo existe fuera del navegador. No confundir aviso de descarga preparada con archivo efectivamente guardado.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### E02 · Recuperar copia en vacío

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Otro perfil/origen candidato vacío; copia E01 conservada y origen intacto.

**Pasos:** Restaurar una copia → elegir JSON. Bajá hasta el final del resumen; revisá cantidades y confirmá. Exportá desde destino.

**Esperado:** Recupera ventas, saldos, FIFO, deudas, metas y pendientes. Comprobá ambos archivos/resúmenes. No se sobreescribe el origen.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### E03 · Importación repetida y archivo inválido

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Destino E02 ya ocupado.

**Pasos:** Intentá elegir nuevamente el mismo archivo; luego un archivo de texto inválido de prueba.

**Esperado:** No mezcla ni duplica registros. Confirmación bloqueada en espacio ocupado; error comprensible para archivo inválido y datos anteriores conservados.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### E04 · Preparación recuperada una sola vez

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Espacio vacío y fixture Mora-QA-restauracion-v28.json, que incluye un gasto preparado de $100.

**Pasos:** Recuperá fixture, cerrá y reabrí dos veces. Revisá historial de efectivo y descargá otra copia.

**Esperado:** La preparación se confirma una sola vez al recuperar; un gasto QA preparado de $100, no dos. Las operaciones ya confirmadas no se repiten.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### E05 · Instalar y abrir desde icono

Prioridad: **P1** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Candidata HTTPS autorizada para QA, con manifiesto disponible.

**Pasos:** Android: usá Instalar app/agregar a inicio. iOS: Compartir → Agregar a inicio. Cerrá navegador y abrí el icono.

**Esperado:** Nombre/icono Mora, apertura en candidata correcta y datos presentes. No abre por error la v25 pública.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### E06 · Abrir y trabajar sin internet

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Candidata abierta una vez y acceso offline preparado; copia JSON externa guardada.

**Pasos:** Prepará una venta sin confirmar. Apagá Wi-Fi y datos. Cerrá/reabrí el icono; revisá carrito y datos. Terminá una venta descartable si permite edición protegida.

**Esperado:** Abre shell y conserva trabajo local; no anuncia confirmación de servidor. Si falta mecanismo seguro, bloquea claramente sin borrar datos. No se promete sincronización.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### E07 · Actualizar con trabajo pendiente

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Una versión candidata nueva preparada por el responsable técnico, sin publicación productiva; carrito con cambios.

**Pasos:** Con internet, esperá aviso de nueva versión. Revisá aviso, elegí actualizar y reabrí. Si la red falla, probá la salida disponible.

**Esperado:** Conserva registros/borrador y evita duplicados. La primera instalación no avisa una actualización ficticia. Registrar versión anterior/nueva usadas.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### E08 · Dos pestañas y navegador incompatible

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Copia descargada; misma candidata y origen.

**Pasos:** Abrí una segunda pestaña sin cerrar la primera. Intentá trabajar; cerrá la primera y reabrí la segunda. Si tenés otro navegador sin soporte, abrilo sólo para leer el mensaje.

**Esperado:** Segunda pestaña bloqueada antes de escribir; después permite entrar. Sin protección disponible explica cómo continuar y conserva datos.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

### E09 · Verificar que nada desapareció

Prioridad: **P0** · Datos: **descartables, siempre** · Estado inicial: **QA físico pendiente**.

**Preparación:** Final de toda la ronda.

**Pasos:** Cerrá/reabrí; compará número de ventas, stock, fiados, abonos, recepciones/pagos, movimientos y meta con tus anotaciones. Guardá una copia final.

**Esperado:** Todos los efectos se explican por los pasos ejecutados. Cualquier diferencia bloquea aceptación y se informa con archivo/captura.

**Observado:** ____________________________________

**Mi estado:** pendiente / aprobado por mí / falló / no pude probar / requiere decisión.

**Capturas o comentarios:** ____________________________________

## Prueba remota futura — bloqueada por infraestructura e integración

Cuando exista Mora dev conectado, repetir B03/B05/B08, C08/C09 y D05 con dos dispositivos autorizados. El responsable técnico debe preparar dos cuentas/dispositivos y revisar las filas finales. Probar abono simultáneo, respuesta perdida, mismo intento, corte de red y revocación. Una venta/pago realizado físicamente debe quedar conservado para revisión si no puede comprobarse. **No ejecutar con Supabase ajeno ni marcar aprobado por las pruebas locales.**

## Cierre de tu ronda

Casos aprobados por mí: ____ / 45 · Fallos P0: ____ · Fallos P1: ____ · No probados: ____.

Decisión del usuario: pendiente / necesito correcciones / autorizo siguiente etapa de preparación. La publicación necesita una autorización expresa separada.
