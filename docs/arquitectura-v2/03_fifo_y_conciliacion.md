# FIFO exacto y conciliación

FIFO está aprobado; su **orden concurrente y política de conciliación son propuestas técnicas**. Recomendación: serialización por negocio, lotes por `fifo_seq` de recepción aceptada y desempate UUID; ventas por orden de aceptación servidor. Dentro de un comando, línea ordinal estable. No prometer orden cronológico físico entre teléfonos desconectados.

Alternativa por hora local obliga a recalcular historia ante llegadas tardías y relojes manipulables. Se rechaza como recomendación técnica, no como decisión del usuario. Una recepción offline enviada después de una venta no reordena automáticamente ganancias históricas.

## Asignación

En transacción, por producto consumir cantidades disponibles de los lotes elegibles más antiguos; registrar cada segmento `(line_id,lot_id,units,cost_rational)`. Lote desconocido **sí consume unidades**, pero su costo queda unknown; no saltarlo para elegir otro más barato/conocido. Si faltan unidades, registrar `unallocated_units` y review, stock negativo permitido. No crear lote cero ficticio. Ganancia de línea solo calculable si todas las unidades tienen costo conocido y no falta asignación; offline estimación siempre provisional.

Costo real fraccionario: pack $125.000 / 6 = `125000/6` ARS por unidad. Tres unidades cuestan $62.500 exactos; seis $125.000. Sumar racionales exactamente antes de presentar importe redondeado en UI; conservar racional para reportes. Pack y unitario contradictorios del fixture requieren elección humana de costo real, no dos costos simultáneos. Cero costo válido solo con justificación de entrada sin cargo; no usar cero para desconocido ni reemplazo que conserva valor anterior.

Conservación por lote: unidades disponibles + asignadas activas + retenidas/reclamadas/bajas = unidades ingresadas, considerando transferencias de valor y compensaciones identificadas. Stock físico registrado y reserva contable de costo son proyecciones distintas cuando hay faltantes pendientes; esa diferencia permanece visible.

## Correcciones y conciliación explícita

Cambio solo de precio mantiene asignaciones; no recalcula costo por precio nuevo. Reducción de cantidad libera los segmentos de la línea desde el final, con reversal append-only; incremento asigna FIFO disponible al aceptar corrección. Cambio de producto revierte stock/asignación del anterior y asigna nuevo. Sin replay global de ventas ya confirmadas. Una recepción y una corrección concurrentes se serializan: cualquiera de los órdenes válidos queda auditado; reintentos mismos IDs no alteran resultado.

Liberar unidades no reescribe costo de ventas posteriores. Pueden existir unidades liberadas de lote antiguo para próximas operaciones. Conciliación de faltantes necesita comando explícito con reviews, unidades y evidencia; asigna FIFO disponible a pendientes por revisión original más antigua entre los seleccionados y guarda nueva versión de costo. No elimina versiones previas ni cambia el cobro/jornada. No atribuir una compra nueva a venta anterior sin confirmación de que explica el faltante; un recuento ajusta stock, no prueba costo histórico.

Corregir costo de recepción ya consumida: propuesta de ajuste de valor con segmentos compensatorios en operaciones afectadas, historial de reportes y motivo, nunca UPDATE silencioso. Se excluye de primera vertical hasta validar política y tests.

## Escenarios reproducibles

Cada escenario parte de un dataset aislado y nuevo, precios en ARS.

| ID | Preparación y operaciones | Resultado verificable |
| --- | --- | --- |
| F01 aprobado | A:10×2000, B:10×2500; ventas 6×3500, 4×4000, 3×4000 | Costos 12000,8000,7500; ganancias 9000,8000,4500; A agotado, B=7 |
| F02 cruce | A:2×2000, B:3×2500; venta 4×4000 | Segmentos A2=4000+B2=5000; costo9000; ganancia7000; B=1 |
| F03 dos equipos | A:1×2000; X e Y venden 1×3500 offline; X aceptado primero | 2 ventas, cobros7000, stock−1; X costo2000, Y sin asignar1/ganancia desconocida; con orden invertido Y recibe costo; misma pérdida física preservada |
| F04 faltante | Sin lotes, venta2×3500 | Venta7000, stock−2, costo null, review2; no ganancia7000 ficticia |
| F05 agotado | A:2×2000; venta2 y otra1 | A0; segunda sin costo; reenviar no revive lote |
| F06 corrección | A:2×2000, B:2×2500; venta3×4000; corregir a1 | Original costo6500; reversión B1 y A1 por4500; costo vigente2000, venta4000; A1+B2 disponibles; stock+2; pago corregido−8000 si cobro originalmente mal anotado |
| F07 precio | Venta1 de A a3500; precio catálogo pasa4000 | Venta anterior ganancia1500; siguiente de A ganancia2000; catálogo no reescribe historia |
| F08 parcial | Pedido2 fardos×8, total pactado32000; recepción8/pago16000, luego8/pago16000 | Primera stock8/caja−16000, pendiente8; luego stock16/caja−32000; dos lotes, ningún efecto al pedir |
| F09 costo desconocido | Apertura2 unknown; B2×2500; venta3×4000 | Consume unknown2 y B1; costo/ganancia total null; cobertura conocida1, no saltar apertura |
| F10 100 reintentos | Lote10×2000; mismo RecordSale1×3500 enviado100 veces | Una venta, asiento stock−1, caja+3500, asignación2000, mismo resultado; mismo ID con precio distinto falla |
| F11 abonos paralelos | Deuda1000; X paga700 e Y paga700 físicamente | Cobros1400; deuda0; aplicado1000; exceso400 no aplicado/review; ningún abono se descarta, no segunda venta ni devolución automática |
| F12 racional | Pack6/$125000; venta3 | Costo62500 exacto; remanente62500; precio sugerido por costo unitario31500 |
| F13 conteo concurrente | Base stock5; conteo físico4 en revisiónR; otra venta1 antes del ajuste | Conteo se guarda como observación; ajuste contra versión vieja entra conflicto, no poner4 sobrescribiendo actividad |
| F14 tardío | Venta sin costo aceptada; luego recepción3×2000 | Nueva recepción no cierra review vieja ni asigna automáticamente; resolución explícita y evidencia crean nueva versión de costo |

## Defectos y reemplazo sin doble costo (propuesta)

Caso: compra6/$12000, una unidad defectuosa. Pago único12000; stock vendible5, lote5 con valor10000, reclamo1 con valor2000 retenido. Reemplazo1 sin cargo: stock+1, valor2000 pasa del reclamo a lote reemplazo, pago adicional0, valor total12000. FIFO del reemplazo sigue aceptación de su recepción, no fingir que estaba vendible antes. Si defecto se detecta después, retiro vendible y transferencia de valor son compensatorios. No tratar este caso como rotura propia ni pérdida económica definitiva.

Restricciones: claim con cantidad/valor pendiente bloqueados, reemplazo no puede excederlos; reintentar mismo comando es no-op. Reemplazo diferente, rechazo de reclamo o costo no conocido requiere revisión humana. Alternativa de reconocer pérdida y compensación posterior afecta informes: necesita decisión antes de activar ese flujo.

Rotura propia: lote3×2000, baja1 -> stock2, pérdida2000, cero venta y cero caja; futuras ventas solo consumen2. Consumo pagado usa venta. Excepciones no pagadas no se convierten en retiro valorizado sin regla aprobada.
