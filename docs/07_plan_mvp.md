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
- Pulido de arranque y sistema: carga sin demora artificial, aviso offline único, recordatorios de respaldo e información de sincronización jerarquizada.

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
2. versión `v0.1.0` publicada;
3. hotfix de guardado seguro publicado como `v0.1.1`;
4. verificación local y workflow de publicación aprobados.

## Plan `v0.2.0` — Cerrado

1. Base documental, Supabase, RLS, identidad y Dexie v2 — implementada.
2. Activación, recuperación, Turnstile y limpieza segura — implementados y validados en la versión publicada.
3. Emparejamiento, nombres auditables, modos, revocación y transferencia — implementados y validados en dos celulares.
4. Migración inicial de datos — omitida porque no existen datos operativos reales antes de la puesta en marcha.
5. Productos y categorías remotos con push/pull idempotente — implementado y validado en dos celulares.
6. Ventas, movimientos y cobros mediante funciones transaccionales — implementados y validados en dos celulares.
7. Realtime como aviso y recuperación incremental por cursor — implementado.
8. Conflictos de stock y conciliación desde el principal — implementados y validados con casos controlados.
9. Backup v2, pruebas offline, dos dispositivos y despliegue gradual — implementados y aprobados en la prueba manual final.

Antes de habilitar el uso real se eliminaron de Supabase los negocios, dispositivos, identidades y operaciones de prueba. La instalación definitiva comienza desde una activación limpia.

Ventas fiadas, cliente mínimo, vencimiento opcional, pagos parciales inmutables y efecto en reportes quedaron implementados dentro de esta evolución. No se modelan como medio de pago.

Fotos de productos, gráficos específicos de proyección y tutorial guiado continúan separados de esta evolución.
