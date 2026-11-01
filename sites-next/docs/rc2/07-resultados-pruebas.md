# Resultados de pruebas RC2

Node: **77/77 entradas aprobadas**. Navegador local HTTPS: **15/15 recorridos aprobados**. API Supabase: **7/7 grupos alojados aprobados**. Estos números miden grupos/entradas del runner, no personas ni aceptaciones físicas.

## Comandos y entorno

`npm ci --no-audit --no-fund` · `npm run stamp` · `npm run verify` · `npm test` · `npm run test:browser`. Node 24 en Work; CI Node 22. Chromium 153 fijado por package-lock y extraído del paquete NPM fijado. No había herramienta Browser asociada disponible para automatizar el navegador local: se utilizó Playwright sobre la app propia aislada.

Pruebas alojadas: `python scripts/hosted-qa.py` y `node scripts/hosted-browser-qa.mjs`, con `MORA_HOSTED_FIXTURE` privado. Se usaron tres usuarios Auth auténticos, dos negocios sintéticos y dispositivos separados. Los reintentos del harness reutilizan el sobre sellado tras un resultado desconocido; no omiten fallos de negocio. Las continuaciones se registran explícitamente.

## Casos API alojados

| Grupo | Resultado | Verificación persistida |
|---|---|---|
| hosted-auth-and-isolation | Aprobado | {"authenticNonanonymousJWTs": 3, "invalidAndExpiredRejected": true, "foreignBusinessAndUserRejected": true, "deviceProofAndOriginRequired": true} |
| hosted-products-opening-sale-fifo | Aprobado | {"sales": 1, "stock": 9, "debt": 5000, "fifoNumerator": "4375"} |
| hosted-100-retries-and-lost-response | Aprobado | {"actualRequests": 100, "payments": 1, "duplicateChangedContentRejected": true, "lostResponseLookup": true} |
| hosted-independent-device-concurrency-and-reviewed-sale | Aprobado | {"independentDevices": 2, "debtPaid": 4000, "overpaymentReviewRejected": true, "physicalSalesPersisted": 3, "stock": 7} |
| hosted-inventory-purchases-corrections-cash-goals | Aprobado | {"revision": 29, "sales": 3, "stock": 8, "receipts": 1, "payments": 2, "corrections": 2, "rollbackUnchanged": true} |
| hosted-supplier-prices-unknown-cost-review-and-product-edit | Aprobado | {"supplierLists": 1, "aliases": 1, "priceReviews": 1, "unknownUnitsPreserved": 4, "stockResolution": 1, "ambiguousCorrectionPending": true, "productEdit": true} |
| hosted-distinct-sessions-quantity-return-refund-and-forged-snapshot | Aprobado | {"distinctAuthenticUsers": 2, "moneyNet": 90, "returnedUnits": 1, "returnCost": 2000, "realRefunds": 4500, "originalSaleUnchanged": true, "browserSnapshotIgnored": true} |

## Navegador local

| Recorrido | Resultado |
|---|---|
| restore-scroll-and-main-screens-360 | Aprobado |
| restore-scroll-and-main-screens-390 | Aprobado |
| restore-scroll-and-main-screens-430 | Aprobado |
| two-real-HTTPS-tabs-and-noncooperating-legacy-key | Aprobado |
| Web-Locks-unavailable-never-writes | Aprobado |
| real-cross-origin-download-import-and-duplicate-protection | Aprobado |
| service-worker-offline-reopen-and-controlled-update-preserve-draft | Aprobado |
| commerce-forms-and-real-effects-360 | Aprobado |
| commerce-forms-and-real-effects-390 | Aprobado |
| commerce-forms-and-real-effects-430 | Aprobado |
| injected-IndexedDB-quota-failure-keeps-prior-snapshot | Aprobado |
| reduced-height-checkout-focus-and-manifest-paths | Aprobado |
| active-IndexedDB-resume-and-two-connections | Aprobado |
| incompatible-IndexedDB-raw-copy-preserves-source-and-redacts-access | Aprobado |
| native-A4-PDF-generated-by-Chromium | Aprobado |

## Navegador con Supabase real

Se aprobaron cuatro recorridos funcionales alojados: acceso/vínculo real, JSON inicial/segundo dispositivo, venta offline con cierre/reapertura y revisión ante otro dispositivo, y pérdida real de respuesta después del commit con consulta posterior del mismo resultado. La segunda ejecución preparó una sesión y dispositivo sintéticos conocidos para continuar; no se cuenta su marcador de antecedentes como una quinta prueba de acceso. Los JSON de ambas ejecuciones se conservan.

El primer harness falló al buscar navegación inferior desde un comprobante. La aplicación había conservado la venta offline tras reabrir; el fallo era el paso del test. Se corrigió para volver a Inicio. Los contextos sintéticos de esa primera corrida se descartaron al cerrar el harness; la repetición usó otro dispositivo autorizado y comparó el delta contra su lectura inicial. La nueva versión del harness guarda antes de cerrar evidencia JSON sin credenciales y estado de navegador sólo en la carpeta privada.

## Seguridad e integridad adicionales

SQL alojado: se provocó un fallo dentro del commit después de actualizar el negocio; estado, facts y comando se revirtieron. Se comprobaron RLS fuera del negocio y denegación de escritura directa con rol authenticated. Revocación real después de una lectura autorizada: envío posterior HTTP 403 y comando ausente. Los casos Node añaden permisos, revocación durante cálculo, conflicto, FIFO, rollback y sesión eliminada/expirada.

El caso de 100 envíos ejercita dos sobres distintos con cien solicitudes cada uno, uno de ellos iniciado concurrentemente. Cada sobre mantiene un único efecto persistido. No se presenta el total de todas las repeticiones diagnósticas como un número adicional de pruebas.

## Fallos encontrados y corrección

- Carrera lookup/lectura: conflicto falso del mismo ID. Corregida y cubierta con intercalación específica y repetición alojada.
- PGRST303 interno: reintento acotado y clasificación desconocida, sin debilitar Auth. El proveedor sigue siendo un límite externo.
- El test usó por error `transfer` donde el dominio exige `move`, y después cambió un campo de un sobre ya sellado. El servidor rechazó ambos; se corrigió el fixture conservando los sobres previos, sin cambiar el dominio para hacer pasar el test.
- El intento CDP de cuota nativa no produjo disco lleno. Se sustituyó la afirmación de prueba nativa por una prueba explícitamente inyectada y se conserva ese límite.
- Acceso de navegador externo falló inicialmente por la configuración de red del runner; con su proxy de pruebas se comprobaron las llamadas reales.

## Pendiente y CI

QA físico: **58 casos pendientes**, ninguno aprobado por el usuario. No se probaron teléfonos reales, impresora ni agotamiento físico de disco. El job alojado opcional de Actions requiere secretos/fixture nuevos y no fue configurado ni ejecutado en GitHub. El CI ordinario sólo puede acreditar Node y navegador local; consultar estado-final.json y el informe de CI por SHA, no atribuirle las pruebas alojadas de Work.

## Comprobación final y archivo sintético

Se comprobaron en la base los 25 tipos de comando confirmados, con 50 comandos entre los dos negocios sintéticos. Sobre Edge v5 se repitieron sobres confirmados de 24 tipos y el estado final quedó exactamente igual; la importación inicial está comprobada por la UI y no se delegó la identidad de su dispositivo original. El archivo histórico conserva 17 tablas, 33 funciones, 281 ventas, 280 cobros y 775 operaciones; su cron sigue inactivo y su esquema no tiene USAGE para los roles de la app.

Al terminar se archivó exclusivamente la ejecución sintética: dispositivos y membresías de esos dos negocios revocados y códigos vencidos. Se conservaron sus 50 comandos y resultados para auditoría. No se eliminaron usuarios Auth ni filas históricas. Para un nuevo QA hay que provisionar un fixture nuevo; no entregar las credenciales privadas de esta corrida al usuario ni reutilizar estos negocios como producción.

La revisión final de rendimiento agregó una tercera migración incremental con los dos índices FK de enrolamientos. La prueba local comprueba ambas columnas compuestas y se verificó la desaparición del aviso activo correspondiente. No se eliminaron índices de integridad por aparecer como todavía no utilizados.

Verificación adicional alojada tras recuperar el cierre: se emitió y verificó una sesión nueva de un usuario exclusivamente sintético, se comprobó su fila y `mora_rc_session_valid=true`, se cerró sólo esa sesión mediante Auth (204), se confirmó la eliminación real de la fila y el mismo JWT recibió 401 en `mora-command`. Antes del logout la autenticación era válida y el acceso devolvía 403 por el archivo deliberado de sus membresías/dispositivos. No se alteraron usuarios históricos. El operador temporal se habilitó sólo para emitir ese enlace fijo y quedó nuevamente retirado en v8, con fuente constante 410 sin capacidad administrativa. Esta prueba tiene evidencia propia y no se cuenta como ejecución del job alojado omitido en Actions.
