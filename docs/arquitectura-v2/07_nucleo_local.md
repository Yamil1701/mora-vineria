# Primera vertical local — implementación para revisión

Base: `master` ceead8d (PR#6 fusionada). Rama `work/v2-nucleo-local`. Esta etapa implementa V0/V1 locales por instrucción expresa del usuario; no habilita V2 remoto, credenciales, RLS ni datos compartidos. No se modificaron Supabase, V1, mockups ni workflow de deploy.

## Funciones utilizables en esta rama

- Alta/edición/desactivación de productos con precio entero, objetivo manual opcional y versión para detectar edición concurrente. No elimina historial.
- Stock inicial antes del primer movimiento: unidades físicas y costo total real conocido o declarado desconocido; crea lote, no inventa salida de caja ni compra histórica. Apertura no repetible con otro ID.
- Recepción de unidades efectivamente recibidas y pagadas en efectivo: lote con costo racional exacto a partir de costo total/unidades, asiento de stock, compra y salida de efectivo. Cada recepción parcial es independiente; no hay pedido proveedor automatizado.
- Venta en efectivo con una o varias líneas, borrador durable de cantidades/precios y efectivo recibido opcional, vuelto, FIFO local entre lotes, stock, cobro y jornada de carga 08:00–07:59. Cambiar precio de catálogo no cambia precio del borrador ni venta histórica.
- Venta física con stock cero/insuficiente se conserva, stock negativo visible, revisión pendiente y costo no calculable cuando faltan lotes/costos. Lote desconocido no se salta. Compra posterior no cierra automáticamente revisión vieja.
- Historial con fecha de carga, jornada, cobro, vuelto, unidades, segmentos FIFO y costo/ganancia estimados. Inicio muestra ventas de hoy y cobertura de costo; variación de efectivo separada de saldo real.
- Comandos inmutables, hash SHA256, secuencia de instalación, resultados locales y outbox durable; sin emisor ni reintentos HTTP. Todos los resultados se etiquetan `local_only`; outbox `awaiting_backend`, intentos 0. No hay confirmación remota.

## Separación demo / registros

La ruta normal continúa mostrando la demo en memoria, sin leer ni crear esta DB. Para QA de la rama: `npm ci`, `npm run dev`, abrir `http://localhost:5173/mora-vineria/?mode=local`. La aplicación local empieza vacía y no importa fixtures. En producción pública todavía sigue la versión anterior: esta PR no se publica sola.

DB aislada: `mora-v2:local-workspace:v1:this-browser`; metadatos con businessId/datasetEpoch/deviceId UUID generados una vez, no identidades autorizadas. Es un espacio local de ensayo por perfil/origen, no un negocio remoto ni tenant operativo. Este nombre sustituye temporalmente la propuesta por negocio/dispositivo mientras no exista enrolamiento remoto. No se abre, recorre ni elimina una base de V1. Tests usan namespace `mora-v2:test:<uuid>` y eliminan **solo** su DB sintética al terminar; E2E usa contextos de navegador temporales nuevos.

Los stores de esta etapa son proyecciones **locales provisionales** separadas de una futura base oficial. No hay officialEntities o pull ficticios. Antes de conectar servidor se necesitarán adaptadores de payload/envelope, cache oficial, reconciliation/replay y revisión del destino. No transmitir automáticamente estos registros de QA ni reutilizar este dataset como producción. El hash actual cubre el comando semántico (versión/ID/timestamp/tipo/payload/dependencias); scope y secuencia se agregan atómicamente en el journal. Contrato RPC definitivo deberá validar tanto hash semántico como scope autenticado; no asumir compatibilidad wire automática.

## Integridad y fallos

`LocalService.execute` valida/clona/hash fuera de `rw`; transacción incluye lotes, stock/caja, venta/recepción/producto, command/result/outbox, contador y consumo del borrador. Fallo revierte todos los efectos; éxito de UI solo tras commit. Payload distinto con ID usado falla, mismo ID devuelve resultado original. Límites de entero seguro se verifican en operaciones y acumulados para impedir reportes con overflow.

Checkout primero sella un comando exacto en el borrador: timestamp/ID/precios/efectivo estables. Si se cierra la app o falla el commit final, el borrador sellado se recupera para reintentar ese mismo comando. Puede reabrirse para editar únicamente cuando no existe comando confirmado local; no borra operaciones existentes. Un cobro insuficiente se valida antes de sellar y deja borrador editable. Las ediciones de borrador/producto utilizan CAS para evitar sobrescritura silenciosa entre pestañas.

Los campos de efectivo se guardan en cola serial; el botón final espera que esas escrituras terminen. Cantidad/precio del borrador se mantienen al navegar y recargar. Si hay error de almacenamiento, formulario y borrador permanecen; no se aconseja borrar datos del sitio. IndexedDB no es respaldo externo ni protección contra borrado del perfil.

Actualización de PWA manual: espera la cola de efectivo y no ejecuta durante acción en curso. Workbox precachea shell/chunk local; pruebas verifican reinicio offline después de instalación. No hace caché de datos remotos ni inventa sincronización.

## Archivos

| Grupo | Implementación |
| --- | --- |
| `src/domain/types.ts`, `rules.ts` | Tipos, UUID/textos/importes, jornada, racionales exactos, FIFO, hash |
| `src/local/database.ts`, `service.ts` | Schema Dexie v1, comandos transaccionales, borradores, checkout, outbox y snapshots |
| `src/local/LocalApp.tsx`, `local.css` | Modo local reutilizando AppShell, GlassPanel, navegación y controles existentes |
| `src/main.tsx` | Selección explícita `?mode=local`, lazy loading; demo permanece predeterminada |
| Tests dominio/persistencia y `tests/e2e/local-flow.e2e.ts` | Reglas reales, fallos, reinicios, replay y recorridos de UI |
| `playwright.config.ts`, package/lock/tsconfig, workflow checks | Dependencias fijadas y verificación reproducible; sin job deploy |

## Comprobaciones

- Vitest: 34 tests (7 reglas de dominio, 23 persistencia real mediante Dexie + fake-indexeddb y 4 demo). Incluye 100 reintentos paralelos con dos conexiones, 50 ventas recuperadas, 8 puntos de fallo transaccional, coste desconocido, recepción parcial, doble click y conflicto CAS.
- Referencia de arquitectura anterior: 14/14 escenarios siguen pasando; sigue siendo referencia, no implementación remota.
- Playwright: 3 recorridos sobre build/preview: demo aislada + FIFO atravesando lotes + recarga; pago insuficiente/no-stock con costo desconocido; edición y borrador con recibido + recarga PWA offline + venta offline. Contextos sintéticos, no datos del usuario.
- Chromium headless 134 local (runner Playwright 1.64); script previo también verificó 360/390/430/1280px, sin scroll horizontal ni errores JS. Browser plugin no disponible; se usó Playwright. Instalador actual 151 falló por descarga truncada del entorno; el shell 134 obtenido del mirror oficial permitió comprobar el flujo. CI instala Chromium correspondiente al runner.
- `npm ci`, typecheck, build y `git diff --check`: correctos. Warning Vite del fondo absoluto permanece (asset presente, browser probado); aviso npm glob transitivo obsoleto ya conocido, sin upgrades indiscriminados.

## Límites y siguientes gates

No hay pagos por transferencia/mixto/fiado, corrección de ventas, conciliación de reviews, pérdida/reemplazo, conteos, backup cifrado/importación, dispositivos ni sync. No mostrar esos controles como funcionales. Reportes limitados a datos locales; FIFO por orden de commit local, siempre provisional, no el orden global de servidor. El reloj del dispositivo no tiene ancla remota; no afirmar verificación de hora.

Escala inicial deliberada: snapshot completo para pequeña base local; no se optimizan miles de filas o virtualización aún. Falta QA en Safari/iOS/Android reales, teclado/safe-area, upgrade de schema futuro y recuperación ante pérdida total del perfil. Sin respaldo externo, la destrucción de IndexedDB puede perder todo lo local. No utilizar como registro productivo compartido.

Siguiente PR: ampliar verticales locales con conciliación/correcciones auditadas y recuperación independiente; luego entorno Supabase **aislado y específicamente autorizado**, RPC/RLS/enrolamiento/pull antes de cualquier sincronización. Esta PR no cambia políticas de negocio pendientes de reemplazos/revocación.
