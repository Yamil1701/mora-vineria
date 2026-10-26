# 24 — Contratos conceptuales de operaciones y datos faltantes

**Corte:** 25/10/2026. **Estado:** especificación técnica **propuesta** de integración de decisiones aprobadas en los Bloques I–III, derivada de los contratos de dominio existentes; no es esquema Dexie implementado ni autorización de código. Se revisa como parte de la **aprobación integral del plano**, no mediante una microdecisión por regla. Referencias: [23 Auditoría](23_auditoria_coherencia_integral.md), [11 Pantallas](11_contratos_pantallas.md), [03 Recorridos](03_recorridos_y_estados.md), `src/domain/types.ts`, `src/local/database.ts`, `src/local/backup.ts`.

## 0. Reglas base que ninguna nueva función puede contradecir

1. **Hechos persistidos y proyecciones separadas:** cada operación identificada y durable es una causa, y stock/cuenta/deuda/reportes son resultados de hechos trazables. Una cifra derivada no vuelve a escribirse como una operación independiente por renderizar otra pantalla.
2. **Identidad, tiempo y jornada:** ID estable por operación/entidad; fecha/hora real `registeredAt` y jornada `businessDate` según 08:00–07:59 en Salta. Una operación realizada a las 03:00 pertenece a la **jornada anterior**, sin cambiar su hora real. Validar también cortes de mes/año.
3. **ARS sin centavos en hechos de cobro:** importes monetarios físicos de venta/cobro/movimiento expresados en pesos enteros seguros. **Costo FIFO interno** puede ser racional al distribuir total de pack entre unidades; nunca redondear costos por unidad antes de asignar.
4. **No reescritura del historial:** los precios de catálogo para ventas futuras no alteran líneas vendidas ni cobros pasados; baja o corrección posterior requiere una operación vinculada al hecho anterior. Producto con historia se **desactiva** en lugar de borrar físicamente.
5. **Atomicidad e idempotencia:** sellar comando con payload completo y el mismo ID; reintentos, doble toque y recargas no duplican stock/lote/caja/deuda. Si una escritura física exige varias filas, se confirman juntas o no se confirma nada; si un comando quedó preparado, se recupera primero.
6. **Espacio local:** no Supabase/backend/login/roles/sincronización automática. La transferencia de datos entre navegadores usa backup/restauración JSON **por archivo**, nunca mezcla remota. Todo nuevo hecho necesita migración Dexie, validación JSON y prueba de restore.
7. **No promesas ficticias de saldo:** ningún número calculado localmente equivale por sí mismo a saldo real del banco, y una venta entregada no se descarta por stock negativo. Los costos no verificables se anuncian, no se sustituyen por cero.

## 1. Conceptos de dominio a incorporar (nombres semánticos, no tablas impuestas)

| Concepto | Campos/relaciones imprescindibles | Fuente de escritura | Lectura/proyección |
| --- | --- | --- | --- |
| Cuenta de dinero | ID, nombre visible, tipo `efectivo`/`banco_manual`, activa, orden, fecha de creación; Brubank/efectivo sugeridos pero no forzados si falta configuración | Configuración comercial ligera o Caja > Cuentas | Caja, cobro, abono y traspaso |
| Movimiento monetario trazable | ID y comando, fecha/jornada, `tipo`, monto entero, cuenta origen/destino según corresponda, `sourceType/sourceId`, motivo opcional | Venta, recepción, abono, gasto, aporte, retiro, traspaso (cada uno dueño único) | Saldo contable calculado, historial y Reportes |
| Parte de pago de venta | ID, venta o corrección dueña, cuenta, monto entero, medio `efectivo`/`transferencia`, hora real y confirmación humana de acreditación cuando sea transferencia | Cobro de Nueva venta / operación correctiva | Total cobrado; no crear segunda venta |
| Fiado / deuda | ID, venta fuente, nombre simple del cliente, total adeudado original, saldo **derivado**, estado abierto/saldado, historial de abonos | Venta fiada, abono y corrección trazable | Ventas > Fiados y Caja para efectivo recibido |
| Abono de fiado | ID, deuda ID, partes de pago, monto entero total, fecha/jornada | Ventas > Fiados > Abonar | Reduce deuda, aumenta cuenta una sola vez, no suma facturación |
| Corrección de venta | ID de comando, ID venta origen, motivo, fecha real/jornada, versión/estado esperado del hecho, cambio por línea o medio, cambios monetarios que *realmente ocurrieron* | Ventas > Detalle > Corregir | Venta con rectificaciones visibles y saldos derivados |
| Lista del proveedor | ID, fecha de carga y referencia de proveedor opcional, texto fuente, filas saneadas, estado de revisión, asociaciones validadas, costos referenciales de **esa** semana | Reposición > Lista del proveedor | Revisión de cambios de precio, costos estimados de pedido |
| Alias confirmado | ID, proveedor opcional, etiqueta normalizada, producto ID, presentación/variante y unidades por pack, fecha/confirmación y versión/invalidez | Confirmación del operador en «Por revisar» | Próximas listas; no congela costo |
| Revisión de precio en lote | ID de intento, cambios propuestos con `productId`, versión y precio previo/nuevo, selección final y estado, comando idempotente | Reposición > Revisar precios | Cambia **solo precio para ventas futuras** |
| Pedido proveedor | ID, proveedor/fecha, estado `borrador`/`pendiente`/`parcial`/`recibido`/`cancelado`, líneas estables, presentación y cantidad, costo estimado con origen de lista | Reposición > Preparar pedido | Pedidos pendientes y precarga recepción |
| Entrega de pedido | ID recepción, pedido ID opcional, líneas de unidades físicamente recibidas, costo total real por línea, fecha/jornada, pago único, estado confirmado | Reposición > Recibir | Lotes FIFO, stock, cuenta de dinero, pendientes de pedido |
| Meta mensual | ID por mes comercial, objetivo ARS entero no negativo o ausente, versión y fecha edición | Reportes > Meta | Avance de ventas reales, porcentaje, proyección opcional |
| Metadata de resguardo | Versión de esquema/backup, fecha de exportación realmente generada y estado verificable del archivo cuando sea posible; nunca afirmar descarga completada sin señal | Configuración > Datos | Mensajes de respaldo y migración |

**Compatibilidad:** el código publicado maneja `CashEntry` efectivo y `ReceivePurchase` con `PurchaseLine[]`, pero **no** existen aún estas entidades completas. La transición futura debe **migrar sin reemplazar ni duplicar** filas de ventas, cash, lotes y receipts actuales. No inventar `Account` retroactivamente como saldo bancario histórico; si se asigna `Efectivo` a operaciones locales existentes, debe ser una migración explícita y testeada.

## 2. Operaciones de Caja, cuentas y cobros

### 2.1 Cuentas y saldo

- **Efectivo** y **Brubank** son los tipos conocidos de la operación; Naranja X/Mercado Pago pueden añadirse si se usan y solo para dinero de Mora. Sin autenticación bancaria; el titular verifica datos externamente.
- Una cuenta muestra **movimientos registrados**, saldo **calculado** si existe una base confiable, último **contado/verificado manual** (importe + instante) si se realizó, y diferencia solo cuando esos datos sean comparables; de lo contrario `No informado`.
- El total de fondos del negocio es la suma de cuentas conocidas cuando todas las bases son confiables; si faltan bases, mostrar parciales sin una cifra de `total real`. No mezclar caja física contada con saldo bancario supuesto.
- Un **aporte** aumenta fondos del negocio, un **gasto** los reduce; ambos tienen motivo, cuenta, monto y fecha; **compra de mercadería** nace de recepción y es clase propia, no gasto duplicado.
- **Mover dinero → Entre cuentas** requiere cuenta origen distinta de destino, monto y revisión; registra `−M` origen y `+M` destino en **el mismo comando**, por lo que variación agregada es 0. **Retirar del negocio** registra `−M` desde cuenta elegida y se distingue de gasto operativo. No registrar una extracción como venta negativa.
- **Conteo físico de efectivo** captura importe y hora **declarados por la persona** y diferencia frente al saldo esperado si existe. **No corrige saldo por sí solo**. La decisión de registrar una diferencia monetaria requiere una operación explícita distinta, con causa.

### 2.2 Venta en efectivo / transferencia / mixto

- **Efectivo:** total debido, importe entregado opcional si equivale al exacto, cálculo de vuelto, validación de insuficiencia; el ingreso a cuenta es **el total pagado**, no la suma recibida antes del vuelto.
- **Transferencia:** escoger cuenta destino de Mora y **confirmar manualmente haber comprobado la acreditación** en aplicación bancaria. Abrir banca o copiar CBU no constituye confirmación. Si no se verificó y se entregó el producto, permitir elegir **fiado/saldo pendiente** en un flujo explícito, nunca marcar `cobrado` falsamente.
- **Mixto:** una venta, `n` partes de pago (p.ej. efectivo + transferencia) suman exactamente el cobro aceptado, con verificación humana por cada transferencia. Vuelto solo sobre la parte de efectivo; validar `importe total cubierto = total exigible` o identificar fiado restante **explícitamente**. No permitir guardar una mezcla incoherente.
- **Fiado:** al registrar se crea una venta **y una deuda** (total o saldo remanente), se descuenta stock una vez, sin entrada monetaria por porción fiada. El historial indica `Total vendido`, `Cobrado`, `Pendiente`.
- Un **abono** posterior reduce deuda, afecta cuenta destino y se referencia al crédito original; **no** aumenta ventas del día de abono. Los abonos no pueden exceder saldo vivo: frenar y mostrarlo antes de confirmar. Si dos pestañas intentan abonar el mismo saldo, revisar versión/saldo en transacción, sin perder un pago físico real sin resolver.

### 2.3 Corrección sin destruir ventas

**El botón «Corregir» vive en Ventas > Detalle.** La pantalla muestra **antes/después** y su impacto físico/monetario por separado.

- Cambiar **cantidad o línea vendida** no equivale a sumar/restar stock directamente desde React; exige comando correctivo con efecto en el journal y manejo FIFO auditable. Nunca recalcular silenciosamente lotes asignados a ventas intermedias.
- Cambiar **precio cobrado** no altera precio del catálogo. Si el importe efectivamente recibido/entregado de vuelta cambia, registrar **el hecho monetario correctivo** (cobro adicional, devolución realizada o saldo pendiente) con cuenta, monto y confirmación; no inventar devolución de dinero automáticamente por editar un número.
- Cambiar **medio/cuenta de cobro mal anotado** crea una rectificación de atribución trazable, sin duplicar cobro. Si un pago pasó efectivamente de una cuenta a otra, usar traspaso o registrar eventos reales adecuados, nunca reclasificar en silencio.
- Corregir una venta con **fiado y abonos ya realizados** exige conservar abonos y revisar el saldo derivado; no sobrescribir pagos. Si la corrección generaría deuda negativa, bloquear y mostrar revisión, no descartar dinero histórico.
- **Alcance del plano:** corrección posterior de cantidad, precio o medio y vínculo con deuda; **devoluciones comerciales, reembolsos bancarios automáticos, impuestos fiscales y reclamos al proveedor** quedan fuera de esta capacidad. Cuando una corrección implique entrega o reintegro físico, pedir confirmación del hecho, no asumirlo.

**Resolución conservadora de límites FIFO complejos:** registrar rectificación inmutable y asignación/compensación explícita; **si las unidades/costos históricos no pueden restaurarse con integridad, marcar revisión y evitar efecto automático ficticio**. No permitir mutación destructiva de lote histórico. La especificación de orden exacto entre lotes que se liberen y ventas posteriores requiere fixtures numéricos antes de implementar; no aprobar algoritmo informal desde UI.

## 3. Proveedor, precios y aprendizaje (de lista hasta compra)

### 3.1 Lista saneada y equivalencias

1. Se pega **texto** del proveedor, se preserva original, se parsean presentaciones, unidades y costos de esa semana, se normaliza conservadoramente; no se crean ventas ni compras.
2. Coincidencia **exacta y coherente** con SKU/variante/presentación del catálogo o alias previamente **confirmado** puede reconocerse; similitud nueva muestra candidato en «Por revisar» con acciones `Es este producto`, `Elegir otro`, `Crear producto`.
3. Confirmar una corrección enseña alias local de proveedor/nombre/pack/producto **por ID** y versión; corregir otra vez invalida viejo mapeo. Si hay variantes, x6 vs x12, artículo inactivo, conflicto o unidades no inferibles, volver a revisión **sin aprender error**.
4. Alias **no guarda costo** fijo: cada semana lee costo de la lista vigente; si falta un costo o el pack es ambiguo, no calcular costo unitario ni precio público nuevo.
5. Las asociaciones persistentes y listas relevantes entran en JSON versionado; no usar OCR o ML remoto como condición de operación.

### 3.2 Precios sugeridos y aplicación segura

- Para una presentación con `U>0` unidades y costo total `C`, costo unitario exacto `C/U` y **sugerido público = mínimo múltiplo de $500 mayor o igual a `(C/U)×1,5`**, en pesos enteros. Si ese valor ya es múltiplo, no se suma otro $500. La persona puede escribir precio final válido distinto.
- **Solo** filas con cambio seguro de **precio público** quedan **preseleccionadas**; las que solo cambian de costo quedan visibles pero no generarán escritura de precio, y las dudosas no se marcan. Filas sin cambios ocultas por defecto.
- Si se edita el precio final hasta quedar igual al vigente, contar `0 cambios` para esa fila. `Revisar N cambios` muestra lista antes/después. **`Aplicar N precios`** exige confirmación. Aún no se crea lote/stock/caja.
- Cada precio seleccionado registra `productId`, **versión y precio previo esperado**, precio nuevo, elección final. Si hubo edición del producto desde otra pestaña, **no sobrescribir**: mostrar fila en conflicto y recalcular/revisar.
- Para aplicar el lote, la propuesta segura es **un único comando local con transacción atómica** de todos los precios seleccionados; si algo falla **no aplicar parcialmente**. Permitir dividir voluntariamente la selección para reintentar tras corregir conflictos, pero no reportar éxito parcial como completo.
- Repetir el mismo comando sellado no reaplica nada. No tocar ventas históricas ni costos FIFO. Cambios de costos de lista son referencia, **no recepción pagada**.

### 3.3 Pedido persistente y entrega parcial

- Pedido `Borrador` admite líneas por SKU/presentación y costo estimado; `Compartir texto` usa WhatsApp/copia, pero solo acción humana explícita lo marca `Pendiente/Enviado`. El pedido **no** afecta stock, lotes ni cuentas.
- Las cantidades de compra se **sugieren** según stock objetivo por producto y presentaciones conocidas; descontar **visualmente** lo que ya está en pedido pendiente para evitar compras duplicadas, **sin sumarlo al stock físico**. Siempre permitir ajuste manual.
- Al recibir, mostrar `Pedido / Recibido` con línea, pack y unidades reales; precargar carrito pero **validar costos realmente pagados**. Si cambia tamaño de pack o llegan otros productos, revisar/vincular explícitamente la diferencia; conservar qué se pidió.
- La recepción confirmada puede referenciar pedido ID; debe tener **identidad independiente** por entrega. Una recepción de `n` líneas confirmadas crea lotes y delta de stock correspondientes y **un solo movimiento monetario de salida por compra** en la cuenta efectivamente usada, dentro de la misma transacción.
- El **pendiente por línea** = pedido − suma de unidades imputadas a entregas confirmadas, nunca stock ni deuda monetaria. `Parcial` si faltan unidades y hubo entregas; `Recibido` cuando no faltan, o un cierre explícito de faltantes tras entrega. Si llega menos/no llegó, preservar pendiente; cancelarlo **no** revierte mercadería ya recibida.
- En caso de doble toque, caída, actualización o dos pestañas, reusar ID de recepción preparada y validar suma contra pendiente con versión/transacción. **Un segundo intento del mismo recibo jamás duplica** egreso ni lote. Otra entrega días después tiene nuevo ID.
- **No confundir costo esperado con pagado:** precio estimado de lista sirve como referencia, pero el FIFO se asigna con el costo real aprobado al recibir. Si pago no fue en efectivo, usar cuenta realmente pagada o detener si el modelo de cuentas todavía no puede representarlo, nunca atribuir falsamente a efectivo.

## 4. Reportes, meta mensual, proyección y PDF

### 4.1 Proyecciones que no mezclan dinero y comercio

| Indicador | Fuente / criterio |
| --- | --- |
| Ventas de Hoy/Semana/Mes | Suma ventas de **jornadas correspondientes**, con correcciones trazables, sin sumar abonos como ventas nuevas |
| Ganancia bruta estimada | Ventas menos costo FIFO asignable; si cobertura incompleta, mostrar subtotal conocido **y advertencia de costos faltantes**, no una ganancia total inventada |
| Caja/cuentas | Cobros reales, compra pagada, gasto, aporte, retiro y traspaso; **separado** de resultado comercial |
| Artículos destacados | Unidades y ventas atribuidas al período y SKU/variante, respetando correcciones; no reconstruir a partir de precios de catálogo actuales |
| Meta mensual | ARS objetivo definido por usuario, progreso de ventas reales del mes según jornada, porcentaje si objetivo >0 |
| Proyección simple | Promedio observado de ventas por **jornada cubierta** del mes × cantidad de jornadas del mes; indicar supuestos y fecha de cálculo, no afirmarlo como resultado |

**Regla conservadora de cobertura:** no equiparar `sin ventas registradas` con `venta cero real` cuando la instalación se estrenó a mitad del mes o faltan datos. Mostrar proyección **solo si hay un tramo de datos fiable con suficientes jornadas completas**; opción operativa propuesta: al menos **7 jornadas completas con cobertura**; si no, `Todavía no hay datos suficientes para estimar el mes`. El corte de mes se define por `businessDate`, no por reloj nocturno de `registeredAt`.

### 4.2 Informe mensual local imprimible

- Desde Reportes → Mes → `Imprimir / Guardar PDF` se arma **una vista local imprimible**, con `@media print`, y luego `window.print()`. Nunca enviar datos a servicio externo ni invocar una API de facturación fiscal.
- Contenido: negocio, mes/jornada, cantidad de ventas, unidades, ventas netas tras correcciones, ganancia bruta **solo cuando costo conocido** (con nota de cobertura), desglose simple separado de compras/gastos/aportes/retiros, productos destacados, progreso de meta si existe, fecha de generación y advertencia sobre estimaciones.
- Print CSS: A4 orientativo con márgenes adecuados, tipografía contrastada, fondo claro, cero dock/header fijo/blur, tabla corta que no corte filas relevantes, saltos de página cuidados. `Cancelar` impresión **no** crea documento guardado por Mora.
- Verificar que cifra mensual = cifra del mismo período en Reportes; se puede imprimir offline. No dar por persistido un PDF solo por llamar `window.print()`; la descarga/guardado depende del sistema/navegador.

## 5. Configuración, backup JSON, restauración y migraciones

- Configuración > Datos y respaldo es el **único lugar canónico** para descargar y restaurar. Inicio muestra acceso o aviso proporcional, no un segundo motor de resguardo.
- Exportar un **snapshot coherente** que incluya movimientos, cuentas, partes de pago, créditos/abonos, correcciones, listas/alias, pedidos/recepciones vinculadas y meta mensual además del dataset actual, borradores y writeIntent. Una operación a medio confirmar debe preservarse **o** quedar fuera totalmente, nunca exportar mitad de sus efectos.
- JSON debe incluir `formatVersion`, `schemaVersion`, información del origen, inventario de entidades/contadores e integridad verificable. Toda migración de versión se programa/testea como paso explícito, compatible con backups anteriores publicados; nunca convertir un backup en datos mixtos de dos instalaciones.
- **Restaurar solo en espacio vacío** con validación de formato, tamaños, IDs, relaciones, sumas, hash e historial de comandos; **vista previa + confirmación**. Rechazar archivo corrupto/incompatible sin modificar DB. Si ya hay datos, orientar a crear copia y usar un espacio vacío, sin botón «sobrescribir» destructivo inventado.
- Dar instrucciones comprensibles para **descargar, ubicar y conservar el archivo fuera del navegador**; no asegurar que está físicamente en Archivos si la plataforma no confirma. El import desde otro equipo **reemplaza su base vacía con un snapshot**, no hace sync continua ni fusiona dos historiales.
- Al introducir nuevas entidades, planificar transacciones y validación semántica de relaciones (ID de pedido/recepción, deuda/abono, alias/SKU, operación/cuenta). **No crear stores hoy**; registrarlos en la migración futura cuando se implemente, con tests de rollback.
- La última fecha de respaldo que la app pueda afirmar debe provenir de un hecho comprobable; no emitir `Respaldo guardado` basándose solo en generación de un Blob.

## 6. Matriz de pruebas y límites

| ID | Datos de prueba | Resultado obligatorio |
| --- | --- | --- |
| DAT-01 | Venta total $10.000, efectivo $4.000 + transferencia $6.000 comprobada | 1 venta, 2 partes de pago, 2 cuentas incrementadas en importes correctos, ni duplicación |
| DAT-02 | Venta $9.000 fiada; abonos $3.000 y $6.000 | 1 venta histórica, deuda $0, dos ingresos a cuentas reales y **ninguna venta extra** |
| DAT-03 | Cuenta efectivo $30.000, transferir $12.000 a Brubank | Efectivo −12.000, Brubank +12.000, variación global 0 |
| DAT-04 | Retirar $5.000 para ahorro personal | Fondos del negocio −5.000, ningún gasto operativo |
| DAT-05 | Compra real de 3 líneas total $60.000 | Stock/lotes por línea, 1 recepción, 1 egreso real; nunca 1 gasto adicional |
| DAT-06 | Pedido x12, recibir x6 y luego x6 en otro día | 2 recibos/lotes/egresos por entregas reales, pendiente 0, sin duplicar el pedido |
| DAT-07 | Lista proveedor `COCA X6` corregida y más tarde `COCA X12` | Alias x6 recordado; x12 a revisión, no misma presentación asumida |
| DAT-08 | Precio vigente $4.500, costo pack6 $18.600 | Costo unit $3.100, sugerido $5.000, cambio preseleccionado hasta confirmación |
| DAT-09 | 3 cambios de precio, versión de 1 producto alterada en otra pestaña | Detectar conflicto y evitar actualizaciones silenciosas / éxito parcial engañoso |
| DAT-10 | Venta con corrección de cantidad y precio tras venta posterior | Mantener histórico FIFO, operación correctiva visible, sin doble ingreso o salida |
| DAT-11 | Jornada 03:00 del 1° de noviembre en Salta | `registeredAt` real, `businessDate` 31 de octubre; mes de informe correcto |
| DAT-12 | Backup de esquema actual y nuevo con alias/pedidos/deuda/abonos/writeIntent | Migración validada, restauración en blanco íntegra, reintento idempotente, rechazo de corrupto |
| DAT-13 | Mes sin meta, costos parciales y pocos datos | No porcentaje inventado ni proyección segura; PDF con nota de cobertura |

**Resultado del contrato:** las operaciones anteriores son **el comportamiento de negocio/documento al cual debe llegar la futura implementación**. Los nombres de entidad y operaciones son conceptuales, sujetos a un ADR de migración y pruebas antes del código. Los detalles que exigen nuevas decisiones de producto se presentarán **en paquete durante la validación integral**; las reglas de integridad no son permisos para inventar funcionalidades nuevas.
