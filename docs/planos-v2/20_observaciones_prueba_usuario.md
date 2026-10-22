# 20 — Registro de observaciones de navegación: primera sesión con el usuario

**Fecha:** 21/10/2026 (conversación del proyecto). **Tipo de evidencia:** respuestas directas del usuario que conoce el producto y está participando del diseño; **NO** es un tree test ciego con una persona sin contexto. **Estado:** sesión cualitativa abierta, dos situaciones discutidas y una preferencia posterior de acceso frecuente, ninguna medición de tiempo ni porcentaje de éxito. No atribuir estas respuestas a otros operadores.

## 1. Contexto y límites

La prueba se realizó en una conversación con **opciones mostradas progresivamente por el asistente**. El participante ya conocía Mora, la propuesta del + central y el mapa anterior; incluso los títulos de subárea se revelaron a cada paso. Por ello estas observaciones permiten **entender expectativas del usuario y detectar contradicciones**, pero no afirmar que se haya demostrado la encontrabilidad de la navegación con un público independiente.

Se preservan por separado **lo que respondió el usuario** y **la interpretación** del asistente. Los comentarios espontáneos sobre rediseñar la navegación no equivalen automáticamente a aprobación de la propuesta exacta.

## 2. Situación A — botella rota / baja de stock

**Tarea planteada:** «Se rompió una botella de vino. Necesitás registrar que ahora tenés una unidad menos».

| Paso | Opciones reveladas | Respuesta literal del usuario |
| --- | --- | --- |
| 1. Primer destino | Inicio, Ventas, +, Productos, Reportes | «Productos.» |
| 2. Segundo nivel | Catálogo, Inventario, Reposición | «Inventario» |
| 3. Tercer nivel | Stock por producto, Contar y ajustar stock, Historial de stock | «Stock por productol.» [sic] |
| 4. ¿Cómo descontaría? | Pregunta abierta | «Descontaría una del contador, y tal vez agregaría una descripción.» |

**Hallazgo observado:** el recorrido mental no saltó directamente a un formulario abstracto llamado «Contar y ajustar stock». La persona encontró más natural **localizar el producto y cambiar su cantidad** desde una vista de stock por producto, con posibilidad de explicar por qué.

**Implicación a diseñar:** desde Productos > Inventario > Stock por producto > Producto, ofrecer una operación explícita «Ajustar stock» que pueda cargar **una unidad menos** y permita nota contextual. No concluir que esté aprobado modificar directamente un contador sin confirmación o trazabilidad.

**Guardarraíl técnico:** el sistema existente registra `RecordStockCount` con referencia de stock vigente y comprobación de cambios concurrentes; por lo tanto, un atajo «−1» propuesto debe **iniciar el mismo flujo de ajuste validado**, mostrando nuevo valor y motivo, **no mutar una cifra visual ni aplicar un delta independiente** que saltee comando, FIFO, revisión, journal o backup. Hay que decidir en el contrato si es conteo físico confirmado o merma conocida; no inventar un segundo modelo sin razón.

**Estado de aceptación:** prioridad para mejorar el recorrido de ajuste; forma final (fila con −1, detalle de producto o formulario precargado) **pendiente de prototipo y seguridad**.

## 3. Situación B — aporte de $5.000 al negocio

**Tarea planteada:** «Pusiste $5.000 de tu bolsillo en la vinería para tener cambio. ¿Dónde tocarías primero?» con Inicio · Ventas · + · Productos · Reportes.

**Respuesta literal:** «La verdad es que ninguno.»

**Pregunta abierta del asistente:** qué sección esperaba encontrar.

**Respuesta literal:** «Creo que cambiaría Reportes por Caja o Movimientos. Y necesitamos muchos más secciones la verdad, así que habría que ver dónde colocrals, obviamenbte no todas amontonadas en la navegación, pero sí una sección que nos muestre el resto de secciones.»

**Hallazgo observado:** **no había un destino de dinero reconocible** en esa barra. La propuesta de Caja sólo como enlace en Inicio era insuficiente para esta tarea, al menos para este usuario. Se pidió explícitamente una **arquitectura escalable de acceso a más secciones**, no simplemente agregar gastos a Reportes.

**Interpretación de trabajo:** Caja/Movimientos necesita un primer acceso muy evidente; Reportes es candidato a salir del dock. **No está decidido** cuál de los demás destinos debe conservar posición privilegiada.

## 4. Comentario espontáneo — menú «Más» y cabecera fija

En respuesta a «¿Dónde esperaría encontrar un listado de todas las secciones?» el usuario expresó:

> «En un lugar accesible, que se mantenga en todo momento sin importar por dónde me desplace (salvo las pantallas más importantes claro, o específicas), quizás podríamos dejar los 3 accesos más importantes en la navegación, y el más de acción nueva venta, y el 4to usarlo como "Más" o algo así.»

También indicó que, al recorrer otras aplicaciones, vio una cabecera sticky con **nombre de app e importantes accesos** como búsqueda, perfil, configuración y estados; la considera útil tanto por **uniformidad visual** como por **acceso rápido**. Señaló que **no usa perfiles** en Mora y no pidió crearlos.

**Decisión ya firme que se preserva:** la separación conceptual **Ventas (área)** versus **+ Nueva venta (acción global)** del [ADR 17](17_adr_ventas_y_nueva_venta.md).

**Nueva propuesta, todavía NO aprobada como contrato exacto:** **tres destinos visibles + acción + + destino «Más»**, con una cabecera fija consistente. Falta escoger **cuáles tres** de Inicio/Ventas/Productos/Caja merecen acceso directo; y dónde se accede a Caja si queda fuera del dock. El orden visual del ADR 17 queda abierto **por esta propuesta posterior**, sin revocar la separación Ventas/+.

## 5. Preferencia posterior: ¿Caja o Productos?

**Pregunta de priorización:** «Durante una jornada normal de la vinería, ¿cuál de estas dos áreas necesitás abrir más frecuentemente: Productos/Inventario o Caja/Movimientos?»

**Respuesta literal:** «Creo que caja la verdad, pero ambos son necesarios así que no se va a perder ninguno en \"Más\"».

**Dato observado:** el usuario prioriza **Caja** como acceso frecuente y señala que **Productos no desaparece porque «Más» conserva su acceso**. Esto **favorece** Variante B del documento 21: **Inicio · Ventas · (+ Nueva venta) · Caja · Más**, con **Productos/Inventario/Reposición**, Reportes y Configuración accesibles en el directorio.

**Límite:** respuesta de frecuencia **cualitativa**, sin registros temporales ni prueba del directorio. No equivale a autorización para implementar ni a aceptación definitiva del orden, rótulos o header. Al diseñar «Más», Productos debe ser visible y no quedar enterrado detrás de categorías confusas.

## 5a. Nueva situación — consultar un producto mientras se prepara una venta

**Fecha:** 21/10/2026. **Prueba conversacional, no prueba de interfaz ejecutable.**

**Tarea planteada:** «Estás registrando una venta con tres productos ya agregados, todavía no cobraste. Necesitás consultar el precio y las existencias de otro producto, sin agregarlo a esa venta. ¿Cómo lo harías y después seguirías con el borrador?»

**Respuesta literal del usuario:** «Usar el buscador, o buscarlo en los disponibles; y ahí la información sería la suficiente como para no tener que estar abriendo detalles, etc, creo yo.»

**Observación directa:** el usuario **no manifestó necesidad de salir del selector de Nueva venta** ni de pasar por Más → Productos para consultar. Espera poder encontrar y leer información suficiente en el propio buscador/listado. El «creo yo» expresa preferencia tentativa, **no aprobación visual de cada campo ni de una maqueta**.

**Implicación UX para prototipar:**

- El selector ofrece consulta rápida por búsqueda o listado; filas legibles con nombre, variante/presentación, precio y stock **registrado** (la fiabilidad del stock debe explicarse cuando corresponda).
- **Leer o buscar no agrega** un artículo a la venta. El gesto/botón «Agregar» debe distinguirse claramente de consultar, sin añadir líneas por navegación accidental.
- Evitar abrir obligatoriamente ficha/detalle para conocer precio y existencias; revelar información secundaria sólo cuando se necesite.
- Conservar los tres productos del borrador, cantidades y total durante búsquedas; no reiniciar borrador ni duplicar comando.
- La prueba **no valida** qué hacer si la consulta exige editar datos/ajustar stock o realizar una operación fuera de Nueva venta; eso requiere otra situación.

**Interpretación:** esta tarea se resuelve **dentro de Nueva venta concentrada**, por lo que no justifica reincorporar el dock global durante la selección. Conviene validar el contenido y la densidad de cada fila en teléfono real antes de dar por cerrado el diseño.

## 5b. Nueva situación — botella rota durante una venta en preparación

**Fecha:** 21/10/2026. **Prueba conversacional cualitativa, no prototipo ejecutado.**

**Tarea planteada:** hay tres productos en una venta sin cobrar y se rompe una botella **que no figura en el carrito**; se pregunta cómo registrar la pérdida y continuar con esa venta.

**Respuesta literal:** «No sé, pero no creo óptimo agregar cosas y cosas para casos excepsionales, resolvería de manera convencional, quitaría ese producto del carrito, o disminuiría la cantidad que se rompió y continuaría con la compra y luego se arregla desde productos, no?».

**Observación:** el usuario rechaza sobrecargar Nueva venta con operaciones específicas de casos infrecuentes y prefiere terminar el trabajo corriente y arreglar el stock desde Productos/Inventario. Mencionó también quitar/reducir del carrito, lo que sólo se aplica **si la botella estaba efectivamente en esa venta**; en el estímulo original estaba fuera de ella. No atribuirle una decisión de registrar roturas automáticas desde el carrito.

**Interpretación de arquitectura y diseño:**

- **Producto fuera de la venta:** no alterar el carrito; finalizar la venta actual y luego ir a **Más → Inventario → Producto → Ajustar stock**.
- **Producto dentro de la venta, pero no vendido:** quitarlo/reducir cantidad sólo corrige qué se vende; **no** registra la merma de stock.
- La merma física se registra por el flujo canónico de conteo/ajuste de Inventario, con motivo, validación de referencia vigente y journal/FIFO cuando corresponda. No modificar contadores directamente ni inventar una operación doble.
- Evitar botones «rotura», atajos especiales o modales de incidentes dentro de Nueva venta solamente por esta situación. No forzar interrupciones, pasos obligatorios ni alertas persistentes para casos aislados.
- **El paso posterior sigue requiriendo acción explícita del operador.** No asumir que la app sabe que hubo una rotura ni afirmar que se registró por quitar una línea.

**Estado:** preferencia clara por simplicidad y separación de responsabilidades; el recorrido real de ajuste permanece pendiente de prueba sobre un prototipo.

## 5c. Idea espontánea — Reposición y acción única «Registrar» en Movimientos

**Fecha:** 21/10/2026. **Estado: exploración del usuario, NO decisión aprobada.**

**Comentario literal del usuario:** «Eso estaba pensando, reposición debería ir en movimientos o en productos, hmm. Y en movimientos en vez de dividirlos en 3 botones de Reposición, Gasto, Movimiento, se usa uno solo de "Registrar" o algo así y luego se selecciona qué tipo, no sé. Cosas que se me van ocurriendo».

**Lo que sí puede inferirse:** el usuario cuestiona tanto la ubicación de Reposición como la proliferación de acciones operativas visibles, y propone explorar **un disparador único «Registrar»** que abra un selector de tipo. No ha aprobado ni la relocalización de Reposición ni el patrón final del selector; tampoco especificó tipos cerrados.

**Hipótesis de arquitectura para probar, no imponer:**

- Mantener **Reposición** como tarea de mercadería con entrada directa en Más (acordada previamente): pedido/recepción y lotes/stock. La recepción física puede generar **una sola salida de dinero** reflejada en Caja > Movimientos, pero **no** debe registrarse por segunda vez como gasto.
- En **Caja > Movimientos**, probar un CTA **«Registrar movimiento»** o «Registrar» que muestre las operaciones monetarias disponibles: Gasto, Aporte; otras como Retiro/ahorro o Traspaso, **sólo cuando estén implementadas**, sin habilitar opciones ficticias. «Movimiento» no debería ser un tipo ambiguo más.
- Evitar un formulario universal con campos heterogéneos o duplicar la operación de recepción bajo Caja. Un acceso transversal, si se justificara por tareas reales, debería abrir el **mismo** flujo canónico de Reposición, sin escribir una segunda vez.
- **Riesgo UX:** si sólo hay dos acciones activas, el menú selector agrega un toque respecto de accesos directos. Comparar claridad del historial, frecuencia y pasos desde teléfono antes de preferirlo por estética.

**Prueba pendiente:** desde Caja, «Registré un gasto puntual / puse dinero mío / recibí 12 botellas y pagué», comprobar dónde inicia cada tarea sin confundir el historial monetario con recepción de mercadería. No alterar contratos de pantallas como aprobados ni programar estas hipótesis antes de recibir la decisión del usuario.

## 5d. Decisión posterior — Reposición independiente y tres opciones para registrar dinero

**Fecha:** 21/10/2026. **Respuesta literal del usuario:** «Pero está bien con 3, gasto, aporte y retiro o movimiento (entre caja, Brubank o así). Y la Reposición sí, la mantendría fuera de productos porque sí, es algo más completo y complejo., tal vez agregar un pequeño acceso directo desde productos hcaia Reposición.»

**Decisiones claras de arquitectura de interfaz:**

1. **Reposición queda fuera de Productos como área/pantalla propia**, no como subpantalla. Mantiene un **acceso directo independiente desde Más → Mercadería**, al igual que Productos e Inventario. Se contempla un **acceso contextual pequeño desde Productos hacia Reposición**, reutilizando el mismo flujo.
2. **Caja → Movimientos** puede disponer de un **botón único «Registrar» que abra tres opciones principales**: **Gasto**, **Aporte** y una **tercera opción para retiro o movimiento de dinero entre efectivo/Brubank/u otras cuentas**. El usuario confirmó la preferencia por tres opciones en vez de botones de operación esparcidos.

**Decisión posterior confirmada por el usuario (22/10/2026):** el tercer rótulo será **«Mover dinero»**. Su segunda pantalla permite elegir explícitamente **«Entre cuentas»** o **«Retirar del negocio»**. Es una decisión aprobada de texto y recorrido, **no una confirmación de que estas operaciones futuras estén implementadas**. Al diseñarla, hay que distinguir **traspaso interno** (el dinero continúa dentro de Mora) de **retiro/ahorro** (sale del negocio), sin confundir efectos de saldo o mostrar funcionalidades futuras como disponibles. El selector puede ser el lugar de elección de operación, pero no autoriza un formulario universal ni nuevos comandos de dominio.

**Regla de integridad invariable:** **Reposición** escribe una sola recepción real con su costo/lote FIFO/stock y egreso correspondiente, visible en Caja como proyección de **ese mismo hecho**, nunca como un gasto manual duplicado. Independencia de **área de interfaz** no significa duplicar productos, servicios, journal o datos.

**Estado:** Reposición como área propia y selector de tres opciones aprobados. **El 22/10/2026 quedó aprobado el texto «Mover dinero» y sus subopciones «Entre cuentas» / «Retirar del negocio».** Pendiente: visual definitivo, formularios, pruebas y operaciones reales de retiro/traspaso. No hay permiso para implementar.

## 5e. Decisión — una compra completa en un carrito de Reposición

**Fecha:** 22/10/2026. **Pregunta de diseño:** «Imaginemos que recibís una compra con 2 cajones de Quilmes, 3 packs de Speed y 1 caja de vodka. ¿Preferirías registrar toda esa compra junta, agregando los productos a una especie de carrito de reposición, con sus costos y un total final? ¿O cargar cada producto por separado?»

**Respuesta literal del usuario:** «toda una compra junta, sí. y es buena idea como un carrito, y hay que hacerlo similar al de venta supongo, pero con sus distinciones obviamente».

**Decisión confirmada de experiencia:** una **recepción de compra completa** con **varios productos en un solo carrito de Reposición**, inspirado en el patrón de Nueva venta pero adaptado a cantidades, presentaciones, costos y confirmación de compra. **No** registrar cada producto como compra separada ni duplicar el gasto en Caja.

**Flujo conceptual a prototipar:** buscar/agregar productos → revisar carrito de compra con líneas editables (cantidad de packs/unidades, unidades resultantes, costo real total por línea) → revisar suma total, confirmar lo efectivamente recibido y pagado → registrar **una recepción con varias líneas**, **lotes FIFO por línea** y **un único egreso monetario**. Hasta confirmar, agregar/remover productos del carrito **no cambia stock ni caja**. El pedido planificado, cuando exista, no equivale a recepción física.

**Verificación técnica puntual en `master`, 22/10/2026:**
- `src/domain/types.ts` declara `ReceivePurchase` con `receiptId` y `lines: PurchaseLine[]`.
- `src/local/service.ts` procesa las líneas dentro de una transacción Dexie, crea lote y movimiento de stock por línea, suma `totalCost` y genera **un** `cash(-total, 'purchase')`; conserva `commandId` y recuperación de `writeIntent`.
- `src/App.tsx` **construye una sola línea en `saveStock`** y en `reopenWrite` **selecciona `lines[0]`** al reabrir una recepción preparada. El **modelo de datos ya admite múltiples productos**, pero la **UI y la recuperación de varias líneas requieren trabajo y QA**; no presentar como capacidad visual implementada.

**Pendientes legítimos:** boceto móvil y flujo óptimo, persistencia/recuperación del carrito editable antes de confirmar (sin confundirlo con Draft de Ventas), criterios exactos para carga de costo de packs/unidades, discrepancia de total facturado, parcialidades, importe y origen del dinero cuando existan distintos medios. No sumar campos o capacidades sin necesidad probada; **no aprobar automáticamente pago parcial o compra fiada**. Pruebas de todo-o-nada, replay idempotente, exactitud de FIFO, un único egreso y backup/restauración.

**Estado:** **aprobada la modalidad de carrito multisproducto y recepción agrupada**, no su formulario final ni código. La interfaz debe reutilizar el comando existente y resolver correctamente sus rutas de recuperación.

## 6. Cambios de hipótesis causados por la observación

| Antes de la prueba | Nueva evidencia | Cambio de hipótesis |
| --- | --- | --- |
| Productos > Inventario > Contar | Buscó «Stock por producto» primero | El objeto (producto con stock) debe anteceder a la acción de ajuste; ofrecer ruta de ajuste desde su cantidad |
| Caja con acceso desde Inicio probablemente suficiente | «Ninguno» ante la barra inicial | Debemos probar Caja como destino principal o con acceso visible persistente; no asumir que Inicio basta |
| Cuatro áreas incluidas en tab bar (Inicio/Ventas/Productos/Reportes) | Sugiere tres áreas, + y Más | Ensayar dock mixto sin sobrecargar ni esconder funciones frecuentes |
| Configuración sólo como destino contextual | Observó cabecera persistente con accesos de relevancia | Prototipar header con acceso estable a datos, pero sin llenar de iconos |
| La jerarquía puede quedar cerrada en doc 18/19 | El usuario cambió el modelo mental esperado | Revisar instrumentos para no probar un árbol obsoleto como «arquitectura final» |

## 7. Riesgos de interpretar demasiado

- La palabra «quizás» en el comentario del usuario es **exploración**, no autorización para eliminar Reportes de la barra inmediatamente.
- «Más» no debería convertirse en un cajón de funcionalidades arbitrarias: requiere índice agrupado con nombres y rutas canónicas.
- «Descontar una del contador» **no** implica prescindir de validación, motivo, confirmación o historial de merma.
- Las guías de iOS/Android pueden orientar diseño pero **no invalidan** el problema detectado por el usuario al buscar Caja.
- Haber recibido dos respuestas en conversación **no** significa que el plan completo haya pasado validación cualitativa.
- No implementar un perfil, servidor, login ni indicador «sincronizado» porque otras aplicaciones los usan.

## 8. Próximos pasos del proyecto de planos

1. Comparar alternativas de dock/header/índice en [21 — Shell y Más](21_hipotesis_shell_mas_header.md), con foco en Caja.
2. Hacer una prueba de selección de los tres destinos de acceso directo **sin imponer la preferencia técnica** del asistente.
3. Comprobar navegabilidad de «Más» con escenarios monetarios, reportes, stock y backup sin exponer operaciones en lugares duplicados.
4. Diseñar entrada al ajuste de un producto desde Stock por producto y revisar cómo precargar `RecordStockCount` sin alterar su contrato.
5. Actualizar después los planos 01/02/10/11 y el guion 19 con la **opción que el usuario valide**; no reescribir retroactivamente respuestas originales.
6. Mantener PR #12 **sólo de documentos** hasta que la arquitectura quede aprobada.

**Conclusión comprobable de esta sesión:** el mapa previo tenía una carencia evidente para **Aportes/Caja**, y el flujo de merma necesita comenzar por **Stock por producto**. El aspecto preciso de la solución está por decidir.
