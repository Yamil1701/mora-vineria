# Movimientos y control de mercadería — PR #10

Base: master 906a6d5; PR #6–#9 publicadas y QA móvil aprobado. Una rama, cinco checkpoints verificables, sin backend, merge ni despliegue.

## Checkpoint 1 — contratos y plan

Reutilizar comandos/resultados/outbox, ledgers, FIFO racional y slot durable de confirmación. Nuevos comandos versión 2: RecordExpense (salida en efectivo), RecordContribution (aporte en efectivo) y RecordStockCount (conteo físico + ajuste explícitamente confirmado). Los comandos históricos versión 1 conservan bytes/hash/significados.

Gastos/aportes: importe entero positivo, concepto obligatorio, nota opcional; instante de carga real, jornada Salta 08:00. Una compra se registra exclusivamente como recepción, nunca además como gasto. Aportes no son ventas ni ganancias.

Conteos: cantidad física entera no negativa, motivo obligatorio. Payload conserva stock esperado y último comando de stock observado; transacción rechaza una base cambiada incluso si la cantidad neta vuelve al mismo valor. Un recuento sin diferencia también deja auditoría. Guardar stock anterior, contado, delta, lotes antes, asignaciones retiradas, unidades añadidas, costos/revisiones. No modificar ventas anteriores.

Política de lotes: al conteo, disponibilidades deben sumar cantidad física contada. Si hay exceso de lotes disponibles, retirar FIFO; si faltan, crear lote de costo desconocido, nunca costo cero. Comparar además stock registrado/lotes: una venta con faltante puede haber dejado deuda de stock que una recepción posterior no concilia. El conteo reconcilia disponibilidad actual, conserva revisiones históricas y genera revisión por esa diferencia. Si hubo incoherencia de base, el valor de baja no se presenta como pérdida calculable. Lotes consumidos/historia no se eliminan y sus costos unitarios permanecen intactos. No hay caja por ajustes.

Evolución aditiva Dexie 4: tablas movements y stockCounts; sin borrar ni reescribir filas anteriores, metadata.schemaVersion actualizado transaccionalmente. Backup formato 2/contrato 2 incluye 16 tablas y reconstrucción verificable de efectos nuevos. Importación formato 1 original: verificar digest/estructura/efectos en su versión original antes de migrar en memoria; agregar tablas vacías y actualizar metadata/envelope, jamás rehash de comandos históricos. Restore sigue único rw y solo base vacía. Una aplicación antigua no puede importar formato 2.

Etapas/commits: (1) contrato; (2) núcleo y pruebas; (3) UI; (4) resúmenes/backups; (5) E2E/documentación. Cada etapa se valida antes de avanzar. Todos los ensayos usan mora-v2:test UUID o perfiles Playwright temporales. Producción y V1 intocadas.

## Estado de checkpoints

1–5 implementación/validación local completadas. CI remoto se verifica antes de entregar la PR; sin merge ni despliegue.

Checkpoint 2 aprobado: TypeScript y 137 pruebas Vitest. Núcleo nuevo probado con dos conexiones, reintentos, fallos de escritura y reapertura. La validación de backup se amplió junto al núcleo porque exportar el esquema nuevo exige verificarlo desde el primer commit funcional. Se conserva el importador anterior validado; faltan presentación/resúmenes y E2E.

Checkpoint 3: formularios integrados y navegación contextual desde Inicio; cuatro tabs intactos. Confirmación durable compartida incluye importes/conteo, estado pendiente, reintento y reapertura explícita. Historial de efectivo/mercadería desde ledgers reales. TypeScript, Vitest y build aprobados; recorridos Playwright Chromium/WebKit móvil validan alta, gastos/aportes, conteos, offline, reinicio, download/restore y fallo nativo de IndexedDB.

Checkpoint 4 aprobado: TypeScript, 138 Vitest, 14 contratos y compilación. Inicio mantiene ganancia bruta separada y añade resumen de movimientos; Reportes diferencia costos vendidos, gastos, aportes, compras, valor FIFO retirado por conteos, resultado tras gastos/bajas y variación de efectivo, sin saldo real inventado. Resultado total permanece no calculable si faltan costos de ventas o bajas; no resta compras dos veces. Backup formato 2 probado con todos los registros nuevos y pendientes; formato 1 mantiene validación del checksum original antes de migración.


## Formato 2 y compatibilidad

Envelope format=mora-v2-local-backup, formatVersion=2, schemaVersion=4, contractVersion=2, environment=local-workspace. Mismos createdAt, rowCounts, data e integrity SHA-256 del formato 1. Se incluyen las 14 tablas anteriores + movements y stockCounts. Categorías/favoritos/borradores siguen en sus mismas filas. Límites 20 MiB UTF-8 / 100.000 filas, exportación comprueba el JSON descargable con indentación; no genera un archivo que luego exceda el límite de importación.

commands conserva discriminantes/payload/version por operación: los cinco anteriores requieren contrato 1 y los tres nuevos contrato 2. cashEntries agrega razones expense/contribution; stockEntries agrega count. No se cambia significado ni forma de asientos anteriores. movements contiene importe positivo, tipo, concepto/nota, commandId, instante/jornada. stockCounts conserva before/counted/delta, lotUnitsBefore, addedUnits/removedUnits, allocations, costo racional nullable, motivo/nota, instante/jornada y reviewIds; se auditan también conteos sin delta. Productos inactivos admiten conteo, no se borran.

Validación reconstruye el journal en orden, compara proyecciones nuevas/anteriores y rechaza inconsistencias, duplicados, referencias/costes adulterados aunque se recalcule checksum. Importar formato 1 no escribe staging: primero verifica original; solo después clona/agrega tablas vacías, actualiza schema metadata y rehace checksum de la nueva envoltura. Ningún hash/ID/timestamp de comando cambia. El fixture tests/fixtures/pr9-backup.json se generó con código inalterado de master 906a6d5 (PR #9) en una base sintética aislada; no es una aproximación creada por el exportador nuevo. Hay ensayos del selector móvil, recuperación de pendiente, equivalencia y upgrade/rollback schema3→4.

## QA Android/iOS tras publicación autorizada

Usar exclusivamente navegador/perfil normal de prueba o teléfono de prueba. No borrar datos del navegador habitual. Conservar un backup de cualquier entorno donde haya datos antes de actualizar.

1. Crear «Conteo QA», precio3500. Registrar compra6 unidades / total12000. Confirmar/cerrar. Stock6, compra12000.
2. Vender2 unidades en efectivo: ventas7000, costo FIFO4000, ganancia bruta3000, stock4.
3. Inicio → Movimientos → gasto1000 «Bolsas», nota opcional. Verificar checkbox/confirmación y cerrar. Aporte5000 «Aporte propio». Ganancia bruta sigue3000.
4. Contar y ajustar: elegir producto, contar3, motivo «Rotura», comprobar anterior4/diferencia−1 y confirmar. Stock3, baja FIFO2000, sin salida de efectivo extra. Reportes: resultado tras gastos/bajas0; variación de efectivo−1000 (7000−12000−1000+5000), no saldo real.
5. Contar5 (sobrante+2). Lote nuevo desconocido/revisión; ventas anteriores mantienen costo4000. El historial debe conservar ambos conteos, importes, notas, hora, jornada y detalle de lotes.
6. Cerrar/reabrir y modo avión: navegar, registrar otro gasto/conteo ficticio y revisar persistencia. Si aparece confirmación pendiente, reintentar esa misma operación, nunca cargar otra para reemplazarla. Para un conflicto de conteo, volver a editar y contar de nuevo.
7. Descargar JSON, comprobar archivo en Descargas/Archivos e importarlo en otro navegador de prueba vacío. Comparar movimientos, stock, costos, borrador y revisiones; reiniciar offline. Probar también un backup conservado de PR #9. Un equipo con actividad debe bloquear importación; archivo corrupto no cambia nada.

## Alcance y límites

Solo efectivo local; aportes no son ventas, gastos no son recepciones. No hay conteo de caja, saldo real, cuentas bancarias, retiros, facturación ni sincronización. Conteo registra medición y autorización de ajuste en un único comando durable; no implementa observaciones separadas o inventario general. Base cambiante rechaza ajuste y conserva payload pendiente para revisar; no aplica contra otra cantidad.

El valor FIFO de la baja es una estimación contable, no demuestra qué botella faltó ni cierra reclamos al proveedor. El resultado después de gastos/bajas es una estimación de ese conjunto de registros, sin impuestos ni otras operaciones fuera de alcance. Revisiones históricas no se cierran: un conteo actual no prueba costos históricos. Sobrantes no reciben costos ficticios y afectan cálculos posteriores como desconocidos. No se pueden modificar/borrar movimientos confirmados; correcciones compensatorias quedan fuera de alcance. JSON sin cifrar; checksum no autentica procedencia. QA físico de selector/teclado/guardado en Android/Safari y rendimiento de bases grandes pendientes.


## Checkpoint 5 — evidencia final

TypeScript correcto; Vitest **142/142** (23 escenarios nuevos), contratos arquitectura **14/14**, Playwright **19/19** (14 Chromium / 5 WebKit móvil), compilación Vite/PWA correcta, git diff --check sin errores. Todos los tests previos se mantienen. Browser plugin no disponible: Playwright sobre http://127.0.0.1:4173/mora-vineria/. Consola sin errores de aplicación, página con contenido/título correctos, sin overlay, interacción y capturas auditadas; anchos360/390/430/1280. Recorridos nuevos incluyen selector JSON antiguo/nuevo, FIFO, gastos/aportes, conteos, rollback nativo, reload, offline, reintento/doble toque y equivalencia tras restore. Capturas temporales fuera del repo; no son nuevos mockups.

Entorno local: Chromium headless134 y WebKit móvil27.2, runner Playwright1.64; binarios/librerías temporales ya disponibles fuera del repositorio. CI instala navegadores correspondientes y sus dependencias; no se saltó ningún test. Advertencia preexistente de URL absoluta del fondo permanece, asset confirmado en navegador. Package/lock y workflow deploy sin cambios; tampoco recursos Supabase, login, datasets V1 o producción. Hora real declarada por el reloj del dispositivo; no se valida contra servidor.

Commits por etapa: contrato → núcleo/compatibilidad → UI → resúmenes → pruebas/QA. La compatibilidad del backup se incorporó al commit del núcleo porque este ya introduce tablas/comandos nuevos; el checkpoint4 verificó su integración completa, sin dejar un estado intermedio que no pudiera exportarse.
