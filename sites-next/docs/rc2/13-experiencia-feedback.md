# RC2 · Experiencia y respuesta visual

Base: `master` `4954c274` (PR #15 publicada). Fuente activa exclusiva: `sites-next/dist/`. La raíz y los contratos visuales anteriores son antecedentes; se conserva Mora v29 y su navegación de cinco posiciones.

## Patrones adoptados

- **Cobro:** un estado de presentación deriva de la validación existente. El botón, el vuelto y las indicaciones coinciden. Una transferencia pendiente sigue permitida; nunca se presenta como acreditación automática.
- **Borradores:** el espacio durable existente conserva formularios por contexto (producto nuevo/edición, conteo, abono, pago, corrección, meta, movimiento y presentación). Volver conserva; descartar exige una segunda acción inline. Completar limpia el borrador en la misma escritura que registra el resultado. Pedidos y recepción conservan sus mecanismos existentes. Auth nunca entra en estos borradores. `savedForms` es un campo opcional de trabajo local, sin migración de base ni cambio de versiones de esquema/backup.
- **Errores:** explicación persistente junto al campo, `aria-invalid`, descripción asociada y foco. Un importe todavía fuera de rango mantiene el error; corregirlo lo retira. Los valores ingresados se conservan. Un fallo de escritura no genera una confirmación y libera los controles.
- **Procesamiento:** “Guardando…” acompaña la operación real, con protección contra dobles pulsaciones. El estado distingue dispositivo, pendiente, resultado desconocido y comprobación remota. La finalización de una venta muestra dónde quedó guardada.
- **Microinteracciones:** pulsación inmediata, selección identificable, confirmación textual del producto agregado y pulso breve del carrito. Entrada discreta de pantalla al cambiar de recorrido, conservación del foco en cambios de controles y continuación clara al terminar. Sin esperas artificiales, vibración ni dependencias. `prefers-reduced-motion` conserva toda la información sin animaciones.
- **Móvil:** superficies reales de al menos 44 × 44 CSS px en los recorridos medidos; selectores redistribuibles, importes largos y texto ampliado sin desbordamiento. Altura de barras medida para reservar su espacio. Un único manejador del teclado conserva umbral, foco, scroll y área visible.
- **Formato:** presentación es-AR compartida, signo antes del peso y hasta dos decimales sólo cuando aportan información. No cambia la aritmética FIFO. Fechas de eventos se muestran en Salta; la jornada guardada conserva su significado separado. Los nombres de archivos mantienen fecha ISO.

## Caso adicional encontrado al probar los estados de guardado

Una respuesta perdida después de crear un producto dejaba el intento en estado desconocido. Si una lectura ya incluía ese producto, la proyección local intentaba crearlo de nuevo y lo marcaba para atención por identidad duplicada. Reproducido en transporte sintético y en una regresión Node antes del arreglo.

La proyección ahora evita repetir esa creación cuando su ID ya está en la instantánea. **No confirma el intento:** la cola y su evidencia se conservan; sólo el resultado original, validado con ID, contenido, dispositivo, negocio y revisión, permite confirmarlo. Sin cambios del servicio, Auth, permisos, SQL ni infraestructura.

## Verificación y límites

- Reproducidos los seis hallazgos en la base: borrador reiniciado, guía mixta contradictoria, error temporal de abono, texto 200 % con ancho 375/360, botones de 42 px y formatos distintos.
- `npm run verify`, `npm test` y `npm run test:browser`. Esta última conserva los 21 grupos anteriores y añade 10 grupos específicos; pueden ejecutarse solos con `npm run test:experience`.
- Regresiones: volver/reabrir/recargar tras comprobar escritura en IndexedDB, descarte sin perder otra tarea, limpieza, abono excesivo corregible, doble pulsación, altura reducida, texto ×2, movimiento reducido, fallo de escritura, pendiente offline y respuesta perdida recuperada con un único envío.
- Ampliación de texto: se duplican tamaños calculados, sin cambiar la escala de página. Zoom de página: prueba separada de escala visual ×2. Ninguna sustituye las preferencias ni el teclado de un Android físico.
- Los recorridos locales usan HTTPS, IndexedDB real y datos sintéticos. El transporte remoto de pruebas está interceptado; **no acredita integración alojada**. No se tocaron datos reales ni se reactivaron operadores.
- Compatibilidad histórica: contratos, typecheck, 155 Vitest, build y 20 recorridos Chromium. WebKit queda cubierto por su workflow, con resultado consultable en la PR. Sus pantallas no se usaron como base.
- Capturas inspeccionadas de errores, texto ampliado, importes largos, venta, foco y estados. Evidencia generada fuera de los recursos servidos y en artefactos de CI.

Pendiente de aceptación: QA físico Android, teclado y accesibilidad del sistema, y nueva integración alojada con un negocio sintético autorizado. Sin merge ni publicación en esta misión.

## Recorrido manual al publicar la candidata

Producto nuevo → escribir → volver/reabrir/recargar → descartar; repetir y guardar. Fiado → abono mayor al saldo → corregir → confirmar. Venta → Mixto incompleto → completar → revisar la transferencia → registrar. Revisar Reportes con texto grande, volver a una venta en curso, comprobar estado de guardado y descargar respaldo.
