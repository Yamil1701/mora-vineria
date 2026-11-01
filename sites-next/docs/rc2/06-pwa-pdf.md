# PWA, impresión y calidad visual

La dirección oscura/cálida/fucsia v29 se conserva; no se modificó CSS de la aplicación existente. Acceso y estado de guardado usan los componentes presentes.

Recorridos locales HTTPS de 360, 390 y 430 px: inicio, ventas, caja, productos, inventario, reposición, reportes, configuración, respaldo/restauración, cobro, comprobante, fiados/abonos y correcciones. Se comprobó ausencia de desbordamiento horizontal en las pantallas principales, acceso al final de la restauración, controles de al menos 44 px en los casos medidos y cobro con altura reducida. No equivale a medir toda la accesibilidad ni a probar teclados de Android/iOS.

Manifest relativo `./`, iconos 180/192/512, scope y start_url bajo `/mora-vineria/`. Se verificó service worker controlando el navegador, recarga offline y actualización con borrador conservado. Los módulos activos se incluyen en sus recursos. `npm run stamp` calcula la identidad de caché desde los bytes de recursos; `npm run verify` impide aceptar una caché obsoleta tras cambiar código. El service worker sólo maneja recursos estáticos, no comandos ni tokens de Supabase.

El aviso de actualización espera el guardado local durable antes de activar. Si falla, conserva la versión anterior y ofrece continuar cuando corresponde. El esquema local del dominio sigue v5; la base IndexedDB y su envoltura de espacio son v1 y no se borran al cambiar caché. La prueba de actualización usa un worker nuevo de QA con los mismos recursos; no certifica todas las futuras migraciones de esquema.

## PDF real

Chromium 153 generó `Mora-informe-mensual-QA-A4.pdf`, no una captura. Son 3 páginas A4 (594,96 × 841,92 puntos), con márgenes previstos de 16 mm. Se inspeccionaron los PNG renderizados de las tres páginas y el texto extraído: octubre de 2026, $16.000 vendido, $7.500 cobrado, 3 de 4 unidades con costo, una pendiente y ganancia total pendiente. No se imprimieron barra inferior ni botones.

Las tablas mantienen importes legibles y los bloques se distribuyen entre páginas sin cortes de filas observados. No se agregó una biblioteca PDF. La evidencia textual/visual pertenece al dataset sintético; una captura de la pantalla del informe no sustituye este PDF.

Pendientes físicos: instalar y abrir icono en Android/iOS, cámara/escáner, teclado real y zoom del sistema, contraste percibido, impresión física, papel/márgenes de impresora y comodidad con una mano. Todos se registran para el QA posterior.
