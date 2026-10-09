# Mora Vinería V2 — contratos de interfaz y ensamblaje (v0.1)

**Estado:** especificación técnica inicial, sujeta a prueba en móvil real. Las pantallas se derivan de referencias visuales existentes; **no generan mockups nuevos**. El frontend no es la fuente de verdad de ventas, pagos, stock o ganancias: recibe datos del dominio y solicita acciones que se validan en el flujo local/Supabase.

## Reglas transversales

- Sin backend confirmado, la UI puede renderizar borradores locales, nunca presentarlos como datos remotos finales.
- Cada acción crea un ID estable para evitar duplicación de ventas/abonos/movimientos al reintentar; la UI no fabrica resultados exitosos.
- Mostrar fecha de carga; jornada derivada 08:00–07:59. Hora local de operación y timestamp servidor deben diferenciarse si corresponde.
- En la jornada, mostrar **ventas** sin sumar abonos de fiados como ventas nuevas. Fiados pendientes no son entradas de efectivo.
- Impedir confirmación de **cobro por transferencia** hasta que el operador indique que observó la acreditación bancaria. No afirmar integración automática.
- La ganancia FIFO en dispositivos offline puede ser provisional hasta asignación confirmada a lotes; con costo desconocido, presentar «No calculable» y una tarea, no $0 ficticios.
- Correcciones de venta deben ser comprensibles pero auditables. No borrar historial de movimientos financieros ni de stock.
- Si stock registrado es 0 y físicamente se vende una unidad, guardar venta y crear **revisión de stock obligatoria posterior**; no inventar mercadería en la UI.
- Foco y estado de botones accesibles; 4 destinos de barra inferior. Sin textos técnicos en interfaz que no ayudan al usuario.

## 1. Inicio

**Fuente visual:** `inicio.webp`. **Prioridad:** ventas de hoy, ganancia estimada, productos para reponer. **Presentación:** `AppShell` + header de marca + `MetricCard` principal + ganancia secundaria + lista de faltantes + `MoraButton` Nueva venta + `SyncStatus` real.

**Datos mínimos:** jornada actual, facturación total de ventas de la jornada (incluye fiados como ventas), unidades/ventas, ganancia bruta FIFO estimada, estado de cálculo, productos cuyo stock está bajo según objetivo y configuración, operaciones pendientes y discrepancias.

**Acciones:** nueva venta, acceder a faltantes, abrir detalle de informe, acceder a caja/cuentas desde acceso contextual, revisar pendientes. **Estados:** sin ventas, sin productos, sin estimación FIFO confiable, offline, cambios pendientes, error de sincronización.

## 2. Ventas + Carrito

**Fuentes visuales:** `ventas.webp` y `prototipos-v2/carrito.webp` (solo prototipo).

**Composición:** búsqueda inmediata, productos más frecuentes, filtros secundarios simples, lista de productos y accesibilidad del carrito; `ProductRow`, `QuantityStepper`, `CartFooter` y precio editable de forma excepcional.

**Datos:** producto ID y variante, precio público, stock conocido, foto validada y cantidad seleccionada; cada línea de carrito con importe unitario mostrado e importe aplicado, cantidad y subtotal. No confundir «7 productos distintos» con «7 unidades».

**Acciones:** sumar/restar, eliminar, buscar/agregar, corregir precio, guardar borrador, ir a cobro. **Estados:** carrito vacío, búsqueda sin resultados, producto inactivo, costo/stock desconocidos, ingreso tardío, stock insuficiente y revisión posterior.

**Aceptación:** la acción de cobrar no aparece habilitada con carrito vacío; al cambiar cantidad se actualizan total y unidades de forma determinista. Navegar entre tabs no pierde carrito local.

## 3. Cobro

**Fuente visual:** `cobro.webp`.

**Modos:** efectivo (recibido opcional, vuelto calculado), transferencia (Brubank predeterminada, Mercado Pago/Naranja X alternativas, comprobación manual), mixto (importe y destino de cada parte) y fiado (nombre y saldo pendiente; parciales posteriores).

**Estados:** pendiente de acreditación, acreditación revisada manualmente, importe mixto incompleto, guardado local, pendiente de sincronización, confirmado remoto y discrepancia de stock/FIFO pendiente.

**Aceptación:** ningún botón simula acreditación bancaria. Si se entrega mercadería offline, la venta queda durable localmente y se concilia después. Una venta guardada no genera una segunda venta al repetir sincronización.

## 4. Productos y stock

**Fuente visual:** `productos.webp`. **Composición:** búsqueda, foto, nombre, variante, precio, cantidad y objetivo. Categorías simplificadas.

**Acciones:** agregar/editar producto, escanear código opcional tras verificar viabilidad, comprobar stock físico, ver lotes FIFO, desactivar producto con historial. Stock negativo o discrepante se maneja con revisión explícita, nunca se tapa con 0 en la interfaz.

**Alta inicial:** catálogo nuevo vacío; el usuario carga stock físico y su costo original o declara «costo desconocido». No importar por defecto datos V1.

## 5. Caja y cuentas

**Fuente visual:** `prototipos-v2/caja-cuentas.webp` (aprobada visualmente). `CashBalance` compara saldo esperado con efectivo **real contado y fechado**; si no hay conteo, la diferencia es «—», no cero. 

**Vista compacta:** Resumen | Movimientos | Cuentas. Mostrar saldo contado, esperado, diferencia, ingresos efectivos por origen, egresos reales y aportes externos. Detalles de ingresos/egresos/aportes **contraíbles** a pedido (usuario lo solicitó).

**Cobros:** fiado nuevo incrementa ventas y cuentas por cobrar, NO «dinero que entró». Abono posterior incrementa cobros y reduce deuda sin volver a incrementar ventas. Brubank distingue movimientos del negocio; Naranja X y Mercado Pago pueden ser cuentas mixtas, así que Mora no inventa saldo bancario total.

**Movimientos:** extracción/ahorro sale del negocio, aporte externo suma capital, compra de mercadería intercambia efectivo por stock, gasto excepcional sí se registra como tal, movimiento entre cuentas NO es venta ni ganancia.

**Estados:** sin conteo, diferencia positiva/negativa, fecha de conteo antigua, sin red, cobros pendientes y operación sincronizada.

## 6. Reposición / pedido al proveedor

**Origen:** «Para reponer» de Inicio/Productos. Esta es una **acción operativa secundaria**, no otra pestaña inferior ni otro tablero duplicado.

**Fila:** stock registrado y si fue verificado, objetivo manual por producto, necesidad sugerida `max(0, objetivo − disponible verificado)` cuando los datos son confiables, conversión a presentación habitual x4/x6/x8/x12, costo esperado de compra y cantidad **editable por el usuario**.

**Acciones:** preparar pedido, copiar texto WhatsApp, marcar enviado, recepción/pago en efectivo, confirmar cantidades efectivamente recibidas, agregar lotes FIFO al **recibir** y no antes. La compra de urgencia de cerveza es un registro extraordinario con costo real, no cambia precio al público automáticamente.

**Estados:** sin objetivos definidos, cantidad del fardo desconocida, precio de proveedor dudoso, pedido preparado, enviado, parcial y recibido. Nunca inferir precio inconsistente de texto de WhatsApp sin revisión humana.

## 7. Reportes

**Fuente visual:** `reportes.webp`.

**Datos:** período jornada/semana/mes, ventas, cobros, ganancia bruta FIFO calculable, fuentes de cobro, productos vendidos, objetivos y alertas de falta de stock; diferencias de caja visibles aparte.

**Estados:** período vacío, poca información para estimar tendencia, ganancia provisional FIFO, datos offline y comparación no disponible. No representar una subida respecto de ayer sin valores reales; no priorizar PDF mensual que nunca fue utilizado.

## 8. Pantallas contextuales que no requieren nuevos mockups previos

Fiados (lista por nombre y abonos), corrección de venta (auditoría bajo la UI), ajuste de stock (motivo), reclamo a proveedor (reposición sin doble compra), dispositivos/autorización/revocación y recuperación de datos. Construirlas reutilizando `AppShell`, `GlassPanel`, `MoraButton`, `SegmentedTabs`, `EmptyState` y controles de formulario existentes; **no** diseñar otro lenguaje visual independiente.

## Matriz mínima de integración y QA futura

| Caso | Resultado esperado |
| --- | --- |
| Venta en efectivo | Importe vendido y cobrado correcto, vuelto opcional |
| Transferencia sin comprobación | No declararla cobrada |
| Pago mixto | Partes suman total sin duplicar venta |
| Venta fiada + abono | Venta única, abono como cobro independiente |
| Dos dispositivos venden offline la última unidad | Conservar ventas reales, marcar desajuste, no inventar costo FIFO |
| Corrección de venta | Efectos compensatorios auditables en dinero/stock/FIFO |
| Reposición enviada, no recibida | Sin cambios de stock/dinero |
| Recepción de 2 fardos x8 | 16 unidades en lote con costo real |
| Compra de cerveza de urgencia | Costo propio, sin actualizar precio público por sí solo |
| Ahorro extraído | Baja dinero del negocio, no un segundo gasto de mercadería |
| Caja sin conteo reciente | Saldo real y diferencia no inventados |
| Modo offline + reinicio | Borrador y cola persistentes, estados explícitos |
| Fondo o blur no compatibles | Lectura y uso preservados |

**Orden de implementación recomendado:** scaffold Vite/TS/Tailwind, integrar el UI Kit y probar render/responsive; luego conexión local (Dexie), catálogo/FIFO, ventas/cobros, offline/Supabase, movimientos/reposición y reportes. Los contratos técnicos del servidor deben aprobarse antes de habilitar sincronización real.
