# Plan del MVP

## Capas cerradas

- Reorganización documental y técnica.
- Confirmaciones Radix, terminología y calidad base.
- Selector semanal, vista compacta, movimientos mensuales, eliminación segura y gráficos.
- Arquitectura de navegación y tareas mobile-first.
- Reorganización de Ventas, Productos, Movimientos, Inicio, Reportes, Proyecciones y Configuración.
- Accesibilidad transversal, feedback funcional, reduced motion y carga diferida por rutas.
- Resiliencia visual: skeletons diferidos, recuperación global, formularios protegidos y recordatorio de respaldo.
- Continuidad final: bloqueo uniforme de navegación, errores de campo, reintentos y primeros usos guiados.
- Identidad PWA y arranque: logo definitivo, iconos, splash, spinner y precarga esencial.

## Validación entregable — Cerrada

La consolidación surgida de pruebas en celular real quedó implementada y la validación manual fue informada como aprobada.

1. Ejecutar `npm run verify` y `npm audit --omit=dev`.
2. Probar en 320, 375 y 430 px, con teclado abierto y áreas seguras.
3. Validar dispositivo principal y consulta.
4. Probar interrupción y recuperación del carrito, vaciado y revalidación de stock.
5. Registrar venta y comprobar regreso/destacado en historial.
6. Revisar listado, detalle, alta y edición de productos.
7. Registrar, anular y eliminar cuando corresponda un movimiento.
8. Consultar cada período y perspectiva de Reportes.
9. Probar respaldo, restauración, CSV, PDF, instalación, actualización y uso offline.
10. Probar foco, lector de pantalla, texto ampliado y movimiento reducido.
11. Dejar un formulario sin cambios y otro modificado; comprobar que solo el segundo advierte al volver o cerrar/recargar la app.
12. Comprobar recordatorio sin respaldo, con siete días exactos y con más de siete días.

## Cierre de la primera versión

Completado:

1. hallazgos corregidos sin ampliar alcance;
2. versión actualizada a `0.1.0`;
3. verificación local y workflow de publicación preparados.

Acción de publicación pendiente:

1. confirmar el workflow verde para el commit final;
2. crear el tag `v0.1.0`.

Después de `v0.1.0` se evaluarán fotos de productos, gráficos específicos de proyección y un tutorial guiado. No deben entrar durante la corrección de hallazgos de esta validación.
