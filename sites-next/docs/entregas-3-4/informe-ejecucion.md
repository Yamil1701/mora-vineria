# Mora · Entregas 3 y 4, ejecución y evidencia

30 de octubre de 2026. Se trabajó sobre la nueva Mora de Sites v26, SHA `bea955a878433b1f94cbb27af6d9388751d9537f`. La publicación v25 permanece fuera de esta ejecución. No se usó la PWA anterior como implementación.

## Resultado funcional

Inventario, fiados, abonos, pagos posteriores de recepción, correcciones auditadas con efectos reales y reportes/metas tienen recorridos utilizables. El núcleo local pasó 19 archivos de pruebas. La aplicación definitiva compartida sigue parcial: no hay integración con Supabase y faltan QA físico, instalación/offline real y PDF/JSON obtenidos como archivos desde un dispositivo.

El estado por los cuatro bloques aprobados y los criterios restantes están en [plan-maestro-actualizado.md](plan-maestro-actualizado.md). Las reglas/entidades están en [contrato-operaciones.md](contrato-operaciones.md). La [matriz de pruebas](matriz-qa.md) distingue dominio, controlador, navegador y límites.

## Punto de partida y preservación

Se leyeron la auditoría integral, resultado de Entregas 1/2, contrato de operaciones, plan maestro y el encargo completo `Texto pegado(3).txt`. Se consultaron contratos funcionales de PR #12 como antecedentes de reglas. No se copiaron sus componentes, CSS ni arquitectura.

Se abrió la fuente de v26 y se ejecutó la línea base: 13 archivos de pruebas aprobados. Se conservó el punto `baseline-v26-entregas34` y un bundle recuperable. Los commits de la fuente de Sites conservan v26 como ancestro; no se reemplaza esa versión guardada. Se contrastó el carrito con capturas v26 conservadas.

## Cambios por etapa y puertas de calidad

| Etapa | Implementación | Evidencia y resultado |
| --- | --- | --- |
| 0 · Base | Lectura, fuente v26, copia recuperable, tests y comparación | `00-base.json`, `00-base-tests.txt`; 13 archivos aprobados |
| 1 · Correcciones v26 | Advertencia legible; aceptación exacta por cantidad/stock; vaciar carrito secundario con confirmación inline | `01-correcciones-tests.txt`; 14 archivos; capturas 360/390/430 |
| 2 · Entrega 3 | Aperturas/conteos/pérdidas/historia; revisiones; fiados/parcial/abonos; pagos posteriores; correcciones reales | Dominio, controlador real con DOM/Storage mínimos y recorridos de navegador; efectos comprobados antes de reportes |
| 3 · Entrega 4A | Reportes, costos incompletos, metas/restante, vista mensual, JSON v5 | `reports.case.mjs`, roundtrip/migración, navegación real y capturas; PDF físico no acreditado |
| 4 · Entrega 4B | Exportación sin framework nuevo; PWA estática; adaptador inactivo, migración preparada y SQL candidato | Tests de alcance/rutas/caché y protocolo simulado; Supabase bloqueado; SQL no ejecutado |
| 5 · Cierre | Matriz integral, regresiones, 27 medidas de nueve áreas a tres anchos, capturas y contrato | `04-final-tests.txt`: 19 aprobados; `anchos-browser.json`; cero errores de app capturados en la inspección final filtrada por origen |

Los cambios se registraron en commits coherentes: `8cb4ca4` (carrito), `1817341` (dominio) y `2d1a39b` (recorridos/reportes), más los commits de estabilización/preparación y documentación enumerados en el cierre. No se agregó un framework ni dependencias de ejecución.

## Recorridos comprobados con datos sintéticos

Todo el QA de navegador ocurrió en `http://terminal.local:4173/`, con productos `QA DESECHABLE`, cliente y proveedor de QA. No son datos del negocio y no se incluyen como datos iniciales de la app.

- Conteo: stock −1 → 5; regularizó una diferencia y creó un lote por 5 unidades, costo total $10.000; no movió dinero. El resultado se recuperó tras recargar.
- Apertura de otro SKU de 1 L: 3 unidades sin costo informado; se conservó como pendiente, sin compra ni movimiento. Se verificó tras recarga.
- Venta 002: dos unidades a $5.500, total $11.000; $7.000 efectivo y $4.000 fiado. Comprobante mostró ambas partes.
- Abono parcial de $1.000: deuda $3.000. Corrección de precio a $6.000 por unidad: total $12.000, deuda +$1.000, dinero $0 y stock sin cambio. Vista previa y resultado coincidieron.
- Abono final por transferencia verificada: $4.000. Fiado saldado; deuda original $4.000 + corrección $1.000 − abonos $5.000 = $0. Sin nueva venta ni descuento de stock.
- Resolución de la venta histórica con costo pendiente: evidencia explícita, costo $3.000 y stock delta 0 porque el conteo ya lo había regularizado. La venta original conservó su costo pendiente histórico; el informe incorporó el hecho de resolución.
- Recepción sin pedido: dos unidades por $6.000, sin pago. Pago posterior $2.000 efectivo: quedó pendiente $4.000; la recepción y las unidades no se repitieron.
- Informe final: vendido $15.500, cobrado $15.500 ($11.500 efectivo + $4.000 transferencia), mercadería pagada $2.000, variación $13.500, costos identificados $7.000, ganancia de ventas antes de gastos $8.500. Meta $100.000; restaban $84.500.

## Arquitectura y archivos

Se mantuvieron HTML/CSS/módulos ES y los componentes propios de Sites. `app.js` sólo incorpora integración/entrypoints; las pantallas y reglas nuevas se separan.

| Responsabilidad | Archivos principales |
| --- | --- |
| Faltantes exactos | `dist/shortage-model.js`, integración de carrito/cobro |
| Lecturas efectivas y saldos | `dist/business-read.js` |
| Inventario/pagos/metas | `dist/extended-operations.js`, `extended-validation.js` |
| Correcciones | `dist/sale-corrections.js`, `correction-validation.js`, `correction-ui.js` |
| Recorridos y borradores | `dist/workflow-ui.js`, `workflow-state.js`, `draft-model.js` |
| Reportes/impresión | `dist/reports-model.js`, `reports-ui.js`, `workflows.css` |
| Movimientos | `dist/money-history-ui.js`, ajustes en `money-model.js` |
| Escritura local/JSON | `dist/local-data.js`, `writer-gate.js` |
| Precios | `dist/product-model.js`, `supplier-engine.js` e integración de sugeridos |
| PWA | `dist/manifest.webmanifest`, iconos, `index.html`, `sw.js` |
| Preparación remota/migración | `dist/remote-queue.js`, `migration-plan.js`, `backend/` |

No se siguió acumulando CSS en `refinement.css`; las adiciones operativas están en `workflows.css`. Reposición se conservó salvo el enlace y registro de pago posterior. Se preservó variedad/volumen en nuevas líneas de recepción.

## Errores encontrados y corregidos

- La prueba de correcciones detectó una referencia de comando invalidada al copiar estado: se preservó el objeto de operación que debía recibir el resultado confirmado.
- La revisión visual detectó que el campo de costo de un conteo no aparecía tras cambiar unidades: se actualiza al aceptar el cambio del campo.
- El encabezado del informe heredaba el layout del header global: se delimitó su estilo para que sea un bloque legible.
- Se corrigió un fallback del service worker afectado al ampliar recursos; la prueba ahora cubre navegación y la firma de `cache.match`.
- Se endurecieron los enlaces entre comandos y hechos, y el resultado remoto simulado debe coincidir también en dispositivo/payload/revisión.
- Se impide regularizar por segunda vez un faltante ya corregido mediante conteo.
- Se añadió versión de precio para detectar el caso A→B→A, además del precio esperado.
- Se preserva la verificación posterior de una transferencia en la vista efectiva después de una corrección.

## Calidad visual y límites exactos

Nueve áreas (Inicio, Ventas, Caja, Productos, Inventario, Reposición, Reportes, Configuración y Datos) se midieron a 360/390/430 px: 27 casos sin desbordamiento horizontal. Carrito también tiene capturas a los tres anchos. Se recorrieron apertura, conteo, cobro parcial, comprobante, abonos, corrección, resolución, pago posterior, informe y navegación contextual.

Las medidas se realizaron con un iframe de ancho CSS real en navegador de escritorio, no mediante teléfonos ni emulación de teclado. No equivalen a QA físico. Los formularios nuevos se ejercitaron en anchos concretos; no se afirma una matriz de todos los estados de cada formulario en los tres tamaños. Las capturas conservan el contexto del navegador de QA.

La acción de impresión se pulsó; no se obtuvo un archivo PDF verificable del diálogo nativo. La espera de descarga JSON mediante la automatización expiró; el código de exportación/importación y roundtrip se probó, pero no se acredita que un archivo de ese recorrido haya quedado descargado ni importado por UI en otro navegador. Son pendientes de QA, no resultados simulados.

El origen HTTP de la vista previa no ofreció service worker/Web Locks. Se verificaron lógica y recursos en pruebas locales; instalación, cacheado real, reapertura offline, actualización de la PWA y exclusión real entre pestañas HTTPS quedan pendientes. El aviso de datos ya distingue esa indisponibilidad de una preparación en curso.

## GitHub y Supabase

Se preparó la rama `work/sites-v27-entregas-3-4` desde `master` `296c2aa1a95273ccd86af784c14595af33573602`. La exportación de la app nueva se coloca de forma autocontenida en `sites-next/`; no importa módulos del viejo `src/` y no sustituye la implementación pública. La identidad de Sites y credenciales no se copian a la app exportada. La PR es de revisión, sin merge ni despliegue.

Se revisó el workflow de Pages: sólo publica con push a `master` o activación manual; no se activó ninguno. El workflow histórico de checks de PR verifica la app antigua; la prueba pertinente de esta exportación es la suite dentro de `sites-next/` y su workflow específico de sólo lectura cuando se ejecute. El cierre adjunto contiene SHA/PR/versión exactos y el estado obtenido, sin presuponer éxito de CI.

Supabase: sólo se listó un proyecto «Chofer Utilities» inactivo y ajeno a Mora. No se accedió a filas de negocio ni se ejecutó SQL. No se configuró Auth, permisos ni conexión; no se probaron transacciones/concurrencia reales. SQL preparado: una foundation dev y RPC de metas; el resto del servidor sigue pendiente. No es integración terminada.

## Aislamiento de pruebas en la exportación

El primer check específico de Sites pasó. El workflow histórico intentó descubrir también los 19 archivos Node terminados en `.test.mjs` y Vitest los rechazó como suites propias. Se corrigió la colisión usando `.case.mjs` y una invocación explícita por `npm test`. No se modificaron el runner ni la aplicación antiguos. El cierre adjunto registra la versión guardada y los checks del commit final; v27 se conserva como borrador intermedio.

## Recuperación y autorización futura

Se conservan v26 y la historia de la nueva fuente. Los datos locales no se migran ni eliminan automáticamente. Antes de cambiar de origen: respaldo externo, destino vacío, ensayo de namespace/manifest y comparación exacta. Antes de volver a una app antigua: exportar el esquema 5 y comprobar compatibilidad.

Este cierre guarda un borrador, exporta código y documenta límites. No publica Sites, no despliega Pages, no fusiona `master`, no modifica Supabase ni migra datos reales. El [plan restante](plan-maestro-actualizado.md) sólo contiene tareas que faltan y sus criterios de aceptación.
