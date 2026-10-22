# 10 — Contrato de navegación y modelo de estado por áreas

**Propuesta 0.1 — 21/10/2026. Estado:** especificación para revisión; **no código autorizado**. Deriva de 06_auditoria_verificada.md y la investigación en 07/08. Verificar primero con árbol de tareas reales (09), luego con prototipo navegable.

> **Decisión posterior (21/10/2026), de aplicación preferente:** el usuario confirmó que tocar el destino global **«Más»** siempre abre **su directorio raíz**, nunca la última subpantalla visitada. Se diferencia del control **Volver**, que respeta la navegación contextual. Ver [21 — Shell/Más/Header](21_hipotesis_shell_mas_header.md). **El modelo de tabs anterior de este documento sigue pendiente de reconciliación integral con la variante Inicio · Ventas · (+ Nueva venta) · Caja · Más; no copiar el tipo `MainTab` anterior a implementación.** Se preservan borrador, operaciones selladas y datos locales.

## Decisiones confirmadas de navegación (21/10/2026) — prevalecen sobre la versión 0.1

**Aprobado expresamente por el usuario para los planos**, sin autorización para implementar ni declarar validación visual final:

1. **Destino activo:** señalar el destino global del **área de la pantalla actual**; Caja/Movimientos → Caja, Productos/Inventario/Reposición/Reportes/Configuración → Más, historial/detalle de ventas → Ventas. «+ Nueva venta» es acción, nunca tab seleccionada. Los destinos concretos de la variante **Inicio · Ventas · (+ Nueva venta) · Caja · Más** siguen como propuesta principal que deberá pasar prueba visual y de recorridos.
2. **«Más» siempre raíz:** tocar «Más» en el dock abre el **directorio principal** aunque se esté en una de sus hijas. No restaurar automáticamente la última hija. Productos, Inventario y Reposición tienen **tres accesos directos distintos**, compartiendo un único dueño funcional del negocio.
3. **Volver según origen:** un botón Volver en una subpantalla regresa al padre/origen real. Ejemplos: Más → Inventario → Producto → Volver a Inventario; Más → Inventario → Volver a Más; Inicio → alerta → Inventario → Volver a Inicio; Reportes → venta → Volver a Reportes con período previo. Preservar filtros/scroll cuando sea viable y no contravenga una operación sellada.
4. **Venta en pantalla concentrada (opción B aprobada):** al iniciar/retomar con «+», **ocultar dock global durante Selector, Carrito, Cobro y confirmación sensible**. Mantener cabecera compacta «Mora.» y regreso interno seguro. Selector → Volver a sección de procedencia conservando borrador; Carrito → Selector; Cobro → Carrito o Selector según origen. Si existe `writeIntent` preparado/pendiente, mantener su ID y el control de recuperación en vez de navegar hacia una nueva venta incompatible. Confirmada una venta, no repetir el cobro con «+».
5. **Contexto protegido:** el cambio de destino no elimina `Draft`, `writeIntent`, comandos, historial ni registros de Dexie; no descarta silenciosamente entradas editadas sin guardar. No confundir «Volver» con «Cancelar venta».
6. **Header aprobado en estructura:** una franja global superior **«Mora.»** con pocos accesos secundarios y **una franja contextual debajo**, ambas dentro del mismo header. **Ubicación propuesta, por confirmar visualmente:** control Volver estándar en el **extremo izquierdo de la franja contextual**, misma iconografía y área táctil (objetivo 44–48 CSS px), texto visible «Volver» cuando haya espacio y nombre accesible contextual (p. ej. «Volver a Inventario»). No se muestra un Volver sin destino en las raíces Inicio, Ventas, Caja o Más; el encabezado conserva alineación. En flujos concentrados, esta ubicación permanece disponible salvo bloqueo temporal seguro de operación crítica.
7. **PWA/navegador:** probar retroceso físico/gesto y `history` sin asumir que el comportamiento existe ya; no debe abandonar la PWA accidentalmente ni provocar efectos duplicados. No agregar enrutador/librería nueva solo para el dibujo.

**Precedencia:** el `MainTab` de cuatro destinos, los enums y las operaciones del ejemplo TypeScript más abajo son **material histórico ilustrativo anterior a estas decisiones** y **no deben implementarse literalmente**. Falta reconciliar modelo, selección activa, retornos e historial de navegador con el nuevo árbol antes de la PR de shell.

## 1. Diagnóstico que motiva el contrato

En `master` tras PR #11 (`90264e5`), `src/App.tsx` usa `tab`, `stage`, `movementsOpen`, `backupOpen`, `detailId`, `modal`, filtros compartidos y varios estados locales que describen destinos. `navigate()` borra búsqueda/categoría/filtro y etapa indiscriminadamente. Esto no implica pérdida del `Draft` Dexie, pero sí puede perderse contexto de consulta y se vuelve difícil razonar sobre cuál es el destino actual y adónde debe regresar el usuario.

[Apple HIG, tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) distingue navegación de primer nivel de acciones y recomienda mantener estado de navegación por sección. [React, choosing state structure](https://react.dev/learn/choosing-the-state-structure) aconseja evitar estados redundantes o contradictorios. Esas fuentes **no ordenan una arquitectura concreta**; esta es la adaptación propuesta a Mora.

## 2. Dos jerarquías explícitas: producto y sesión

**Antecedente supersedido por las decisiones del 21/10/2026:** el modelo original proponía `inicio`, `ventas`, `productos`, `reportes`, con (+ Nueva venta) como acción. **No utilizar este orden como navegación vigente**; la variante en evaluación ahora es Inicio · Ventas · (+ Nueva venta) · Caja · Más, y Ventas sigue abriendo historial/gestión. Ver decisiones de precedencia arriba y ADR 17.

**Antecedente de áreas contextuales:** antes Caja y Configuración estaban fuera del dock. **Caja ahora se prioriza como destino global en la variante B**, mientras Configuración continúa dentro de Más; ese cambio requiere actualizar los tipos y flujos ilustrativos siguientes.  Estas áreas pueden contener una navegación secundaria (Caja: Resumen / Movimientos / Cuentas), sin alterar la barra global.

**Pantallas de flujo** (`Screen`): selección de venta, carrito, cobro, historial, detalle, corrección; catálogo, ficha, inventario, conteo, reposición, pedido, recepción; dashboard/reportes; datos, backup, restauración. Una pantalla tiene **un padre canónico** según documento 02 y **puede recibir enlaces contextuales** desde otras áreas.

**Acción/modal** (`Overlay`): intervención breve contextual sin sustituir destino principal. No usar modal para flujo largo con varios pasos y estados críticos sólo para ahorrar navegación. Un formulario que ocupe la mayor parte de móvil puede ser pantalla secundaria.

## 3. Modelo conceptual discriminado — ilustrativo, no API definitiva

~~~ts
type MainTab = "inicio" | "ventas" | "productos" | "reportes";

type ScreenId =
  | "inicio.resumen"
  | "ventas.inicio" | "ventas.historial" | "ventas.detalle"
  | "ventas.nueva.selector" | "ventas.nueva.carrito" | "ventas.nueva.cobro" | "ventas.nueva.confirmacion"
  | "productos.catalogo" | "productos.ficha"
  | "productos.inventario" | "productos.conteo"
  | "productos.reposicion" | "productos.pedido" | "productos.recepcion"
  | "reportes.resumen"
  | "caja.resumen" | "caja.movimientos" | "caja.cuentas"
  | "configuracion.inicio" | "configuracion.datos"
  | "configuracion.respaldo" | "configuracion.restaurar";

// Los IDs son semánticos; no implican URLs HTTP ni funcionalidades ejecutables.
// «+» es comando, NO ruta ni pestaña.
type GlobalAction = 'nueva_venta';
type Route =
  | { screen: "inicio.resumen" }
  | { screen: "ventas.inicio" | "ventas.historial" | "ventas.nueva.selector" | "ventas.nueva.carrito" | "ventas.nueva.cobro" | "ventas.nueva.confirmacion" }
  | { screen: "ventas.detalle"; saleId: string }
  | { screen: "productos.catalogo" | "productos.inventario" | "productos.reposicion" }
  | { screen: "productos.ficha" | "productos.conteo" | "productos.recepcion"; productId: string }
  | { screen: "productos.pedido"; orderId?: string }
  | { screen: "reportes.resumen"; period?: "Hoy" | "Semana" | "Mes" }
  | { screen: "caja.resumen" | "caja.movimientos" | "caja.cuentas" }
  | { screen: "configuracion.inicio" | "configuracion.datos" |
              "configuracion.respaldo" | "configuracion.restaurar" };

type NavigationState = {
  activeMainTab: MainTab;
  current: Route;
  // Se recuerda posición por pestaña, no se reutiliza un estado global de filtros.
  lastMainTabRoute: Record<MainTab, Route>;
  backStack: Array<{ route: Route; origin: "tab" | "contextual" }>;
  overlay: null | { kind: "confirm" | "help" | "error"; owner: ScreenId };
};
~~~

La estructura anterior sirve para discutir invariantes, no debe copiarse sin evaluar:
- Las rutas sólo pueden existir si la funcionalidad está disponible. Por ejemplo, `ventas.detalle` existe, `productos.pedido` es futuro. `ventas.inicio` deberá implementarse como nueva portada de historial, pero su servicio/lista de historial ya existe.
- `lastMainTabRoute` tiene restricciones por área: una ruta de Caja no debe quedar dentro del stack de Ventas; el tipo refinado real debe impedirlo o el reducer validarlo.
- `backStack` no debe crecer indefinidamente; definir navegación de regreso explícita y considerar `history.back()` del navegador **sólo** cuando se diseñen deep links y comportamiento PWA.
- `overlay` es UI efímera; no guarda `writeIntent`, pago, cantidad ni comando.
- IDs de entidad deben existir y verificarse contra snapshot: enlace a entidad desactivada/sin registro presenta estado explicativo, no pantalla en blanco.

## 4. Cinco operaciones de navegación con resultados deterministas

| Evento | Qué cambia | Qué NO cambia |
| --- | --- | --- |
| `SELECT_MAIN_TAB` | Tab activa; **Ventas abre `ventas.inicio` (historial/gestión)**, las otras rutas según política de contexto | `Draft` durable, registros, filtros de otras tabs, writeIntent |
| `START_OR_RESUME_SALE` (botón **+**) | Abre `ventas.nueva.selector` o retoma flujo existente; si hay operación preparada, conduce a recuperación del mismo ID | No agrega quinta tab ni crea segundo borrador/writeIntent |
| `OPEN_CHILD` | Agrega origen al retorno y abre detalle/hijo | Datos de pantalla padre; operación aún no confirmada |
| `OPEN_CONTEXTUAL` | Abre Caja/Configuración desde fuente inequívoca y recuerda origen | No crea una «tab activa» ficticia llamada caja; no registra nada |
| `BACK` | Regresa al contexto de origen, o a padre estable cuando no hay origen | Borrador y operaciones confirmadas |
| `COMPLETE_OPERATION` | Presenta resultado, libera contexto sólo tras confirmación/ack aplicable | No duplica comando ni resetea otros módulos |

**Regla anti-regresión:** ir de un filtro de Productos a un reporte y volver debe preservar el filtro, salvo que la persona explícitamente lo cambió o salió del flujo con una acción de reinicio inequívoca.

**Matiz importante:** conservar absolutamente todo *siempre* también puede ser peligroso; un cobro de una venta antigua no debe reaparecer como un cobro nuevo. Identificar estado por naturaleza:
- **Persistente en IndexedDB:** venta borrador/confirmación sellada, producto, stock, operación, metadata, backup.
- **De sesión por pestaña:** búsqueda, categoría, orden, filtro, producto consultado, período reportes.
- **Efímero al salir:** diálogo de ayuda, hint, error visual temporal, foco, teclado; confirmar que no hay datos no guardados.
- **Derivado:** total de venta, costo FIFO, stock, alertas e indicadores; nunca copiarlos a estado independiente sin motivo.

## 5. Contrato del botón Volver y del cambio de pestaña

| Escenario | Comportamiento propuesto |
| --- | --- |
| Inicio → Para reponer → Productos | Entra a faltantes o Reposición con filtro relevante; Volver devuelve a Inicio si se entró contextualmente, no deja «pantalla anterior» escondida |
| **+** → Selector → Carrito → Cobro | Volver a Carrito/Selector según punto de origen; datos del borrador intactos; Ventas abre el área de gestión |
| **Ventas** → Historial/gestión → Detalle | Volver a Historial con búsqueda/período/scroll cuando resulte útil |
| Productos → Catálogo filtrado → Ficha | Volver a catálogo con mismos filtros y posición |
| Inicio → Caja → Gasto | Volver a Movimientos; después cerrar operación lleva a su historial, no fuerza Inicio |
| Reportes → Ver venta → Ventas/Detalle | Volver al reporte y período consultado |
| Configuración → Restaurar → seleccionar archivo | Cancelar antes de confirmar no escribe ni borra datos |
| Interrupción al escribir operación durable | Guardar/restaurar vía servicio, no por stack; `BACK` y tabs no permiten iniciar otro comando incompatible |
| Reload del navegador | El destino UI puede volver a Inicio si aún no soporta deep-link; **recuperar** borrador/writeIntent del servicio antes de habilitar escrituras |

El botón de retroceso del sistema Android/Safari se evalúa expresamente, sin asumir que la PWA dispone de un router externo. El comportamiento de `window.history` requiere contrato propio si se usa; evitar navegación que salte inesperadamente fuera de la PWA por ausencia de historial interno.

## 6. Máquina de estados de navegación de una venta

~~~mermaid
stateDiagram-v2
  [*] --> AreaVentas
  AreaVentas --> Selector: + Nueva venta
  Selector --> Carrito: Ver carrito
  Carrito --> Selector: Agregar más
  Selector --> Cobro: Cobrar directo
  Carrito --> Cobro: Continuar
  Cobro --> Carrito: Revisar líneas
  Cobro --> Preparada: Sellar
  Preparada --> Confirmada: Commit local
  Preparada --> Preparada: Falla; reintentar mismo ID
  Confirmada --> NuevaVenta: Iniciar venta
  NuevaVenta --> Selector
  AreaVentas --> Historial: Consultar historial
  Selector --> Historial: Volver a Ventas
  Historial --> Detalle: Abrir venta
  Detalle --> Historial: Volver
~~~

**Protección:** una venta `Preparada` no se reinicia como borrador nuevo por tocar Ventas o Inicio; se retoma según el estado durable. La nueva navegación debe consultar `LocalService` antes de decidir su acción.

**Control central +:** nombre accesible «Nueva venta» como botón, separarlo de las cuatro secciones; foco/tabulación en orden visual, sin `aria-current` ni `aria-pressed` de pestaña. Ver [ADR 17](17_adr_ventas_y_nueva_venta.md), NAV+-01 a NAV+-12.

## 7. Protocolo de diseño y pruebas de navegación

1. Probar el árbol sin UI con tareas T1–T12 de documento 09. No publicar «aprobado» sin participantes reales.
2. Prototipar el modelo de regreso con datos sintéticos: Productos con filtro, ficha, Reportes, detalle venta, Caja/Configuración.
3. Testear viajes ida/vuelta para cada atajo, incluido acceso a backup y edición.
4. Probar recarga/actualización offline con borrador y `writeIntent` preparado; no permitir «otra venta» hasta resolver la anterior.
5. Probar foco y teclado virtual: W3C [SC 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum), [SC 2.4.3](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html).
6. Reportar excepciones que requieran restablecer filtro (por ejemplo, acción explícita «Nueva búsqueda»).

**Definición de listo:** cada destino tiene ID, padre, entradas, retorno, estados permitidos, protección de datos y tests; ningún botón «Volver» improvisa `navigate('inicio')` para escapar de una pantalla mal ubicada.

## 8. Puentes a arquitectura actual sin tocar datos

- `AppShell`, `BottomNav`, `LocalService`, `liveQuery(snapshot)` y formularios recuperables se reutilizan.
- Primero encapsular navegación en una máquina/reducer probado, sin pantalla nueva ni librerías.
- Luego extraer pantallas por ámbito, una por PR o bloque coherente, sin mover registros.
- Por último reubicar accesos, conservando historial de ventas, stock y caja proyectado desde mismo servicio.
- **No** desmantelar la confirmación global hasta demostrar otro lugar igualmente visible/seguro para cualquier `writeIntent` pendiente.

Este documento es **un plano sujeto a prueba**, no garantía de que el usuario ya aprobó todas las decisiones del árbol.
