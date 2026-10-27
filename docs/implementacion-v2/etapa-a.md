# Etapa A · navegación y operaciones integradas

- Cinco accesos; Ventas es historial y + abre el borrador real. Más siempre abre el directorio. Productos, Inventario y Reposición son hermanos.
- Header compartido en dos franjas y marca con cuadrado pequeño. Filtros, detalle y desplazamiento vuelven con navegación nativa. Enlaces profundos tienen retorno interno. Dialog nativo mantiene foco y cierra con Atrás/Escape.
- Inventario integra conteos CAS e historial de stock. Caja separa Resumen/Movimientos/Cuentas con gasto/aporte reales y variación identificada; no inventa saldos bancarios ni efectivo contado.
- Reposición registra varios productos en una transacción `ReceivePurchase`; reabrir una confirmación conserva todas las líneas. Un lote por línea y un único egreso; no se agregaron comandos monetarios.
- Sin ilustraciones que aparenten fotos de una variante: placeholder neutral. Filas de producto, superficies sobrias, controles táctiles y barra de cobro independiente del dock.

## Verificación

Base: 142 Vitest y 14 oráculos de arquitectura pasaron antes de cambios. Tras integrar: build/typecheck y 17 Playwright Chromium pasaron (55,6 s). Incluyen stock 20/10 %, venta sin costo, CAS, error IDB, rollback, reintento en dos pestañas, doble toque, migración desde base antigua, backup PR9, restauración en perfil vacío y operación offline. Prueba nueva multiproducto: 6 unidades por $125.000 conservan costo `62500/3`; segundo producto y egreso total único de $135.000, aun tras fallo y reintento.

Capturas en `capturas/` provienen de la aplicación real, con datos QA aislados. Revisadas Nueva venta 390, Cobro 360 y Productos 430; los recorridos verifican ausencia de desbordamiento a 360/390/430 y escritorio. No son aprobación estética del usuario. El teclado nativo y Safari físico requieren revisión en dispositivo; el viewport reducido no los sustituye.

Chromium de Playwright 1.64 no pudo descargarse (archivo inválido); QA ejecutado con Headless Shell 141/Playwright 1.56.1 mediante `MORA_CHROME`, manteniendo runner 1.64 y lock del proyecto. WebKit se descargó pero faltan bibliotecas de sistema: no se declara probado.

La persistencia del carrito de recepción **antes** de sellarlo y el circuito de pedidos se tratan en la siguiente etapa. Lo aquí confirmado ya usa el slot durable existente. Esta etapa no declara toda la misión terminada.
