# Mora Vinería 2.0 — QA visual 02

**Rama:** `feature/mora-v2-app-shell`. **No es software productivo**. Las ventas, importes, movimientos y productos de ejemplo son ficticios; no existe persistencia de negocio ni conexión con Supabase. Todos los estados vuelven a su valor inicial al recargar.

## Cambios según observaciones del usuario

| Observación QA 01 | Implementación en la iteración 02 |
| --- | --- |
| Faltan íconos en Inicio | Íconos ilustrativos consistentes para Ventas, Ganancia, Reponer y acciones. |
| Paneles sin sensación de vidrio | Superficie más luminosa con borde en degradado, reflejo interior y blur; base sólida si no se admite la transparencia. |
| Nueva venta demasiado protagónica y baja | Acción compacta al lado de la fecha, antes de las métricas. |
| Reposición y “Ver todos” desintegrados | Header, ícono, acción de detalle y lista en **un único panel**; acciones de cada artículo. |
| Faltan Favoritos | Carrusel de favoritos con arte ilustrativo, precio y botón directo de agregar. |
| Ordenar productos | Sección «Todos los productos» con botón Ordenar/Filtros y opciones funcionales. |
| Carrito bloquea cobro | Barra fija arriba de la navegación: total, acceso opcional al carrito y **Cobrar directo**. |
| Mucho texto en filas | Jerarquías compactas; ilustraciones vectoriales de envases **sin fingir fotografías verificadas**. |
| Productos sin filtro ni acciones | Campo buscar + filtro; CTA Agregar producto funcional **solo en memoria**; icono Escanear visible, funcionalidad pendiente anunciada. |
| Reportes demasiado sobrios | Dos tarjetas estilizadas, iconografía, gráfico derivado de registros ficticios y explicación; ganancia FIFO permanece «—». |
| Falta historial | Botón superior Historial en Nueva venta con vista de registros de demostración. |
| Categorías ocupan espacio al bajar | Desaparecen al desplazar más de ~150 px durante Nueva venta. |
| Cobro plano | Hero de total, cuatro métodos en tarjetas con ícono, elección visual de cuenta, confirmación manual de transferencia y detalle de efectivo. |
| Fondo se desplaza | Wallpaper anclado a `body::before` con `position: fixed`; no se mueve con secciones. Requiere prueba específica en Safari iOS. |
| Jerarquías de texto débiles | Tokens diferenciados para nombre, detalle, importe, alerta y meta. |

## Pruebas manuales necesarias

1. Abrir a 360, 390 y 430 px; verificar que el fondo sea fijo durante un scroll largo y no haya scroll horizontal accidental.
2. Inicio: tarjeta de ventas, ganancia «—», lista de reposición en un solo panel, acción Nueva venta discreta y accesible.
3. Nueva venta: agregar desde Favoritos y lista; cambiar categoría; bajar por la lista y comprobar que categorías se ocultan; activar filtro; abrir historial.
4. Nueva venta con artículos: verificar total y unidades; tocar Cobrar **sin pasar por Carrito**; volver y editar desde el área de detalle del carrito.
5. Cobro en efectivo, transferencia, mixto y fiado: impedir pagos incompletos, conservar la transferencia como confirmación **manual**, mostrar vuelto calculado.
6. Productos: buscar, ordenar, filtrar por stock y agregar producto a la demo; Escanear muestra una explicación, no enciende falsa cámara.
7. Reportes: gráfico refleja los registros de ejemplo; cambiar a Semana/Mes no inventa valores.
8. Recargar: se pierde la demostración. Abrir PWA y probar con actualizaciones pendientes sin interrumpir la venta.
9. Probar teclado abierto y zoom 200% en un dispositivo; documentar elementos superpuestos, contraste del vidrio y botones táctiles.

## Límites conocidos

- Los envases de ejemplo son **ilustraciones abstractas**. Fotos verificadas de cada SKU son trabajo posterior y no se deben simular a partir de un mockup generado por IA.
- Alta de producto y venta de prueba solo en memoria, sin autenticación ni servidor; escaneo todavía no implementado.
- Ventas iniciales de ejemplo no tienen costos ni unidades originales; no se simula margen ni artículos más vendidos.
- La información bancaria mostrada es **identificadora, no acreditación real**. No existen alias/CBU configurados.
- Verificar en dispositivos reales `position: fixed`, paneles con `backdrop-filter`, barra de cobro y safe-area antes de considerar este trabajo aprobado visualmente.
