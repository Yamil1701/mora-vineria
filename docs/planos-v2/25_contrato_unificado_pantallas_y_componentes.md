# 25 — Contrato unificado de pantallas, navegación y sistema visual

**Corte:** 25/10/2026. **Estado:** consolidación **propuesta** para cierre integral del plano, basada en dirección UX acordada en Bloques I–III. **No es JSX, CSS nuevo, mockup pixel-perfect ni software en ejecución**. Los detalles operativos con impacto en negocio están en [24 — Operaciones y datos](24_contratos_operaciones_y_datos.md); los destinos en [02](02_catalogo_pantallas.md) y [10](10_contrato_navegacion.md).

## 0. Principio rector de diseño: operar primero, sin «IA slop»

Mora es una PWA **mobile-first** de vinería local: debe sentirse cálida, nocturna, moderna y ligera; no como un ERP, panel administrativo o demo con tarjetas que intentan simular profundidad. Priorizar en cada pantalla:
1. **Ubicación y tarea:** saber dónde se está y qué se puede hacer.
2. **Dato para decidir:** producto/precio/stock, total, cuenta, estado del pedido o resultado del período, según tarea.
3. **Acción principal:** un único CTA visualmente prioritario para la siguiente decisión real.
4. **Acciones secundarias:** enlaces discretos a pantalla canónica, no funcionalidad duplicada.
5. **Detalle avanzado:** disponible cuando se lo pide, nunca mezclado con una captura breve o tapando operación frecuente.

**Vocabulario de interfaz:** «Resumen de hoy», «Ventas de hoy», «Movimientos de hoy», «Para reponer», «Preparar pedido», «Recibir mercadería», «Guardar venta», «Revisar cambios», «Guardar respaldo», «Volver». **No** mostrar «día operativo», «ledger», «FIFO» en etiquetas de uso cotidiano, «sincronizado» sin backend, «writeIntent», «UUID», «CAS» o estados de desarrollador. El detalle de FIFO puede figurar en pantalla técnica bajo demanda, no en carrito normal.

## 1. Identidad, color, geometría y tipografía

**Marca del usuario (aprobada):** **«Mora» con un signo cuadrado pequeño fucsia al final**, del **mismo tamaño óptico que un punto de puntuación**. No renderizar como texto `Mora.` con punto redondo, ni como `Mora■` sobredimensionado. El cuadrado es un elemento de marca con lados iguales, alineación/baseline y separación óptica definida mediante token visual. Mantener el nombre accesible `Mora`, sin anunciar «cuadrado».

**Tokens mínimos conceptuales** (nombres implementables, valores concretos de referencia ya existentes a auditar sobre pantalla real):

| Grupo | Tokens y funciones | Regla visual |
| --- | --- | --- |
| Identidad | `brand.wordmark`, `brand.squareMark`, `brand.accent` | Fucsia de referencia `#FF0A89`; cuadrado compacto, jamás un botón |
| Fondos | `surface.canvas`, `surface.raised`, `surface.subtle` | Fondo carbón único y atmósfera sutil; efecto blur solo en áreas que flotan de verdad |
| Texto | `text.primary`, `text.secondary`, `text.muted`, `text.onAccent` | Contraste real sobre fondos renderizados; no abusar de grises ilegibles |
| Estados | `status.warning`, `status.error`, `status.success`, `focus.ring` | Estado acompañado de palabras/icono, nunca solo color |
| Tipografía | `type.brand`, `type.heading`, `type.body`, `type.caption`, `type.money` | Familia distintiva para marca/títulos cuando corresponda; resto legible. Importes con cifras tabulares |
| Espaciado | `space.1…8` de escala 4 px | Ritmo repetible, no márgenes únicos por pantalla |
| Toque | `touch.min`, `touch.primary`, `dock.safeArea` | Objetivo general 44–48 CSS px para acciones frecuentes; barras no tapan teclado |
| Formas | `radius.control`, `radius.panel`, `border.subtle` | Un estilo de controles; no redondear tres paneles anidados para una sola fila |
| Movimiento | `motion.standard`, `motion.reduced` | Discreto, opcional, con `prefers-reduced-motion` |

**Uso cromático:** el fucsia identifica acción principal, selección activa y marca. No aplicar fucsia a todos los precios, enlaces, cifras y badges al mismo tiempo. Stock bajo/crítico debe distinguirse por texto/indicador, sin degradar la lectura nocturna. El fondo decorativo no debe interferir con listas largas.

## 2. Shell y navegación compartidos

### 2.1 Shell normal

```text
┌──────────────────────────────────────┐
│ Mora [cuadrado pequeño]      [···]  │  ← marca + 0–2 accesos útiles
│ [‹ Volver]  Título de pantalla       │  ← franja contextual
├──────────────────────────────────────┤
│ Contenido de tarea                   │
│ Primario → Secundario → Detalle      │
│                                      │
├──────────────────────────────────────┤
│ Inicio  Ventas   (+)   Caja    Más   │  ← 4 destinos + acción
└──────────────────────────────────────┘
```

- Dock **`Inicio · Ventas · (+ Nueva venta) · Caja · Más`** es el **candidato rector** para el cierre global. El `+` inicia/retoma venta, no ocupa estado de pestaña, y su etiqueta accesible es «Nueva venta».
- **Ventas** abre historial/gestión. **Más** abre **siempre la raíz del directorio**, aunque se estuviera en una hija; el acceso interno directo a Productos/Inventario/Reposición preserva retorno.
- Una hija de Más tiene **Más** como destino resaltado. Un detalle de venta tiene **Ventas**; un movimiento **Caja**. El origen de atajo (Inicio/Reporte/ficha) afecta a `Volver`, no debe alterar arbitrariamente el resaltado global.
- `Volver` vive a la **izquierda de segunda franja** cuando hay destino real. El `BackControl` visual y la navegación por gesto/tecla Atrás deben resolver el **mismo contexto**; en raíz no inventar una flecha inerte. Al volver de Reportes → Detalle Venta, conservar período del informe.
- En Nueva venta (selector/carrito/cobro/confirmación sensible) ocultar dock y dejar control de retorno seguro; preservar borrador durable e impedir otro intento incompatible si ya hay escritura sellada.
- `sticky` no significa inmóvil: la cabecera ocupa poco espacio; con teclado virtual evitar que el CTA o lista de resultados queden tapados. Respetar `env(safe-area-inset-bottom)` y scroll.
- **La raíz del directorio Más**, por grupos sin lista abrumadora: **Mercadería: Productos / Inventario / Reposición**; **Negocio: Reportes**; **Aplicación: Configuración / Datos**. Evitar crear una subpantalla «Mercadería» que sea paso obligatorio para llegar a las tres tareas.

### 2.2 Estados de navegación

| Escenario | Acción/retorno | Persistencia requerida |
| --- | --- | --- |
| Inicio → Para reponer → Reposición | Volver a Inicio en contexto | Pedido/stock no cambian |
| Más → Inventario → Producto → Conteo | Regresar a inventario con filtro/posición útil | Conteo guarda solo al confirmar |
| Más → Productos → Ficha → Reposición | Reposición se abre con SKU contextual; Volver devuelve a Ficha | No duplicar «recibir» en ficha |
| Reportes (Mes) → Detalle venta | Volver a Reportes con Mes intacto | No resetear período |
| `+` con borrador | Recuperar selector/carrito y cifras exactas | Borrador local durable |
| `+` con venta sellada pendiente | Abrir recuperación de **misma operación**, no segunda venta | Comando + ID intactos |
| Fondo/recarga/actualización PWA | Restaurar estado de operación antes de habilitar nuevos guardados | Historial y writeIntent, sin perderlos |
| Abrir/cerrar teclado | Mantener foco, CTA visible y scroll sin salto | No aplicar ni cancelar por teclado |

## 3. Biblioteca conceptual de componentes — una única familia

| Componente conceptual | Uso y contrato | Evitar |
| --- | --- | --- |
| `AppShell / GlobalHeader / ScreenHeader` | Marca cuadrada, contexto, retorno y acciones pertinentes; densidad adaptativa | Uno distinto por módulo |
| `BottomNav / NewSaleAction` | 4 destinos + acción central; estado accesible | Acción `+` como tab seleccionada |
| `BackControl` | Destino semántico real, foco y retorno consistente | Enlace fijo a Inicio |
| `ActionButton` | Primary/secondary/quiet/danger, tamaños táctiles, estado busy | CTA en todas las tarjetas |
| `DataRow / ProductRow / StockIndicator` | Filas compactas, SKU+variante+precio+stock, accesibilidad | Galería decorativa para SKU sin foto fiable |
| `SearchField / FilterBar` | Buscar sin alterar datos, conservar filtros de consulta | Teclado ocultando resultados/CTA |
| `MoneyValue / MoneyField / QuantityField` | ARS sin centavos, etiquetas explícitas, error por campo | Placeholders como único label |
| `LineItem / QuantityStepper / CheckoutBar` | Editar cantidades, total derivado, Cobrar directo | Duplicar total como estado mutable |
| `SegmentedTabs` | Alternar `Resumen/Movimientos/Cuentas` o `Hoy/Semana/Mes` con selección persistente en sesión | Pestañas dentro de pestañas anidadas sin necesidad |
| `ReviewRow / MatchSuggestion / PriceDiff` | Anterior/nuevo, cambios seguros marcados, candidatos dudosos, revisión por lote | Precio aplicado por tildar una fila |
| `OrderRow / ReceiptLine` | Pedido/recibido, presentación, costo estimado/real distinto, diferencias destacadas | Copiar carrito de venta sin adaptarlo a compra |
| `HistoryRow / EventDetail` | Fecha, importe y origen; enlaza dueño; ampliación bajo demanda | Historial duplicado de operaciones |
| `EmptyState / InfoNote / ReviewNotice` | Estado, implicación y próxima acción | Caja de color grande para toda información |
| `PendingWritePanel` | Confirmación sellada, ID reintentable, misma operación, error recuperable | Toast que desaparece y habilita duplicación |
| `ConfirmDialog / CheckAnswers` | Revisión focalizada antes de operación de alto impacto | Dos confirmaciones para cada tarea trivial |
| `BackupPanel / RestorePreview` | Exportar/validar/confirmar/importar y feedback veraz | Prometer descarga/sync sin comprobación |
| `PrintReportView` | Vista A4 y `window.print()` local | PDF fiscal, librería pesada, marca como respaldo |

**Extracción al implementar:** los nombres son **responsabilidades**, no una orden de crear 20 carpetas. Primero auditar componentes actuales del repositorio, luego reutilizar/extender con tokens únicos. Ninguna pantalla debe inventar una variante personal de botones/formularios mientras existan componentes canónicos.

## 4. Contrato compositivo por pantalla principal

| Destino | Encabezado y dato prioritario | Acción primaria | Secundario y límites |
| --- | --- | --- | --- |
| **IN-01 Inicio** | «Resumen de hoy»; Ventas de hoy, ganancia estimada con cobertura, pocas prioridades de reposición | `+` global para vender; si hay escritura bloqueada, **Recuperar** antes | Acceso a Caja, Reposición y Reportes; no historial completo ni panel de configuración |
| **VE-00 Ventas** | Historial reciente con fecha/jornada/importe/método, buscador y filtro útil | Abrir detalle seleccionado; `+` inicia venta global | Correcciones/Fiados como accesos secundarios; vacío «Todavía no registraste ventas» |
| **VE-01 Nueva venta** | Buscar y consultar precios/stock por SKU, favoritos, categorías a demanda | Agregar artículo / **Cobrar** cuando hay líneas | Consulta sin agregar; carrito opcional; dock oculto |
| **VE-02 Carrito** | Líneas, cantidades, precio efectivo y total | Continuar al cobro | Agregar más, quitar ítem, vaciar con resguardo de borrador |
| **VE-03 Cobro** | Total y medio de cobro, recibido/vuelto o partes de pago, acreditación humana | **Guardar venta** | Corregir pago antes de sellar; incertidumbre stock/costo tras confirmar |
| **VE-05/06 Detalle** | Artículos, método, importes, momento/jornada y estado corregido | Ver/Corregir cuando aplique | No alterar historial; muestra origen de rectificación |
| **VE-08 Fiados** | Lista de clientes con saldo pendiente, ventas vinculadas | Ver deuda / **Abonar** desde su ficha | Pagos acreditados únicos, no otra venta |
| **PR-01 Productos** | SKU+variante, precio y stock; búsqueda/filtros/categorías | Agregar producto | Ficha, editar, favorito; lotes avanzados bajo demanda |
| **PR-05 Inventario** | «Stock por producto», faltantes/objetivos y diferencias | Seleccionar producto → Contar/Ajustar | Historial físico; nunca saldo monetario |
| **PR-09 Reposición** | **Pedido pendiente** prioritario si existe; si no, «Preparar pedido» | Recibir mercadería o Preparar pedido según estado | «Para reponer», «Lista del proveedor», «Recibir sin pedido» discretos |
| **PR-Lista Proveedor** | Pegado texto → saneamiento → «Cambios» y «Por revisar» | **Revisar N cambios** → **Aplicar N precios** con confirmación | Seguros preseleccionados, dudas excluidas; sin cambios ocultos |
| **PR-10 Pedido** | Faltantes, objetivo y presentación; carrito de packs | Guardar pedido / marcar enviado explícitamente | Compartir WhatsApp, costo estimado sin egreso |
| **PR-11 Recibir** | Carrito pedido vs recibido, unidades, costo real por línea, total | **Confirmar recepción** | Parciales conservan pendientes, sin doble egreso; costo estimado rotulado |
| **CA-01 Caja** | Movimientos relevantes y saldos confiables cuando existan; `Resumen/Movimientos/Cuentas` | **Registrar** | Sólo Gasto/Aporte/Mover dinero; no registrar manualmente compras |
| **CA-02 Movimientos** | Fecha/hora, cuenta, clase, origen y monto | Abrir detalle / Registrar | Transferencia entre cuentas no sumar ingresos |
| **CA-07 Cuentas** | Efectivo, Brubank y cuentas adicionales de Mora; saldo calculado/contado con procedencia | Ver cuenta / mover dinero | Sin conexión al banco ni saldo ficticio |
| **RE-01 Reportes** | Hoy/Semana/Mes, ventas, ganancia FIFO/cobertura | Cambiar período / Ver detalle | Evolución y productos destacados; no duplicar gestión |
| **RE-05 Meta** | Objetivo mes, avance, proyección etiquetada | Guardar objetivo | Sin meta ni suficientes datos, estado honesto sin insistencia |
| **RE-06 Informe** | Mes + cifras verificables y contexto de cobertura | **Imprimir / Guardar PDF** | Solo ventana de impresión, no documento fiscal |
| **CO-01 Configuración** | «Datos y respaldo», versión/estado local, pocas preferencias útiles | Abrir Datos y respaldo | Sin perfil, login, sync ni ajustes empresariales |
| **CO-02/03 Datos** | «Descargar respaldo» y «Restaurar desde archivo» con preview | Descargar / Confirmar restauración en base vacía | No fusionar historias ni sobreescribir dataset activo |

Cada fila es el **esqueleto** del contrato dueño de [11](11_contratos_pantallas.md) y debe mantenerse alineada con sus IDs, incluso cuando la implementación actual sea mucho más limitada.

## 5. Estados y mensajes consistentes en toda Mora

| Estado transversal | Mensaje y comportamiento de referencia |
| --- | --- |
| Sin registros | Explicar qué falta y una acción que **exista**: «Todavía no hay ventas» / «Agregar producto» |
| Sin objetivo de stock | «Sin objetivo configurado»; no indicar bajo/crítico inventados |
| Sin costos fiables | «No se puede calcular toda la ganancia» y monto conocido con cobertura separada |
| Sin saldo inicial | «Saldo no informado»; mostrar movimientos registrados sin afirmar fondos disponibles |
| Lista semanal sin cambios | «No hay precios para revisar esta semana»; `Ver N sin cambios` opcional |
| Lista con alias dudoso | «Por revisar»: candidato principal, Elegir otro/Crear; no preseleccionar precio |
| Pedido sin entrega | «Pedido pendiente»: sin stock ni Caja, CTA Recibir mercadería |
| Recepción parcial | «Quedan N unidades pendientes» con producto/presentación y detalle; no crear stock faltante |
| Pago por transferencia no acreditado | «Comprobá la acreditación antes de confirmar»; no simular conexión bancaria |
| Fiado sin abonos | Saldo total, «Abonar»; no incluir como dinero ingresado |
| Operación sellada pendiente | «Falta confirmar esta operación. Reintentá sin duplicarla»; mismo ID |
| Error transaccional | Mostrar qué falló y permitir recuperar; nunca éxito decorativo |
| Offline | «Los datos se guardan en este dispositivo»; no hablar de sincronización con nube |
| Respaldo antiguo/ausente | Aviso proporcional, enlace a Configuración > Datos; sin afirmar fecha que no pueda verificarse |
| Proyección insuficiente | «Todavía no hay información suficiente para estimar el mes» |
| Guardado local | «Guardado en este equipo» solo cuando la transacción confirmó, no por clic |
| PDF cancelado | Regreso normal a Reportes, sin mensaje de archivo descargado |

## 6. Reglas de accesibilidad y composición móvil

- Validar estructura a **360, 390 y 430 CSS px**, modo nocturno, Android/iOS, zoom y texto ampliado, con teclado abierto y áreas seguras. Evitar dos paneles horizontales de métricas cuando el texto ya no cabe: apilar o simplificar.
- Componentes interactivos con nombre accesible; foco visible con color+contorno, orden lógico. Botón de regreso interno y gesto Atrás no cancelan silenciosamente una venta/preparación; diálogo recupera foco.
- Un `ConfirmDialog` de alto impacto explica **qué se cambia**: `Aplicar 5 precios`, `Confirmar recepción`, `Restaurar datos`; nunca una etiqueta genérica `Sí` que pueda confundir.
- MoneyField: moneda/cuenta/importe explícitos, números enteros, separador ARS en lectura y validación de importes; sin teclado numérico que oculte estado y confirmación.
- En grupos de resultados, preferir **filas** para catálogos, historial, precios o stock, con separadores discretos; reservar **una tarjeta importante** para tareas pendientes reales. Evitar `glass` encadenado y contadores grandes sin decisión asociada.
- No depender de gestos de arrastre/swipe exclusivamente para borrar/corregir; conservar acción táctil visible. Animaciones con reduced-motion.
- Impresión tiene **sistema distinto solo por soporte** (alto contraste y papel), no un segundo diseño arbitrario: conserva jerarquía informativa y nombres, elimina fondo ornamental y navegación.

**Actualización del 26/10/2026:** la consistencia semántica aquí no alcanza por sí sola para firmar una **dirección de arte**. Work debe cumplir la auditoría de referencias, heurísticas UX/UI, exploración controlada de tipografía/paleta/materiales, componentes en pantallas reales y checklist explícito contra estética genérica definidos en [27 — Dirección visual y control anti-slop](27_direccion_visual_y_control_anti_slop.md); el texto preparado para una futura misión está en [28](28_encargo_work_fase_visual_previa.md). **Sin firma visual expresa y una posterior autorización de alcance, no se implementa**, aunque el usuario haya solicitado considerar una primera construcción intermedia.

## 7. Gates de diseño antes de código y QA después de código

### Antes de escribir código — cierre documental

- Cada pantalla en [02](02_catalogo_pantallas.md) y [11](11_contratos_pantallas.md) enlaza dueño único, origen, efecto y retorno.
- Los datos/operaciones de [24](24_contratos_operaciones_y_datos.md) respaldan cada CTA real; no hay promesa de cuenta/cobro/stock que el dominio no pueda explicar.
- El sistema compartido de este documento y [12](12_sistema_componentes.md) evita componentes incompatibles; identidad usa punto **cuadrado**.
- El usuario revisa **una síntesis integral** y aprueba o corrige el paquete, no una decisión por botón.
- Los ejemplos ficticios son **ejemplos**, no campos obligatorios ni datos reales. El plano no se vende como implementación ni prueba de QA.

### Después de implementar — gate técnico/operativo, diferente

- Pruebas unitarias, integración, migraciones Dexie, transacciones/reintentos, versión de backup, restauración en perfil limpio, navegación Playwright, responsive/teclado/lector, capturas lado a lado con referencias y QA operativo en móvil real.
- Publicar solo tras autorización explícita; `master` y los datos actuales se preservan durante la fase de planos.

**Criterio final:** este documento especifica **qué patrones deben compartir las pantallas y cómo se debe usar la app**, no impone estructura de carpetas ni nombres concretos de componentes sin auditar la implementación existente. El plano integral se considerará terminado cuando el usuario valide la síntesis global y no queden contradicciones materiales registradas en [23](23_auditoria_coherencia_integral.md).
