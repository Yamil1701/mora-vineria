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

## 8. Productos — PR-09/10/11 Reposición, pedido y recepción

**Reposición:** productos por objetivo, unidades faltantes y presentaciones compra; no tratar ≤20 % como cantidad fija por todo el catálogo. Si objetivo no existe, mostrar «sin objetivo» sin inventarlo.

**Pedido futuro:** preparar cantidad en paquetes/unidades; enviar texto por WhatsApp como acción explícita; pedido *enviado* no cambia stock ni caja. El pedido se prepara habitualmente antes del jueves/viernes, según operación real.

**Recepción hoy:** desde Producto o futura Reposición, informar unidades físicas recibidas, costo total real, presentación; guardar recepción única: crea lote FIFO, aumenta stock y registra salida de efectivo **una sola vez**. En entregas parciales registrar sólo cantidad real.

- **Entrada:** Productos > Reposición > Recibir, con producto opcional preseleccionado.
- **Estados:** pedido vacío, pedido enviado, entrega parcial, costo desconocido (si el contrato lo permite), error de escritura, confirmado.
- **QA:** 2 packs de 6 = 12 unidades, compra pagada una vez, pedido no muta stock, sobreventa previa no se borra.
- **Estado:** recepción simple implementada, preparación/enlace de pedido futura.

## 9. Caja — CA-01/02/03/04/05/06/07/08/09

**Área secundaria:** Caja y dinero, accesible de manera estable y reconocible; referencia visual `caja-cuentas.webp` aprobada para *Resumen / Movimientos / Cuentas*, sujeto a tareas. «Caja» no se agrega como quinta tab.

- **CA-01 Resumen (P):** entradas/salidas conocidas y efectivo esperado **solo con saldo inicial confiable**; contado real con marca temporal ingresada por persona; diferencia sólo si ambos existen. Si no, «No informado».
- **CA-02 Movimientos (núcleo actual T):** historial de cobros, compras pagadas, gastos, aportes y futuros retiros; origen de cada fila verificable. No mezclar ajustes de stock sin efecto monetario.
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
- **Reportes avanzados/PDF (E):** decidir según uso real; la preferencia posterior de V2 indicó que el PDF mensual de V1 nunca se utilizó.
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
