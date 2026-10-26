# 09 — Matriz de decisiones y protocolo de validación de los planos

**Fecha:** 21/10/2026. **Estado:** recomendación técnica revisable, **no** aceptación final ni autorización de refactor. Aplicar la precedencia de decisiones de `README.md` y las fuentes de `06`–`08`.

## 1. Síntesis de decisiones propuestas tras contrastar evidencia

| ID | Decisión propuesta | Evidencia principal | Confianza | Costo de un error | Validación siguiente |
| --- | --- | --- | --- | --- | --- |
| DE-01 | Inventario y Conteos dentro de Productos, no Caja/Movimientos de efectivo | AU-05, tarea física, Square conteo cíclico, Loyverse ajustes | Alta en delimitación del dominio; ubicación final a validar | Personas buscan sin encontrar ajuste; daño de stock si se duplica acción | Tree test: botella rota |
| DE-02 | Reposición dentro de Productos, con Pedido y Recepción separados | Relevamiento proveedor semanal, AU-08, Shopify inventario | Alta | Pedido altera stock/caja antes de recibir; costo doble | Ensayo con pedido jueves, parcial |
| DE-03 | Caja y dinero como destino contextual estable desde Inicio | Relevamiento efectivo/aportes, AU-04/05/17; **cuestionada por respuesta real del usuario, doc 20** | **Hipótesis debilitada; revisión necesaria** | Aporte no encontrable en antigua barra («ninguno») | Probar Caja visible en dock vs acceso rotulado en header y Más |
| DE-04 | Configuración > Datos para backup/restauración y estado local | AU-09, MDN almacenamiento, backup obligatorio | Alta en propiedad; acceso exacto a validar | Respaldo invisible y pérdida de datos | Sin indicaciones, buscar y descargar JSON |
| DE-05 | Ventas es dueño del historial/corrección y método de cobro | AU-06/07, Shopify órdenes/venta | Alta | Duplicar acciones y romper auditoría | Encontrar venta, corregir, reintentar (sólo prototipo si falta feature) |
| DE-06 | Reportes no registra nuevas operaciones; enlaza a su dueño | AU-06/14, separación consulta/acción | Alta | Doble camino de edición | Consultar costo, ir al detalle correcto |
| DE-07 | Inicio muestra prioridades y eventos excepcionales, no un centro de administración | AU-04, relevamiento Inicio aprobado | Media-alta | Uso lento por saturación y pérdida de foco | Reconocer venta/ganancia/faltantes en primer vistazo |
| DE-08 | Un único modelo de destino/subpantalla/contexto, sin introducir router por inercia | AU-01/02/03, React estado | Media | Refactor complejo puede perder búsqueda/borrador | Ensayo navegación ida-vuelta y reinicio |
| DE-09 | Mover UI por dominios sin reescribir Dexie/FIFO/backup | AU-10/13/15, Dexie, ISO 25010 | Alta | Riesgo innecesario de duplicación/pérdida | Tests de regresión, snapshot y restauración |
| DE-10 | Componentes por función y jerarquía visual, no por proliferación de tarjetas | AU-11/12, mockups aprobados, GOV details | Media | Slop visual renovado | QA visual comparado y tareas con foco |
| DE-11 | Accesibilidad AA como criterio de diseño + targets propios cómodos | WCAG 2.2, uso móvil de una mano | Alta como objetivo; cumplimiento no demostrado | Errores de toque, textos ilegibles, foco tapado | Contraste, teclado, lector de pantalla, zoom |
| DE-12 | No introducir sincronización, cloud, login ni características de plataforma externa | Alcance MVP explícito | Muy alta | Multiplica complejidad y contradice contrato | Revisar cada PR por dependencias y lenguaje |
| DE-13 | **Ventas = área de historial/gestión; + central = Nueva venta** | **Decisión del usuario, ADR 17** | **Aprobada en concepto** | Ventas crea borradores por error o + compite con navegación | NAV+-01 a NAV+-12, semántica y respuesta móvil |
| DE-14 | **Explorar 3 destinos directos + (+ Nueva venta) + Más, con header sticky** | **Sugerencia posterior del usuario y preferencia expresa por Caja, docs 20/21** | **Variante B favorecida; configuración final NO aprobada** | Caja escondida o Productos difíciles de encontrar | Probar B: Inicio · Ventas · (+) · Caja · Más; comprobar acceso inmediato a Productos/Inventario/Reposición desde Más |
| DE-15 | Merma desde **Inventario > Stock por producto > ajustar cantidad** | **Ruta elegida por usuario en la sesión, doc 20** | **Intención de recorrido observada; gesto exacto pendiente** | Ajuste directo que saltea FIFO, validación o historial | Prototipo de ajuste −1 mediante flujo duradero RecordStockCount, con motivo y nota opcional |

**Confianza** es juicio del análisis de documentos, **no** tasa calculada ni aprobación del usuario. **DE-13 es la excepción: decisión expresa del usuario**, pendiente sólo de detalles de diseño, semántica y pruebas.

**Nota de precedencia (25/10/2026):** esta lista registra dudas de la **fase inicial**; varias se resolvieron por decisiones posteriores del usuario y propuestas documentadas en [20](20_observaciones_prueba_usuario.md), [22](22_cierre_integral_por_bloques.md), [23](23_auditoria_coherencia_integral.md), [24](24_contratos_operaciones_y_datos.md) y [25](25_contrato_unificado_pantallas_y_componentes.md). No reabrirlas una por una ni interpretar `pendiente` histórico como anulación de acuerdo posterior. El gate que sigue pendiente es **aprobación integral** y QA posterior a construir.

## 2. Decisiones que NO damos por cerradas

- Forma, relieve y accesibilidad de la acción **+ Nueva venta** en pantallas estrechas/teclado; **propósito aprobado**, pero **orden de los demás destinos reabierto por propuesta posterior (20/21)**.
- **Preferencia ya expresada:** Caja se usa más que Productos; evaluar como candidata principal Inicio · Ventas · (+) · Caja · Más. **Pendiente:** probar que Productos, Inventario y Reposición se encuentren fácilmente en Más, además del funcionamiento del header fijo y del directorio.
- Posición exacta del acceso a Caja y Configuración en cada pantalla.
- Si Productos incorpora selector local «Catálogo / Inventario / Reposición» o una pantalla intermedia con grupos de acciones.
- Si Caja presenta Resumen/Movimientos/Cuentas como tabs internas o navegación en lista; la referencia visual favorece tabs internas, pero accesibilidad/comportamiento hay que probarlos.
- Qué filtros deben permanecer al regresar de una ficha y cuánto dura ese contexto; el borrador de venta sí debe ser durable según dominio.
- Cuándo mostrar «Movimientos de hoy» en Inicio; podría ser solo enlace contextual a Caja.
- Forma y límite de favoritos; grilla vs lista y cuánto arte visual aporta sin confundir SKU.
- Encabezado y barra inferior en pantallas de formulario/modal/cobro; comprobar teclado, scroll y safe area.
- Si la confirmación durable debe ocupar una pantalla completa, un panel propio o modal; reintento seguro es obligatorio.
- Desglose de reportes; qué datos diarios considera útiles el operador frente al ruido visual.
- Cuándo activar un recordatorio de backup; requiere modelo real de metadata y evaluación de riesgo.
- **Transferencia, fiados y correcciones sí deben quedar diseñados en esta PR documental** como parte de toda Mora; sus operaciones, datos y recorridos se proponen en [24](24_contratos_operaciones_y_datos.md). **No implementar ninguna** de esas funciones antes del cierre/aceptación integral de los planos y autorización de una misión técnica posterior.

## 3. Tree testing práctico de Mora sin estética

**Objetivo:** probar nombres/ubicaciones antes de CSS y JSX. Sólo presentar el árbol conceptual (áreas, subáreas y destinos) sin colores, tarjetas ni iconos. Usar tareas narradas, no preguntas que incluyan el nombre exacto del destino.

| ID | Situación en lenguaje de operador | Ruta esperada del mapa actual | Error revelador |
| --- | --- | --- | --- |
| T1 | Se rompió una botella; necesito registrar que hay una menos | Productos > Inventario > Conteo | Buscar en Caja por ser «movimiento» |
| T2 | Puse $5000 míos en el negocio | Caja > Movimientos > Aporte | Buscar en Reportes por «ingreso» |
| T3 | Llegaron dos cajones y pagué al proveedor | Productos > Reposición > Recibir | Crear gasto genérico en Caja |
| T4 | Quiero ver qué se vendió en los últimos siete días | Reportes > Semana | Abrir historial para sumar a mano |
| T5 | Cargué mal el precio de una venta que ya terminé | Ventas > Historial > Detalle | Buscar en Productos > Editar precio |
| T6 | Quiero guardar mis registros antes de cambiar de teléfono | Configuración > Datos > Backup | Buscar en Movimientos |
| T7 | Conté el efectivo físico y necesito anotarlo | Caja > Resumen > Contar | Registrar aporte/extracción inexistente |
| T8 | Un cliente me devuelve parte de su deuda | Ventas > Fiados > Cliente > Abonar | Registrar una nueva venta |
| T9 | Mañana tengo que mandar al proveedor mi lista de compras | Productos > Reposición > Pedido | Registrar recepción prematura |
| T10 | Una persona pregunta cuánto cuesta una bebida, todavía no compra | Productos > Catálogo, sin abrir un borrador; si ya está en +, consulta y puede salir sin guardar venta | Registrar venta solo por consultar precio |
| T11 | Se vendió aunque la app marcaba stock cero | **+ Nueva venta → Cobrar**, luego alerta en Productos > Inventario | Bloquear venta física, crear compra falsa |
| T12 | Quiero saber si tengo plata realmente disponible | Caja > Resumen/Cuentas con fecha de conteo | Confundir ganancia FIFO con caja contada |

**Protocolo cualitativo:** preferir las personas que de verdad atienden la vinería, aunque inicialmente sean pocas. No inventar usuarios ni simular resultados como evidencia. Para cada tarea: primer destino, ruta completa, alternativas pensadas, dónde dudó, si llegó o no y observación textual. Si sólo participa una persona, reportar **1 observación**, no «porcentaje representativo de usuarios».

**Criterio de aceptación propuesto:** sin errores críticos en tareas de cobro, recuperación, conteos y dinero; ninguna tarea depende de un botón inesperado en Inicio; rutas ambiguas se revisan. No fijar «95 % éxito» estadístico con n=1–3. Si se requiere benchmarking cuantitativo, diseñar muestra y metodología aparte. Referencia [NN/g Tree Testing](https://www.nngroup.com/articles/tree-testing/).

**Guion sin rutas esperadas para participantes:** [19_guion_prueba_arbol.md](19_guion_prueba_arbol.md). **Análisis previo, NO evidencia de usuario:** [18_prevalidacion_heuristica.md](18_prevalidacion_heuristica.md). **No permitir que el participante lea la columna «Ruta esperada» de esta matriz antes de la sesión.**

## 4. Pruebas de interacción visual después del árbol

Con prototipo navegable **con datos ficticios etiquetados**, sin sustituir la app ni necesitar backend, recorrer:
- una venta en efectivo de 1 unidad;
- venta de 4 unidades de 2 productos, editando cantidad;
- búsqueda por marca/variante con lista larga y teclado abierto;
- cambio de área y regreso con borrador;
- falta de stock y revisión;
- dinero contado distinto del esperado (si sólo diseño futuro, no simular registro real);
- error de almacenamiento con comando pendiente/reintento;
- backup descargado y restauración en perfil vacío;
- noche real, bajo brillo, 360–430 px; cambio de orientación y zoom;
- sin red/recarga/update de PWA.

**Evaluación de experiencia:** dónde duda el operador, errores físicos de toque, contenido tapado, legibilidad, cantidad de pasos, claridad de confirmación. No declarar «excelente» por screenshot. Fuente de método: [NN/g Usability Testing 101](https://www.nngroup.com/articles/usability-testing-101/).

## 5. Puertas de calidad («gates») antes del nuevo código

### Gate A — Plano sin huecos
Todas las acciones conocidas ubicadas en `02_catalogo_pantallas.md`. Las escrituras tienen **un** propietario canónico, entradas/salidas y relaciones con ledger/stock. Pendientes/futuro señalados sin prometer funcionamiento.

### Gate B — Investigación y validación
Fuentes y alternativas registradas (07–08). Tree test realizado y hallazgos incorporados, aunque el número de participantes sea pequeño. Decisiones cerradas/abiertas etiquetadas con autor y fecha.

### Gate C — Contratos de interacción
Cada pantalla elegida para implementar tiene propósito, información mínima, acción primaria, estados, navegación de vuelta, excepciones, referencia visual, foco/teclado y suite de aceptación. No se diseña todo sólo con wireframe estático; requiere recorrer tareas.

### Gate D — Refactor seguro por etapas
Una PR por responsabilidad, manteniendo el contrato real de servicios. No mover datos/localStorage/IndexedDB porque cambiaron nombres o pantallas. Separar CSS por módulos y medir regresiones visuales con artefactos reales.

### Gate E — Verificación antes de publicación
Typecheck, Vitest, arquitectura, E2E Chromium/WebKit, backup JSON con equivalencia, offline/reapertura/rotura de escritura y QA de render. Aprobación de usuario antes de fusionar/desplegar. Si cambia formato, plan explícito de compatibilidad y rollback.

## 6. Secuencia propuesta de PR de implementación (después de aprobar planos)

1. **Navegación y shell**: cuatro destinos y acción + separada en orden Inicio · Ventas · + · Productos · Reportes; Ventas abre historial y + abre/retoma borrador. Contextuales Caja/Configuración. Tests de ida/vuelta, reintento, borrador y datos.
2. **Productos/Inventario**: reubicar conteos, stock inicial e historial sin tocar sus comandos. Reposición actual aparece como recepción simple y no pedido aún.
3. **Caja/Datos**: reubicar gastos/aportes, historial de efectivo y backup, preservando exportación visible y restauración segura. Caja real aún no existe: interfaz no finge importes.
4. **Ventas/Reportes**: historial canónico y enlaces, limpieza del selector/cobro, paneles/visibilidad y contexto.
5. **Sistema visual unificado y QA integral**: revisión CSS/tokens, semántica, foco, contraste, iconografía, error/empty states y pruebas con operador. Ajustes por pantalla sin otro lenguaje visual.
6. **Recién después**: nuevas operaciones aprobadas (transferencia manual, corrección de venta, retiros, pedido, fiados y caja real) una vertical completa por PR con modelo, QA y migración de backup si aplica.

Este orden es **propuesta, no cronograma aprobado**; puede cambiar tras tree testing. Incluso las tareas «de sólo mover UI» son de riesgo moderado por confirmaciones durables y recorridos actualmente probados.

## 7. Riesgos visibles y mitigación

| Riesgo | Impacto | Mitigación antes de publicar |
| --- | --- | --- |
| Volver a saturar Inicio | Descubribilidad y calidad visual | Regla de owner + límite de contenido de Inicio |
| Duplicar recepción al mover UI | Stock/caja erróneos | Reusar comando/ID y E2E de fallos |
| Restablecer componentes sobre un borrador activo | Venta perdida | Prueba de navegación, update, reload y offline |
| Ocultar backup en Configuración | Riesgo de pérdida total | Tree test sin pistas + CTA contextual y exportación |
| Introducir caja «real» sin conteo | Confianza falsa en dinero | Sólo mostrar valor real si se registró con fecha |
| Usar fotos genéricas por «bonito» | SKU/variante equivocada | Ilustración de reserva y verificación de SKU |
| Sobre-normalizar CSS | Interfaz sin jerarquía, slop | Tokens comunes pero patrones distintos por misión |
| Adoptar un router/gestor global no necesario | Costo y errores de migración | Primer contrato simple de destinos; dependencia sólo tras justificar |
| «Completar» PDF/sync/cloud fuera de foco | Alcance descontrolado | Feature gate explícito y priorización por tareas del negocio |
| Documentos antiguos contradicen proyecto | Work sigue reglas desfasadas | Actualizar estado vigente y referencias luego de aprobación del plano |

## 8. Qué está finalizado y qué sigue pendiente

**Trabajo realizado en esta investigación documental:** lectura de fuentes oficiales y código, trazado de discrepancias por archivo, benchmark inicial de POS con fuentes primarias, decisiones preliminares y protocolo de evaluación. **Trabajo aún NO realizado:** entrevista/test de árbol con operador, auditoría manual de accesibilidad y diseño renderizado en móvil, mapa final aprobado, contrato de diseño por pantalla, investigación integral del texto pagado de normas ISO o implementación de la nueva interfaz.

El siguiente documento, tras el Gate B, debería ser una **versión 1.0 del plano aprobada y fechada**, que reemplace explícitamente las decisiones tentativas, no otro borrador solapado.
