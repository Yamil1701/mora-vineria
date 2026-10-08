# 0014 — Mora Vinería 1.0: jerarquía, navegación y protección de tareas

- Estado: aceptada para la candidata; publicación pendiente de autorización del propietario.
- Fecha: 2026-10-08
- Fuente: encargo maestro Mora Vinería 1.0 aprobado por el propietario.

## Decisión

Reutilizar el stack y los flujos vigentes, con un sistema visual compartido. Inicio separa vendido, cobrado y vendido fiado; ganancia estimada vive en Reportes. El cuarto destino móvil pasa de Más a Reportes. Más queda en cabecera; escritorio incorpora Tesorería y Movimientos como accesos secundarios. Esta decisión actualiza la distribución visual de las decisiones 0005 y 0013.

Los sheets conservan gesto, Escape, fondo exterior y regreso del sistema, y agregan un cierre visible con nombre accesible. Se actualiza la pauta anterior de no mostrar un control propio: el descubrimiento y el uso por teclado justifican el cambio. Los formularios con cambios siguen usando la protección existente de navegación.

Las acciones sensibles serializan desde la apertura de la confirmación hasta la terminación de la escritura, mediante una exclusión síncrona en UI. No sustituye validaciones transaccionales, idempotencia ni permisos de la capa de datos.

## Límites y compatibilidad

Sin migraciones, nuevas entidades o dependencias del producto. Dexie v8, JSON v6 y lectura histórica de respaldos, jornada de 08:00, costos/precios históricos, soft delete, cobros inmutables, libro de Tesorería y protocolo Supabase permanecen vigentes. No se modifica el modelo de descuentos: el flujo existente ajusta precios unitarios y no tiene un descuento global. La mención anterior de descuento en 0009 queda como contexto histórico; no se implementa una fórmula distinta por inferencia.

La versión del paquete pasa a 1.0.0 como candidata. Crear la PR no autoriza fusionar, etiquetar una release ni publicar.
