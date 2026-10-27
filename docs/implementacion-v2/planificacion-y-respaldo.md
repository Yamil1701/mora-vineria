# Planificación durable y recepción · decisión técnica B

Fuentes: planos 20 §§5h–5l, 24 §§2/4 y 26 §§3/5. Pedidos persistentes, parcialidades, metas y respaldo están aprobados conceptualmente. Esta concreción no agrega compras a crédito ni un medio de pago nuevo.

- Pedidos y borradores de recepción son preparación: nunca escriben stock, lotes ni caja. Se guardan en tablas separadas, con versión para rechazar ediciones concurrentes.
- Pedido editable mientras es borrador; enviado se conserva como referencia inmutable. Estado parcial/recibido se deriva de recepciones confirmadas. Cancelar conserva lo ya recibido. Compartir texto no marca enviado.
- Recepción: cantidades individuales realmente entregadas y total real por producto; conservar racionales FIFO. No redondear costo unitario ni deducir pago desde un presupuesto. Parcialidades no pueden superar el saldo del pedido: el excedente se registra como recepción independiente, explícita.
- El comando `ReceivePurchase` existente sigue siendo el único origen monetario. La vinculación del borrador/pedido se consume en **la misma transacción** que sus efectos. IDs estables y mismo slot durable para reintentar. Una recepción antigua sin planificación sigue siendo válida.
- Esquema aditivo 5: pedidos, borradores de recepción y metas mensuales. Backup formato 3 valida todo el journal anterior sin modificarlo, además de relaciones de planificación, versiones y límites. Formatos 1/2 migran sólo en memoria tras validar sus hashes. No se vacían bases con datos.
- Meta: importe entero ARS para un mes comercial, editable y opcional. No altera ventas ni ganancias. Informe mensual usa registros del mes, su cobertura de costos y movimientos separados.
- Proyección automática pendiente: el journal no distingue un día sin operaciones de un día no registrado. No se inventa cobertura ni se presenta como aprobada la muestra propuesta de 7 jornadas.

Estos son criterios de implementación, no evidencia de pruebas terminadas. Los resultados se registran en la entrega.

## Resultado de la etapa

Implementados pedidos por presentaciones, referencia de costo opcional, texto de WhatsApp con envío humano, marcado enviado explícito, parcialidades, cancelación no destructiva, borrador de recepción con guardado incremental y CAS, meta por mes y vista imprimible. No se comunica un costo ausente como cero. La entrega parcial deja saldo y conserva un egreso por recepción.

Verificación: 148 Vitest, 14 oráculos de arquitectura, typecheck/build y 19 recorridos Playwright Chromium completos. Las nuevas pruebas cubren compras parciales offline, borrador previo a sellado tras reload, reintentos paralelos, reversión ante fallo de pago, exceso de cantidad rechazado sin efectos, restauración de vínculo/meta y manipulación resignada de cantidades. Revisadas capturas reales de pedido parcial 360 y vista de impresión; sin scroll horizontal a 360/390/430. El botón de impresión invoca `window.print()` y se verificó el CSS de impresión; no se simula que un usuario haya guardado un PDF desde su sistema.
