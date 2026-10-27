# Entrega funcional controlada · 27/10/2026

Rama `work/v2-construccion-plano-maestro`, base `master` `90264e5`. PR documental #12 consultada en `f3eba1f`, sin fusionarla ni modificarla. Ambos heads se verificaron nuevamente al cerrar esta entrega. No se recuperó `e53fa66`. No hubo merge, despliegue, backend ni manipulación de datos de producción.

Esta entrega completa recorridos independientes de venta en efectivo, inventario, gastos/aportes y reposición. **No equivale a completar todas las operaciones financieras del plano ni a una aprobación visual final.** Las exclusiones se explicitan abajo.

## Auditoría e investigación

La [matriz de trazabilidad](README.md) clasifica fuentes, conflictos y resolución; el [inventario](inventario-fuentes.tsv) identifica documentos/imágenes del corte revisado. El núcleo previo ya ofrecía comandos idempotentes, efectivo/FIFO, gastos/aportes, conteos y backup. Faltaban la navegación acordada, separación de áreas, preparación durable de compras y circuito del proveedor.

El encargo posterior autoriza implementar sin esperar nuevas maquetas. Conserva requisitos de calidad y excluye propuestas visuales rechazadas. Los textos antiguos de Supabase/demo no dirigen esta implementación.

[Investigación y sistema visual](sistema-visual.md): referencias originales abiertas, fuentes W3C, Apple HIG, NN/g, Shopify POS, Square y Loyverse; decisiones sobre jerarquía, divulgación progresiva, prevención de errores y controles táctiles. Un solo kit, carbón/fucsia, cuadrado pequeño de marca, títulos expresivos, filas compactas y superficies sobrias. Sin fotos de variantes inventadas ni estado de sincronización ficticio. La adaptación sigue siendo revisable por Yamil.

## Qué funciona y dónde se guarda

| Módulo | Recorrido y registro real | Archivos principales / evidencia |
| --- | --- | --- |
| Navegación | Inicio/Ventas/+ venta/Caja/Más; directorio raíz; retorno contextual; filtros y detalle; modales con Atrás/Escape | `App.tsx`, `app/navigation.ts`, `Dialog.tsx`, `BusinessScreens.tsx`; `ux-refoco.e2e.ts` |
| Productos e Inventario | Alta/edición/desactivación, favoritos, búsqueda/categorías, objetivo y alertas 20/10 %, conteo físico CAS con historial | Núcleo preservado; Inventario separado; `local-flow`, `movements` y pruebas de stock/conteos |
| Venta | Borrador durable, consulta sin agregar, carrito opcional, efectivo/vuelto, FIFO exacto, comprobante/historial; reintentos con mismo ID | `LocalService`, App, forms; fallos IDB, dos pestañas, doble toque y recarga |
| Caja | Resumen por jornada, movimientos vinculados, gasto/aporte real, variación acumulada de efectivo; saldo contado no informado | `BusinessScreens.tsx`, `MovementForms.tsx`, `projections.ts`; backup y movimientos offline |
| Lista del proveedor | Texto original, equivalencias humanas locales revocables, revisión de costo/precio, cambios seguros preseleccionados; confirmación de precios por lote atómico | `domain/suppliers.ts`, `local/suppliers.ts`, `app/Suppliers.tsx`; `suppliers.test.ts` y e2e |
| Pedidos | Borrador editable, cantidades por pack, costo de referencia opcional, texto WhatsApp, marcado enviado explícito y cancelación que conserva entregas | `domain/planning.ts`, `local/planning.ts`, `app/Orders.tsx`; planning/unit y orders/e2e |
| Recepción | Borrador antes de confirmar; entrega multiproducto/parcial; unidades y costo pagado real; un egreso por recepción, lote por línea, saldo pendiente | `Replenishment.tsx` y transacción existente `ReceivePurchase`; fallos/reintentos/rollback y restauración |
| Reportes | Hoy/7 jornadas/mes seleccionado, ganancia FIFO con cobertura, meta mensual opcional, informe imprimible con movimientos separados | `MonthlyReport.tsx`, proyecciones; selección mensual persistida en ruta, `orders.e2e.ts` |
| Datos | Esquema Dexie 6 aditivo; backup 4 completo; lectura de formatos 1/2/3; restauración sólo en base vacía con validación semántica | `database.ts`, `backup.ts`; pruebas de migración, manipulación y restauración en otro perfil |

La lista y el pedido no crean stock ni dinero. El costo de lista es referencia; sólo el costo real confirmado en recepción entra en FIFO. Los nuevos precios no reescriben ventas ni borradores anteriores. Cambiar un producto mientras se revisa un lote de precios bloquea el lote entero, sin aplicación parcial.

## Validación ejecutada

| Verificación | Resultado |
| --- | --- |
| TypeScript y build de producción | Correctos; PWA generada, base `/mora-vineria/` |
| Vitest | **155/155** con un worker; incluye persistencia, recuperación, migraciones y backup |
| Oráculos de arquitectura | **14/14** |
| Chromium / Playwright | **20 recorridos verificados**: 18 pasaron en la corrida integral; dos esperaban esquema/backup anterior. Actualizadas únicamente esas expectativas, ambos pasaron completos en la repetición dirigida |
| Formularios tras último ajuste visual | 4/4 recorridos dirigidos: pedidos, recepción multiproducto y proveedor; foco/scroll del formulario a 360×420, además de 360/390/430 |
| Offline | Service Worker real, red cortada en navegador; borradores, ventas, listas, pedidos, recepción y restauración |
| Impresión | Vista real, estilos print y llamada a `window.print()`; no se afirma haber guardado un PDF en el sistema del usuario |
| QA visual | Capturas de la app renderizada con datos aislados; revisión de inicio/venta/cobro/productos, pedido parcial, informe y proveedor |

Los [logs](verificacion/) conservan también los fallos de expectativas de versión y su resolución. Chromium Headless Shell 141 ejecutado mediante `MORA_CHROME` con runner Playwright 1.64: el navegador previsto por el runner no se pudo descargar correctamente. WebKit no se pudo ejecutar por bibliotecas de sistema ausentes. Safari/Android físicos, teclado virtual real y guardado PDF del sistema siguen pendientes; no se atribuyen al QA automático.

## Prueba manual sugerida

Usar un perfil vacío o datos de QA; conservar un backup del perfil habitual antes de una futura actualización autorizada.

1. Más → Productos: crear «Vino Malbec», precio $3.500, objetivo 24. Cerrar confirmación.
2. Más → Reposición: pegar proveedor «QA» y `VM x6 21000`. Revisar artículo, asociar Vino Malbec y confirmar presentación/importes; guardar equivalencia. Revisar y confirmar el precio propuesto $5.500.
3. Pegar una lista nueva `VM x6 24000`: se reconoce la equivalencia y el precio propuesto cambia a $6.000. Sólo cambia al confirmar.
4. Preparar pedido desde esa lista: se sugieren cuatro packs de seis cuando stock es cero. Editar a dos packs, guardar y marcar enviado. El texto de WhatsApp se abre para revisión/envío humano.
5. Recibir seis unidades por $24.000. El pedido queda parcial; stock +6 y un egreso de $24.000. Recargar y recibir las seis restantes con su costo real. No reutilizar el total estimado sin comprobarlo.
6. Nueva venta: agregar una unidad, cobrar efectivo y recargar. Debe existir una sola venta. Revisar stock, FIFO e historial; el cambio de precios previo no modifica registros anteriores.
7. Caja: registrar gasto y aporte; revisar movimientos y acumulado identificado como variación, no efectivo contado.
8. Reportes → Mes: guardar meta y abrir informe/impresión. Exportar JSON y restaurarlo en otro perfil vacío; comprobar catálogo, pedidos, equivalencias, movimientos y meta.

## Pendientes y clasificación explícita

| Función | Clase / motivo real | Qué permite avanzar |
| --- | --- | --- |
| Cuentas, traspasos y retiros | **B pendiente técnico financiero**, con decisiones C para bases/conciliación. El núcleo vigente tiene un ledger de efectivo sin cuentas; implementar sólo botones o asignar bancos a dinero histórico inventaría información. 24/26 presentan la concreción precisa como propuesta | Etapa conjunta de cuentas y migración: atribución del efectivo histórico preservada, bases desconocidas explícitas, movimientos pares atómicos, retiros separados, reversión y backup. Confirmar cómo se fija/verifica una base inicial y cómo tratar diferencias; no hace falta rediscutir la necesidad de mover dinero |
| Transferencia y mixto | Concepto aprobado; **B pendiente de modelo seguro**, dependiente de cuentas. No se atribuye a efectivo un pago bancario | Partes de cobro atómicas, confirmación humana de acreditación, conciliación con journal/backup y pruebas de reintento. Sin integración bancaria |
| Fiados y abonos | **C** en resolución de cobros concurrentes/correcciones; nombre y deuda simple sí están acordados | Cerrar tratamiento de un pago físico que entra en conflicto con saldo/versiones y su recuperación; luego implementar deuda/abono/venta sin doble ingreso |
| Correcciones de venta, recepción o costo histórico | **C**: devolución/cobro real, mercadería físicamente devuelta y FIFO consumido son hechos distintos | Adoptar política compensatoria y reconciliación del FIFO ya consumido; conservar historia, nunca editar ventas antiguas en silencio |
| Proyección automática | **C**: no hay cobertura de jornadas; «sin ventas» no demuestra «día registrado en cero» | Elegir registro de días/cierre o criterio explícito de cobertura. La muestra de siete jornadas de 24 es propuesta; meta e informe operan sin proyección |
| Dispositivos reales / aprobación visual | Verificación pendiente, no funcionalidad falsa | Revisar Android/Safari, teclado y PDF; decidir ajustes visuales sobre capturas reales |
| Backend, sincronización, roles, OCR/lector no aprobado, facturación, visual e53fa66 | **D**, excluidos | Fuera de esta entrega |

La categoría B financiera se declara pendiente, no completada ni transformada en una supuesta decisión comercial faltante. La misión permite entregar partes independientes de valor cuando no puede demostrarse un circuito monetario completo. El próximo trabajo debe abordar ese conjunto como una unidad con migración y pruebas; no activar medios de pago parciales.

## Continuidad

No instalar una versión antigua de la app sobre una base migrada a esquema 6: los clientes anteriores no comprenden las tablas nuevas ni el formato 4. Para una revisión paralela, usar perfiles separados. La restauración de respaldos antiguos en la versión nueva sí está cubierta.

La PR de implementación se entrega para revisión y futura autorización de merge/deploy. La PR #12 conserva su función documental y su historia.
