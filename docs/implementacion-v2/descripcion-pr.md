# Mora V2: operación móvil integrada y reposición durable

**Base:** `master` · **Head:** `work/v2-construccion-plano-maestro` · **Modalidad:** borrador, sin merge ni despliegue.

La aplicación tenía un núcleo local real, pero sus recorridos no reflejaban la navegación acordada y no permitían completar lista de proveedor → pedido → entregas parciales. Esta rama integra ese circuito y conserva ventas, FIFO, IDs y recuperación existentes.

## Cambios

- Inicio / Ventas / + venta / Caja / Más, retorno contextual y áreas independientes de Productos, Inventario y Reposición.
- Caja con gastos/aportes reales y variaciones identificadas; conteos de stock con control de concurrencia.
- Listas de proveedor conservadas, equivalencias humanas revocables, comparación de costos y cambios de precios atómicos tras revisión.
- Pedidos guardados, texto para WhatsApp con envío humano, entregas parciales y recepción multiproducto: un pago por entrega, FIFO según costo real.
- Borradores de recepción, metas mensuales, informe imprimible y respaldo completo. Esquema 6 / backup 4, con migración validada de formatos anteriores.

## Validación

TypeScript y build correctos; **155 Vitest**, **14 pruebas de arquitectura** y **20 recorridos Chromium verificados**. La corrida integral pasó 18; dos expectativas de versión se actualizaron y ambos recorridos pasaron completos al repetirlos. Los cuatro recorridos de formularios afectados por el último ajuste visual también pasaron.

QA real a 360/390/430, operación offline, recarga/reintento/doble toque, fallos de almacenamiento, FIFO exacto, migración y restauración en perfil vacío. Chromium Headless Shell 141 con runner 1.64; WebKit y teclado móvil físico pendientes por limitaciones del entorno. Impresión verificada con `window.print()` y CSS print, no guardado PDF del sistema.

## Límites de esta entrega

No se implementan cuentas/traspasos/retiros, transferencia/mixto, fiados/abonos ni correcciones históricas parciales. Se documentan dependencias y decisiones pendientes; Caja no simula saldo contado ni bancario. Proyección pendiente de cobertura de jornadas. Sin backend, sincronización ni datos ficticios en operación normal.

[Entrega y prueba manual](entrega.md) · [Trazabilidad](README.md) · [Sistema visual e investigación](sistema-visual.md) · [Capturas](capturas/) · [Logs](verificacion/).

La PR documental #12 permanece intacta. No incluye `e53fa66` ni las propuestas visuales rechazadas. La aprobación visual final y la autorización de merge/deploy corresponden al usuario.
