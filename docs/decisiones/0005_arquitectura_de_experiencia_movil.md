# 0005 — Arquitectura de experiencia móvil

- Estado: aceptada
- Fecha: 2026-07-10

## Decisión

La interfaz se organiza alrededor de tareas y divulgación progresiva. La navegación inferior contiene Inicio, Ventas, Productos y Más. Nueva venta es la acción operativa principal y Movimientos permanece dentro de Más por su frecuencia ocasional.

Listados, detalles, creación y edición son vistas separadas. Las tareas enfocadas ocultan la navegación general y ofrecen regreso explícito. Los objetivos táctiles importantes miden al menos 48 px y respetan las áreas seguras.

El carrito se conserva como borrador temporal local, puede vaciarse y se revalida antes de registrar. Después de guardar, la app vuelve al historial y destaca brevemente la venta nueva. Inicio prioriza el stock que requiere atención.

## Consecuencias

La aplicación deja de mostrar formularios, historiales y acciones sensibles al mismo tiempo. El borrador no es un registro operativo, no reserva stock y no se incluye en el backup. Reportes muestra un período y una perspectiva por vez.
