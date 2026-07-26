# 0013 — Layout responsive de escritorio

- Estado: aceptada
- Fecha: 2026-07-25

## Decisión

Mora Vinería continúa siendo mobile-first y usa las mismas rutas, componentes y flujos en todos los tamaños. Desde 1024 px, las pantallas principales reemplazan la navegación inferior por una barra lateral fija con Inicio, Ventas, Productos, Más y la acción destacada de Nueva venta.

El contenido se centra dentro del espacio restante. Los listados pueden usar un ancho mayor, mientras las tareas enfocadas y formularios conservan un ancho contenido. Los detalles de ruta y bottom sheets se presentan como paneles laterales derechos en escritorio; en móvil continúan como sheets inferiores arrastrables.

## Consecuencias

No existe una versión desktop separada ni se duplican pantallas. La adaptación queda concentrada en el layout y los componentes compartidos, conserva los temas Oscuro y Claro y no modifica persistencia, sincronización, backups ni reglas de negocio.
