# Cierre de relevamiento funcional — Mora Vinería 2.0

Fecha: 9 de octubre de 2026. Fuente: respuestas directas del usuario a las 16 preguntas agrupadas. Este documento distingue decisiones confirmadas, propuestas y puntos pendientes. Complementa docs/04_descubrimiento_operativo.md.

## A. Ventas
1. **Fiados — confirmado.** Registrar nombre y deuda; sin vencimiento ni límite de crédito obligatorio. El operador decide a quién fiar. Permitir pagos parciales, aunque son raros. Los abonos no son nuevas ventas.
2. **Correcciones — confirmado.** El operador prefiere corregir directamente la venta. No se aceptan devoluciones comerciales ni reintegros habitualmente. **Propuesta técnica:** edición sencilla y trazabilidad de cambios de precio, stock, dinero y deuda, sin borrar el historial. Las eventuales excepciones legales no se consideran anuladas.
3. **Registro tardío — confirmado.** Usar la fecha y hora de carga, sin exigir recordar cuándo se realizó realmente la venta. La jornada 08:00–07:59 sigue vigente.
4. **Venta sin stock registrado — confirmado.** Si existe físicamente el producto aunque Mora diga cero, dejar venderlo y exigir después una revisión del inventario. No inventar stock ni corregir automáticamente cantidades sin comprobar.

## B. Dinero
5. **Gastos — confirmado.** Rara vez se registran gastos operativos; permitir un gasto excepcional con tipo o motivo escrito manualmente. El pago de reposiciones sigue otro flujo.
6. **Saldos — confirmado.** Mostrar dinero esperado en caja y cuentas del negocio y compararlo con importes reales. Brubank es la principal cuenta comercial; en cuentas personales alternativas controlar solo movimientos atribuibles a Mora. No presumir acceso automático al banco.
7. **Aportes y retiros — confirmado.** Importe, fecha, motivo y dispositivo de origen suelen bastar. La identidad del dispositivo no garantiza quién operó si varias personas lo comparten. El ahorro es extracción fuera del negocio; comprar inventario no equivale a doble gasto sobre la ganancia.
8. **Costo de mercadería — pendiente de aprobación.** El usuario pidió una explicación de costo de última compra versus promedio. **Propuesta:** promedio ponderado móvil para estimar costo de unidades vendidas, conservando costo atribuido en cada venta; costo último para sugerir nuevos precios al público. Ejemplo: 10 unidades a $2.000 y 10 a $2.500 -> promedio $2.250. Vendiendo a $4.000, ganancia bruta estimada de $1.750 (promedio) o $1.500 (último costo). Ganancia, facturación y dinero disponible son conceptos distintos.

## C. Catálogo y reposición
9. **Objetivo de stock — confirmado.** Fijarlo inicialmente a mano por producto, para cubrir la semana con margen de seguridad. Después Mora puede proponer modificaciones según ventas históricas, siempre para revisión del usuario.
10. **Categorías — pendiente de decisión.** El usuario ve razonable tenerlas, pero casi no las utilizó en V1; solicitó conocer sus ventajas y desventajas. **Fotos — preferencia favorable** si se normalizan y verifican imágenes, variante exacta, fuente, formato, peso y uso offline. Propuesta: categorías simples, quizá opcionales, y fotos consistentes con placeholder.

## D. Inicio y reportes
11. **Jornada — confirmada:** 08:00–07:59, con instante de registro real y fecha de jornada calculada.
12. **Inicio — prioridades confirmadas:** cuánto se vendió, cuánto se obtuvo en ganancias y qué hay que reponer. Evitar mezclar ganancia estimada con saldo disponible; detalles extra quedan por diseñar.
13. **Reportes — confirmados:** para entender el negocio, comparar períodos, decidir compras y evaluar metas o tendencias con cautela. El PDF mensual de V1 nunca se utilizó; no considerarlo requisito esencial de primera versión sin nueva validación.

## E. Dispositivos, sincronización y datos
14. **Acceso — confirmado:** unos 3–4 dispositivos, todos con permiso funcional completo. Cualquier dispositivo ya habilitado puede habilitar a otro. Pendiente: diseñar autorización segura, revocación y recuperación; auditar dispositivo de origen.
15. **Conflicto offline — confirmado, opción A:** conservar todas las ventas físicamente realizadas, incluso cuando dos teléfonos offline creyeran tener menos unidades en total. Marcar discrepancia y requerir recuento/ajuste posterior. Sin pérdidas de ventas ni duplicados al reenviar. **Pendiente técnico:** conciliación transaccional, estados local/servidor, correcciones simultáneas y permisos.
16. **Inicio desde cero — confirmado:** nueva base de negocio vacía, sin traer automáticamente catálogo, ventas ni stock anteriores. Esto NO autoriza borrar la V1 ni información existente de Supabase; preparar un entorno nuevo o aislado y una carga inicial verificada del stock físico. El backup JSON de V1 nunca se utilizó; su interfaz no es prioridad. La recuperación fiable sigue siendo necesaria: exportación/restauración controlada u otra medida probada, por definir.

## Decisiones todavía abiertas antes de cerrar alcance y diseño
- Aprobar o ajustar promedio ponderado para costo de ventas.
- Determinar si las categorías agregan suficiente valor y cómo se preparan fotos.
- Diseñar la experiencia de corrección de ventas, conciliación de saldos y revisión obligatoria de stock.
- Especificar acceso seguro, conflictos offline y recuperación.
- Validar opciones secundarias como PDF/JSON y lector de códigos sin sobrecargar el MVP.

**Estado:** fase de descubrimiento funcional avanzado, sin pantallas, esquema de datos ni implementación aprobados.