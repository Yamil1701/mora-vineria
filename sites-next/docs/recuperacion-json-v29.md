# Mora · recuperación JSON y conservación del historial

31 de octubre de 2026. Continuación sobre el borrador v28 de Sites. Datos exclusivamente sintéticos, navegador inicialmente vacío y preview HTTP de QA. La versión pública v25 se conserva; este avance se guarda como borrador y continúa en la PR #14, sin fusionar.

## Cambio comprobado

La importación y la descarga real de JSON se completaron mediante los controles de archivo del navegador. La copia incluye ventas, cobros mixtos, fiado, abono, recepción impaga, pago posterior, correcciones, lotes con costo conocido/desconocido, inventario y una operación preparada.

| Paso | Resultado observado |
| --- | --- |
| Elegir y validar el archivo de 40.965 bytes | Archivo compatible; confirmación habilitada en el navegador vacío |
| Confirmar restauración | Historial recuperado con dos productos, dos ventas, una recepción y un fiado |
| Descargar JSON antes de recargar | Todas las entidades de negocio coinciden con la entrada; operación preparada conservada |
| Recargar dos veces y descargar otra copia | Un solo gasto de $100; libro de caja de 5 a 6 movimientos; mismo ID confirmado |
| Volver a elegir una copia con el navegador ocupado | Archivo validado, confirmación deshabilitada; historial actual protegido |
| Revisar el resumen a 360 / 390 / 430 px | Ancho de contenido igual al viewport; sin desborde horizontal |

Los archivos descargados se validaron con `readBackup` y se cotejaron exactamente por todas las claves de `DATA_KEYS` excepto `workState`, que contiene navegación y formularios. Para la segunda copia se aplicó el comando preparado al esperado antes de comparar. No se reemplazó la comparación por conteos o importes agregados.

El saldo sintético resultante conserva efectivo −$100, Brubank $5.500, deuda $4.500 y stock 14 / 3. Los costos desconocidos siguen siendo `null`. Las acciones de navegador y las dos recargas son evidencia observada; el verificador por sí solo acredita el contenido de los archivos, no reproduce esos clics.

## Correcciones incluidas

El resumen de restauración ahora muestra fiados, abonos, pagos posteriores de mercadería, aperturas/conteos, correcciones, metas, diferencias y registros preparados cuando existen. También informa borradores y unidades del carrito. Explica que una confirmación pendiente activa se retomará al volver a abrir Mora. Los preparados sin intención activa sólo se anuncian como conservados para revisión.

Se corrigió un defecto de lectura: al consultar una venta corregida después de verificar una transferencia, `effectiveSale` podía escribir esa verificación sobre el snapshot histórico de la corrección. Ahora calcula la vista sobre una copia. La regresión prueba que el pago aparece verificado en la vista actual y que el JSON completo, el antes/después histórico y el resultado guardado del comando no cambian al consultarlos. No reescribe historiales existentes.

El resumen vive en `dist/backup-summary.js`; `app.js` sólo lo incorpora. El nuevo módulo está incluido en la caché estática v29. El driver temporal de tamaños se retiró del paquete.

## Evidencia y reproducción

`verificacion/recuperacion-json-v29/` contiene la entrada sintética, las dos descargas reales, resultados, medidas y salida de pruebas. `design/recuperacion-json-v29/` contiene capturas de la interfaz. Los nombres con v28 identifican el origen de la prueba y se conservan para no alterar la evidencia.

Desde la raíz de la fuente:

```sh
npm test
node scripts/verify-recovery-evidence.mjs
```

20 archivos de pruebas aprobados. La prueba nueva cubre resumen, borradores, diferencias resueltas, preparados activos/inactivos y lectura sin mutaciones. La regresión de historial se agregó a `extended-operations.case.mjs`.

## Pendientes que siguen abiertos

Esta prueba usa un único origen de preview. No acredita traslado entre dos orígenes, dos dispositivos, concurrencia HTTPS, instalación/actualización/offline físicos ni PDF nativo y paginado A4. La espera de descarga fallida anterior correspondía al recorrido dentro del iframe; la descarga desde la página principal sí se completó en esta continuación.

Supabase sigue bloqueado: la conexión disponible sólo enumera Chofer Utilities, inactivo y ajeno a Mora. No existe un entorno Mora dev inequívoco disponible. No se ejecutó SQL, no se activó el adaptador remoto y no se trasladaron datos reales. La preparación del servidor conserva su alcance parcial documentado.

La integración remota requiere primero ese entorno aislado; después corresponden Auth/RLS, RPCs de todos los comandos y pruebas de permisos, rollback, reintentos y carreras. Mantener el gate de publicación y migración ya acordado.
