# Matriz de pruebas y primera entrega

Los criterios siguientes son gates de implementación futura. **No están ejecutados salvo la referencia local expresamente indicada.** Dataset sintético aislado; no pruebas sobre producción ni V1.

| ID | Caso / nivel | Criterio medible |
| --- | --- | --- |
| D01 | Jornada / dominio | 07:59:59 Salta jornada anterior, 08:00 jornada nueva; cambio de mes/año, reloj erróneo, reconexión días después conserva carga original |
| D02 | Importes / dominio | Rechazar fracción, NaN, negativo y overflow antes de efectos; vuelto5000−3500=1500; pack125000/6 conserva valor exacto |
| D03 | Transferencia/mixto / UI+RPC | Sin verificación humana no registrar transferencia acreditada; cuenta obligatoria; efectivo1500+transfer2000=3500, sin doble venta |
| D04 | Fiado/abonos / RPC | Venta3500 fiada: ventas3500, caja0, deuda3500; abono1000: ventas igual, caja1000, deuda2500; concurrencia F11 preserva exceso |
| D05 | FIFO / dominio+DB | F01–F05,F09,F12: segmentos/costos exactos, cero unknown ficticio; conservación por lote |
| D06 | Corrección / RPC | F06/F07 y corrección sobre fiado ya pagado; original/audit intactos, asientos compensatorios; reintento100 veces de corrección sin efecto adicional |
| D07 | Parcial/reemplazo / RPC | Pedido no altera stock/caja; F08; compra6/12000 defectuoso1 + reemplazo: vendible6, caja−12000, valor12000, no doble costo |
| D08 | Pérdida / RPC | Rotura lote3×2000 baja1: stock2, pérdida2000, caja sin cambio; consumo pagado es venta; costo desconocido permanece pendiente |
| D09 | Dinero / RPC+proyecciones | Aporte5000, gasto1000, retiro2000 => variación2000; traspaso3000 suma0; compras no restan otra vez ganancia FIFO |
| D10 | Conteo / RPC | Conteo real y esperado a misma revisión; sin apertura no saldo absoluto ficticio; F13 exige nueva base en concurrencia |
| D11 | Reportes / integración | Fiado entra ventas, abono no; cobertura parcial costos visible; precio nuevo no reescribe previos; cero datos no inventa tendencia |
| L01 | Commit local / Dexie real | Inyectar fallo en cada escritura: comando+outbox+contador+borrador todos o ninguno; «Guardada» solo tras commit; cuota llena muestra fallo |
| L02 | Reinicio / navegador | Guardar50 operaciones sin red, matar pestaña y reabrir:50 IDs/payloads intactos y borrador recuperado |
| L03 | Dos pestañas / IDB | 100 clicks sobre mismo borrador producen1 comando; contadores únicos con dos tabs; lease vencido recupera emisor |
| S01 | Reintento / Postgres | Submit100 veces paralelo mismo ID:1 efecto/resultado; distinto hash mismo ID rechazado; error después de commit antes del ack conserva una venta |
| S02 | Concurrencia / Postgres | F03 ambos órdenes y online simultáneo:2 ventas, negativo/review, ninguna pérdida de cobro; serialización auditada |
| S03 | Cursor / Postgres+Dexie | T1 demora commit, T2 espera lock; pull no pierde revisión; fallo de página aplica batch+cursor ambos o ninguno |
| S04 | Aviso perdido / integración | Desactivar Realtime, cambiar desde otro equipo, reabrir/foco/poll: converge por pull; «Al día» solo tras watermark sin outbox |
| S05 | Ack/pull / integración | Ack antes/después de pull: venta/caja/stock jamás se duplican por overlay; pending sin ack recuperado por resultado incluido |
| S06 | Bootstrap / integración | Snapshot paginado consistenteR, cambios concurrentes >R recuperados; corrupción/cursor caducado reinicia staging sin borrar outbox |
| S07 | Versiones / integración | Equipo viejo offline y servidor nuevo: outbox conserva hash/version; upgrade local falla sin borrado; cliente incompatible no escribe |
| S08 | Conflictos / RPC | Catálogo modificado mientras venta preparada conserva precio cobrado snapshot; edit CAS muestra propuestas; producto inactivo físico no descarta venta |
| S09 | Dependencias / integración | Producto+recepción+venta locales: orden padre antes de hijo; conflicto padre bloquea dependiente visible, no resto de negocio |
| A01 | Aislamiento / DB+HTTP | anon, auth sin membresía y businessB: cero filas negocioA; negar tablas y RPC/helpers directos, FKs cross-tenant y UPDATE de negocio |
| A02 | Revocación / DB+HTTP | JWT sin caducar revocado: submit/pull/snapshot/invite negados; carrera con comando ordenada y revalidada tras lock |
| A03 | Invitación / HTTP | Uso doble/expirado/desafío distinto/replay => máximo1 equipo autorizado; aprobador revocado durante flujo no aprueba |
| A04 | Offline revocado / navegador | Pendientes preservados; exportación posible; lease caducado muestra cuarentena; reimportación doble desde habilitado no duplica |
| A05 | Secretos / build | Bundle/backup/log sin service_role/JWT/refresh/invite hashes; proyecciones no contienen control de acceso privado |
| A06 | Canales / HTTP | Realtime y Storage propios no permiten fuga tras revocación/otro tenant, si se habilitan; advisors sin findings críticos sin resolver |
| R01 | Restauración / integración | Dataset10.000 operaciones: hashes de balances/ventas/deudas/asignaciones iguales; mismo backup2 veces no duplica; tiempos/RPO documentados |
| R02 | Archivo malicioso / integración | Truncado, hash roto, negocio/epoch distinto, esquema futuro, tamaño excedido: cero cambios activos |
| R03 | Desastre / ensayo | Equipo perdido y todos equipos perdidos; sesión nueva, reautorización, recuperación independiente; pendientes sin copia identificados como irrecuperables |
| U01 | Estados / E2E móvil | 360/390/430px: offline, guardada local, pendiente, confirmada y review distinguibles; no falso «Sincronizado»; error conserva formulario |
| U02 | PWA / navegador | Actualizar SW con venta en borrador/outbox; ningún ID desaparece; assets offline disponibles; caché no sirve respuestas Auth obsoletas |

## Referencia ejecutable de esta PR

`node --test tests/architecture/contract.cases.mjs` ejecuta14 escenarios numéricos sobre un oráculo en memoria separado de `src/`: jornada, ARS, F01–F12 (sin F13) y F14, incluyendo idempotencia ilustrada y abonos. `reference-model.mjs` es una ayuda para revisar resultados esperados, **no** código de producción ni prueba de red, atomicidad, PostgreSQL, Dexie, RLS, cifrado, Auth o concurrencia real. La corrección del oráculo solo ilustra liberación de segmentos y no implementa reintentos de corrección. Seguridad/recuperación siguen pendientes de entorno aislado.

Los4 tests existentes Vitest son demo. Typecheck y build prueban que la demo sigue compilando. No se reporta QA móvil real nuevo ni deploy. El workflow de PR propuesto solo verifica: no posee permissions Pages ni job deploy.

## Primera vertical mínima recomendada

**Producto manual → recepción real de lote y pago → venta en efectivo con FIFO → outbox durable → confirmación/pull.** Un solo producto basta para el recorrido, pero modelo acepta múltiples líneas. Ganancia desconocida/discrepancia se muestra desde el primer día. Se reutiliza UI existente y se separa modo demo de entorno funcional aislado; ningún fixture demo entra en negocio.

| Checkpoint | Entrega / gate |
| --- | --- |
| V0 local, siguiente PR | Tipos y validadores, funciones exactas de jornada/FIFO, repositorios Dexie, transacciones y outbox; fake-indexeddb para fallos y navegador real para reinicio; sin recursos remotos |
| V1 local | Alta producto/objetivo, recepción y efectivo, carrito durable, una venta y estados; tests dominio+IDB+E2E; UI conserva flujo Cobrar directo |
| V2 aislado tras autorización | Crear entorno/dataset vacío, Auth/enrolamiento, migrations revisadas, RPC/RLS y lectura incremental; ejecutar todos gates L/S/A relevantes |
| V3 multi-equipo | Dos navegadores/3–4 teléfonos, F03,100 reintentos, actualizaciónPWA y recuperaciónR01–R03; medir latencia y visibilidad de revisiones |
| V4 QA de usuario | Verificar cifras, móvil real y políticas pendientes; recién solicitar autorización de merge/despliegue operativo |

No separar una pantalla bonita de sus efectos: cada checkpoint conserva datos, maneja fallos y tiene criterio verificable. Fiados/mixto/correcciones completas/reclamos/conteos/movimientos quedan para verticales siguientes, con contratos ya previstos; no mostrar controles como funcionales antes de tener transacción. Escáner, importador proveedor, fotos externas, proyecciones y PDF se postergan.

Riesgos principales: serialización por negocio limita throughput (medir, no optimizar prematuramente); clocks offline no fiables; datos locales pueden perderse por OS; recuperación requiere custodia independiente; policy de exceso de abono y reemplazos debe revisarse; no costear faltantes automáticamente; planes de Supabase desconocidos; dependencias demo heredadas requieren revisión antes de activar producción.

## Comprobaciones ejecutadas en esta misión

- `npm ci --no-audit --no-fund`: instalación limpia desde lockfile, exit0. Runtime local Node24.19.0/npm11.9.0; workflow usa Node22 (resultado remoto se verifica en PR).
- `node --test tests/architecture/contract.cases.mjs`:14/14 escenarios de referencia pasan.
- `npm run typecheck`, `npm test` (4/4 tests demo) y `npm run build`: comprobaciones de scaffold, sin servidor ni datos reales.
- `git diff --check` y resolución de links relativos nuevos: sin errores.
- Diff de `src/`, assets, Vite, package.json y workflow deploy: vacío. `master` remoto continúa en base `f0c7970372be61aceecdaa345b4b73c576a474b0` antes de publicar la rama.

Observaciones de herramientas: npm avisa dependencia transitiva `glob@11.1.0` obsoleta; revisión de dependencias antes de producción, sin actualización indiscriminada aquí. Vite advierte que URL absoluta del fondo se resuelve en runtime; asset existe en public y dist. No se realizó auditoría de vulnerabilidades ni QA móvil nuevo. Los checks locales no certifican el backend diseñado.
