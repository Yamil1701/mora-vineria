# 12 — Sistema de componentes, contenido y calidad visual

**Estado:** contrato propuesto v0.1, sin UI nueva. Las imágenes oficiales son la referencia visual; estos criterios describen **cómo preservar su identidad y evitar dispersión**, no sustituyen la inspección pixel a pixel. Los assets son \`docs/diseno/mockups-aprobados-v2/{inicio,ventas,cobro,productos,reportes}.webp\` y \`docs/diseno/prototipos-v2/caja-cuentas.webp\` (complementaria aprobada); carrito.webp es sólo referencia de prototipo.

## 1. Problema detectado en el código

- \`src/ui/components.tsx\` ya reúne \`AppShell\`, \`BottomNav\`, \`GlassPanel\`, \`MoraButton\`, \`SegmentedTabs\`, \`Money\`, \`MetricCard\`, \`StockBadge\`, \`ProductRow\`, \`QuantityStepper\`, \`SyncStatus\`, \`CashBalance\`, \`CartFooter\`, \`EmptyState\`.
- \`src/App.tsx\` compone algunos roles por JSX propio; \`src/app/app.css\` acumula ~39,8 KB / cientos de bloques; el CSS existe junto a \`src/ui/theme.css\`. **Es riesgo de dispersión**, no prueba automática de CSS incorrecto.
- \`SyncStatus\` del UI kit puede presentar estados teóricos de sync, pero el MVP **no tiene** sync entre dispositivos. Sus contratos no deben colarse en presentación local ni prometer «sincronizado».
- El mismo \`GlassPanel\` no debería ser argumento para convertir cada línea, alerta y formulario en tarjetas con borde/fondo/blur: una superficie significa **agrupación**, no decoración.

## 2. Sistema de tokens semánticos (una sola fuente ejecutable)

**No fijar aún valores finales adicionales sin render.** La referencia técnica inicial \`src/ui/theme.css\` fija fucsia \`#FF0A89\`, carbón y escala de espaciado. El contraste debe verificarse sobre el **fondo efectivamente renderizado**.

| Categoría | Tokens conceptuales | Regla de uso |
| --- | --- | --- |
| Color | \`accent\`, \`accentOn\`, \`surfaceBase\`, \`surfaceRaised\`, \`surfaceSubtle\`, \`textPrimary\`, \`textSecondary\`, \`borderSubtle\`, \`danger\`, \`warning\`, \`success\` | Fucsia reservado a marca, acción prioritaria, selección; no todos los precios |
| Tipografía | \`display\`, \`heading\`, \`body\`, \`label\`, \`meta\`, \`money\` | Serif editorial sólo donde fue aprobada; texto operativo sans, números tabulares, etiquetas legibles |
| Espaciado | escala 4 px (4/8/12/16/20/24/32), padding de pantalla por breakpoint | Misma estructura de secciones entre pantallas, sin gaps inventados por PR |
| Tamaño táctil | \`controlMin\`, \`controlPrimary\`, \`tabTarget\` | Meta de diseño 44–48 CSS px para acciones frecuentes; WCAG AA SC 2.5.8 es 24 px con excepciones, **no** 44 obligatorio |
| Forma | radios para control, tarjeta destacada, diálogos | Evitar anidamiento repetido de vidrio redondeado |
| Profundidad | sombra/borde/blur por nivel de superficie | Fondo ornamental no debe competir con contenido; fallback sin blur |
| Movimiento | duración/curva/reducedMotion | Feedback discreto; ninguna animación necesaria para comprender estado |
| Estado | foco, error, offline, busy, pending, confirmed, disabled | No transmitir diferencia únicamente por color |

Revisar pares sobre el fondo \`fondo-nocturno-fucsia.webp\`, incluyendo imágenes de catálogo, overlays y selección. Contraste de texto normal 4,5:1 salvo excepciones; objetos/foco y otros contrastes tienen criterios específicos. [W3C 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum).

## 3. Catálogo de componentes: identidad, cuándo usar, antipatrones

| Familia | Componente base canónico | Función visual | Prohibir |
| --- | --- | --- | --- |
| Shell | \`AppShell\`, fondo y zonas seguras | Identidad global y contenedor | Uno distinto por pestaña |
| Navegación principal | \`BottomNav\`, cuatro destinos | Cambiar área, mismo orden | «Contar stock» como quinta tab |
| Navegación contextual | \`ScreenHeader\`, \`BackControl\`, breadcrumbs mínimos si ayudan | Lugar actual / volver | Todos los \`Volver\` dirigidos a Inicio |
| Acciones | \`ActionButton\` o \`MoraButton\` roles primary/secondary/quiet/danger | Una acción principal y jerarquía | Varios fucsias iguales en la misma decisión |
| Formulario | \`Field\`, \`MoneyField\`, \`QuantityField\`, \`SelectField\`, \`TextArea\` | Etiquetas, valores, mensajes de error contextuales | Placeholder como única etiqueta; lógica FIFO en UI |
| Selección de método | \`PaymentMethodOption\` | Efectivo activo; otros sólo cuando existan | Botones que aparentan operar sin guardar |
| SKU | \`ProductListItem\`, \`ProductFavorite\`, \`StockIndicator\` | Nombre+variante inequívocos, precio, cantidad | Imagen de variante errónea; cantidad visual ficticia |
| Venta | \`SaleLine\`, \`QuantityStepper\`, \`CheckoutBar\` | Edición de línea y resumen persistente | Carrito obligatorio; barra tapa teclado |
| Lectura | \`MoneyValue\`, \`MetricSummary\`, \`DataList\`, \`HistoryRow\` | Cifras reales, desglose, contexto | Mismo panel de métrica para todas las filas |
| Estado | \`EmptyState\`, \`ErrorMessage\`, \`PendingWritePanel\`, \`ReviewNotice\`, \`OfflineStatus\` | Aclarar problema y siguiente paso | «Sincronizado» en modo local; toast que desaparece con error grave |
| Contenedores | \`Section\`, \`Panel\`, \`Divider\`, \`Disclosure\` | Agrupación proporcional a información | \`<details>\` para ocultar datos imprescindibles |
| Diálogo | \`ConfirmDialog\`, \`EditDialog\` breves | Confirmación localizada y foco recuperable | Formulario de varias etapas con navegación inexistente |
| Accesibilidad | \`VisuallyHidden\`, \`FocusBoundary\` según necesidad | Semántica, anuncio y gestión de foco | ARIA manual redundante o controles solo con ícono |

**Cuidado:** los nombres son conceptuales. Antes de crear nuevas abstracciones, reutilizar \`src/ui/components.tsx\` cuando el contrato ya satisface la necesidad. No crear 30 componentes mínimos por moda: se extrae componente cuando repite comportamiento/estilo semántico, o cuando una responsabilidad de pantalla no puede probarse aislada.

## 4. Densidad y prioridad por pantalla

| Pantalla | Elemento dominante | Elementos de segundo plano | Información avanzada |
| --- | --- | --- | --- |
| Inicio | Ventas de hoy + acción Nueva venta | Ganancia estimada, faltantes, alerta excepcional | Ningún historial completo |
| Ventas selector | Buscar/agregar producto y CTA Cobrar | Favoritos, categoría, total | Preferencias y costo FIFO fuera |
| Carrito | Líneas/cantidades/importe total | Agregar más, vaciar | IDs y auditoría fuera |
| Cobro | Total y medio de cobro, confirmación | Vuelto, aviso de stock/costo | Registro técnico en detalle posterior |
| Productos catálogo | SKU/precio/stock verificable | Categorías, filtros, alta | Lotes en ficha avanzada |
| Inventario | Unidades y diferencia al contar | objetivo, alertas, causa | valor FIFO si se necesita en detalle |
| Reposición | Faltantes y unidades por paquete | Precio/costo, envío WhatsApp | Historial de compras y lotes detallado |
| Caja | Esperado vs real **si ambos existen** | Movimientos, cuentas, entrada a gasto/aporte | IDs de comando |
| Reportes | Ventas y ganancia del período | Desglose, tendencias, artículos | Diario contable completo fuera |
| Datos | Seguridad del respaldo | Estado local, ayuda al traslado | Digest/formato interno |

Un bloque solo se destaca si cambia la **decisión** que la persona toma; no por ser un dato cuantitativo.

## 5. Información progresiva: tres niveles

**Nivel A — imprescindible para decidir:** precio, producto/variante, total, medio, unidades, confirmación, error, incertidumbre de costo/stock y advertencia de dato sin respaldo.

**Nivel B — para consultar en el flujo:** cantidad por producto, costo aproximado cuando corresponde, fecha/hora, motivo, historial, desglose de cobro; pantalla detalle o segunda sección.

**Nivel C — para auditoría/diagnóstico:** IDs de comando, hash, racionales internos, lote exacto, metadata; «Ver información técnica» bajo demanda sin invadir trabajo diario.

[GOV.UK Details](https://design-system.service.gov.uk/components/details/) advierte no esconder en disclosure datos que la mayoría necesita. Aplicación al PR #11: los acordeones de dinero/mercadería/historial no son automáticamente definitivos; hay que evaluar qué se consulta de verdad.

## 6. Sistema de feedback y microcopy

Para cada resultado del servicio distinguir:
- **Guardado en este equipo:** transacción IndexedDB confirmada; no usar «enviado» ni «sincronizado».
- **Pendiente de confirmar:** comando sellado, ofrecer «Reintentar» con mismo ID y «Volver a editar» sólo cuando el servicio lo permita.
- **Necesita revisión:** dato real guardado pero falta verificar unidades/costo, enlace a Inventario.
- **No se pudo guardar:** transacción no confirmada; preservar formulario, explicar y no volver a generar efectos.
- **Sin conexión:** shell disponible y guardado local; no sugerir que se está esperando una nube inexistente.
- **Respaldo preparado:** sólo archivo preparado en memoria; «Descargado» únicamente si hay evidencia de descarga/verificación humana.
- **Restauración incompatible:** no escribir y explicar base de destino ocupada, formato o archivo incorrecto.
- **Cifra no calculable:** no sustituir por \`$0\`. Mismo criterio para ganancia, saldo real y costos.

Textos de acción cortos y específicos: «Guardar venta», «Registrar gasto», «Confirmar conteo», «Descargar respaldo». No escribir «día operativo», «UUID», «CAS» o «reconciliación transaccional» en botones.

## 7. Componentes críticos: contratos de interacción

### CheckoutBar
- Entrada: total y líneas de borrador (derivados), disponibilidad de acción (servicio).
- CTA: «Cobrar» o «Continuar al cobro», desactivado si no hay líneas o la operación está sellada e incompatible.
- Posición: zona segura, scroll y teclado; no oculta campo enfocado ni banner de error.
- Testing: 360/390/430, teclado abierto, zoom, orientación, VoiceOver.

### PendingWritePanel
- Entrada: \`writeIntent.status\` y tipo/fecha/detalles de operación desde snapshot.
- \`prepared\`: acción Reintentar mismo comando / Volver a editar seguro.
- \`confirmed\`: «Ya se guardó en este equipo», cerrar confirmación; sin botón que repita efectos.
- Visible/reconocible **independientemente** del área y si se recargó PWA.
- Testing: crash/reload, retry, cambio pestaña; cero doble escritura.

### StockIndicator
- Entrada: cantidad y objetivo individual; estado calculado **fuera de CSS**.
- Bajo ≤20 %, crítico ≤10 %, sólo si objetivo válido mayor a cero; sin objetivo → desconocido/sin alerta.
- No introducir «faltan 5» como umbral global ni colores como único canal.

### BackupPanel / Restore
- Preparar y descargar JSON; restaurar en base vacía y mostrar previsualización comprensible.
- No invocar \`reset\`, borrar sitio, ni importar automáticamente a navegador habitual.
- Feedback distingue archivo descargado de respaldo meramente preparado.
- Testing: corrupto, anterior formato 1, actual formato 2, destino ocupado, offline y recuperación de \`writeIntent\`.

## 8. Definición de listo del sistema de componentes

No damos por adoptado el sistema hasta disponer de:
1. Inventario real de componentes usados vs duplicados con decisiones de convergencia.
2. Tokens ejecutables únicos, sin overrides inexplicados en CSS; migración **paulatina**.
3. Estados claro/ocupado/error/foco/deshabilitado y semántica probados.
4. Capturas reales comparadas con los mockups aprobados y evaluación en dispositivos físicos.
5. Tests de accesibilidad/manuales para selector, cobro, conteo, Caja y respaldo.
6. Ningún componente de presentación importando reglas nuevas de negocio para sortear \`LocalService\`.

**Fuentes adicionales:** [React componentes y estado](https://react.dev/learn/thinking-in-react), [React state](https://react.dev/learn/choosing-the-state-structure), [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/), [W3C target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum).
