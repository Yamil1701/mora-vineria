# 10 — Contrato de navegación y modelo de estado por áreas

**Propuesta 0.1 — 21/10/2026. Estado:** especificación para revisión; **no código autorizado**. Deriva de 06_auditoria_verificada.md y la investigación en 07/08. Verificar primero con árbol de tareas reales (09), luego con prototipo navegable.

## 1. Diagnóstico que motiva el contrato

En \`master\` tras PR #11 (\`90264e5\`), \`src/App.tsx\` usa \`tab\`, \`stage\`, \`movementsOpen\`, \`backupOpen\`, \`detailId\`, \`modal\`, filtros compartidos y varios estados locales que describen destinos. \`navigate()\` borra búsqueda/categoría/filtro y etapa indiscriminadamente. Esto no implica pérdida del \`Draft\` Dexie, pero sí puede perderse contexto de consulta y se vuelve difícil razonar sobre cuál es el destino actual y adónde debe regresar el usuario.

[Apple HIG, tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) distingue navegación de primer nivel de acciones y recomienda mantener estado de navegación por sección. [React, choosing state structure](https://react.dev/learn/choosing-the-state-structure) aconseja evitar estados redundantes o contradictorios. Esas fuentes **no ordenan una arquitectura concreta**; esta es la adaptación propuesta a Mora.

## 2. Dos jerarquías explícitas: producto y sesión

**Destinos superiores permitidos** (\`MainTab\`): \`inicio\`, \`ventas\`, \`productos\`, \`reportes\`. Orden fijo aprobado.

**Áreas contextuales** (\`ContextArea\`): \`caja\`, \`configuracion\`. Existen como pantallas de primer nivel visual con botón de regreso, pero **no** como quinta/sexta tab inferior; tienen punto de entrada estable que debe validarse. Estas áreas pueden contener una navegación secundaria (Caja: Resumen / Movimientos / Cuentas), sin alterar la barra global.

**Pantallas de flujo** (\`Screen\`): selección de venta, carrito, cobro, historial, detalle, corrección; catálogo, ficha, inventario, conteo, reposición, pedido, recepción; dashboard/reportes; datos, backup, restauración. Una pantalla tiene **un padre canónico** según documento 02 y **puede recibir enlaces contextuales** desde otras áreas.

**Acción/modal** (\`Overlay\`): intervención breve contextual sin sustituir destino principal. No usar modal para flujo largo con varios pasos y estados críticos sólo para ahorrar navegación. Un formulario que ocupe la mayor parte de móvil puede ser pantalla secundaria.

## 3. Modelo conceptual discriminado — ilustrativo, no API definitiva

~~~ts
type MainTab = "inicio" | "ventas" | "productos" | "reportes";

type ScreenId =
  | "inicio.resumen"
  | "ventas.selector" | "ventas.carrito" | "ventas.cobro"
  | "ventas.historial" | "ventas.detalle"
  | "productos.catalogo" | "productos.ficha"
  | "productos.inventario" | "productos.conteo"
  | "productos.reposicion" | "productos.pedido" | "productos.recepcion"
  | "reportes.resumen"
  | "caja.resumen" | "caja.movimientos" | "caja.cuentas"
  | "configuracion.inicio" | "configuracion.datos"
  | "configuracion.respaldo" | "configuracion.restaurar";

// Los IDs son semánticos; no implican URLs HTTP ni funcionalidades ejecutables.
type Route =
  | { screen: "inicio.resumen" }
  | { screen: "ventas.selector" | "ventas.carrito" | "ventas.cobro" | "ventas.historial" }
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
- Las rutas sólo pueden existir si la funcionalidad está disponible. Por ejemplo, \`ventas.detalle\` existe, \`productos.pedido\` es futuro.
- \`lastMainTabRoute\` tiene restricciones por área: una ruta de Caja no debe quedar dentro del stack de Ventas; el tipo refinado real debe impedirlo o el reducer validarlo.
- \`backStack\` no debe crecer indefinidamente; definir navegación de regreso explícita y considerar \`history.back()\` del navegador **sólo** cuando se diseñen deep links y comportamiento PWA.
- \`overlay\` es UI efímera; no guarda \`writeIntent\`, pago, cantidad ni comando.
- IDs de entidad deben existir y verificarse contra snapshot: enlace a entidad desactivada/sin registro presenta estado explicativo, no pantalla en blanco.

## 4. Cinco operaciones de navegación con resultados deterministas

| Evento | Qué cambia | Qué NO cambia |
| --- | --- | --- |
| \`SELECT_MAIN_TAB\` | Tab activa, ruta que se recuerda de esa tab o raíz según política validada | \`Draft\` durable, registros, filtros de otras tabs, writeIntent |
| \`OPEN_CHILD\` | Agrega origen al retorno y abre detalle/hijo | Datos de pantalla padre; operación aún no confirmada |
| \`OPEN_CONTEXTUAL\` | Abre Caja/Configuración desde fuente inequívoca y recuerda origen | No crea una «tab activa» ficticia llamada caja; no registra nada |
| \`BACK\` | Regresa al contexto de origen, o a padre estable cuando no hay origen | Borrador y operaciones confirmadas |
| \`COMPLETE_OPERATION\` | Presenta resultado, libera contexto sólo tras confirmación/ack aplicable | No duplica comando ni resetea otros módulos |

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
| Ventas → Carrito → Cobro | Volver a Carrito/Selector según punto de origen; datos del borrador intactos; confirmación no se duplica |
| Ventas → Historial → Detalle | Volver a Historial con búsqueda/período/scroll cuando resulte útil |
| Productos → Catálogo filtrado → Ficha | Volver a catálogo con mismos filtros y posición |
| Inicio → Caja → Gasto | Volver a Movimientos; después cerrar operación lleva a su historial, no fuerza Inicio |
| Reportes → Ver venta → Ventas/Detalle | Volver al reporte y período consultado |
| Configuración → Restaurar → seleccionar archivo | Cancelar antes de confirmar no escribe ni borra datos |
| Interrupción al escribir operación durable | Guardar/restaurar vía servicio, no por stack; \`BACK\` y tabs no permiten iniciar otro comando incompatible |
| Reload del navegador | El destino UI puede volver a Inicio si aún no soporta deep-link; **recuperar** borrador/writeIntent del servicio antes de habilitar escrituras |

El botón de retroceso del sistema Android/Safari se evalúa expresamente, sin asumir que la PWA dispone de un router externo. El comportamiento de \`window.history\` requiere contrato propio si se usa; evitar navegación que salte inesperadamente fuera de la PWA por ausencia de historial interno.

## 6. Máquina de estados de navegación de una venta

~~~mermaid
stateDiagram-v2
  [*] --> Selector
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
  Selector --> Historial: Consultar
  Historial --> Detalle: Abrir venta
  Detalle --> Historial: Volver
~~~

**Protección:** una venta \`Preparada\` no se reinicia como borrador nuevo por tocar Ventas o Inicio; se retoma según el estado durable. La nueva navegación debe consultar \`LocalService\` antes de decidir su acción.

## 7. Protocolo de diseño y pruebas de navegación

1. Probar el árbol sin UI con tareas T1–T12 de documento 09. No publicar «aprobado» sin participantes reales.
2. Prototipar el modelo de regreso con datos sintéticos: Productos con filtro, ficha, Reportes, detalle venta, Caja/Configuración.
3. Testear viajes ida/vuelta para cada atajo, incluido acceso a backup y edición.
4. Probar recarga/actualización offline con borrador y \`writeIntent\` preparado; no permitir «otra venta» hasta resolver la anterior.
5. Probar foco y teclado virtual: W3C [SC 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum), [SC 2.4.3](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html).
6. Reportar excepciones que requieran restablecer filtro (por ejemplo, acción explícita «Nueva búsqueda»).

**Definición de listo:** cada destino tiene ID, padre, entradas, retorno, estados permitidos, protección de datos y tests; ningún botón «Volver» improvisa \`navigate('inicio')\` para escapar de una pantalla mal ubicada.

## 8. Puentes a arquitectura actual sin tocar datos

- \`AppShell\`, \`BottomNav\`, \`LocalService\`, \`liveQuery(snapshot)\` y formularios recuperables se reutilizan.
- Primero encapsular navegación en una máquina/reducer probado, sin pantalla nueva ni librerías.
- Luego extraer pantallas por ámbito, una por PR o bloque coherente, sin mover registros.
- Por último reubicar accesos, conservando historial de ventas, stock y caja proyectado desde mismo servicio.
- **No** desmantelar la confirmación global hasta demostrar otro lugar igualmente visible/seguro para cualquier \`writeIntent\` pendiente.

Este documento es **un plano sujeto a prueba**, no garantía de que el usuario ya aprobó todas las decisiones del árbol.
