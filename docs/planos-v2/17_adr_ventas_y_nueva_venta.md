# 17 — ADR: Ventas es un área; «+» es la acción central Nueva venta

**Decisión de producto aprobada expresamente por el usuario:** 21/10/2026. **Estado:** arquitectura de navegación aprobada **en concepto**; diseño exacto y ejecución siguen pendientes de pruebas y autorización de implementación. **No se cambió la PWA.**

## 1. Decisión y motivo

El usuario señaló que la pestaña **Ventas no debe equivaler a «Nueva venta»**. Es el **área de ventas**, con historial, detalles, futuras correcciones, fiados y abonos. La acción de registrar una venta es el motivo más frecuente de uso de la aplicación y merece un acceso global persistente, inmediato y prominente.

**Barra inferior propuesta, de izquierda a derecha:**

~~~text
┌────────────────────────────────────────────────────┐
│  Inicio     Ventas       (+)     Productos Reportes │
│                        Nueva venta                 │
└────────────────────────────────────────────────────┘
~~~

**Nota posterior 21/10/2026:** el usuario propuso revisar esta disposición literal para disponer **tres destinos directos + (+) + Más**, con encabezado sticky. **Se mantiene aprobada** la separación **Ventas=gestión** y **+=Nueva venta**; **la identidad de los tres destinos y la inclusión de Más siguen pendientes**. Ver [20 — Observaciones](20_observaciones_prueba_usuario.md) y [21 — Hipótesis de shell](21_hipotesis_shell_mas_header.md). La frase/diagrama del dock aquí documentan la versión anterior, no la arquitectura final.

La forma exacta, relieve, color, texto accesible, safe areas y respuesta al teclado se ajustarán con pruebas.

**Contabilidad de destinos:** cuatro secciones estables (Inicio, Ventas, Productos, Reportes) **y una acción central distinta** (+). No son cinco pestañas; **Caja** y **Configuración** siguen como áreas contextuales. El botón «+» no selecciona una categoría ni tiene un contenido de sección propio: **abre/retoma un flujo de venta dentro del dominio Ventas**.

## 2. Modelo conceptual actualizado

~~~mermaid
flowchart TB
  M["Mora Vinería · Dock inferior"]
  M --> I["Inicio · resumen"]
  M --> V["Ventas · gestión/historial"]
  M --> A["(+) Nueva venta · acción"]
  M --> P["Productos · catálogo/inventario/reposición"]
  M --> R["Reportes · análisis"]
  V --> H["Historial y detalle"]
  H --> C["Correcciones auditadas · futura"]
  V --> F["Fiados y abonos · futuro"]
  A --> S["Selector / favoritos / búsqueda"]
  S --> E["Carrito opcional"]
  S --> CO["Cobro directo"]
  E --> CO
  CO --> X["Confirmación local"]
  X --> H
  A -. "Pertenece al dominio" .-> V
~~~

Las subpantallas operativas siguen siendo `ventas.nueva.selector`, `ventas.nueva.carrito`, `ventas.nueva.cobro`, `ventas.nueva.confirmacion`; **Ventas por pestaña** abre `ventas.inicio` (historial/gestión, no selector). Los nombres son conceptuales, no URLs ni cambios ya hechos en código.

## 3. Comportamiento acordado y precisiones necesarias

| Interacción | Resultado del plano | Restricción |
| --- | --- | --- |
| Pulsar **Ventas** | Abrir el área Ventas: historial, consulta, acceso a detalle, futuras correcciones y deudas. Si aún no hay ventas, estado vacío claro | **No** inicia ni guarda una nueva venta |
| Pulsar **+** sin venta en curso | Iniciar borrador y abrir el selector para agregar productos | No crear registros de venta hasta confirmar Cobro |
| Pulsar **+** con borrador existente | Retomar **ese** borrador, conservando líneas, cantidades e importes | No crear otro borrador ni sobrescribir uno sin aviso |
| Pulsar **+** durante Cobro | Permanecer/volver a la venta existente con su contexto, según comportamiento seguro definido en pruebas | No resetear dinero recibido ni duplicar |
| Pulsar **+** con `writeIntent` o venta preparada pendiente | Mostrar ruta de reintento/edición segura del mismo comando | No iniciar otra operación incompatible ni saltar la confirmación |
| Cambiar de Nueva venta a **Ventas** | Mostrar historial/gestión con venta en curso retenida localmente; posible indicación «Venta en preparación» | No eliminar borrador ni marcar como cobrada |
| Terminar una venta | Confirmación, opción próxima nueva venta; Ventas la lista en historial | El registro no se duplica al pulsar + después |
| Abrir desde Reportes un detalle de venta | Ventas > Detalle, Volver devuelve a período de Reportes | Sin historial duplicado en Reportes |

**No confundir «Ventas» con «Caja».** Ventas es registro comercial y corrección de operaciones; Caja gestiona dinero físico/cuentas/gastos/aportes. Un fiado registra venta sin efectivo, y un abono registra cobro sin crear nueva venta.

## 4. Por qué no contradice necesariamente las guías UX

La regla de que las pestañas representan destinos **sigue aplicando a las cuatro secciones**. La propuesta añade **un control de acción de máxima frecuencia**, visualmente integrado pero **semánticamente distinto**.

- [Apple HIG — Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars): la barra de pestañas navega entre áreas y no debería usar una pestaña como comando. **Conclusión para Mora:** + no se modela como pestaña, ni adquiere `aria-current` de sección.
- [Android Developers — Layouts and navigation patterns](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns): describe FAB prominente para la acción más importante, con una sola acción de ese rango. **Conclusión:** + es principal y único, no «Menú de acciones» ambiguo.
- [Android Developers — App bars](https://developer.android.com/develop/ui/compose/components/app-bars): permite barras inferiores que combinan navegación central y acciones principales, entre ellas un FAB contenido. **Conclusión:** el patrón compuesto tiene precedentes; no implica copiar implementación Jetpack Compose a React.

Las guías no son una certificación de que este orden sea automáticamente óptimo: se probará en móvil real, con foco, lector de pantalla, teclado y estados críticos. La decisión es del producto; la investigación ayuda a ejecutarla sin introducir ambigüedad.

## 5. Requisitos concretos del control (+)

1. **Un solo botón global prominente** con símbolo + y nombre accesible «Nueva venta». Considerar texto «Nueva venta» visible bajo el icono o tooltip/etiqueta asociada si no cabe; nunca depender del dibujo + como único texto accesible.
2. **Separación semántica y visual:** cuatro destinos con indicación de sección activa; + como botón de acción sin estado «pestaña seleccionada» ni `aria-current`. Si una venta está abierta, la sección propietaria es Ventas, pero + no se convierte en quinta tab.
3. **Orden táctil y de teclado:** posición visual y tabulación deben ser coherentes; no usar `tabIndex` positivos ni dos landmarks de navegación duplicados sin motivo. Validar el DOM diseñado para cuatro destinos y acción.
4. **Tamaño y separación:** objetivo propio al menos 48×48 px para +, preferentemente 52–60 px si cabe sin comprimir las cuatro etiquetas; evaluar desde 320/360 hasta 430 CSS px, safe area iOS y foco visible. [WCAG 2.2 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) marca 24×24 CSS px AA con excepciones, **no** 48 obligatorio.
5. **No obstaculizar:** el dock, el centro elevado si lo hay, la barra Cobrar y el teclado no pueden tapar resultados de búsqueda, campos o mensajes de error. Ver [WCAG 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum).
6. **Sin doble CTA competitivo:** la referencia oficial de Inicio muestra «Nueva venta» grande; este nuevo requerimiento **reemplaza su rol como único CTA dominante de Inicio**. Puede existir atajo contextual en estado vacío si aporta encontrabilidad, pero no dos botones fucsias que compitan por jerarquía en pantalla normal.
7. **Sin menú desplegable desde +:** no ofrecer «Nueva venta / gasto / pedido / conteo» desde el botón central. El símbolo representa **solo Nueva venta**, como pidió el usuario.
8. **Sin bloqueo arbitrario por falta de internet:** permanece disponible offline bajo las mismas garantías de Dexie; si hay operación preparada o confirmación crítica, conduce a recuperación segura.

## 6. Ventas como pantalla de gestión

**Pantalla canónica:** `ventas.inicio`, título «Ventas», lista de historial como contenido predominante, filtros útiles, resumen breve si es relevante y vínculo a una venta/detalle. Correcciones y fiados se incorporarán después como subpantallas de esta área; **no** mostrar botones funcionales que todavía no existen.

- **Con ventas:** historial reciente, importe, fecha de carga (jornada internamente), cobro registrado si procede, detalle al tocar. Sin perder contexto al regresar.
- **Sin ventas:** estado «Todavía no registraste ventas», puede indicar «Usá + para registrar una venta». No obliga a pasar por Inicio ni por Reportes.
- **Con borrador:** indicación discreta «Venta en preparación» al volver al área, que reabre el mismo flujo; el + también retoma.
- **Con operación sellada:** estado de recuperación global prevalece y dirige al mismo comando. No se permite crear una venta nueva mientras el estado sea incompatible.
- **Correcciones y fiados futuros:** sin ejecutar sobre el journal hasta que exista diseño de dominio, backup compatible y pruebas.

## 7. Pruebas específicas antes de pasar a código

| ID | Situación | Resultado exigido |
| --- | --- | --- |
| NAV+-01 | Tocar **Ventas** desde Inicio | Historial/gestión, **no** selector de productos |
| NAV+-02 | Tocar **+** desde cualquier área | Nueva venta abre selector, no una quinta pestaña |
| NAV+-03 | Hacer borrador con 2 productos; navegar a Reportes; tocar + | Recupera mismas líneas y cantidades |
| NAV+-04 | Durante Cobro tocar + | Conserva flujo y recibido; sin nueva venta/doble escritura |
| NAV+-05 | Operación preparada sin confirmar; tocar + | Muestra reintento del mismo comando, sin reemplazarlo |
| NAV+-06 | Ventas sin historial | Estado vacío y acceso «Usá +» entendible |
| NAV+-07 | 320/360/390/430 px, teclado y safe area | Cuatro rótulos legibles y + accesible, sin solapamientos |
| NAV+-08 | Tabulador/lector de pantalla | Lee «Nueva venta» como **botón**, destinos con estado actual, orden lógico |
| NAV+-09 | Ventas > Detalle desde Reportes y Volver | Retoma Reportes con período anterior |
| NAV+-10 | Borrador offline + reinicio/actualización PWA | Continúa una sola venta, sin perder stock ni datos |
| NAV+-11 | Guardar venta y luego pulsar + | Inicia **nueva** venta tras finalización, no repite anterior |
| NAV+-12 | + cuando hay un diálogo crítico abierto | No intercepta foco del diálogo ni permite escritura incompatible |

**Fase actual:** este documento actualiza la arquitectura aprobada **sólo a nivel de diseño y documentación**. La pestaña Ventas todavía abre Nueva venta en `master` hasta una PR de implementación autorizada. No fusionar PR #12 como si esto ya estuviera en producción.

## 8. Registro de cambio / precedencia

- **Sustituye** las frases anteriores en planos 01–16 que atribuían a la pestaña Ventas el acceso directo al selector o exigían «Nueva venta» como CTA dominante de Inicio.
- **Conserva** exactamente cuatro destinos principales, el carácter opcional del carrito, el funcionamiento offline local, los controles por operación, FIFO y backup JSON.
- **No decide todavía:** diámetro/estilo final del botón, si sobresale por encima del dock, animación de pulsación, comportamiento preciso de teclado en cada OS ni microcopy del resumen de Ventas.
- **Quién decidió:** usuario del proyecto; solicitado como ajuste explícito tras la auditoría estructural.
