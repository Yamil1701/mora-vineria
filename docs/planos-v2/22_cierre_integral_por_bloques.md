# 22 — Cierre integral del plano maestro por bloques

**Fecha:** 25/10/2026. **Naturaleza:** documento de trabajo del plano maestro; **no es orden de implementar código**.

## 0. Decisión del usuario sobre el proceso y situación del proyecto

**Respuesta del usuario (25/10/2026):** «No, por ahora no quiero empezar a construir a medias cosas que luego vamos a tener que retocar. Recordá que la idea era armar los planos y una vez terminada toda la app en los planos, recién desarrollarla, con componentes coherentes, navegación coherente y cómoda, etc, etc. Hagamos un último repaso sobre las cositas que ya vimos, un vistazo a lo que falta, y terminamos el plano maestro. Lo hagamos en bloques, lo más grande posible para no tardar y avanzar de mensaje en mensaje con una decisión. Además, es importantísimo seguir guardando y documentando todo, ya que la documentación son los planos mismos para construir».

**Regla de trabajo aprobada:** cerrar **primero la totalidad del diseño del producto** con contratos coherentes de pantallas, componentes, estados, flujos, navegación y datos; **después** desarrollar en etapas técnicas. No proponer construir a medias, cambiar el alcance de manera improvisada ni reemplazar documentación por capturas decorativas. Recoger observaciones/aprobaciones **por bloques amplios**, no una microdecisión por conversación. Guardar cada decisión aprobada en su contrato específico y en el registro de observaciones. **Sin código, migraciones ni despliegue mientras se cierra el plano**.

La revisión de código real de `master` permite conservar como base el núcleo local Dexie/FIFO, comandos idempotentes, ventas en efectivo, productos, conteos, gastos/aportes y backup JSON. **Ninguna característica de esta PR documental debe describirse como ya implementada por estar dibujada.** La PR #12 continúa como borrador.

**Estado explícito:** decisiones históricas confirmadas **(A)**, diseño propuesto por el asistente a contrastar **(P)** y capacidades deliberadamente fuera de la versión **(F)**. Una propuesta no pasa a A sin respuesta del usuario; las decisiones de comportamiento delegadas explícitamente al asistente constan como tales.

## Actualización de estado — revisión en bloques (25/10/2026)

- **Bloque I:** propuesta general de experiencia diaria aceptada para avanzar, con **corrección expresa** de identidad: «Mora» termina en un **cuadrado pequeño, del tamaño óptico de un punto tipográfico**, no en punto redondo. Continúa pendiente la auditoría de coherencia global, no un nuevo debate por cada pantalla.
- **Bloque II:** **aprobado conceptualmente por el usuario** ante la revisión integral de Reposición + lista/aprendizaje/precios + pedido/recepción + Caja/cuentas/movimientos + efectivo/transferencia/mixto + fiados + correcciones: «Sí, me parece bien». Aprobado el **modelo de experiencia y alcance**. Las especificaciones de estados, modelos transaccionales, pantallas, migraciones y QA siguen pendientes de precisión **documental**; la aprobación no equivale a software disponible.
- **Bloque III:** **aprobado conceptualmente** por el usuario, «Me parece bien», a la revisión conjunta de Reportes/periodos, meta/proyección básica, PDF mensual local por impresión, Configuración/JSON y sistema visual/estados. Igual que en los otros bloques, los contratos de implementación y QA deben precisarse en documentación, sin escribir código.
- **Implementación:** expresamente pospuesta hasta terminar, revisar y **aprobar todo el plano maestro**. La PR #12 sigue abierta en borrador y sin cambios de código.

**Jerarquía de evidencia:** aprobación del usuario > propuestas del asistente > ejemplos/mocks históricos. Las propuestas conceptuales ya aceptadas del Bloque II no deben quedar erróneamente marcadas como «pendientes de aprobación de producto», aunque los contratos técnicos y visuales aún tengan trabajo.

## 1. Qué está cerrado y qué falta — mapa de cobertura

| Área | Contrato/propietario | Confirmado (A) | Falta cerrar en planos (P) |
| --- | --- | --- | --- |
| Navegación y shell | 01, 10, 12, 17, 20, 21 | «Mora.»; header compacto de dos franjas; «Volver» contextual uniforme; Ventas = historial; + = nueva venta; Más raíz; Mercadería con Productos/Inventario/Reposición separados; Caja preferida en dock | Congelar variante final del dock y reglas de back del teléfono/gestos, teclado/scroll y navegación en flujos sensibles; estados vacíos |
| Inicio | IN-01/02/03 — 11 | «Resumen de hoy», ventas, ganancia estimada, pocos faltantes; sin centro de administración | Jerarquía definitiva, excepciones, accesos, vacíos, métricas incompletas |
| Nueva venta / Ventas | VE-00 a VE-09 — 11, 17 | Selector ágil, favoritos/búsqueda sin sumar ítems al mirar; carrito opcional; venta física sin stock se conserva; borrador; historia separada; corrección por flujo canónico | Cobros transferencia/mixto, corrección posterior, fiado/abonos, historial filtrado y confirmaciones sin sobrecarga |
| Productos / Inventario | PR-01 a PR-08 — 11 | Producto, precio, favorito, stock/objetivo, alertas 20/10 %, desactivar con historia, contar/ajustar stock con causa | Pantallas finales, edición/variantes, filtros y preservación de contexto; variantes de producto y controles |
| Reposición | PR-09 a PR-14 — 03, 11, 20 | Área propia; lista semanal WhatsApp, saneamiento y alias aprendidos; costo por presentación; recargo 50 % y techo $500; revisión/edición de precio; cambios seguros preseleccionados, sin cambios ocultos; pedido guardado; carrito multisproducto y recepciones parciales; portada con pendiente prioritario | Contrato final de interfaz compacta y calendario lógico pedido/entrega, tratamiento de excepciones/estados, vínculo lista↔pedido↔recepción |
| Caja/cuentas | CA-01 a CA-09 — 11, 21 | Caja visible preferida; un «Registrar» → Gasto/Aporte/Mover dinero → Entre cuentas/Retirar del negocio; compra no se registra dos veces | Cuentas y saldos conocidos/contados, traspasos, pagos mixtos, conteo de efectivo, gastos y retiros con historial |
| Reportes/metas/PDF | RE-01 a RE-06 — 11 | Reportes con jornadas, costos FIFO honestos, períodos y enlaces canónicos | Comparación/períodos, metas/proyecciones sencillas, salida mensual local **imprimible vía window.print()** |
| Configuración/datos | CO-01 a CO-05 — 11 | Backup/restauración JSON local central, sin sync; configuración accesible; restauración segura | Pantalla de datos, compatibilidad de extensiones de backup y migraciones, prevención de pérdida, resguardos y preferencias mínimas |
| Sistema transversal | 04, 10, 12, 13, 14, 15 | Dark/fucsia, mobile-first, densidad contenida, control de retorno, recuperación de writeIntent, única fuente de verdad | Componentes/estados por área, accesibilidad, diálogos, acciones y fallback offline, matriz final de aceptación |

**Corrección de precedencia:** la antigua idea de Supabase, login, autenticación remota, sync, etc., en documentación histórica es **F para el MVP**: arquitectura vigente local-first sin backend, IndexedDB/Dexie y backup/restauración por archivo. El `outbox` histórico del código no justifica exponer mensajes de sincronización inexistente. La barra `Inicio / Ventas / Productos / Reportes` implementada ahora es **estado de código viejo**, no dirección vigente del plano.

## 2. Macro-bloque I — Experiencia diaria completa

**Agrupa:** shell, navegación, Inicio, Ventas, Nueva venta, Productos e Inventario. No subdividir en una pregunta por botón. Cerrar juntos el mapa de interacción, la composición, los controles compartidos y el contrato de regreso.

### Ya acordado (A)

- Dock candidato principal **Inicio · Ventas · + Nueva venta · Caja · Más**, a confirmar como conjunto al terminar el bloque; la preferencia cualitativa por Caja sobre Productos está registrada. **Más** siempre abre su raíz; dentro de «Mercadería» hay accesos independientes **Productos / Inventario / Reposición**. Reportes y Configuración viven en Más; otros atajos son contextuales y apuntan a su **pantalla dueña**.
- Header sticky **«Mora.»** arriba, franja contextual inferior con título, `BackControl` uniforme a la izquierda, acciones mínimas y no decorativas. Ocultar dock al preparar/cobrar una venta para concentrar la tarea; regreso/actualización no descarta `Draft` ni `writeIntent`.
- Inicio: **«Resumen de hoy», «Ventas de hoy», «Ganancia estimada», «Para reponer»**, acceso a tarea pendiente cuando hay incidencia, sin cifras de saldos inventados.
- Ventas = historial/gestión; tocar `+` inicia/retoma **un solo** borrador de Nueva venta. Buscador/consulta muestran precio y stock sin agregar; favorito agrega si se elige acción explícita. Carrito opcional. Quitar producto del carrito no es merma: se corrige físicamente en Inventario después.
- Inventario es una tarea distinta del catálogo: «Stock por producto», contar, ajustar con motivo e historial. Bajo ≤20 % y crítico ≤10 % del **stock objetivo por SKU**, no número global.

### Propuestas de cierre para evaluar juntas (P)

- **Inicio:** un dato comercial dominante; ganancia y lista de hasta tres faltantes subordinadas; no duplicar un gran botón `Nueva venta` cuando `+` ya está en el dock. Alertas de escritura/revisión reales van primero **solo cuando existen**; sin ventas/costos mostrar estados honestos en una línea.
- **Ventas/historial:** lista por fecha de jornada con total, ítems/método compactos; filtros fecha y búsqueda cuando hacen falta; detalle de venta con cambios/cobros trazables; enlace desde Reportes conserva retorno y período. No llevar todo el historial al Inicio.
- **Nueva venta:** lista compacta, búsqueda inmediata, favoritos y categorías a demanda, barra de total/cantidad fija solo cuando hay selección y sin tapar teclado; `Cobrar` directo y carrito opcional. La confirmación muestra dinero efectivamente cobrado y aviso de costo/revisión sólo si corresponde. No interrumpir la venta ordinaria con operaciones de merma excepcionales.
- **Productos:** catálogo en filas con nombre + variante, precio y stock; ficha con editar/favorito y accesos contextuales a Inventario/Reposición; edición de precio nueva no reescribe historia. Producto con historial se desactiva, nunca se destruye.
- **Inventario:** acceso primero a «Stock por producto» con buscador/estado, luego «Contar y ajustar» sobre un SKU; delta calculada por el núcleo al confirmar, causa y vista previa comprensible; ante línea base obsoleta se vuelve a cargar, sin ajuste silencioso. Historial legible pero no mezclado con Caja.
- **Interacciones comunes:** `Volver` mantiene filtro/scroll cuando ayuda; el botón atrás del teléfono y el del header no deben contradecirse; mantener borradores antes de salir, evitar navegación que borre formularios; sin acciones vacías/deshabilitadas que parezcan disponibles.

**Gate del bloque I:** mapa de destinos y enlaces sin destinos huérfanos; una sola tarea dueña por operación; wireframes **estructurales** y contratos (no nueva ronda de estilismos) para estados normales, vacíos, con error y teclado. Pruebas de recorrido por escenarios completos, no un microvoto por elemento.

## 3. Macro-bloque II — Mercadería y dinero completos

**Agrupa:** toda Reposición, precios, pedidos, recepciones, Caja, medios de pago, correcciones de ventas, fiados/abonos y su historia financiera. La dependencia compartida es **hecho físico → dato registrado → efecto único de stock/dinero**.

### Ya acordado (A)

- Lista del proveedor cada semana por texto WhatsApp; saneamiento local corregible; mapeos aprendidos por confirmación humana con producto/presentación/unidades, respaldados en JSON; nombre/pack incierto = «Por revisar» con asociación sugerida no automática.
- Precio de costo por presentación conocido. `costo unitario = costo presentación ÷ unidades`. **Precio sugerido de venta = techo al múltiplo de $500 de (costo unitario × 1,50)**, corregible antes de aplicar; no redondear costos FIFO exactos ni recalcular ventas previas.
- Lista de revisión focaliza **precios cambiados y filas dudosas**; sin cambios quedan ocultos; cambio de costo permanece visible aun si precio público final no cambia; cambios **seguros de precio** aparecen preseleccionados, desmarcables, y hay resumen/confirmación final.
- Reposición tiene portada sobria. Si hay pedido pendiente, **recibir mercadería** va primero; sin pedidos, **preparar pedido**. Accesos a «Para reponer», «Lista del proveedor», pedidos anteriores y «Recibir sin pedido» como secundario.
- Pedido editable **guardado localmente**, texto para WhatsApp y estado «Enviado» indicado explícitamente por la persona (abrir WhatsApp no certifica entrega). Pedido no crea stock/lotes/gasto. Al recibir se precarga carrito de compra multisproducto, se corrige físico y costo pagado. Una recepción real produce lote(s) FIFO, incremento de stock y **un solo egreso monetario**, reflejado en Caja. Parciales mantienen saldo pendiente.
- Caja: CTA «Registrar» → **Gasto**, **Aporte**, **Mover dinero**, seguido de **Entre cuentas** o **Retirar del negocio**. Transferencia interna no genera ingreso total; retiro del negocio no es gasto operativo; compra de stock nunca se duplica como gasto manual.

### Direcciones conceptuales aprobadas en revisión conjunta (A para UX; detalle técnico/visual por especificar)

- **Preparar pedido:** sugerencias hacia objetivo por producto (no sólo alertas ≤20 %), cantidades redondeadas a presentaciones enteras **si el proveedor vende cerrado**; editar manualmente y descontar informativamente lo ya pedido pendiente **sin sumarlo al stock físico**. Costos son estimados basados en lista reciente, fecha indicada. Nuevo pedido posible aunque exista otro; mostrar posible duplicación.
- **Recepción:** una lista pedido-vs-recibido que resalta sólo diferencias; presentar costo **real** por presentación y total agregado antes de confirmar. Parciales y productos diferentes son visibles; cobro y recepción no deben producir egresos hasta confirmación. Costos desconocidos o entrega gratuita requieren regla/causa segura del dominio.
- **Caja:** portada compacta con **Movimientos** como función disponible y **Cuentas** propias, y un resumen fiable cuando hay saldo inicial/registro suficiente. «Saldo contado» sólo si hubo recuento humano; el cálculo derivado no finge ser saldo bancario real. Cada movimiento enlaza al hecho de origen, sin segunda edición paralela.
- **Cuentas:** Efectivo, Brubank y otras cuentas usadas realmente; registrar origen/destino de cada cobro/movimiento, sin conexión automática a bancos. Si una transferencia llega a Naranja X y después va a Brubank, representar **cobro una vez + traspaso una vez**, no dos ingresos.
- **Cobro:** efectivo/transferencia/mixto. En transferencia la persona verifica acreditación antes de guardar como cobrada; combinado suma importes por medio y valida total. No implementar estado «cobrado en banco» por una intención no verificada.
- **Fiados (simple):** nombre del cliente, venta que origina deuda, deuda pendiente sin vencimiento impuesto, abonos parciales y saldo trazable. Registrar pagos efectivamente recibidos por medio/cuenta; cobrar fiado **no crea otra venta**.
- **Correcciones de ventas:** desde Detalle, previsualización de los efectos; historia inmutable con operación correctiva trazable. Corregir después de vender no significa borrar la venta/fila original ni recalcular FIFO histórico arbitrariamente. **No introducir devoluciones o reclamos complejos** si la operación real sólo necesita corregir cantidad/precio/método.
- **Costos/conciliación:** cuando una operación tenga costeo FIFO no calculable, avisar en Ganancia/Reportes. No inventar costo cero o monto de caja por falta de dato; una entrega no recibida nunca forma stock.

**Gate documental restante del bloque II (dirección aprobada, sin código):** especificar estados completos de pedido → recepciones múltiples; cuenta origen/destino y dinero total coherente; correcciones y fiados con entradas únicas; matriz de cambios de esquema Dexie + backup JSON + recuperación que preserve `writeIntent`. Escenarios de aceptación del circuito semanal completos, de pago mixto, abono, retiro y transferencia entre cuentas.

## 4. Macro-bloque III — Información, configuración, estados y sistema visual

**Agrupa:** Reportes, metas, proyecciones, PDF mensual local, Configuración/Datos y **todos los componentes/estados visuales transversales**. Termina el sistema que desarrolladores deben poder ejecutar sin inventar decisiones.

### Ya acordado (A)

- UX mobile-first para uso nocturno, carbón/fucsia `#FF0A89`, una sola familia de componentes, densidad contenida, fondo ambiental sin tapar lectura. La funcionalidad y legibilidad importan más que reproducir una imagen de un mockup.
- Reportes consultan **ventas, ganancia FIFO conocida, gastos, compras, aportes y variación de dinero como conceptos distintos**. Toda cifra dudosa o incompleta se comunica explícitamente, nunca se reemplaza por cero.
- Respaldo **JSON obligatorio y central**, restauración desde archivo como migración **semiautomática manual**, no sincronización; antes de borrar, actualizar o cambiar de navegador, asegurar copia verificable. Historial y costos deben sobrevivir migraciones.
- El alcance vigente del proyecto incluye **metas mensuales/proyecciones básicas y PDF mensual local** mediante vista imprimible + `window.print()`; no introducir librería de PDF, servicio de terceros o servidor para esa función.

### Direcciones conceptuales aprobadas en revisión conjunta (A para UX; detalle técnico/visual por especificar)

- **Reportes:** acceso desde Más, período Hoy/Semana/Mes; vista inicial con ventas, ganancia estimada y comparación con período anterior **solo con datos comparables**. Profundizar por productos, dinero/costos y evolución; ventas detalladas siguen en Ventas y movimientos en Caja (enlaces, no copias completas).
- **Meta mensual:** importe de ventas objetivo editable, progreso real por jornada del mes y porcentaje derivado; poder dejarla sin configurar. Proyección básica con ritmo observado de días transcurridos y días restantes, marcada **«Estimación»**, no garantía, y sin inventar margen si faltan costos. Negocio nuevo/mes con pocos datos muestra «Todavía no hay información suficiente».
- **Informe mensual:** vista imprimible local con mes, ventas, número de operaciones, ganancia cuando costeo esté completo, desglose simple de movimientos, productos destacados, notas de cobertura/estimación y fecha de generación. Acción `Imprimir / Guardar PDF` invoca `window.print()` del navegador; CSS de impresión sin dock/fondo oscuro ornamental, apto para A4 o PDF del sistema. No facturación fiscal.
- **Configuración:** directorio pequeño con «Datos y respaldo», «Acerca de Mora / versión» y preferencias solo si aportan valor. «Datos» reúne descargar JSON, validar/recuperar en espacio vacío, comprobar estado local, exportación actualizada, y guía para llevar archivo a otro equipo (nunca prometer sincronización).
- **Resiliencia:** reabrir borrador tras recarga, conservar escritura sellada con ID, informar «Guardado en este equipo» y recuperación explícita ante error; indicar offline sólo si modifica decisiones operativas, no insinuar servidor. Escenarios sin productos/ventas/cuentas/lista/reporte/backup reciben mensaje y siguiente acción, no paneles simulados.
- **UI kit:** tokens de color/tipografía/espaciado/tacto, una sola cabecera/dock, `ScreenHeader`, `BackControl`, `ProductRow`, `MoneyValue`, `Field`, `QuantityStepper`, `CheckoutBar`, `PendingWritePanel`, `EmptyState`, `ReviewNotice`, `ConfirmDialog`; nombres conceptuales, **no código todavía**. Una sola acción primaria por decisión; espacios/tamaños consistentes, fucsia para acción real, no para llenar tarjetas.
- **Accesibilidad:** superficies táctiles suficientemente amplias, foco/teclado, contraste sobre fondo oscuro real, errores por campo, reducciones de movimiento y lenguaje sin jerga; mostrar detalle avanzado sólo a demanda, nunca ocultar total/medio/error.
- **Backup de nuevas entidades:** pedido, alias, metas y cuentas deberán formar parte del JSON versionado con validación, restauración segura y prueba en otro navegador; controles de integridad antes de aplicar. No modificar formatos hasta desarrollar y probar.

**Gate documental restante del bloque III (dirección aprobada, sin código):** sistema visual/semántico suficientemente preciso para implementar todas las pantallas con los mismos componentes; reportes, PDF, ajustes, estados de error/empty/offline y respaldo especificados; lista de escenarios extremos y pruebas de accesibilidad cerrada, sin asumir que ya se ejecutó.

**Estado de cierre de los bloques:** los **tres macro-bloques tienen ahora aceptación conceptual de la dirección de producto** (el Bloque I, con la corrección de marca, está encaminado para el cierre integral; II y III expresamente aprobados como paquetes). **Eso no equivale al cierre del plano maestro**. La auditoría integral en [23](23_auditoria_coherencia_integral.md) verificará vacíos de contrato, contradicciones y aceptación final. Ninguna aprobación es autorización para escribir código.

## 5. Riesgos transversales y puntos a resolver en lote, no pregunta por pregunta

| Riesgo/punto | Propuesta conservadora | Estado |
| --- | --- | --- |
| Dock final con Caja y Más | Cerrar variante B `Inicio · Ventas · + · Caja · Más`; no devolver Productos al dock sin motivo nuevo | **P** (preferencia fuerte del usuario, falta cierre global) |
| Método de regreso/estado de navegación | Una sola política entre header y atrás del sistema; conservar contexto sin perder borrador ni writeIntent | **A objetivo**, **P detalle** |
| Ventas antiguas y correcciones | Libro de hechos trazable; operaciones correctivas explícitas, no editar history destructivamente | **A integridad**, **P flujo exacto** |
| Medios y cuentas | Brubank como cuenta principal; transferencias manualmente verificadas; dinero único por hecho | **A operativa**, **P representación de UI** |
| Lista de proveedor y precios | No redondear costos FIFO; cambios comerciales aprobados por lote con revisión final; alias aprendidos bajo reglas conservadoras | **A** |
| Pedidos y entregas parciales | Pedido persistente, no cambia stock/caja; recepciones vinculadas y idempotentes | **A** |
| Reportes, metas, PDF | Resumen útil y modesto; meta/proyección simple; PDF mensual por `window.print()` | **A alcance del proyecto**, **P presentación final** |
| Versión local y backups | Sin backend/sync, migraciones seguras y compatibilidad JSON obligatoria | **A** |
| Evidencia de validación | Contrato y recorrido por módulo antes de código; QA de la **app nueva** pertenece a fase de construcción, no prerrequisito imposible del plano | **P proceso de cierre propuesto** |

## 6. Definición de «plano maestro terminado» ANTES de desarrollar

Al cerrar los tres macro-bloques:

1. **Mapa único** de todas las pantallas y operaciones; dueño, entrada, regreso y navegación global explícitos. Sin enlaces huérfanos ni acciones falsas.
2. **Contratos completos por pantalla**, incluida cada función de esta entrega: objetivo, contenido prioritario, principal/secundarias, datos derivados, formulario, revisión, confirmación, vacíos, errores, persistencia, regreso, efecto negocio.
3. **Biblioteca visual conceptual y reglas compartidas**: tokens, tipografía, densidad, header, bottom dock, tarjetas/filas, controles, modales, feedback, accesibilidad y responsive.
4. **Contratos de dominio y almacenamiento** de las nuevas capacidades suficientes para desarrollar sin inventar modelos, preservando IndexedDB/Dexie, FIFO, jornada, caja, historial, migraciones y backup JSON.
5. **Matriz de aceptación end-to-end** de al menos: venta y consulta, corrección, stock conteo, compra semanal completa y parcial, lista mal escrita y precios, caja y traspaso, venta mixta y fiado, reportes/metas/PDF, backup y restauración, errores y regreso.
6. **Política de alcance y precedencia:** lo aprobado está fechado y se distingue de bocetos, hipótesis y funciones futuras. Los documentos históricos antiguos (p. ej. Supabase y dock viejo) quedan con etiqueta de **histórico**, sin borrarlos.
7. **Aprobación expresa del usuario del plano integral** tras una revisión amplia. Recién entonces se diseña el **plan de commits/PR de construcción**, que no forma parte de este gate.

**La aceptación del diseño no exige construir primero la nueva app ni generar capturas de una implementación inexistente**. Se pueden contrastar composición, referencias previas, wireframes estructurales y escenarios; las pruebas de fidelidad de la PWA real vienen **después** de construir, antes de desplegar.

## 6b. Cambio de secuencia del 26/10/2026 — firma visual y posible entrega intermedia

**Actualización solicitada expresamente por el usuario, posterior al plan de cierre global absoluto:** antes de definir cada pequeño remate del plano funcional, quiere **establecer expectativas de buen UI/UX y design system**, dar a Work un encargo de planos visuales **sin aspecto IA genérico**, **firmar visualmente los componentes** y solo luego, **con nueva autorización**, poder construir un **bloque importante ya planeado** sin que cada pantalla se reinvente.

**Gates propuestos:**
- **Gate V0 — Dirección visual como encargo:** revisar [27 — Calidad visual y anti-slop](27_direccion_visual_y_control_anti_slop.md) y [28 — Brief para Work](28_encargo_work_fase_visual_previa.md). Identificar referencias reales, heurísticas, accesibilidad, entrega y prohibiciones. No elegir fuentes/tokens exactos ahora.
- **Gate V1 — Firma de componentes:** Work presenta auditoría de referencias, hasta dos direcciones justificadas, pantallas móviles coherentes, tokens, UI kit/estados y comprobaciones. El usuario firma explícitamente una dirección/sistema; sin firma, **no código**.
- **Gate F1 — Primera implementación autorizada por separado:** solo entonces se elige un recorrido **esencial, acotado pero completo** de lo ya acordado, con pruebas/backups/regresiones y definición de cómo extender los componentes al resto. La firma visual **no concede** permiso para implementarlo automáticamente.
- **Gate D — Cierre global del resto de los planos:** se continúa afinando las pequeñas partes pendientes bajo el mismo sistema visual, sin abrir un sistema nuevo por cada funcionalidad.

**Compatibilidad:** las tres macro-áreas aprobadas del plano siguen vigentes. Este es un **cambio de orden de trabajo**, no un reinicio de arquitectura ni permiso para desarrollar una app a medias. Hasta las firmas: la PR documental no debe mezclar cambios en `src/`.

## 7. Política de cierre final después de las tres aprobaciones por bloque

**Estado de la conversación:** se completaron las revisiones conjuntas I, II y III. No repetirlas por separado. El usuario corrigió la marca a punto cuadrado y validó la dirección de las pantallas; II y III tienen aceptación conceptual expresa.

1. **Auditoría de coherencia:** documento [23](23_auditoria_coherencia_integral.md), incluyendo responsabilidades, precedencias, conflictos y recorridos de extremo a extremo.
2. **Contratos propuestos de operaciones y datos:** documento [24](24_contratos_operaciones_y_datos.md), para cuentas, mixtos, fiados/abonos, correcciones, proveedor, pedidos, reportes, backup y migraciones, preservando FIFO y trazabilidad.
3. **Contrato propuesto de experiencia compartida:** documento [25](25_contrato_unificado_pantallas_y_componentes.md), para jerarquía visual, marca con cuadrado, navegación, pantallas, componentes y estados.
4. **Revisión integral final con el usuario:** presentar como **un solo paquete**, recoger eventuales correcciones de alto impacto y obtener aprobación explícita **del plano completo**. Hasta entonces, la fase de arquitectura visual no está cerrada.
5. **Después de esa aprobación:** actualizar la portada e índices, marcar lo aprobado y lo excluido y conservar documentos históricos, sin permitir que instrucciones de Supabase o docks anteriores sustituyan al MVP vigente.

**Prohibición vigente durante cierre:** no crear código funcional, migraciones, nuevas tablas, backend, sync, JSX, CSS, PR de implementación, merge ni despliegue sin autorización posterior explícita.

**Contratos vigentes y fuente de consulta:** [01 Mapa](01_mapa_conceptual.md), [02 Catálogo](02_catalogo_pantallas.md), [03 Recorridos](03_recorridos_y_estados.md), [10 Navegación](10_contrato_navegacion.md), [11 Pantallas](11_contratos_pantallas.md), [12 Componentes](12_sistema_componentes.md), [20 Registro usuario](20_observaciones_prueba_usuario.md), [23 Auditoría](23_auditoria_coherencia_integral.md), [24 Operaciones](24_contratos_operaciones_y_datos.md), [25 Composición](25_contrato_unificado_pantallas_y_componentes.md).
