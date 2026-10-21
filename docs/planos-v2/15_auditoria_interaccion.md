# 15 — Auditoría de interacción y accesibilidad desde el código

**Fecha:** 21/10/2026. **Nivel de evidencia:** inspección estática de \`master\` \`90264e5\`, complementada con W3C APG, WCAG, Apple HIG y React. **No se ejecutaron pruebas de lector de pantalla, análisis de DOM final, Lighthouse, axe ni capturas renderizadas en esta etapa.** Distinguir observación segura de hipótesis y fallo comprobado.

## 1. Sistema de evaluación

- **C (comprobado en código):** comportamiento o estructura literalmente presente.
- **H (hipótesis de experiencia):** posible dificultad, requiere prueba de navegación/tacto/render.
- **N (no disponible):** funcionalidad o evidencia sin implementar.
- **R (riesgo de integridad):** una modificación incorrecta puede duplicar/perder registros, no implica que hoy exista corrupción.

## 2. Tabla de hallazgos localizados

| ID | Código / fuente | Evidencia | Impacto / acción de arquitectura |
| --- | --- | --- | --- |
| IA-01 | \`src/App.tsx:32-47,81\` | **C:** ruta visual depende de \`tab\`, \`stage\`, \`movementsOpen\`, \`detailId\`, \`backupOpen\` y \`modal\`; \`navigate()\` borra búsqueda/filtros/selección/etapa | Consolidar contrato \`10_contrato_navegacion.md\`; proteger borrador Dexie sin preservar estados incompatibles |
| IA-02 | \`src/App.tsx:40\` | **C:** cada cambio de \`tab\` o \`stage\` hace \`window.scrollTo(top=0)\` | **H:** al regresar a lista larga se pierde posición; probar ida/vuelta a ficha/historial |
| IA-03 | \`src/App.tsx:41\` | **C:** abrir ficha ejecuta \`scrollIntoView\` sobre panel \`.m2-product-detail\` | **H:** navegación por scroll dentro del catálogo puede no comunicar nueva subpantalla/foco; contrato de cabecera y regreso |
| IA-04 | \`src/App.tsx:159-161\` | **C:** \`searchBox\` y \`categoryBar\` se reusan con el mismo estado en Ventas y Productos | **H:** filtro de una tarea contamina otra si se cambia de pestaña en momentos inesperados; separar state por ámbito |
| IA-05 | \`src/ui/components.tsx\` \`BottomNav\` | **C:** navegación en \`<nav>\`, botones con etiquetas visibles, \`aria-current=page\`, cuatro destinos | Preservar semántica; probar enfoque al cambiar pantalla y no reiniciar contextos |
| IA-06 | \`src/ui/components.tsx\` \`SegmentedTabs\` | **C:** grupo de botones \`aria-pressed\`, no tabs ARIA falsos; explícito en comentario | Patrón apropiado para alternancia de vistas simple; no añadir \`role=tablist\` sin teclado flechas/roles completos |
| IA-07 | \`src/app/Dialog.tsx\` | **C:** \`<dialog>\` nativo, \`showModal\`, \`onCancel\`, etiqueta, foco inicial al primer input, foco devuelto al cerrar | **H:** en formularios largos iniciar foco en input puede desplazar encabezado o explicación importante; probar con teclado virtual, zoom y lectores |
| IA-08 | \`src/app/Dialog.tsx\` | **C:** Escape cancela sólo si no está \`busy\`; el título accesible es \`h2.sr-only\` | Probar si título contextual siempre describe acción; no ocultar visualmente propósito cuando formulario ya lo muestra, evitar dos cabeceras que se contradicen |
| IA-09 | \`src/App.tsx:166-172\` | **C:** confirmación durable global y reintento de mismo comando; muestra UUID al usuario | **R:** reubicar la confirmación no puede romper su visibilidad/reanudación; texto técnico debería quedar en «Información avanzada» sin perder trazabilidad |
| IA-10 | \`src/app/MovementForms.tsx\` | **C:** motivo requerido, checkbox de revisión física, monto/conteo y diferencia visibles | Preservar consentimiento; validar errores por campo y que el check vuelva a estado no confirmado al modificar datos críticos |
| IA-11 | \`src/App.tsx:211\` | **C:** tres medios no implementados visibles y deshabilitados con texto «Pendiente» | **H:** confunden al operador frente al cobro real; evaluar reducir prominencia mientras no existan, nunca habilitarlos sólo por estética |
| IA-12 | \`src/App.tsx:223-224\` | **C:** botón escáner deshabilitado con etiqueta/título «pendiente» | **H:** affordance sin función ocupa espacio de acceso rápido; evaluar mantenerlo fuera del trabajo principal |
| IA-13 | \`src/App.tsx:235-236\` | **C:** \`<details>\` agrupa desglose e historial de ventas en Reportes | **H:** la opción puede ser poco detectable si la persona busca detalles frecuentes; probar encontrabilidad de Ventas→Historial y Reportes→Detalle |
| IA-14 | \`src/ui/theme.css\` | **C:** \`prefers-reduced-motion\`, \`prefers-reduced-transparency\`, CSS \`min-height:48px\` para botón de UI kit, \`BottomNav\` táctil grande | Buen punto de partida; **no certifica** todo control generado por \`src/app/app.css\` ni contrastes reales |
| IA-15 | \`src/ui/theme.css\` | **C:** fondo con \`background-image: url('/mora-vineria/assets/fondo-nocturno-fucsia.webp')\` y overlay | Probar compatibilidad GitHub Pages, fallback sin blur, textos sobre fotografía/gradiente e interacción con preferencias de transparencia |
| IA-16 | \`src/ui/components.tsx\` \`SyncStatus\` | **C:** componente reusable incluye texto «Todo sincronizado» para un estado posible, aunque app actual indica guardado local | **R:** si se reutiliza en nueva pantalla sin servidor, generaría afirmación falsa. Restringir/eliminar API de estado remoto en MVP UI, previa auditoría de usos |
| IA-17 | \`src/ui/components.tsx\` \`CashBalance\` | **C:** componente visual espera saldo esperado y contado con fecha y muestra diferencia sólo si los conoce | No presentar como módulo operativo hasta que exista modelo real de Caja; patrón visual no crea datos |
| IA-18 | \`src/App.tsx:163,238\` | **C:** offline se describe como local sin sincronización | Mantener mensaje coherente y discreto; reserva de backup requiere recordatorio proporcional, no alerta permanente sin acción |
| IA-19 | \`src/app/BackupPanel.tsx\` | **C:** exportación prepara Blob y explica comprobar archivo; importación valida límite y estructura sobre base vacía | **R:** reubicación Configuración no debe reducir encontrabilidad; test en navegador aislado |
| IA-20 | \`src/App.tsx:200,215\` | **C:** barra Cobrar y pie de confirmación móvil tienen lugar fijo/reservas visuales | **H:** teclado en iOS y safe areas pueden ocultar info/foco; inspeccionar visualmente y con lector, no concluir desde CSS únicamente |

## 3. Guías de interacción aplicadas sin exagerarlas

### Interfaz con foco y modales

[WAI-ARIA APG Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) define expectativas de foco contenido, retorno de foco y Escape; [ejemplo oficial de diálogo largo](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/) muestra que **centrar automáticamente el primer control interactivo** puede dejar invisibles título e instrucciones iniciales.

En Mora, \`Dialog.tsx\` posiciona foco en el primer \`input:not([type=checkbox])\`. **No es un error automáticamente**, pero debe variarse según tipo de diálogo: en alta rápida puede tener sentido; en restauración crítica, explicar primero efectos y opción de cancelación. Una simple prop \`initialFocus\` sólo se justifica si hay casos concretos y tests.

### Prevención de errores de dinero/datos

[WCAG 2.2 SC 3.3.4](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html) acepta estrategias de reversibilidad, detección de error o revisión/confirmación para operaciones de alto impacto; **no obliga a usar dos diálogos por cada Guardar**. Mora debe privilegiar una pantalla de cobro clara y control de importe/vuelto, con revisión adicional para efectos críticos difíciles de corregir y restauraciones.

### Controles táctiles

[WCAG 2.2 SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) establece mínimo de 24×24 CSS px con excepciones y reglas de espaciado. Elegimos como **objetivo propio** botones táctiles frecuentes de al menos 44–48 px, sin inventar que WCAG lo exige; comprobar áreas reales de \`m2-round-add\`, iconos y nav, no sólo \`MoraButton\`.

### Estado y navegación

[React, Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure) recomienda evitar contradicciones/duplicaciones. [Apple HIG Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) separa navegación de operaciones y sugiere preservar estado de navegación al cambiar secciones. El nuevo contrato no necesita una librería nueva sin demostrar beneficio.

## 4. Matriz de evaluación manual de accesibilidad — pendiente

| Prueba | Pantalla | Qué observar |
| --- | --- | --- |
| Foco | Abrir/cerrar producto o backup | Título anunciado, input correcto, regreso a disparador |
| Teclado virtual | Selector/Cobro | Campo visible con teclado; total/CTA no tapan interacción |
| Tabulación | Cualquier pantalla | Orden lógico; foco siempre visible; acceso a todas las acciones |
| Zoom/reflow | 200 % sobre 360 px | No perder texto, botones ni confirmaciones |
| Color | Estado stock crítico/costos | El texto y el contexto no dependen de rojo/verde solamente |
| Lector de pantalla | Historial/detalles | Nombres de botones y valores asociados; \`<summary>\` anunciado |
| Movimiento | Animaciones/transiciones | \`prefers-reduced-motion\` respetado |
| Contraste | Sobre fondo con botella | Pares medidos efectivamente renderizados, foco y bordes |
| PWA y actualización | Borrador + actualización pendiente | Aviso comprensible, no se pierden datos |
| Offline | Sin red | Se entiende qué se guarda localmente y qué es respaldo externo |

**No atribuir resultados a estas pruebas** mientras no se ejecuten. Para un producto pequeño, una pasada física de compra/recepción en móvil real aporta más que afirmar conformidad por reglas CSS generales.

## 5. Prioridades antes de escribir JSX

- **P0 integridad:** contrato PendingWritePanel, reintento de mismo comando, respaldo recuperable.
- **P1 experiencia:** modelo de navegación, catálogo/inventario/caja por dueño, historia canónica, teclado/foco.
- **P2 diseño:** consistencia de materiales/espaciado, cards/listas, jerarquía visual, densidad de información.

Se acepta la función probada del núcleo #10; los hallazgos aquí no autorizan «arreglar» servicios que funcionan mediante refactor de UI.
