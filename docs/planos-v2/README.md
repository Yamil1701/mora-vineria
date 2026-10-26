# Planos de Mora Vinería 2.0

**Política de cierre confirmada el 25/10/2026:** **completar y validar toda Mora en planos antes de escribir una sola funcionalidad nueva**. Revisión final en tres **macro-bloques de documentación**, no microdecisiones por pantalla: (I) experiencia diaria, (II) mercadería y dinero, (III) reportes/datos/sistema de componentes. El usuario pidió expresamente evitar construir fragmentos que después haya que rehacer. Ver [22 — Cierre integral por bloques](22_cierre_integral_por_bloques.md). La PR #12 continúa **solo documental**, en borrador y sin permiso para merge ni despliegue.


**Versión:** propuesta 0.8 — 21/10/2026. **Estado:** planos en borrador con **primera ronda de investigación documental y auditoría de código completada** (documentos 06–09, además de contratos de implementación propuestos 10–13). **No constituye aprobación automática, especificación cerrada ni autorización de implementación.**

**Estado QA actualizado por el usuario:** PR #10 aprobada en el teléfono; PR #11 probada y aceptada solo **provisionalmente** en diseño. La investigación no necesita repetir sus pruebas básicas, pero debe protegerlas al reorganizar pantallas.

**Decisión de navegación aprobada posteriormente:** [ADR 17](17_adr_ventas_y_nueva_venta.md). Ventas abre historial y gestión; **+ central** abre/retoma el flujo de venta. Prevalece sobre frases antiguas que identificaban la pestaña Ventas con Nueva venta.

**Estado de validación actualizado:** el usuario respondió **dos situaciones de navegación en conversación**; se documentaron como observaciones cualitativas con límites en [20](20_observaciones_prueba_usuario.md), **no** como tree test ciego ni estudio de otros operadores. [18](18_prevalidacion_heuristica.md) queda como análisis heurístico previo y [19](19_guion_prueba_arbol.md) como guion de la **primera variante**. Falta comparar [21](21_hipotesis_shell_mas_header.md) y el diseño real.

**La barra literal del ADR 17 está en revisión posterior:** el usuario exploró **3 destinos principales + botón + Nueva venta + Más**, con **header sticky**. **Preferencia posterior explícita:** usa **Caja** más frecuentemente que Productos; por eso gana prioridad la variante **Inicio · Ventas · (+) · Caja · Más**, con **Productos → Catálogo / Inventario / Reposición** y Reportes/Configuración accesibles desde el índice «Más». Se ha registrado como **preferencia de navegación, no aprobación final del diseño ni confirmación de usabilidad**. La separación **Ventas (historial/gestión)** vs **+ (nueva venta)** sigue aprobada.

**Decisión de header confirmada el 21/10/2026:** cabecera global **compacta de dos franjas integradas en un mismo componente**: arriba, identidad estilística exacta **«Mora.»** con pocos accesos secundarios; debajo, franja **contextual persistente** que cambia título, regreso y acciones según el área. Es una decisión aprobada para documentar/prototipar, **no** permiso de implementación. El dock **Inicio · Ventas · (+ Nueva venta) · Caja · Más** y el directorio de «Más» son la **propuesta principal pendiente de validación de recorridos**. Contrato y excepciones: [21 — Shell/Más/Header](21_hipotesis_shell_mas_header.md).

**Decisión de «Más» confirmada (21/10/2026):** el grupo **Mercadería** contiene **tres entradas independientes y directas: Productos, Inventario y Reposición**, sin pasar primero por Productos. **Reposición es ahora un área operativa propia, no subpantalla de Productos**, aunque comparte artículos, stock y costos; Inventario continúa vinculado a esos datos. Puede añadirse un enlace pequeño desde una ficha de Producto hacia Reposición, sin otro flujo de recepción. Reportes, Configuración y el acceso al respaldo se mantienen en la propuesta del directorio; su presentación final y las reglas de Volver/selección activa aún se deben validar. Véase [21 — Shell/Más/Header](21_hipotesis_shell_mas_header.md). **No hay autorización de código, merge ni despliegue.**

**Decisión de navegación confirmada (21/10/2026):** pulsar «Más» en la barra inferior **siempre abre la raíz del directorio «Más»**, no recuerda automáticamente la última subpantalla visitada. Es independiente de «Volver», que conserva el retorno al contexto de origen. No descartar borradores ni operaciones pendientes; definir todavía la integración con historial del navegador y selección activa. Detalle en [21 — Shell/Más/Header](21_hipotesis_shell_mas_header.md). **Sin autorización para implementar.**

**Decisiones de navegación confirmadas (21/10/2026):** el destino activo corresponde al área mostrada (Inventario/Reposición/Reportes/Configuración → Más; Movimientos de dinero → Caja; detalle comercial → Ventas), mientras el botón central **+ nunca es pestaña**. **Volver** respeta el padre/procedencia y el contexto anterior; pulsar **Más** siempre regresa al directorio raíz. **Nueva venta será una pantalla concentrada**, ocultando el dock global en Selector/Carrito/Cobro/confirmaciones, sin perder `Draft` o `writeIntent`. El **BackControl** uniforme fue **aprobado expresamente** para el extremo izquierdo de la segunda franja contextual del header «Mora.» (21/10/2026; pendiente de QA táctil y accesibilidad), con identidad/etiqueta/tamaño consistentes; no crear Volver ficticio en raíz. Contratos: [10](10_contrato_navegacion.md), [12](12_sistema_componentes.md) y [21](21_hipotesis_shell_mas_header.md). **Solo planos; nada autorizado para implementar ni desplegar.**

**Decisión posterior de Mercadería/Caja (21/10/2026):** Reposición mantiene **entrada directa en Más** y se considera **área autónoma en la interfaz**, no subordinada a Productos; desde Productos se admite un **enlace contextual** hacia Reposición. Dentro de **Caja → Movimientos**, el usuario prefiere un CTA único «Registrar» con **tres familias de opciones: Gasto, Aporte y retiro o movimiento entre cuentas**. **El usuario aprobó el 22/10/2026 «Mover dinero» como tercera etiqueta**, con una segunda selección: **«Entre cuentas»** / **«Retirar del negocio»**. Un retiro fuera del negocio y un traspaso interno no tienen el mismo efecto y se deben distinguir. No implicar que dichas acciones futuras ya funcionan; toda recepción genera un solo efecto en stock/FIFO/caja y nunca un gasto duplicado. Detalle y evidencia en [20](20_observaciones_prueba_usuario.md) y [21](21_hipotesis_shell_mas_header.md). **Sigue sin autorización para código/merge/despliegue.**

**Decisión de Reposición del 22/10/2026:** recepción de **una compra completa con varios productos en un carrito propio de Reposición**, similar al carrito de Ventas pero adaptado a packs, unidades recibidas y costos por línea. Confirmar genera **una sola recepción multisproducto**, lote/stock por línea y **una sola salida monetaria** reflejada en Caja, sin gasto duplicado. Se verificó que `ReceivePurchase` admite `PurchaseLine[]` y su transacción local ya cubre varias líneas; la UI actual `src/App.tsx` solo arma una línea y su recuperación de operaciones pendientes toma `lines[0]`, por lo que la interfaz y recuperación completa **están pendientes**. Decisión y límites en [20](20_observaciones_prueba_usuario.md), [03](03_recorridos_y_estados.md), [11](11_contratos_pantallas.md) y [16](16_secuencia_constructiva.md). **Planos solamente; nada aprobado para implementar, fusionar ni desplegar.**

**Aclaración de flujo semanal confirmada el 25/10/2026:** Reposición debe partir de la **lista de precios por presentación enviada por el proveedor cada semana**. Se pega/ingresa el texto, se **sanean nombres, formatos y presentaciones**, se vincula al catálogo y se propone automáticamente un precio comercial por unidad: **(costo presentación ÷ unidades) × 1,50**, redondeado hacia arriba a múltiplo de **$500**; el usuario **revisa y corrige manualmente** antes de aplicar precios nuevos. La lista puede precargar el carrito de Reposición, pero **no modifica stock, costos FIFO históricos, Caja ni precio publicado por sí sola**. La compra real se confirma luego con cantidades y costos pagados. Contratos: [03](03_recorridos_y_estados.md), [11](11_contratos_pantallas.md), decisión observada [20](20_observaciones_prueba_usuario.md) y orden [16](16_secuencia_constructiva.md). Texto local es el objetivo; **OCR sigue exploratorio**, no requisito de MVP. **Solo documentación; sin autorización de código, merge ni despliegue.**

**Regla de interfaz aprobada el 25/10/2026 para la lista semanal:** mostrar por defecto **solo cambios relevantes y filas por revisar**, ocultando productos estables/identificados correctamente tras una consulta secundaria discreta. No confundir «sin variación del precio sugerido» con «sin cambios»: si cambió el costo del proveedor o la presentación, la fila debe permanecer visible aunque el redondeo mantenga el precio de venta. Las dudas de identificación nunca se esconden. La revisión/aplicación continúa siendo explícita; el patrón visual exacto sigue sujeto a QA en móvil. Ver [11](11_contratos_pantallas.md) y [20](20_observaciones_prueba_usuario.md). **Solo documentación.**

**Decisión de revisión de precios confirmada el 25/10/2026:** los cambios de **precio público** identificados de manera inequívoca en la lista semanal **aparecen seleccionados por defecto**; el usuario los puede desmarcar o corregir. Los productos dudosos no se preseleccionan, y un cambio sólo del costo del proveedor permanece visible aunque no produzca un precio público diferente. **Selección ≠ aplicación**: «Revisar N cambios» lleva a vista previa y «Aplicar N precios» exige confirmación explícita; no modificar datos al pegar ni al preseleccionar. [11](11_contratos_pantallas.md), [20](20_observaciones_prueba_usuario.md). Diseño de interacción por validar en móvil, no implementación.

**Decisión de saneamiento adaptativo confirmada el 25/10/2026:** «Por revisar» permite vincular entradas mal escritas/abreviadas a un artículo existente (o crear uno por el flujo canónico). **Cada corrección confirmada enseña una equivalencia local al motor**, para reconocer el mismo nombre/presentación en semanas futuras sin repetirla. El alias debe respetar variante y unidades por pack, poder corregirse/invalidate y no contener costos fijos; ante duda se vuelve a «Por revisar». Las reglas aprendidas se guardarán en IndexedDB y se incluirán en **backup/restauración JSON** cuando se implemente la función. No requiere ML, backend, OCR ni sincronización automática; **funcionalidad acordada pero no implementada**. Más detalle: [11](11_contratos_pantallas.md), [20](20_observaciones_prueba_usuario.md), [03](03_recorridos_y_estados.md), [16](16_secuencia_constructiva.md).

**Pedido de proveedor aprobado el 25/10/2026:** «Preparar pedido» mantiene **borrador local**, se comparte por WhatsApp y queda **pendiente** (marcar enviado explícitamente). Al llegar mercadería se abre desde «Pedidos pendientes» con **carrito de recepción multisproducto precargado**, se corrigen entregas y costos reales y se confirma el ingreso. Pedido sin stock/FIFO/caja; **sólo recepción real** genera cada lote/egreso, y entregas parciales conservan saldos pendientes sin duplicaciones. Persistir pedidos en Dexie e incluir en **backup/restauración JSON** cuando se implemente. Función aprobada de producto, **no implementada ni autorizada para fusionar**. Ver [03](03_recorridos_y_estados.md), [11](11_contratos_pantallas.md), [20](20_observaciones_prueba_usuario.md) y [16](16_secuencia_constructiva.md).

## Propósito

Este conjunto de documentos es el **mapa maestro del producto**. Responde, antes de construir otra pantalla: ¿qué tarea representa?, ¿a qué área pertenece?, ¿de dónde se accede?, ¿qué cambia al guardarla?, ¿qué datos utiliza?, ¿cuál es su estado y cómo se verifica?

Separar **área** (hogar de una responsabilidad), **pantalla** (vista orientada a una tarea), **acción** (operación del usuario), **flujo** (recorrido), **dominio** (reglas/datos) y **componente** (pieza reutilizable). Una misma información puede aparecer como resumen o vínculo en varias áreas, pero **cada escritura tiene un solo propietario funcional**.

## Índice

1. [01 — Mapa conceptual integral](01_mapa_conceptual.md): jerarquía y relaciones, dentro y fuera del alcance, decisiones de ubicación.
2. [02 — Catálogo de pantallas y funciones](02_catalogo_pantallas.md): inventario de destinos, qué hace cada pantalla, estado real frente al deseado, dueño único de operaciones.
3. [03 — Recorridos, excepciones y estados](03_recorridos_y_estados.md): tareas de ventanilla, mercadería, dinero y recuperación; navegación de vuelta, errores, offline, datos desconocidos.
4. [04 — Arquitectura de interfaz y reglas de construcción](04_arquitectura_y_guardarrailes.md): fronteras UI/dominio, estructura técnica sugerida, componentes, accesibilidad, contratos.
5. [05 — Decisiones, investigación y secuencia](05_decisiones_e_investigacion.md): asuntos abiertos, investigación posterior, pruebas de encontrabilidad y protocolo para modificar los planos.
6. [06 — Auditoría verificada](06_auditoria_verificada.md): hallazgos localizados en código publicado y cambios de ubicación recomendados.
7. [07 — Investigación de normas y UX](07_investigacion_normas_y_ux.md): fuentes oficiales ISO, WCAG, NN/g, Apple, React, GOV.UK, MDN y Dexie, límites y aplicaciones concretas.
8. [08 — Benchmark de POS y componentes](08_benchmark_pos_y_componentes.md): patrones de Shopify, Square y Loyverse evaluados para el negocio.
9. [09 — Decisiones, pruebas y puertas de calidad](09_decisiones_pruebas_y_gates.md): matriz de evidencia, test de árbol con tareas, riesgos y condiciones antes de implementar.
10. [10 — Contrato de navegación](10_contrato_navegacion.md): destinos, regreso, contexto por pestaña, máquina de estados y sus pruebas.
11. [11 — Contratos de pantallas](11_contratos_pantallas.md): propósito, datos, acciones, errores y estados para Inicio, Ventas, Productos/Inventario/Reposición, Caja, Reportes y Datos.
12. [12 — Sistema de componentes](12_sistema_componentes.md): familias, tokens, jerarquía visual, estados, contenido, accesibilidad y antipatrones.
13. [13 — Validación integral](13_plan_validacion.md): pruebas de árbol, QA de interacción, suites de regresión y requisitos antes de refactor.
14. [14 — Fidelidad visual](14_matriz_fidelidad_visual.md): lectura directa de referencias, hallazgos por pantalla y diferencias legítimas por reglas de negocio.
15. [15 — Auditoría de interacción](15_auditoria_interaccion.md): foco, modales, filtros, estados de navegación, acceso táctil y riesgos concretos del código.
16. [16 — Secuencia constructiva](16_secuencia_constructiva.md): dependencias, fronteras de refactor, PR pequeñas y gates antes de publicar.
17. [17 — ADR Ventas y Nueva venta](17_adr_ventas_y_nueva_venta.md): decisión del usuario de 4 destinos y el + central como acción única de nueva venta.
18. [18 — Prevalidación heurística de rutas](18_prevalidacion_heuristica.md): alternativas y riesgos de entrada a Caja, Inventario, Reposición y Configuración; análisis técnico, no QA del usuario.
19. [19 — Guion de prueba de árbol](19_guion_prueba_arbol.md): tarjetas de tareas sin respuestas, sesión cualitativa y registro de hallazgos sin datos reales.
20. [20 — Observaciones reales de la conversación](20_observaciones_prueba_usuario.md): respuestas literales y hallazgos de dos situaciones; el usuario conoce el plano y **no** fue una prueba ciega.
21. [21 — Más, header y nuevas variantes de dock](21_hipotesis_shell_mas_header.md): decisiones posteriores de estructura «Mora.», Más y Volver; dos variantes históricas de dock, con Caja preferida pero cierre global pendiente.
22. [22 — Cierre integral por macro-bloques](22_cierre_integral_por_bloques.md): **documento rector del cierre previo a código**, matriz de cobertura, tres grandes bloques de revisión, propuestas aún no aprobadas, riesgos y definición de «plano maestro terminado».

## Fuente de verdad y trazabilidad

- **Negocio:** docs/04_descubrimiento_operativo.md y docs/07_cierre_relevamiento_16_preguntas.md; incluir correcciones posteriores expresas. Un documento propositivo antiguo no deroga una decisión explícita.
- **Diseño:** cinco imágenes y README de docs/diseno/mockups-aprobados-v2/; como complemento visual, caja-cuentas.webp aprobado y carrito.webp aceptado solo para prototipar. Otras propuestas históricas rechazadas no mandan.
- **Ejecución real:** master después de PR #11 (90264e5c4f27132e7314722e38c08edfbb16e73f). El código determina qué funciona **hoy**, pero no define por sí solo lo que **debería** existir.
- **Antecedentes técnicos:** docs/arquitectura-v2/{07_nucleo_local,08_interfaz_integrada,09_backup_json,10_movimientos,11_refoco_visual}.md.
- **Alcance MVP vigente:** React/Vite/TS/Tailwind, PWA, IndexedDB/Dexie, GitHub Pages, datos por navegador y backup/restauración JSON manual. **Sin backend ni sincronización automática en el MVP.** La aspiración histórica de 3–4 equipos sincronizados se conserva para discusión posterior, no se introduce silenciosamente.

## Estados de cada capacidad

- **V — Verificado con QA móvil del usuario:** núcleo de productos/ventas/FIFO/persistencia y backup JSON previo a PR #10.
- **T — Implementado y cubierto por pruebas automáticas; QA móvil completo pendiente:** nuevas operaciones de PR #10 y cambios visuales PR #11.
- **P — Planeado, asociado a necesidad aprobada; no implementado aún:** transferencia manual, pago mixto, fiados, corrección de ventas, retiros, conciliación de caja y preparación de pedidos.
- **E — Exploración condicionada a validar valor/alcance:** escáner, imágenes exactas automáticas, **OCR/interpretación de imágenes** de lista de proveedor, proyecciones avanzadas y PDF de uso dudoso. **P aprobado pendiente de implementar:** pegar y sanear **texto** de la lista semanal, sugerir precios con recargo del 50 % y redondeo a $500, revisar/corregir manualmente antes de aplicar.
- **F — Futuro ajeno al MVP local:** autenticación multi-equipo y sincronización automática, dispositivos habilitados/revocación, servidor, RLS.

Las etiquetas son **evaluaciones de alcance por funcionalidad**, no un certificado de calidad de toda la app. V indica QA de recorridos realizados, no cobertura exhaustiva de todos los casos.

## Principios no negociables

1. **Separar navegación de acción:** Ventas abre gestión/historial y + inicia o retoma Nueva venta (ADR 17, aprobado). **Composición del dock en revisión:** cuatro destinos antiguos Inicio/Ventas/Productos/Reportes, frente a tres destinos prioritarios + «Más» + acción central (21), según nueva observación del usuario. Caja/Productos/Reportes/Configuración mantienen dueños canónicos aunque cambie su acceso.
2. Cada acción operativa tiene un **único lugar canónico**. Otros lugares muestran resumen o enlace contextual, nunca crean implementaciones independientes de la operación.
3. Inicio = orientación y próximos pasos; Reportes = interpretación; Productos = mercadería; Ventas = operación comercial; Caja = dinero y cuentas; Configuración = seguridad de datos y preferencias.
4. Las funciones no implementadas no se presentan como disponibles. Los estados de costo/saldo/cobro/stock desconocidos no se inventan.
5. Jornada 08:00–07:59 en Salta internamente, con fecha/hora real y fecha de jornada; **no usar «día operativo» como texto de interfaz**.
6. FIFO e historial auditables, sin duplicar cargos, stock ni ventas; operaciones durables y recuperables.
7. Backup JSON visible y recuperable, sin falso lenguaje de sincronización; nunca borrar datos locales sin autorización y prueba de recuperación.
8. El sistema visual fucsia/carbón y los mockups aprobados guían el render; respetar contraste y uso táctil antes de copiar proporciones.
9. No se mueve lógica de negocio a React mientras se refactoriza la interfaz.
10. El mapa no se declara congelado por autoridad: se **valida con tareas reales** y se versiona bajo control de cambios antes de servir como contrato implementable.

## Regla para evitar nuevas «arenas movedizas»

Ninguna PR funcional nueva se inicia sin: pantalla y dueño documentados, entrada/salida definida, estados/error claros, impacto en datos/backup revisado, prueba de navegación y caso de regresión. Si la funcionalidad no tiene lugar en el mapa, la PR de implementación se pausa y se decide su ubicación **primero**, con cambio explícito a estos planos. No se agregan accesos a Inicio por descarte.

## Actualización documental pendiente

README.md, AGENTS.md y docs/HANDOFF_WORK_V2.md conservan frases históricas de etapas anteriores. No fueron reescritos en esta PR para evitar borrar evidencia. Al aprobar estos planos, incorporar referencias a este índice y una tabla breve de estado vigente que reduzca contradicciones; conservar la historia rotulada como historia.
