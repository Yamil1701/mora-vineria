# Movimientos y control de mercadería — PR #10

Base: master 906a6d5; PR #6–#9 publicadas y QA móvil aprobado. Una rama, cinco checkpoints verificables, sin backend, merge ni despliegue.

## Checkpoint 1 — contratos y plan

Reutilizar comandos/resultados/outbox, ledgers, FIFO racional y slot durable de confirmación. Nuevos comandos versión 2: RecordExpense (salida en efectivo), RecordContribution (aporte en efectivo) y RecordStockCount (conteo físico + ajuste explícitamente confirmado). Los comandos históricos versión 1 conservan bytes/hash/significados.

Gastos/aportes: importe entero positivo, concepto obligatorio, nota opcional; instante de carga real, jornada Salta 08:00. Una compra se registra exclusivamente como recepción, nunca además como gasto. Aportes no son ventas ni ganancias.

Conteos: cantidad física entera no negativa, motivo obligatorio. Payload conserva stock esperado y último comando de stock observado; transacción rechaza una base cambiada incluso si la cantidad neta vuelve al mismo valor. Un recuento sin diferencia también deja auditoría. Guardar stock anterior, contado, delta, lotes antes, asignaciones retiradas, unidades añadidas, costos/revisiones. No modificar ventas anteriores.

Política de lotes: al conteo, disponibilidades deben sumar cantidad física contada. Si hay exceso de lotes disponibles, retirar FIFO; si faltan, crear lote de costo desconocido, nunca costo cero. Comparar además stock registrado/lotes: una venta con faltante puede haber dejado deuda de stock que una recepción posterior no concilia. El conteo reconcilia disponibilidad actual, conserva revisiones históricas y genera revisión por esa diferencia. Si hubo incoherencia de base, el valor de baja no se presenta como pérdida calculable. Lotes consumidos/historia no se eliminan y sus costos unitarios permanecen intactos. No hay caja por ajustes.

Evolución aditiva Dexie 4: tablas movements y stockCounts; sin borrar ni reescribir filas anteriores, metadata.schemaVersion actualizado transaccionalmente. Backup formato 2/contrato 2 incluye 16 tablas y reconstrucción verificable de efectos nuevos. Importación formato 1 original: verificar digest/estructura/efectos en su versión original antes de migrar en memoria; agregar tablas vacías y actualizar metadata/envelope, jamás rehash de comandos históricos. Restore sigue único rw y solo base vacía. Una aplicación antigua no puede importar formato 2.

Etapas/commits: (1) contrato; (2) núcleo y pruebas; (3) UI; (4) resúmenes/backups; (5) E2E/documentación. Cada etapa se valida antes de avanzar. Todos los ensayos usan mora-v2:test UUID o perfiles Playwright temporales. Producción y V1 intocadas.

## Checkpoints pendientes

2 Núcleo; 3 UI; 4 resúmenes/backups; 5 validación/CI/QA.

Checkpoint 2 aprobado: TypeScript y 137 pruebas Vitest. Núcleo nuevo probado con dos conexiones, reintentos, fallos de escritura y reapertura. La validación de backup se amplió junto al núcleo porque exportar el esquema nuevo exige verificarlo desde el primer commit funcional. Se conserva el importador anterior validado; faltan presentación/resúmenes y E2E.

Checkpoint 3: formularios integrados y navegación contextual desde Inicio; cuatro tabs intactos. Confirmación durable compartida incluye importes/conteo, estado pendiente, reintento y reapertura explícita. Historial de efectivo/mercadería desde ledgers reales. TypeScript, Vitest y build aprobados; recorridos Playwright Chromium/WebKit móvil validan alta, gastos/aportes, conteos, offline, reinicio, download/restore y fallo nativo de IndexedDB.
