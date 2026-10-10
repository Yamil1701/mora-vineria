# Interfaz única conectada al núcleo local

Nueva misión posterior a las PR #6 y #7, 10/10/2026. Base: master `3dd101d`. Rama `work/v2-interfaz-integrada`. Desarrollo para revisión: **sin merge, despliegue, Supabase ni importación V1**.

## Auditoría y decisión

`App.tsx` ofrecía la dirección visual de la demo, pero operaba sobre fixtures y carrito en RAM. `LocalApp.tsx` usaba servicios reales, aunque con otro catálogo y otro recorrido, sin la composición de las cinco referencias aprobadas. `main.tsx` seleccionaba entre ambas por `?mode=local`. Esta separación era la causa del problema; cambiar únicamente los colores de LocalApp no lo resolvía.

Se tomó la composición de App como presentación única: fondo fijo, vidrio, iconos, jerarquías, favoritos, categorías, lista, cobro directo, carrito opcional y cuatro destinos. Se reutilizó el enlace de LocalApp a `LocalService`, sus formularios, cola de recibido, borrador CAS y confirmaciones durables. **LocalApp y su CSS alternativo se retiran.** La ruta normal y `?mode=local` abren la misma App y la misma DB. El sitio publicado no cambia por esta rama/PR: su actualización requiere autorización de merge/despliegue.

Fuentes revisadas: AGENTS, handoff, arquitectura 00–07, documentos funcionales y contratos 10/11/12, cinco WebP aprobadas y prototipos de carrito/caja. El diseño histórico UX01/02 no sustituye las imágenes aprobadas.

## Separación de responsabilidades

| Capa | Responsabilidad |
| --- | --- |
| `App.tsx` | Navegación y composición de las pantallas existentes; suscripciones Dexie; envío a servicios, estados verdaderos y cola de efectivo |
| `OperationForms.tsx`, `Dialog.tsx` | Formularios extraídos del modo anterior; diálogo modal nativo, foco, Escape, devolución de foco; historial expandible con snapshots y lotes |
| `projections.ts` | Búsqueda/filtros/orden, stock desde ledger, agregación de ventas y ganancia exacta; no ejecuta FIFO ni efectos de negocio |
| `LocalService` | Se conservan `sealWrite`, `confirmWrite`, `acknowledgeWrite`, `reopenWrite`, `saveDraft`, `checkoutDraft` y transacciones; se agrega únicamente preferencia de favoritos |
| `database.ts` | Mismo namespace, stores/índices de negocio intactos; ampliación aditiva de preferencias |
| `src/ui`, `app.css`, `ProductArt` | Sistema visual existente y ajustes de accesibilidad; arte abstracto como reserva, sin fotografías verificadas ficticias |

No hay otra implementación funcional en paralelo ni datos demo en el bundle de la aplicación. `demo-data`/`demo-state` permanecen como referencias y pruebas históricas en memoria, sin importación desde App. Las pruebas generan su propio catálogo en bases/contextos aislados.

## Contratos de datos y recuperación

- DB **`mora-v2:local-workspace:v1:this-browser`**, sin cambio de nombre, scope ni IDs. Schema **3** agrega `preferences` (`key`, registro `favorites` con UUID de productos). Upgrade modifica únicamente `metadata.schemaVersion`; los demás registros permanecen iguales. Contrato semántico de comandos sigue en versión **1**.
- Favoritos son una preferencia local. Su toggle utiliza `rw` para no perder cambios entre pestañas; no cambia productos, versiones, secuencias, ledger ni outbox. No se promete sincronizar preferencias.
- Producto, stock inicial y recepción continúan sellando el contenido completo **antes** de los efectos. Confirmación pendiente recupera IDs/costos/unidades originales; confirmada se cierra explícitamente. Abrir otra pantalla no cancela ni vuelve a preparar la operación.
- Ventas utilizan el mismo borrador/commandId/saleId/precios/recibido y checkout durable. El carrito opcional modifica ese borrador, no crea otra venta. Un doble toque se bloquea en UI y se deduplica transaccionalmente. Un borrador sellado no admite agregar/vaciar/cambiar unidades hasta reabrirlo con la comprobación existente.
- Efectivo se guarda en cola serial y el checkout/actualización manual de PWA la esperan. Formularios y navegación se bloquean mientras se guarda; un error no aconseja borrar los datos del sitio.
- Confirmar una venta muestra comprobante local; **Nueva venta** abre un nuevo borrador solo después de completar la anterior. Al reiniciar, una venta ya consumida aparece en historial y no reaplica efectos. Una confirmación no aplicada permanece disponible para reintentar.
- Historial ordenado por fecha de registro local, descendente, con desempate por ID; no afirma orden remoto. Nombres y precios cobrados permanecen los snapshots originales.
- No existe migración inversa: una versión vieja que solo conoce schema2 no debe utilizarse sobre schema3. Si fuera necesario volver a publicar código anterior, preparar un lector compatible con schema3; **no borrar ni bajar la versión de la DB**.

## Corrección de alertas de stock — 10/10/2026

Por instrucción expresa del usuario para la PR #8, `src/domain/stock.ts` centraliza una política de lectura comprobable: **stock bajo ≤20 % del objetivo** y **crítico ≤10 %**, por producto. La clasificación crítica también pertenece a «Para reponer». Como las cantidades son enteras, los límites se redondean hacia abajo: objetivo24 → bajo hasta4 / crítico hasta2; 5 y 23 no generan alerta. Para objetivo25 el límite bajo es5 (incluido).

Un objetivo válido es un entero seguro mayor que cero; nulo, cero, negativo o inválido no generan alertas, aun con stock negativo. Las cantidades negativas se muestran sin recortarlas. Inicio, filtro «Solo para reponer», filas e indicadores de Productos/Ventas y el helper histórico de demo comparten esta función. Se conservan las clases y colores aprobados: bajo/crítico comparten el indicador existente, sin un rediseño.

El cálculo no escribe en IndexedDB ni modifica ventas, FIFO, movimientos, lotes o precios. No hay cambio de schema, namespace, IDs, migraciones ni dependencias. El objetivo sigue siendo editable; su diferencia con stock no es por sí sola una alerta.

Pruebas nuevas: límites exactos y fraccionarios, objetivos distintos para la misma cantidad, stock cero/negativo, objetivos nulo/cero/inválidos y enteros grandes. Playwright recorre 23→5→4→2→−1 mediante ventas reales, verifica Inicio→Ver todos→Productos, indicadores/filtro y catálogo de Ventas, recarga y objetivos cero/nulo. Compara lotes, entradas de stock, caja y recepciones antes/después de editar solo el objetivo.

Validación de esta corrección: **93/93 Vitest**, **14/14 casos de arquitectura**, **9/9 Playwright**, TypeScript y compilación correctos. Playwright1.64 se ejecutó localmente con Chromium headless134 obtenido del mirror oficial de Microsoft tras fallar la descarga estándar (ZIP truncado); CI instala su Chromium correspondiente. Plugin Browser no disponible. Se mantienen las comprobaciones previas de 360/390/430px, errores de consola, IndexedDB nativo, FIFO, recarga y recuperación. No se modificaron CSS ni archivos de persistencia/servicio.

## Funciones reales y pendientes

| Pantalla | Utilizable |
| --- | --- |
| Productos | Alta/edición/desactivación, búsqueda/categorías/orden, objetivo manual, favoritos, ficha, apertura de stock antes de movimientos, recepción y pago real, lotes y recepciones registradas |
| Nueva venta | Catálogo real activo, favoritos persistentes, búsqueda/filtro, agregar, total durable y cobro directo; carrito opcional para cantidades/vaciar |
| Cobro | Efectivo recibido opcional, vuelto y guardado transaccional con FIFO, revisión y comprobante local |
| Inicio | Ventas y ganancia de la jornada real, reposición al ≤20 % del objetivo manual de cada producto, revisión pendiente; sin mínimos globales ni saldo supuesto |
| Reportes | Hoy, últimas 7 jornadas (Semana), mes de jornada actual; importes, cobertura FIFO, barras por jornada, más vendidos e historial; movimientos reales como variación, nunca saldo de caja |

Transferencia, mixto, fiado y escaneo: deshabilitados y señalados como pendientes. Conteos/ajustes, conciliación, correcciones y backup aún no están implementados. No hay controles de verificación bancaria ficticios.

Estados visibles: vacío, borrador guardado, guardando, confirmación pendiente, confirmada **localmente**, revisión y error. `navigator.onLine` informa conectividad del navegador, no disponibilidad de un servidor. Siempre se aclara **Sin sincronización**. La outbox permanece `awaiting_backend`; se informa cuántas operaciones están conservadas, sin presentar un emisor que no existe.

Ganancia se calcula desde costos FIFO ya guardados con racionales exactos y redondeo final para mostrar pesos. Si alguna venta del período carece de costo completo, la ganancia total no se calcula; se muestran cobertura y subtotal conocido separado. Compras no descuentan nuevamente ganancia. Se excluyen fechas futuras de los períodos hasta hoy; siguen visibles en el historial completo, pues el reloj local no tiene verificación remota.

## Diferencias respecto de las referencias visuales

Se mantiene la estructura y el CSS de la demo, con fondo fijo, fucsia, vidrio y tipografía editorial. Se adapta contenido al estado real:

- Catálogo vacío inicial, categorías provenientes de productos y favoritos elegidos por la persona, sin marcas/fotos/stock de ejemplo.
- Etiquetas «Local / Sin sincronización» sustituyen «Demo / Sincronizado». Ganancia y métricas no incluyen tendencias inventadas.
- Reportes usan barras de jornadas reales y estado vacío, en lugar del gráfico decorativo de referencia. No se agregan pronósticos, objetivos monetarios o PDF falsos.
- Ficha contextual y formularios toman el estilo existente; «Ver» abre los datos, no finge «Comprobar» físicamente stock.
- Los tres pagos pendientes se ven deshabilitados; no hay selector bancario operativo. El efectivo contiene ayuda breve y una acción de guardar fija sobre la navegación; el detalle puede requerir desplazamiento en 360px con teclado abierto.
- Categorías permanecen disponibles al desplazarse para evitar ocultar el filtro activo; conserva el carrusel horizontal, sin animación adicional.
- Blancos de añadir/stepper de 44px; texto oscuro sobre acciones fucsia para contraste; diálogo accesible y reducción de movimiento. Son ajustes de accesibilidad, no otra identidad.

No se generan nuevos mockups ni imágenes para el producto. Capturas de prueba se escriben en `/tmp`, no son referencias aprobadas nuevas.

## Validación

Comprobaciones locales: **63/63 Vitest**, **14/14 casos de referencia** de arquitectura, TypeScript y build correctos; **8/8 Playwright** sobre build/preview. Revisión de capturas de Inicio, Ventas, Productos, Carrito, Cobro y Reportes en 360/390/430, sin overflow horizontal ni errores JS/console en los recorridos auditados. Caso FIFO: venta14000, costo9000, ganancia5000, stock1.

Runner Playwright1.64 con Chromium headless134 local: la descarga del navegador actual falló en el entorno; se usó el shell obtenido del mirror oficial, sin modificar dependencias. CI instala el Chromium correspondiente al runner. Queda la validación en teléfonos físicos. Build conserva el warning previo de URL absoluta del fondo, cuya imagen se comprobó en navegador. No se realizó auditoría de vulnerabilidades ni conexión remota. Se agregan pruebas de proyecciones, ampliación v2→v3 sobre todas las tablas, favoritos concurrentes y supervivencia de identidades/confirmaciones/borradores. Playwright conserva fallos nativos de IndexedDB, cierre/recarga y reintentos de recepciones; amplía navegación, foco/modal, favoritos, búsqueda/categorías, carrito/directo, doble toque, venta sellada recuperada, upgrade nativo de base previa, shell offline y 360/390/430.

La comprobación de actualización compara **todos los registros** anteriores con los posteriores; únicamente metadata pasa a schema3. El dataset se produce con servicios reales sobre el schema anterior en un contexto sintético, nunca sobre registros del usuario.

## Guía de QA desde celular

La nueva UI no está publicada. Esta guía corresponde a la versión de la rama, una vez autorizada su publicación o servida para QA en un origen seguro. Para pruebas numéricas usar un perfil/navegador de ensayo separado; no borrar ni mezclar fixtures con el perfil que contiene los registros actuales.

1. En el perfil con registros previos, anotar productos, unidades, ventas, recepción pendiente/comprobante y borrador antes de actualizar. Después comprobarlos en la misma URL/origen y perfil; `?mode=local` debe mostrar la misma App. No limpiar datos ni reinstalar el perfil.
2. En el perfil de ensayo: Productos → Agregar producto, precio3500, objetivo24; cerrar comprobante. Ficha → Stock inicial2, costo total4000; después recibir3, costo total7500. Cerrar explícitamente cada confirmación.
3. Marcar favorito y abrir Nueva venta. Buscar/categorizar, agregar, abrir carrito opcional y llevar cantidad a4; cobrar con recibido20000. Deben resultar venta14000, vuelto6000, FIFO9000, ganancia5000 y stock1.
4. Reportes/Historial → expandir venta y verificar los dos lotes. Cerrar/reabrir: mismo registro, sin otra salida de stock/efectivo. Recargar un borrador antes de vender y comprobar cantidades/recibido.
5. Con shell previamente cargado/instalado, activar modo avión, reabrir y registrar una operación de prueba; ver «Sin conexión» y «Sin sincronización». La recepción confirmada debe persistir hasta cerrar comprobante. No crear otra recepción para reemplazar una pendiente.
6. Probar búsqueda, favoritos, filtros, volver de cobro, teclado numérico, giro, zoom200%, lectura y botones a una mano. Pagos/escaneo pendientes deben estar inaccesibles; no debe aparecer saldo real ni «Todo sincronizado».

## Riesgos y siguiente gate

Pendiente validar Safari/iOS y Android físicos, teclado/safe-area, rendimiento con bases grandes y lectores de pantalla reales. Snapshot completo sigue siendo una elección para pequeña base local; no se agrega virtualización ni nuevas dependencias. IndexedDB sigue sin respaldo externo; borrado del perfil/dispositivo no puede recuperarse por esta UI. No se certifica deduplicación multi-dispositivo ni FIFO global.

Revisar esta PR y realizar QA móvil antes de autorizar merge/despliegue. Después avanzar con otra vertical real; Supabase necesita autorización específica y un entorno aislado. Ninguna prueba o función aquí crea conexiones remotas.
