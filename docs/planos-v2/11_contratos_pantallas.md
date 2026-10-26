# 11 — Contratos de pantallas y recorridos (para implementar, sin inventar)

**Propuesta 0.1, pendiente de validar con árbol de tareas y render móvil.** Es el siguiente nivel del mapa: cada pantalla tiene propósito, dueño, entrada/salida, CTA, datos, estados y prueba de aceptación. IDs trazados a 02_catalogo_pantallas.md. **P** indica futura; las pantallas actuales no deben fingirla.

## 0. Plantilla obligatoria de ficha de pantalla

~~~yaml
id: VE-03
nombre: Cobro
propietario: Ventas
objetivo_usuario: Confirmar lo físicamente cobrado por una venta
entrada: selector | carrito
salida: confirmación | volver a líneas
accion_primaria: guardar venta local
datos_minimos: líneas, cantidades, total, medio, recibido/vuelto
efecto_de_dominio: RecordSale durable (según variante admitida)
estados: vacío | preparado | validando | error | confirmado | revisión
recuperacion: mismo commandId; sin duplicación
accesibilidad: nombre de campos, focos, CTA visible, error cercano
fuente_visual: cobro.webp
evidencia: prueba automática + QA móvil + comparación visual
estatus: efectivo implementado; otros métodos pendientes
~~~

La ficha es un **contrato de interfaz**, no la fuente de verdad del dominio. El efecto real lo determina `src/domain` y `src/local`. Si un campo de la ficha necesita un dato inexistente, **no improvisarlo desde React**.

## 1. Inicio — IN-01 / IN-02 / IN-03

**Propósito:** responder en pocos segundos cuánto se vendió, cuánto se ganó en términos estimados y qué hace falta reponer; ofrecer la siguiente tarea **sin servir como centro administrativo**.

- **Información principal:** «Resumen de hoy», «Ventas de hoy», «Ganancia estimada», «Para reponer». Métricas derivadas de la jornada correcta; ventas registradas con costo no calculable deben comunicar incertidumbre. Listas de stock con máximo unas prioridades y «Ver reposición».
- **Acción principal global:** botón central **+ Nueva venta**, disponible desde Inicio pero no parte de la pantalla. Inicio muestra Ventas de hoy, ganancias y reposición; accesos secundarios a Reportes, Inventario/Reposición, Caja y Configuración. Evitar otro CTA fucsia que compita con +.
- **Alerta excepcional:** recuperación de confirmación pendiente, stock en revisión, backup con riesgo probado; no convertir cada una en tarjeta permanente.
- **Estates:** negocio vacío (alta producto), sin ventas, faltantes, costos incompletos, writeIntent pendiente, modo sin conexión, error real de datos. Cada vacío tiene CTA contextual verificable.
- **No incluir:** lista completa de gastos/operaciones/stock, edición de productos, backup modal como única ubicación, números con apariencia de saldo real si no hubo conteo.
- **Entrada:** pestaña Inicio / fin de venta / volver de sección contextual. **Volver:** a Inicio desde Caja/Config según origen.
- **Pruebas:** distinguir ventas/ganancia/saldo, iniciar venta con **+**, ir a faltantes, entender costo pendiente; inspección 360/390/430 CSS px y voz lectora.
- **Ref visual:** `inicio.webp`. **Estado:** funcional con estructura provisional (#11).

## 2. Ventas — VE-00 Área de historial y gestión

**La pestaña Ventas no es el formulario de Nueva venta.** Abre historial real como contenido principal, detalle de cada venta, contexto de borrador si existe y, cuando estén implementados, correcciones, fiados y abonos. Estado sin ventas: «Todavía no registraste ventas. Usá + para registrar una venta». Las pantallas futuras no fingen funcionalidad.

**Pruebas:** NAV+-01 (Ventas abre historial), NAV+-06 (estado vacío), NAV+-03 (+ retoma borrador), NAV+-09 (regreso desde Reportes). Referencia: [ADR 17](17_adr_ventas_y_nueva_venta.md).

## 2a. Nueva venta — VE-01 Selector

**Propósito:** encontrar una bebida rápidamente y añadirla a una venta en curso.

- **Entrada:** botón central **+ Nueva venta** desde cualquier área, o volver de Carrito. Si hay borrador, se retoma. **Salida:** Cobro directo o Carrito opcional; la pestaña **Ventas** abre historial/gestión conservando el borrador.
- **Primaria:** consultar mediante búsqueda/listado y **Agregar producto** como acción explícita separada; Cobrar cuando existe al menos una línea. Un artículo frecuente puede agregarse desde Favoritos sin abrir ficha comercial, pero **consultarlo no debe sumar unidades**.
- **Datos:** en cada resultado, información suficiente para una consulta breve sin abrir ficha: nombre, variante/presentación, **precio de venta** y stock registrado con alerta/incertidumbre pertinente; búsqueda/categoría, borrador durable, subtotal y cantidad. El costo FIFO **no** se requiere en selector. **Observación conversacional 21/10/2026:** durante una venta con tres líneas, el usuario eligió consultar mediante buscador o lista de disponibles, sin salir del flujo; leer [20 — Observaciones](20_observaciones_prueba_usuario.md).
- **Vacios:** catálogo vacío → alta de producto desde Productos; sin coincidencias → borrar búsqueda; favoritos vacíos → consejo, no sección gigante.
- **Protecciones:** stock insuficiente no impide registrar venta física (debe permitir revisión posterior); bloquea sólo operaciones incompatibles con confirmación sellada, no simplemente por «sin internet».
- **Regreso:** al volver de Carrito/Cobro conserva líneas, búsqueda útil, cantidades y contexto; nuevas ventas empiezan limpias **sólo tras** confirmación y acción.
- **QA:** una venta de una unidad sin carrito; multiproducto; búsqueda y filtro; **tres líneas en borrador → buscar cuarto producto → leer precio/stock sin agregárselo → conservar cantidad/total → volver al borrador**; offline/reload; no duplicación doble clic. Validar en móvil que la fila sea legible, sin obligar a abrir ficha.
- **Ref:** `ventas.webp`. **Estado:** funcional.

### Decisión de simplificación — incidentes durante Nueva venta (observación 21/10/2026)

Una rotura/faltante físico imprevisto **no genera una herramienta específica** en el selector ni interrumpe obligatoriamente una venta. Si el producto no estaba en carrito, la venta sigue intacta; si estaba, quitar una unidad o la línea sólo corrige lo que se va a cobrar. **La baja física se registra luego por el único flujo canónico de Inventario**, desde Más → Inventario → Producto → Ajustar stock, sin atribuir costo o merma al hecho de editar el borrador.

**Caso de aceptación a probar:** tres líneas en borrador; incidente de producto no incluido → mantener venta intacta; incidente de producto incluido → reducir línea sin alterar stock por merma; concluir venta; registrar baja con revisión de stock vigente, motivo e historial. Evitar una función «rotura durante venta» en esta pantalla. Referencia: [20 — Observaciones](20_observaciones_prueba_usuario.md).

## 3. Ventas — VE-02 Carrito

**Propósito:** revisar/modificar líneas, no ser barrera obligatoria.

- **Contenido:** producto y variante, cantidad editable, precio unitario del borrador, subtotal, total; agregar/quitar.
- **Primaria:** Continuar al cobro. **Secundaria:** agregar otro / quitar artículo; vaciar exige protección proporcional al riesgo (confirmación si puede destruir trabajo).
- **Estados:** carrito vacío; producto desactivado después de añadirse; cantidad > stock; venta sellada no editable hasta reabrir formalmente.
- **Regreso:** Selector con misma búsqueda y borrador.
- **QA:** cambiar 1→3, eliminar línea, recalcular, volver selector y entrar directo a Cobro sin pasos extra.
- **Ref:** `carrito.webp` sólo prototipo; nunca etiquetarlo diseño final.

## 4. Ventas — VE-03 Cobro

**Propósito:** permitir registrar una venta real única con su medio de cobro, sin confusión ni doble efecto.

- **Información crítica SIEMPRE visible:** total, cantidad, medio, caja recibida/vuelto o acreditación humana/fiado cuando se implementen.
- **Efectivo hoy:** campo recibido opcional (vacío = importe exacto informado claramente), validación insuficiente, vuelto, botón «Guardar venta en efectivo».
- **Transferencia/mixto/fiado futuros:** presentan ruta y estados en plano, pero **no** como botones funcionales. Transferencia exige afirmación humana de acreditación verificada en Brubank/otra cuenta. Mixto suma partes hasta igualar total, fiado crea deuda sin generar entrada de caja.
- **Acción primaria:** Guardar; no bloquear por conexión. Después de sellar borrador, botón Reintentar usa el mismo comando, no uno nuevo.
- **Estados:** borrador editable, validación, registrado local, preparado/reintento, revisión de stock, costo desconocido.
- **QA:** exacto, vuelto, insuficiente sin pérdida, venta sin stock, doble toque, error y reintento, recarga con operación preparada, teclado abierto y CTA enfocado.
- **Ref:** `cobro.webp`. **Estado:** efectivo implementado; demás pendientes.

**Relevancia normativa:** [WCAG 3.3.4](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html) contempla revisión/corrección u otras salvaguardas en operaciones importantes de datos/dinero; no implica exigir un segundo modal en todas las operaciones menores. [GOV.UK Check answers](https://design-system.service.gov.uk/patterns/check-answers/) aporta patrón de verificación previa, a adaptar sin ralentizar venta de una botella.

## 5. Ventas — VE-04/05/06/07/08/09 Confirmación, historial, detalle, correcciones y fiados

| ID | Contenido/acción | Entrada / regreso | Estado |
| --- | --- | --- | --- |
| VE-04 Confirmación | «Venta guardada», monto, unidades, advertencia de revisión sin saldo falso, Nueva venta | Desde Cobro; después nueva o Inicio | Implementada |
| VE-05 Historial | Lista de ventas reales, fecha/hora de carga, total y medio, filtros cuando haya volumen | Ventas; vuelve manteniendo consulta | Básico implementado |
| VE-06 Detalle | Artículos, importes, método, costo FIFO si conocido, trazabilidad bajo demanda | Historial o Reportes, regreso al origen | Lectura parcial |
| VE-07 Corrección | Previsualiza efecto en stock, dinero, costo y deuda; confirma asiento trazable | Detalle; retorna con histórico intacto | P — no implementar hasta diseñar dominio |
| VE-08 Fiados | Clientes y saldos pendientes, ventas de origen y abonos | Ventas secundario, cuenta de cliente | P |
| VE-09 Abono | Cobro parcial/total, cuenta, saldo nuevo, operación separada de venta | Fiados > Cliente > Abonar; vuelve a cliente | P |

**Condición:** no incluir acciones falsas en una pantalla «futura» ni habilitar corrección sin compensaciones transaccionales.

## 6. Productos — PR-01 Catálogo / PR-02 Ficha / PR-03 Alta-edición

**Catálogo:** encontrar/modificar un artículo; búsqueda, orden, categoría, filtro bajo stock, precio y cantidad clara. Al abrir ficha no se pierde el filtro ni scroll si vuelve. No usar imagen equivocada sólo para llenar una fila.

**Ficha:** variante, categoría, precio, stock/objetivo y estado activo. Agrupar «Editar producto», «Inventario» y «Reposición» según responsabilidad; no mostrar todos los lotes/fórmulas por defecto. Favorito afecta acceso rápido de Ventas, no precio/stock.

**Alta-edición:** inputs comprensibles, objetivo manual opcional, soft delete al desactivar producto con historial, CAS/versionado, precio de futuras ventas sin reescribir pasado. Costos y cantidades reales se cargan en Stock inicial o Recepción, no en una supuesta «compra» ficticia.

- **Entrada:** Productos; fichas por ID; «Agregar» desde estado vacío.
- **Estados:** vacío, sin resultados, desactivado, stock desconocido, objetivo ausente, edición concurrente, preparado/reintento.
- **QA:** alta/edición, desactivar usado, historial permanece, precio histórico no cambia, favorito aparece en Ventas.
- **Ref:** `productos.webp`. **Estado:** implementación funcional con ficha provisional.

## 7. Productos — PR-05/06/07/08 Inventario y conteo

**Inventario** no es un sinónimo de Catálogo. Muestra stock actual por producto, referencia de objetivo, diferencias y acciones de verificación física; **no** dinero.

**Conteo:** escoger SKU/variante, leer referencia actual, escribir cantidad contada, mostrar diferencia clara, motivo, nota opcional y confirmación. Si la línea base cambió en otra pestaña, **no** ejecutar ajuste viejo; mostrar estado nuevo y pedir revisar. Un faltante valora baja FIFO cuando se puede; sobrante nunca inventa costo cero.

**Historial stock:** entradas (stock inicial/recepción), salidas (ventas/conteos), ajustes con motivo. Conteo/costo técnico no equivale a movimiento monetario.

**Stock inicial:** si aún no hay movimientos, ingresar unidades y costo conocido o desconocido, sin salida de caja histórica ficticia.

- **Entrada:** Productos > Inventario; atajo desde «Para reponer» o ficha.
- **Regreso:** inventario con SKU y filtro preservados.
- **QA:** contar 4→3, conteo sin diferencia, exceso → costo desconocido, edición concurrente, consumo FIFO y revisión histórica.
- **Estado:** núcleo de conteo implementado (#10), ubicación de UI propuesta pendiente; pantalla Inventario propia aún no existe.

## 8. Reposición — PR-09/10/11 área propia de compras y recepciones

**Reposición:** productos por objetivo, unidades faltantes y presentaciones compra; no tratar ≤20 % como cantidad fija por todo el catálogo. Si objetivo no existe, mostrar «sin objetivo» sin inventarlo.

**Pedido futuro:** preparar cantidad en paquetes/unidades; enviar texto por WhatsApp como acción explícita; pedido *enviado* no cambia stock ni caja. El pedido se prepara habitualmente antes del jueves/viernes, según operación real.

**Recepción hoy:** desde Producto o futura Reposición, informar unidades físicas recibidas, costo total real, presentación; guardar recepción única: crea lote FIFO, aumenta stock y registra salida de efectivo **una sola vez**. En entregas parciales registrar sólo cantidad real.

- **Entrada principal:** Más → Reposición → Recibir, con producto opcional preseleccionado. **Entrada contextual:** ficha en Productos → «Ver en Reposición» hacia la misma área, nunca un segundo formulario de recepción. Reposición es área propia de interfaz, aunque comparte catálogo, stock y costos.
- **Estados:** pedido vacío, pedido enviado, entrega parcial, costo desconocido (si el contrato lo permite), error de escritura, confirmado.
- **QA:** 2 packs de 6 = 12 unidades, compra pagada una vez, pedido no muta stock, sobreventa previa no se borra. Navegar desde Más → Reposición y desde ficha de producto → misma Reposición; regresar al origen; comprobar una única recepción, lote FIFO y egreso reflejado en Caja.
- **Estado:** recepción simple implementada, preparación/enlace de pedido futura.

### Reposición — pantalla principal PR-09 (jerarquía aceptada provisionalmente; 25/10/2026)

**Estado actualizado por respuesta del usuario el 25/10/2026:** ante la jerarquía propuesta de mostrar «Pedido pendiente» y «Recibir mercadería» primero, «Para reponer» después y «Lista del proveedor» como sección secundaria, respondió **«Sí, me parece bien. Por ahora esa pantalla está bien dentro de todo»**. Se acepta **provisionalmente la jerarquía y la composición conceptual**, **no** la estética final ni implementación. Objetivo: reunir tareas sin otro dashboard de ventas, finanzas o stock completo.

**Composición móvil propuesta (360–430 px):**

1. **Cabecera global aprobada:** «Mora.» y franja contextual con «Volver» y «Reposición». El dock candidato conserva «Inicio · Ventas · (+) · Caja · Más»; el área activa es «Más». Volver respeta origen (directorio Más, Inicio o ficha comercial).
2. **Área prioritaria contextual:** si hay uno o varios **pedidos pendientes de entrega**, mostrar primero **un pedido relevante** con fecha, estado (pendiente/parcial), breve referencia de productos y acción **«Recibir mercadería»**, más «Ver todos los pedidos» cuando corresponda. Si no hay pedidos pendientes, sustituir por la acción principal **«Preparar pedido»**; evitar bloque vacío de tamaño grande. **No** mostrar precios estimados como dinero pagado.
3. **«Para reponer»:** resumen compacto de **hasta 2–3 artículos prioritarios** con stock actual, objetivo y enlace «Ver faltantes». Umbrales: bajo ≤20 % del **objetivo por producto**, crítico ≤10 %; recomendaciones de cantidad hacia objetivo y presentaciones se calculan en el flujo de pedido, no saturan la portada. Si un artículo ya está en pedido pendiente, etiquetar **«Ya pedido»**; no contarlo como stock físico ni volver a sugerirlo ingenuamente como una compra nueva. Sin objetivo, no fabricar alerta.
4. **«Lista del proveedor»:** fila secundaria visible con fecha de última lista **si existe** y acción **«Actualizar lista»** (pegar WhatsApp, sanear y revisar precios); si no existe, «Cargar lista». La lista es referencia de costos/precios comerciales y no genera stock ni Caja. Su ausencia no debe impedir una recepción urgente con costo verificado manualmente.
5. **Acciones secundarias discretas:** **«Preparar pedido»** cuando ya haya pendiente y se necesite otro, y **«Recibir sin pedido»** para compras imprevistas; ambas reutilizan su flujo canónico, no crean servicios duplicados. No incorporar un menú con todas las operaciones ni formularios en la portada.
6. **Múltiples pendientes y excepcionalidades:** mostrar el más accionable arriba y «Ver todos» para lista propia; un pedido con entrega parcial conserva su saldo real faltante y puede priorizarse por fecha. Presentación nunca implica transferencia financiera ni recepción automática.
7. **Estados de portada:** primera instalación (catálogo vacío), productos sin objetivo, stock suficiente, lista ausente, pedido borrador, pedido enviado, parcial, varios pedidos, offline, confirmación sellada pendiente o error recuperable. La acción de recuperación durable **debe tener prioridad por encima de iniciar otra recepción**, evitando doble writeIntent.
8. **Prueba móvil prevista:** desde Más localizar pedido pendiente y abrir recepción con carrito completo; desde Inicio entrar a Reposición y volver; sin pendientes iniciar pedido; identificar qué productos ya se pidieron sin modificar stock; actualizar lista; recibir urgencia sin pedido; comprobar títulos/contraste/tamaño táctil a 360/390/430 px.

**Jerarquía resumida:** **pedido pendiente y recepción** (solo cuando exista) → **para reponer** → **lista semanal de proveedor**; sin pendiente: **preparar pedido** toma la posición superior. **Jerarquía de pantalla validada provisionalmente por el usuario**; pendiente su consistencia visual y UX con todo el plano maestro antes de declarar diseño final. No implica que el proveedor envíe o que la recepción se registre al pulsar CTA, ni requiere backend.

### Reposición — preparar, guardar y recibir pedidos (aprobado 25/10/2026)

**Decisión validada por el usuario:** el pedido preparado se **guarda de forma persistente** en Reposición y, cuando llega la mercadería, se abre para **precargar el carrito de recepción multisproducto**. Es el flujo normal; no obligar a seleccionar productos de nuevo.

**Contrato conceptual del recorrido:**

| Estado | Acción | Efecto sobre datos |
| --- | --- | --- |
| **Borrador** | Aceptar sugerencias por stock objetivo/producto, convertir faltantes a presentaciones, ajustar productos/packs y costos estimados de la lista saneada | Solo pedido editable local; **no** cambia stock, lotes ni Caja |
| **Pendiente** | Crear el texto para WhatsApp, compartir/copiar y **marcar como enviado** explícitamente si corresponde | Pedido guardado esperando entrega; no interpretar abrir WhatsApp como prueba de envío |
| **Recibir** | Abrir pedido, precargar todas las líneas; verificar recibido real, presentación, unidades y costo final | Carrito editable de recepción **sin movimiento** hasta confirmar |
| **Recibido parcialmente** | Confirmar solo las líneas/cantidades físicas que llegaron con un `ReceivePurchase`; mostrar lo que falta | **Lotes + stock + un egreso** solo por esa recepción; resto pendiente, sin stock ficticio |
| **Recibido** | Completar la mercadería pendiente y cerrar cuando no falten cantidades | Historial de pedido vinculado a una o varias recepciones, sin duplicar movimientos |
| **Cancelado** | Abandonar pendientes no recibidos con confirmación | Conserva historia de recepciones ya confirmadas; no revierte stock ni caja |

**Interfaz mobile-first:** entrada de Reposición con «Preparar pedido» y «Pedidos pendientes» claramente diferenciados de «Recibir sin pedido» (compra imprevista); dentro de un pendiente, botón prioritario «Recibir mercadería». Mostrar pendientes con resumen legible (productos, fecha, lo recibido/faltante y costo **estimado**, no dinero pagado). En pedido, el precio de lista es **estimación**; el costo real se verifica al recibir y el total monetario se genera **solo** desde el evento de recepción.

**Reglas especiales:** evitar sugerir pedidos ya abiertos como compra nueva sin advertir cantidades comprometidas (no contar pedido como stock actual). Si se recibe menos, registrar solo unidades reales y mantener saldo sin duplicar, incluso tras cerrar/reabrir. Si llega algo distinto, agregar/modificar el carrito de recepción con trazabilidad sin reescribir silenciosamente el pedido enviado. Si falla la confirmación, recuperar el **mismo** comando y todas sus líneas; ni segunda recepción ni doble débito. Para entregas posteriores, crear nueva recepción real enlazada con el mismo pedido. No registrar una compra en Caja como gasto manual adicional.

**Implementación/QA pendiente:** `ReceivePurchase` ya admite varias líneas, pero no existe contrato implementado de pedido persistente/vínculo con recepciones. Diseñar estado y almacenamiento Dexie, versión/migración del backup JSON, atomicidad entre recepción real y pendiente, export/restore, reload, envío WhatsApp no confirmado y dos recepciones parciales con reintentos; sin backend ni mensajes falsos de confirmación. **No aprobada ninguna escritura de código por esta decisión documental**.

### Reposición — lista semanal y cálculo de precios antes de la compra (confirmación 25/10/2026)

**Necesidad real:** el proveedor envía por WhatsApp una lista semanal con **precio de costo por presentación para cada producto**. La persona quiere pasarla a Mora, **sanearla**, obtener **precios sugeridos automáticos**, revisarlos y **corregirlos manualmente** antes de aplicar cambios. No exigir tipear todos los costos cada semana.

**Secuencia de pantalla propuesta (no implementada):**
- **Pegar lista:** texto original como entrada; identificar fecha/versión de referencia cuando esté disponible; **no** interpretar pegar como «Actualizar todo».
- **Revisar lista saneada:** comparar original vs producto vinculado, presentación/cantidad en unidades, precio por presentación, costo unitario calculado; filas sin certeza quedan pendientes de identificación manual.
- **Revisar precios:** mostrar precio de venta actual, sugerencia de **(costo presentación ÷ unidades) × 1,50**, redondeada **hacia arriba a múltiplo de $500**, y edición directa por producto antes de confirmar. Si el valor ya es múltiplo exacto, no sumar otros $500.
- **Confirmar aplicación:** sólo precios comerciales expresamente aprobados cambian para próximas ventas. Ningún pegado/limpieza genera stock, pedidos confirmados, lotes FIFO o gastos.
- **Preparar compra / recibir:** aprovechar costos aprobados de la lista como **referencia**, pero confirmar cantidades físicas y **costo pagado** por presentación en el carrito. Una diferencia con lista exige revisión; no recalcular costo histórico desde precio público.

**Estados mínimos:** sin lista, texto no reconocible, filas ambiguas, producto nuevo, presentación dudosa, cambio de precio, precio corregido manualmente, lote validado/aplicado. Resolver con interacción local-first; conservar original y revisión hasta finalizar.

**Regla financiera:** costo FIFO por unidad mantiene precisión racional y costo total real; **redondeo de $500 sólo para precio de venta**, no para repartir costos entre unidades. Los nombres y presentaciones ajustados pueden volver a usarse en listas siguientes, con revisión si cambia el proveedor.

**Alcance:** flujo definido por el usuario, **interfaz y saneador pendientes de implementación**. No confundir con OCR/imagen opcional ni presentarlo como actualización automática sin intervención.

### Reposición — motor local de saneamiento que aprende de las correcciones (decisión 25/10/2026)

**Necesidad confirmada por el usuario:** la lista semanal está mal escrita o abreviada; un registro sin correspondencia segura entra en **«Por revisar»**. Cuando la persona corrige su relación con Productos (y su presentación), **Mora recuerda esa resolución** para listas siguientes. No debe exigir corregir una y otra vez lo mismo.

**Flujo de identificación propuesto:**
1. Guardar temporalmente el **texto original** y separar filas/costo/presentación sin escribir en Catálogo ni en Caja.
2. **Normalizar** mayúsculas/minúsculas, puntuación, espacios, comas/puntos decimales y abreviaturas conocidas; no borrar distinciones importantes como volumen, sabor, variante o unidades por pack.
3. Buscar coincidencia exacta del catálogo o **equivalencia local previamente confirmada**, teniendo en cuenta **presentación y cantidad real de unidades**, y proveedor cuando haya contexto fiable. Solo clasificar «Reconocido» cuando los datos no se contradigan.
4. Si no hay evidencia suficiente, sugerir candidatos sin decidir por el usuario y marcar **«Por revisar»**. La resolución permite **«Vincular con producto existente»** o **«Crear producto»** usando el recorrido de alta canónico y regresar a la revisión.
5. **Aprender al confirmar la corrección**: persistir asociación **etiqueta normalizada del proveedor → producto ID + variante/presentación + unidades por pack** (y versión/fecha/confirmación pertinente). No exigir un paso extra «entrenar». En la próxima lista, reutilizar las asociaciones verificadas siempre que sigan siendo coherentes.
6. **Reaprender/corregir:** si el usuario cambia una asociación anterior, permitir invalidar/reemplazar la regla y registrar esa corrección; si alias, producto o pack entran en conflicto, suspender coincidencia automática y volver a «Por revisar». No aprender errores no confirmados o similitudes solo inferidas.

**Separación estricta:** una equivalencia aprendida identifica **qué producto/presentación es**, **no fija costos ni precios**. Los costos de cada presentación se leen de la **lista nueva**, el precio sugerido se calcula con recargo de 50 % y múltiplo superior de $500, y los costos FIFO se originan únicamente al confirmar físicamente la recepción. No inventar tamaño de pack a partir del nombre si es dudoso.

**Persistencia y backup:** es un requisito local-first. Al implementarse, el conjunto de reglas/equivalencias debe guardar su estado en IndexedDB y estar incluido en **exportación y restauración JSON**, con migración/versionado compatible; no se aprueba crear una tabla nueva por anticipado ni almacenar relaciones frágiles por nombre de producto en vez de ID. Verificar restauración en otro navegador y que reglas hacia productos ausentes/inactivos pasen a revisión. El uso de un algoritmo determinista con diccionario de alias confirmados es suficiente para el MVP; propuestas difusas pueden ofrecerse como ayuda, **nunca como verdad automática**.

**Estados y QA:** desconocido; ambiguo; sugerencia no confirmada; corregido/recordado; reconocido por alias; contradicción por presentación distinta; producto nuevo/inactivo; equivalencia invalidada; lista corregida repetida; backup/restauración; ninguna modificación automática de precio/stock/Caja antes de la confirmación humana. **No implementado**; esta sección documenta la decisión de producto, no un contrato de librería específica.

### Resolución de diseño delegada — coincidencia dudosa (25/10/2026)

**Delegación expresa del usuario:** «No con lo que ya tenemos hasta ahora resolvelo vos. Pasemos a lo siguiente». No volver a solicitar decisiones menores para el saneador salvo que surja un conflicto nuevo con efecto real.

**Comportamiento especificado para futura implementación (sin ML remoto):**

- **Coincidencia confirmada**: aplicar normalización conservadora y buscar alias local previamente validado para **producto ID + variante + unidades/presentación**, condicionado a que el producto siga vigente y sin contradicción; reutilizar en la siguiente lista.
- **Coincidencia no aprendida**: coincidencia exacta confiable entre SKU/presentación y catálogo puede marcarse reconocida si es inequívoca; una similitud textual no confirmada genera **sugerencia**, nunca asignación automática. Ordenar candidatos por nombre normalizado, marca, volumen/variante y unidades del pack cuando estén disponibles.
- **Fila por revisar**: mostrar **primera sugerencia con nombre y presentación completos**, alternativas sólo a demanda, y acciones «Es este producto» / «Elegir otro» / «Crear producto». La selección confirma la asociación sin pantalla extra y conserva el contexto; nunca forzar alta de SKU por una abreviatura del proveedor. Si falta cantidad de presentación, **no inferir** ni calcular costo unitario/precio hasta resolverla.
- **Aprendizaje**: guardar alias sólo tras corrección/confirmación inequívoca; al cambiar la asignación anterior invalidar la versión vieja. Si quedan múltiples productos, conflicto de packs x6/x12 o variante no distinguible, **no aprender ni aplicar**.
- **Separación**: confirmar reconocimiento puede habilitar **propuesta de precio** y su preselección si resulta segura, pero **no cambia catálogo ni stock** hasta la confirmación comercial final; no guarda costos como alias.
- **Errores y recuperación**: revisión pendiente, asociación corregida, anulación y backup de alias persistidos; después de restaurar, validar integridad de ID y unidades.

**Alcance:** decisión de interacción resuelta por el asistente a petición del usuario, sujeta a QA real; no autoriza implementación ni introducir sincronización, redes, librerías ML o entidades adicionales hoy.

### Propuesta de pantalla móvil — «Revisar lista del proveedor» (25/10/2026)

**Estado:** boceto de contrato para conversar con el usuario; **NO es aprobación visual ni interfaz implementada**. Parte del flujo de pegado/saneamiento/precios ya confirmado. Reutilizar el header global de dos franjas de Mora: «Mora.» arriba y **«Volver» uniforme a la izquierda** del contexto «Revisar lista» abajo.

**Objetivo:** pasar de una lista pegada potencialmente desordenada a un conjunto de **propuestas comprobables de cambio de precio público**, minimizando inspección repetida sin aplicar cambios silenciosos ni alterar stock/Caja.

**Estructura propuesta para 360–430 px:**

1. **Encabezado de avance:** «Revisar lista del proveedor», referencia opcional de fecha y resumen sobrio de **cambios** y **por revisar**. El total de filas **sin cambios** se muestra sólo en un texto/enlace discreto secundario («N sin cambios»), no como bloque de métricas que compita por atención. Las cifras se derivan del procesamiento real.
2. **Contenido por defecto (aprobado por el usuario el 25/10/2026):** mostrar **solamente productos con cambios relevantes y filas que requieren resolución**; agrupar/ordenar primero los dudosos y los cambios accionables, sin tarjetas ni contadores dominantes para lo estable. Los productos **realmente sin cambios** quedan **ocultos por defecto**, recuperables mediante enlace discreto «Ver N sin cambios» o filtro secundario a demanda. No exigir que el operador revise nuevamente cada fila idéntica.
3. **Cada producto como fila/tarjeta compacta:** producto de Mora reconocido + variante; presentación (`pack/cajón/caja/suelto`), unidades por presentación y **costo informado por presentación**; **precio actual → sugerido** destacado; estado «Coincide» / «Cambió» / «Revisar». Mostrar costo unitario calculado sin redondeo ficticio cuando aporte claridad.
4. **Detalles a demanda:** texto original exacto del proveedor, correspondencia escogida, costo anterior como referencia **si está disponible**, notas de coincidencia, presentación y motivo de incertidumbre. Abrir detalle **no** cambia selección o precio.
5. **Corrección manual:** cambiar asociación, unidades del pack, precio por presentación, o precio de venta final. Recalcular propuesta tras corregir insumos, pero **nunca sobrescribir silenciosamente una corrección manual**; explicitar la propuesta y el valor final que se aplicaría.
6. **Fila incierta:** si no está identificado el SKU, el tamaño del pack o el costo, **marcar «Por revisar»**; resolver manualmente o dejar fuera de los cambios, sin elegir coincidencia cercana automáticamente.
7. **Acción final:** «Revisar cambios»/«Aplicar precios revisados» tras una **vista previa de diferencias** producto por producto. Aplicar únicamente artículos explícitamente revisados/seleccionados; no actualizar nada por pegar texto o salir con Volver. No dejar acciones destructivas en una tarjeta que parece de lectura.
8. **Persistencia y estado:** conservar el original y ediciones en curso en el diseño local-first sin afirmar que existe hoy; proponer una política concreta de guardado de borrador antes de implementar. Evitar duplicados entre dispositivos; backup/restauración JSON deberá cubrir cualquier dato persistido nuevo.

**Criterio de clasificación:** «Sin cambios» significa que la fila fue reconocida con confianza y no cambió **ningún dato relevante que deba revisarse** frente a la referencia válida anterior; una variación de **costo del proveedor o presentación** debe aparecer aunque el precio público sugerido termine siendo el mismo por el redondeo. Duplicados, productos sin equivalencia, precios no interpretables y presentaciones inciertas van a **«Por revisar»**; no se ocultan como «sin cambios». Si **todo** está igual y no hay dudas, mostrar «No hay precios para revisar esta semana» con el enlace discreto para consultar la lista completa. La selección final de cambios continúa siendo **explícita** y la acción de confirmar nunca incluye por defecto filas ocultas.

**Ejemplo ficticio de fila para probar legibilidad, NO costo/precio real:** «COCA 2,5 X6 — $18.600» → Coca-Cola 2,5 L, pack de 6, costo unitario $3.100; precio público vigente ilustrativo $4.500, sugerido $5.000 (`ceil((18.600 / 6 × 1,50) / 500) × 500`). La persona puede corregir el precio final. Si lista «COCA 2,5 — $18.600» sin cantidad clara, no dividir por 6 automáticamente.

**Regla clave:** el precio sugerido es una decisión comercial para ventas futuras; el **costo FIFO del lote se registra sólo cuando se recibe físicamente la mercadería con su costo real**, no al sanear la lista semanal. La lista sirve como referencia para armar carrito/pedido, no registra compras.

**Pendiente de validar:** si las filas con cambios seguros aparecen como seleccionadas por defecto o exigen marca individual; cómo guardar las correcciones semana a semana sin repetir trabajo ni ocultar cambios de presentación. Probar tiempos/tamaño/foco en celular real con lista completa y nombres confusos.

### Propuesta pendiente — selección y aplicación de varios precios (25/10/2026)

**Decisión del usuario (25/10/2026):** los **cambios claros aparecen seleccionados por defecto**. El boceto exacto, el mecanismo de confirmación técnica y sus pruebas siguen pendientes. Preseleccionar **no** ejecuta escrituras.

**Recorrido aprobado a nivel de experiencia, pendiente de prueba real en móvil:**
1. Mostrar cambios reconocidos con seguridad, cambios de costo sin cambio de precio público y filas «Por revisar», manteniendo fuera de vista los que realmente siguen igual. **Preseleccionar automáticamente sólo los cambios seguros de precio de venta**, antes de cualquier confirmación.
2. Preselección condicionada a **producto/presentación/costo inequívocos**, precio sugerido calculable y **diferente al precio vigente**. Permitir desmarcar o volver a marcar una fila; si se decide ofrecer «Seleccionar cambios claros», será una acción secundaria de recuperación, no requisito para avanzar. **Excluir de la preselección** filas «Por revisar», productos sin identificación o con duda, y cambios sólo de costo sin variación del precio público.
3. Cada fila seleccionable muestra **precio anterior → precio final**; el precio sugerido proviene de costo presentación / unidades × 1,50 redondeado hacia arriba a múltiplo de $500. La persona puede **corregir el precio final manualmente** y conservar esa corrección al cambiar filtros/selección; no reemplazarla silenciosamente si se recalculan insumos.
4. Botón **«Revisar N cambios»** abre un resumen independiente (no aplica aún) con cada producto y el antes/después. Si nada está seleccionado, botón inactivo y texto que lo explica.
5. **Confirmación explícita única de UI** («Aplicar N precios») para los **N elementos elegidos**, sin tocar catálogo por pegar lista, marcar casilla, abrir resumen o presionar Volver.
6. Si el catálogo cambió durante la revisión, mostrar conflicto por artículo y pedir revisión. **No** presentar «Todo actualizado» tras un guardado parcial o incierto; la futura implementación deberá definir transacción consistente o mostrar resultados por artículo de forma recuperable/idempotente. Los precios cobrados en ventas previas no se modifican.

**Observación de diseño:** una fila con variación de costo de proveedor pero sin cambio en precio público **sigue visible en «Cambios»** para leer la diferencia, aunque no se incluya en «Seleccionar cambios claros» ni requiera escritura de precio. Una fila dudosa exige resolver asociación/unidades/costo antes de incorporarla al lote.

**Validado por el usuario:** los cambios seguros quedan **preseleccionados**, con revisión y confirmación final obligatorias. **Pendiente:** ergonomía visual y accesibilidad en móvil, protección ante cambios de catálogo concurrentes, y semántica de escritura en lote sin éxito parcial engañoso. Una corrección manual que deje el precio final igual al vigente no debe contarse como precio para actualizar. Nunca seleccionar filas ambiguas automáticamente.

### Reposición — PR-11: carrito de recepción multisproducto aprobado (22/10/2026)

**Decisión de interfaz:** recibir **toda una compra junta**, con múltiples productos y **carrito de Reposición** semejante al de Ventas, pero con unidades de compra y costos propios. Una sola recepción registrada; no exigir compras separadas para cada SKU.

| Etapa | Contenido / comportamiento propuesto | Regla de integridad |
| --- | --- | --- |
| Selección | Búsqueda de productos y selección de lo recibido; sumar o retirar líneas | No tocar stock ni Caja |
| Carrito | Por producto: variante, tipo de empaque (p. ej. cajón/caja/pack/suelto), número de empaques, unidades por empaque, **unidades reales recibidas**, **costo total real por línea** y subtotal general | Convertir a unidades individuales sin inventar stock/costos; editar sin write |
| Revisar y confirmar | Lista completa, totales de unidades y costo, importe pagado; verificar dinero/salida consistente con suma de líneas | **Una sola confirmación `ReceivePurchase`** y no un `RecordExpense` adicional |
| Guardado y recuperación | Resultado de un receiptId, líneas y lotes FIFO, una salida `purchase` de Caja, historial y retorno | Mismo `commandId` tras fallo; recuperar **todas** las líneas de `writeIntent`, no sólo primera |

**Situación del código comprobada:** `ReceivePurchase` recibe `PurchaseLine[]` y se ejecuta en una transacción Dexie ya apta para varias líneas; cada línea origina lote FIFO y stock, la suma se registra como un único movimiento de dinero. La UI vigente `saveStock` usa una línea, y `reopenWrite` toma `lines[0]`; **son brechas de interfaz/recuperación**, no licencia para cambiar esquemas sin justificación.

**Abierto para decisión de UX:** ingreso de costos por pack versus costo total de producto, discrepancias de factura, experiencia de pedido vs recepción, persistencia del carrito editable, compras parciales/financiadas solo si se aprueban expresamente. **No** introducir “carrito compartido” con Ventas ni mezclar `Draft` de venta con recepción. La división de costos FIFO debe preservar exactitud monetaria y backups.

**Pruebas obligatorias al implementar:** Quilmes 2 cajones × 10 = 20 unidades; Speed 3 packs × 12 = 36 unidades; vodka 1 caja × 6 = 6 unidades (cantidades ilustrativas, no defaults globales); precios distintos por línea, suma exacta, un solo egreso, historial agrupado, doble toque/reintento idempotente, falla que revierte todo, reload con confirmación pendiente, salida con carrito editable, restauración JSON íntegra.

## 9. Caja — CA-01/02/03/04/05/06/07/08/09

**Caja y dinero:** área con entrada directa en el dock principal actualmente en validación (**Inicio · Ventas · + · Caja · Más**); referencia visual `caja-cuentas.webp` aprobada para *Resumen / Movimientos / Cuentas*, sujeto a QA. + continúa siendo acción y no tab.

- **CA-01 Resumen (P):** entradas/salidas conocidas y efectivo esperado **solo con saldo inicial confiable**; contado real con marca temporal ingresada por persona; diferencia sólo si ambos existen. Si no, «No informado».
- **CA-02 Movimientos (núcleo actual T):** historial de cobros, compras pagadas, gastos, aportes y futuros retiros; origen de cada fila verificable. No mezclar ajustes de stock sin efecto monetario. **Estructura y rótulos aprobados (22/10/2026):** un CTA «Registrar» que abre exactamente tres opciones: **Gasto**, **Aporte**, **Mover dinero**. Esta tercera opción lleva a **«Entre cuentas»** o **«Retirar del negocio»**. No equivale a habilitar operaciones de traspaso/retiro pendientes. Dentro del tipo, distinguir retiro fuera del negocio de traspaso interno sin doble ingreso. Menú visual pendiente de QA; no habilitar operaciones P.
- **CA-03 Gasto y CA-04 Aporte (T):** importe, motivo/nota, confirmación durable, monto +/− claro y no sumar ganancia comercial.
- **CA-05 Retiro/ahorro (P):** extracción fuera del negocio, no gasto ni traspaso interno.
- **CA-06 Conteo físico (P):** importe real y fecha; no «arreglar» diferencia inventando ingreso o egreso.
- **CA-07 Cuentas (P):** efectivo, Brubank y alternativas sólo sobre transacciones atribuibles a Mora; nada de saldo remoto supuesto.
- **CA-08/09 Traspasos (P):** cuentas propias +/− sin duplicar ventas o ingresos; Brubank→efectivo requiere comprobación de los hechos reales.

**QA:** gasto y aporte se ven en historial y Reportes, no como venta; conteo de stock pertenece a Productos; Caja puede abrirse/volverse sin perder tarea de origen.

## 10. Reportes — RE-01/02/03/04/05/06

**Propósito:** interpretar el negocio, no administrar registros. «Hoy/Semana/Mes» conserva período al abrir detalle de venta u otra área y volver.

- **Inicial:** ventas, ganancia bruta estimada, cobertura de costos, unidades/productos más vendidos, progreso por jornada.
- **Secundario:** gastos, aportes, compras, valor FIFO de bajas, variación de efectivo **separados** de resultado comercial.
- **Detalles:** enlace único a Ventas > Detalle y Caja > Movimientos, sin clonar listas enteras de historial.
- **Vacios:** sin ventas, sin costos conocidos, sin comparaciones fiables; no inventar porcentaje ni proyección.
- **Metas/proyecciones básicas y PDF mensual local (P obligatorio del alcance MVP):** meta mensual editable, avance respecto de ventas realmente registradas y proyección simple rotulada como estimación; ante historia insuficiente, explicar incertidumbre. El informe del mes debe abrir **vista imprimible mediante `window.print()`**, con estilos de impresión y **sin generar PDF en servidor ni añadir librería de PDF innecesaria**. Que el PDF de V1 no se haya usado frecuentemente guía su simplicidad, **no** elimina el requisito vigente. Contrato preciso para revisión en bloque III del [22](22_cierre_integral_por_bloques.md).
- **QA:** período consistente, totales reales, sin doble costo de compra, costo desconocido expresado como desconocido, regreso conserva período.
- **Ref:** `reportes.webp`. **Estado:** básicos implementados, presentación aún provisional.

## 11. Configuración — CO-01/02/03/04/05

**Acceso estable:** Configuración > Datos, localizable sin buscar en «Movimientos». Hay un enlace desde alertas de respaldo de Inicio, pero no dos sistemas de backup.

- **CO-02 Respaldo hoy:** preparar JSON íntegro, descargar, verificar que está realmente en Archivos/Descargas. No prometer resguardo solo por crear Blob sin bajar archivo.
- **CO-03 Restaurar hoy:** selector JSON, validación semántica/integridad/formato y estado vacío, vista previa, confirmación, restauración transaccional o no modificar nada.
- **CO-04 Estado de datos:** este equipo/navegador, sin sincronización, versión, advertencia sobre almacenamiento, último backup si realmente medible.
- **CO-05 Preferencias:** sólo opciones útiles; no mezclar catálogo o categorías aquí.
- **QA:** encontrar backup sin pista, descargar/restaurar en otro navegador vacío, rechazar importación sobre actividad, archivo corrupto no afecta DB, offline.
- **Estado:** motor backup validado, nueva ubicación y pantalla Configuración pendientes.

## 12. Reglas transversales que toda pantalla debe pasar

| Tema | Regla | Prueba |
| --- | --- | --- |
| Semántica | Un propósito principal y un destino padre claro | Usuario identifica título, acción, Volver |
| Números | ARS, unidades y tendencias provienen de proyección única | Reproducir con fixture |
| Protección | No se reinicia `writeIntent` al cambiar de pantalla | Failure/reload/retry con ID idéntico |
| Datos inciertos | Sin costo o saldo real ≠ cero | Estado sin valor explícito |
| Errores | Error por campo + mensaje explicativo y recuperación | Entrada inválida, poco espacio |
| Offline | Acciones locales disponibles; sin sync ficticio | Modo avión/reload |
| Interacción táctil | Sin CTA tapado por teclado, foco ni footer | 360/390/430 px en móviles |
| Visual | Uso de tokens y referencias oficiales, sin slop | Comparación capturas + QA humano |
| Lectores de pantalla | Etiqueta y foco, feedback status/alert adecuados | VoiceOver/TalkBack o equivalente |
| Dominio | UI no duplica reglas de movimiento/costo | Revisión de imports y tests |
| Historial | No se pierden lotes/sales por desactivar | E2E de soft delete y backup |
| Regreso | Conserva contexto según documento 10 | Prueba de ida/vuelta |

**Fuentes metodológicas:** [ISO 9241-143:2012 ficha](https://www.iso.org/standard/53590.html), [WCAG 3.3.1](https://www.w3.org/WAI/WCAG22/Understanding/error-identification), [WCAG 3.3.4](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html), [GOV.UK Errors](https://design-system.service.gov.uk/components/error-message/), [React state](https://react.dev/learn/choosing-the-state-structure). Las fichas públicas no son prueba de haber auditado cada cláusula de normas pagas.
