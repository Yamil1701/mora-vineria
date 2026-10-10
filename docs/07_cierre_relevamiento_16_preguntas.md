# Cierre de relevamiento funcional — Mora Vinería 2.0

> **Nota de estado (10/10/2026):** los cierres históricos de este documento no describen el código actual. Existe demo V2 en master; FIFO y categorías simples están aprobados, pero persistencia/servidor aún no implementados. El [handoff](HANDOFF_WORK_V2.md) rige el estado y la [arquitectura propuesta](arquitectura-v2/README.md) separa decisiones confirmadas de propuestas técnicas. No generar más mockups.

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
8. **Costeo por lotes FIFO — decisión aprobada el 9/10/2026.** Cada recepción crea un lote con su costo unitario y cantidad recibida. La venta consume primero (a efectos de asignación de costo) las unidades del lote más antiguo aún disponible; se guarda la asignación exacta de cantidades y costos a cada detalle de venta, incluso si una venta abarca dos lotes. Si el precio de venta cambia mientras queda mercadería de un lote antiguo, la ganancia bruta de cada venta usa el precio efectivamente cobrado menos el costo asignado al lote, sin recalcular ventas anteriores. Ejemplo: lote A, 10 cervezas a $2.000; lote B, 10 a $2.500. Se venden 6 a $3.500 (ganancia $9.000), luego 4 a $4.000 (ganancia $8.000); las siguientes 3 a $4.000 consumen lote B (ganancia $4.500). **Costo promedio ponderado:** conservarlo como indicador secundario del stock, no como método primario de costo de las ventas. **Cuidado:** FIFO asigna costos siguiendo antigüedad contable; sin identificar el lote de cada botella entregada físicamente, no demuestra el costo físico de esa botella. **Pendiente técnico:** compras con recepción parcial, correcciones posteriores, lotes defectuosos y reemplazados, stock inicial sin costo conocido, sobreventas permitidas y ventas offline concurrentes: al sincronizar se resuelve la asignación oficial sin perder ventas ni inventar lotes o ganancias definitivas. Ganancia bruta, ganancia neta y saldo de dinero son métricas distintas.

## C. Catálogo y reposición
9. **Objetivo de stock — confirmado.** Fijarlo inicialmente a mano por producto, para cubrir la semana con margen de seguridad. Después Mora puede proponer modificaciones según ventas históricas, siempre para revisión del usuario.
10. **Categorías — confirmado el 9/10/2026:** mantenerlas, pero **simplificadas**. Propuesta de diseño: pocas categorías claras, sin subárboles complejos ni selección forzada durante ventas. La asignación opcional y la lista inicial exacta se resolverán en el diseño del catálogo. **Fotos — preferencia favorable** si se verifica la variante correcta y se normalizan formato, tamaño, peso y disponibilidad offline; usar imagen de reserva si no hay una confiable.

## D. Inicio y reportes
11. **Jornada — confirmada:** 08:00–07:59, con instante de registro real y fecha de jornada calculada.
12. **Inicio — prioridades confirmadas:** cuánto se vendió, cuánto se obtuvo en ganancias y qué hay que reponer. Evitar mezclar ganancia estimada con saldo disponible; detalles extra quedan por diseñar.
13. **Reportes — confirmados:** para entender el negocio, comparar períodos, decidir compras y evaluar metas o tendencias con cautela. El PDF mensual de V1 nunca se utilizó; no considerarlo requisito esencial de primera versión sin nueva validación.

## E. Dispositivos, sincronización y datos
14. **Acceso — confirmado:** unos 3–4 dispositivos, todos con permiso funcional completo. Cualquier dispositivo ya habilitado puede habilitar a otro. Pendiente: diseñar autorización segura, revocación y recuperación; auditar dispositivo de origen.
15. **Conflicto offline — confirmado, opción A:** conservar todas las ventas físicamente realizadas, incluso cuando dos teléfonos offline creyeran tener menos unidades en total. Marcar discrepancia y requerir recuento/ajuste posterior. Sin pérdidas de ventas ni duplicados al reenviar. **Pendiente técnico:** conciliación transaccional, estados local/servidor, correcciones simultáneas y permisos.
16. **Inicio desde cero — confirmado:** nueva base de negocio vacía, sin traer automáticamente catálogo, ventas ni stock anteriores. Esto NO autoriza borrar la V1 ni información existente de Supabase; preparar un entorno nuevo o aislado y una carga inicial verificada del stock físico. El backup JSON de V1 nunca se utilizó; su interfaz no es prioridad. La recuperación fiable sigue siendo necesaria: exportación/restauración controlada u otra medida probada, por definir.

## Decisiones todavía abiertas antes de cerrar alcance y diseño
- FIFO por lotes y categorías simples ya están aprobados; queda diseñar asignaciones transaccionales y correcciones de lotes, incluyendo casos offline.
- Definir cómo se preparan y verifican las fotos del catálogo.
- Diseñar la experiencia de corrección de ventas, conciliación de saldos y revisión obligatoria de stock.
- Especificar acceso seguro, conflictos offline y recuperación.
- Validar opciones secundarias como PDF/JSON y lector de códigos sin sobrecargar el MVP.

**Estado:** fase de descubrimiento funcional avanzado, sin pantallas, esquema de datos ni implementación aprobados.