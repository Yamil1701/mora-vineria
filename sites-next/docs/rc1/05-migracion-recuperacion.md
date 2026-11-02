# Migración y recuperación

## Lo que se ejecutó

Datos exclusivamente sintéticos. Compatibilidad v3 → v5, v4 → v5 y restauración v5 verificadas; v4 se generó con el escritor auténtico congelado de v26 (`bea955a878433b1f94cbb27af6d9388751d9537f`) a partir del fixture v3. Se compararon todos los datos comunes y una segunda exportación v5.

El dataset complejo v29 contiene ventas, FIFO, crédito/abonos, correcciones aplicadas y en revisión, recepción, pago posterior, meta y una operación preparada. Las pruebas comprueban que descargar/restaurar no cambia esos hechos y que cerrar/reabrir recupera la preparación una sola vez. Un registro confirmado no genera otro movimiento al repetirse.

En Chromium HTTPS se descargó un archivo por el botón real, se importó mediante selector real en **otro origen vacío** y se descargó nuevamente. Igualdad exacta de 26 claves de negocio; `workState` se comprueba aparte porque navegar modifica el contexto. La fuente permaneció intacta y una segunda importación en destino ocupado quedó bloqueada. Esta evidencia es de migración **local por JSON**, no de importación a Supabase.

## Procedimiento para un traslado futuro autorizado

1. Detener nuevas operaciones en el origen para la ventana de traslado. No usar simultáneamente la versión anterior y la candidata como registros reales independientes.
2. En el origen, Datos y respaldo → Descargar respaldo JSON. Conservar el archivo fuera del navegador, con fecha y una segunda copia. Comprobar que el archivo existe y abre; preparar la descarga no acredita que el teléfono lo haya guardado.
3. En una candidata **vacía**, elegir Restaurar una copia y seleccionar ese archivo. Revisar resumen, cantidades, advertencias, versión y preparaciones. El sello detecta cambios accidentales; no es una firma contra un atacante que pueda rehacerlo.
4. Confirmar una sola vez. Si el destino ya tiene datos, conservarlos y usar otro espacio vacío; no mezclar ni limpiar automáticamente.
5. Exportar el destino y comparar productos, existencias, lotes/restantes, ventas/correcciones, movimientos/cuentas, deudas/abonos, revisiones, metas, pedidos/recepciones y pagos. Comparar operaciones/resultados, no sólo cantidad de ventas.
6. Cerrar/reabrir. Si había una preparación, revisar su resultado recuperado, volver a descargar y comprobar un solo efecto. Distinguir preparación de hecho confirmado.
7. Registrar origen/destino, SHA del archivo, fecha, recuentos y diferencias. Conservar el origen sin modificar ni retirar hasta autorización expresa.
8. Para una futura base compartida agregar importación de servidor con identidad estable, manifiesto y comprobación de integridad. **No existe aún ese comando remoto de importación.** No insertar un JSON real mediante el rol privilegiado para saltarse esta carencia.

## Reversión

Antes de importar, se conserva una copia del destino previo. El flujo actual exige destino vacío. Para revertir el ensayo, volver al origen intacto o recuperar su copia original en otro espacio vacío. Nunca introducir el JSON v5 en v25: una app antigua puede no interpretarlo. Nunca eliminar el único respaldo ni hacer downgrade sobre la clave anterior.

La RC usa una clave separada y ofrece descargar los datos de la versión anterior si existen en el mismo origen. No los convierte ni sobrescribe automáticamente. Cambiar de dominio (Sites, Pages u otro) no transporta localStorage ni IndexedDB.

## Almacenamiento

Se probaron escritura denegada, cuota simulada, interrupción entre preparar/confirmar, resultado perdido después de escribir, restauración con checkpoint fallido, copia alterada, límite 10 MB, fotos limitadas e historial de 600 movimientos con foto de 88 KB. Las pruebas de navegador agregan el agotamiento real de cuota del contexto sintético y la posterior reapertura.

`idb-store.js` usa una transacción IndexedDB con durabilidad estricta, revisión y checkpoint en la misma base. Dos conexiones reales comprobaron rechazo de versión vieja, importación repetida y un único efecto en 100 confirmaciones después de reabrir. **No reemplaza todavía el controlador síncrono activo.** La integración requiere llevar todas las escrituras a ese contrato asíncrono y volver a ensayar fallos/cierres reales. Un cierre entre llamadas de prueba no certifica un corte de energía.
