# Matriz de QA · Mora Entregas 3 y 4

Actualizado el 31 de octubre de 2026. `node --test tests/*.case.mjs`: 20 archivos aprobados. Los tests de app ejecutan funciones reales con DOM/Storage mínimos; no son pruebas de navegador. Los tests remotos/locks usan simuladores y no acreditan servidor ni carreras de navegador. La continuación de JSON sí incluye controles de archivo reales del navegador: ver `../recuperacion-json-v29.md`.

| Caso | Evidencia de código/controlador | Navegador / límite |
| --- | --- | --- |
| Precio fijo y edición comercial | stabilization, product-model, purchasing | Carrito observado; aceptación de faltante cambia al modificar cantidad |
| Efectivo exacto/vuelto | money-model, operations, app-local-flow | Cobro parcial en efectivo y comprobante |
| Transferencia confirmada/pendiente/mixta | money-model, operations, app-money-flow, app-recovery | Abono final transferido con comprobación manual |
| Stock suficiente/negativo | operations, shortage-acceptance | Advertencia 360/390/430; conteo desde negativo |
| Apertura conocida/desconocida | operations, extended-operations, app-local-flow | Apertura sin costo y recuperación tras recarga |
| Conteo/pérdida | extended-operations | Conteo −1→5; historial; pérdida cubierta en dominio |
| Revisar/resolver | operations, reports, extended-operations | Evidencia/costo $3.000; no volver a sumar stock regularizado |
| FIFO varios lotes/retornos racionales | local-receiving, purchasing, extended-operations | Costos/resultados visibles; invariantes exactos en dominio |
| Fiado completo/parcial | operations, app-local-flow | Parcial: efectivo $7.000 y deuda $4.000 |
| Abono parcial/final/exceso | operations, extended-operations | $1.000 parcial; $4.000 final; saldo cero y dos abonos |
| Corregir cantidad/producto/precio | extended-operations | Precio: vista previa $11.000→$12.000, deuda +$1.000, sin stock/dinero |
| Corregir cuenta/cobro/devolución | extended-operations; regresión de consulta inmutable tras verificación posterior | Interfaz disponible; prueba de efectos en dominio; casos físicos ambiguos pendientes |
| Gasto/aporte/retiro/traspaso | money-model, operations, app-money-flow | Caja/historial recorridos; efectos de cada clase en dominio |
| Compra pagada/pendiente | purchasing, local-receiving, app-local-flow | Recepción sin pago $6.000; pago posterior parcial $2.000 |
| Pago posterior final/exceso/reintento | extended-operations | Recorrido parcial probado; final/exceso en dominio |
| Historial/filtros/orígenes | money-history-ui, lecturas vinculadas | Pantallas disponibles; revisión de enlaces y filtros simple pendiente de ampliar en dispositivo |
| Reportes/fechas/costos | reports, extended-operations | Hoy/mes, meta y valores finales cotejados; fechas límite y semana en dominio |
| Meta/restante | reports, comando monthly-goal | Meta $100.000 guardada; informe muestra restante $84.500 |
| Informe/PDF | Mismo buildReport, CSS print A4, window.print | Vista y clic comprobados; archivo PDF y paginado nativo pendientes |
| JSON antiguo/actual | local-receiving, purchase-orders, product-model, operations, migration-plan, backup-summary; verificador de descargas | Importación real en navegador vacío y dos descargas exactas comprobadas; restaurar sobre historial ocupado bloqueado; resumen a 360/390/430. Traslado entre orígenes/dispositivos pendiente |
| Preparado/doble confirmación/reintento | operations, app-local-flow, app-recovery | Gasto preparado importado, dos recargas reales y una sola confirmación/efecto, cotejados en JSON descargado; guardas del controlador probadas |
| ID reutilizado con otro contenido | operations, extended-operations, remote-queue | Rechazo en dominio; servidor real no disponible |
| Falla antes/después de guardar | app-recovery, app-local-flow | Simulada en controlador; no operación real sobre datos del usuario |
| Respuesta remota perdida | remote-queue | Sólo transporte simulado, consulta del mismo ID |
| Dos pestañas | local-receiving, writer-gate | Detección stale y lock simulado; carrera HTTPS pendiente |
| Dos dispositivos/seguridad | remote-queue; backend/tests/acceptance.md | Bloqueado por falta de Mora dev; no se afirma prueba distribuida |
| Migración/duplicado | migration-plan + fixture v3 | Manifest exacto v3→v5 y restore repetido rechazado en Storage aislado; traslado entre orígenes pendiente |
| Actualización con borrador | update-gate, app-local-flow, app-recovery | Política/controlador probados; actualización instalada física pendiente |
| PWA/rutas | offline-shell, manifest/iconos | Recursos/fallback/subdirectorio probados; HTTP preview sin SW; instalación y offline real pendientes |

## Archivos de pruebas

`app-local-flow`, `app-money-flow`, `app-recovery`, `backup-summary`, `extended-operations`, `local-receiving`, `migration-plan`, `money-model`, `offline-shell`, `operations`, `product-model`, `purchase-orders`, `purchasing`, `remote-queue`, `reports`, `shortage-acceptance`, `stabilization`, `supplier-engine`, `update-gate`, `writer-gate`.

## Evidencia visual

`design/entregas-3-4/`: comparación v26, carrito a tres anchos, conteo, comprobante parcial, corrección, reportes a tres anchos, informe final, pago posterior y fiado saldado. `verificacion/entregas-3-4/anchos-browser.json` conserva las 27 medidas. Datos exclusivamente sintéticos.

`design/recuperacion-json-v29/` y `verificacion/recuperacion-json-v29/`: copias reales, comparación exacta, historial protegido, aviso de preparado y medidas de 360/390/430 px. El driver temporal no forma parte de `dist/`.
