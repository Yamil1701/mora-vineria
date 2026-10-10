# Dominio y operaciones

Propuesta técnica basada en reglas confirmadas. Los nombres internos no son etiquetas de UI.

## Tipos, claves e invariantes

IDs UUID aleatorios generados antes del commit local; no usar `Date.now()` como identidad ni secuencia global. Todas las filas del negocio tienen `business_id`; PK/UNIQUE `(business_id,id)` y FKs compuestas impiden referencias cruzadas. Tablas de control de acceso tienen identidad propia. `revision` bigint servidor viaja como string decimal, no Number inseguro.

`registered_at` instante de carga ISO UTC, `timezone='America/Argentina/Salta'`, `business_date` calendario local: antes de 08:00, día anterior; exactamente 08:00, ese día. `accepted_at` es distinto. El servidor deriva jornada del instante original, no de reconexión. Conservar hora declarada y desviación frente a último ancla temporal servidor; si hay duda, crear revisión, nunca mover jornada silenciosamente. Corrección de jornada requiere comando auditado. Orden FIFO no usa reloj local.

Precios, cobros, gastos y pagos: ARS enteros no negativos; negativos solo en asientos compensatorios. Validar entero seguro y overflow en cada suma/producto; persistencia bigint con límite contractual <= Number.MAX_SAFE_INTEGER, rechazando totales que excedan. Cantidades vendibles: enteros positivos en líneas; stock proyectado sí puede ser negativo. Costos de bulto fraccionarios: racional `cost_numerator_ars / cost_denominator_units` positivo, cálculo BigInt; serialización decimal string. Nunca truncar un pack a costo unitario entero. `null/unknown` no equivale a costo cero.

## Modelo relacional

| Entidad | Campos esenciales y relaciones |
| --- | --- |
| businesses | id, timezone, contract_version, dataset_epoch; reloj de revisión en fila bloqueable |
| devices / memberships | device_id, business_id, auth_user_id, session_id, enabled/revoked/expiry, autorizador; mismo permiso funcional |
| categories | id, nombre, activo, versión; categoría producto opcional como propuesta, sin catálogo precargado |
| products | id, nombre, variante, category_id, precio ARS, objetivo nullable, activo, versión, foto verificada opcional; stock/costo no se editan aquí |
| purchase_presentations | producto, proveedor, alias, unidades por bulto verificadas; valores concretos copiados a recepción |
| purchase_orders / lines | pedido, producto, unidades pedidas, costo orientativo, estado; no efecto financiero/stock |
| receipts / lines | recepción parcial independiente, pedido nullable, unidades aceptadas/defectuosas, costo total real, payment_id, emergency; acumulados contra pedido |
| lots | producto, receipt_line/opening_id, cantidad, valor racional, fifo_seq, disponibilidad vendible/reclamo; lote no cambia costo retroactivamente |
| sales / sale_revisions / sale_lines | venta, revisión, precio referencia y cobrado, cantidad, total, jornada; historial inmutable, revisión vigente explícita |
| payments | venta/abono/compra, cuenta, monto, método, verificación humana para transferencia, comando origen |
| customers / debts / debt_entries | nombre simple, venta fiada, aumentos/disminuciones; sin límites/vencimiento automáticos; cliente UUID, no fusionar por nombre |
| accounts / cash_entries | efectivo, Brubank, MP, NX; asientos firmados y origen; solo fondos atribuibles al negocio |
| stock_entries | producto, delta, motivo, source_command, lote/revisión nullable; ledger append-only |
| cost_allocations / allocation_reversals | sale_line/loss, lot_id, unidades, costo racional histórico, versión, referencia reversión |
| supplier_claims / replacements | origen defectuoso, cantidad/valor retenido, unidades reemplazadas, vínculo a recepción; no segunda compra |
| stock_counts / cash_counts | medición real, instante, revisión base y alcance; observar no significa ajustar |
| reviews / review_resolutions | tipo, entidades afectadas, evidencia, pendiente/resuelto, comando resolución; cierre exige efectos verificables |
| commands / command_results | ID, hash canónico, equipo/secuencia, payload/version, resultado definitivo, revisión |
| audit_events / change_batches | comando, origen autenticado, antes/después o efectos, revisión, datos de replicación |
| backup_manifests | dataset, esquema, revisión, hashes, fecha; no secretos ni tokens |

No es un ERP: estas entidades respaldan operaciones simples, no exigen una pantalla por tabla. FK con RESTRICT para historial; ningún cascado elimina ventas o ledgers. Índices: `(business_id,revision)`, `(business_id,product_id,fifo_seq,id)`, `(business_id,business_date)`, `(business_id,sale_id)`, `(business_id,auth_user_id,session_id)`, comando único y equipo/secuencia únicos. Medir antes de agregar índices extras.

## Comandos separados de proyecciones

Cada comando declara tipo, payload completo, dependencias, versión esperada cuando corresponde y motivo de corrección. El servidor calcula totales, no acepta stock/saldo/ganancia enviados por cliente como autoridad.

| Comando | Validación y efectos atómicos |
| --- | --- |
| CreateProduct / EditProduct / DeactivateProduct | Nombre, precio, objetivo; compare-and-set versión para ediciones; conflicto conserva ambas propuestas; con historial solo desactivar |
| RecordOpeningStock | Cantidad física y costo conocido/desconocido; lote de apertura, asiento stock; no fabricar compra/salida caja histórica |
| ReceivePurchase | Cantidades reales/presentación, costo y pago realizado; recepción+lote+stock+salida cuenta; pedido pendiente no tiene efecto; parcial no replica pago anterior |
| RecordSale | Líneas con snapshots de nombre/precio; monto de cobros + deuda = total; cliente si deuda; efectivo recibido opcional >= parte efectivo; transferencia exige confirmación humana + cuenta; registra stock/cobros/deuda/FIFO o revisión |
| AmendSale | expected_sale_revision, motivo, versión nueva; efectos compensatorios stock/dinero/deuda/costo, sin borrar originales; conflicto devuelve revisión vigente; no reintegro comercial implícito |
| RecordDebtPayment | pago físicamente recibido, debt_id, cuenta; cobro independiente, reduce deuda; concurrencia excesiva conserva dinero y crea crédito no aplicado/revisión, nunca inventa devolución |
| RecordMovement | aporte/retiro/ahorro/gasto/traspaso; motivo; traspaso dos asientos suma cero; no ingreso venta; saldo insuficiente genera revisión si ocurrió físicamente |
| RecordLoss | Baja física y costo FIFO si conocido, motivo; no venta ni salida caja adicional; valoración económica excepcional necesita revisión |
| RecordCount / ResolveStockDifference | Medición no sobreescribe stock; ajuste exige base vigente, delta explicable y costo conocido/desconocido; si cambió base, conflicto/recuento nuevo |
| RecordSupplierClaim / ReceiveReplacement | Retener unidades/valor reclamados, reemplazar hasta cantidad pendiente, cero pago adicional; valoración propuesta en documento FIFO |
| ResolveReview | Evidencia, referencias y efectos compensatorios explícitos; no un botón que cambia solo estado |

Productos inactivos/desconocidos al sincronizar una venta física: conservar payload y revisar vinculación; no borrar venta. Los comandos inválidos estructuralmente se mantienen en cuarentena local y no alteran ledgers oficiales. Reposiciones dependientes de alta local esperan su comando padre; no ocultar bloqueo.

## Corrección de ventas y abonos existentes

Revisión original permanece; cantidades/precios vigentes determinan ventas, no la suma bruta de todas las revisiones. Se compensan solamente diferencias de dinero realmente registradas. Si cambia cuenta, se revierte asiento previo y se crea correcto. Si se reduce venta fiada por debajo de abonos recibidos, conservar cobros y generar exceso no aplicado/revisión; no deuda negativa oculta ni devolución automática. Cambiar de efectivo a fiado revierte cobro mal registrado, no supone entregar billetes: pedir confirmación de hechos y motivo. Auditoría registra dispositivo y sujeto autenticado, sin afirmar quién sostuvo un teléfono compartido.

## Proyecciones e indicadores

Ventas = suma de totales de revisión vigente por jornada (incluye fiado). Cobros = entradas efectivas de venta y abonos, sin aportes ni traspasos. Deuda = cargos − abonos aplicados. Stock registrado = suma de asientos, incluidos negativos. Disponible esperado = apertura verificada + asientos de cuenta; sin apertura, saldo absoluto desconocido, sí variación conocida. Conteo real fechado separado; comparar con esperado **a la revisión/instante del conteo**, no con actividad posterior.

Ganancia bruta FIFO = venta − costo asignado solo con cobertura completa. En período incompleto mostrar subtotal de operaciones costeadas + cobertura y pendientes, nunca llamar ganancia total al subtotal. Resultado tras pérdidas/gastos los resta una vez; compras de inventario, retiros, ahorro y aportes no se restan como gasto de ganancia bruta. Promedio secundario excluye asignaciones consumidas; si quedan unidades de costo desconocido, promedio completo desconocido. Alertas requieren objetivo y porcentajes aprobados/configurados: no precargar 10/20/30%. Sugerencia `ceil((costo * 3/2)/500)*500`, costo base explícito revisable, jamás actualiza precio por recepción.
