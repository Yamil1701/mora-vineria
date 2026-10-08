# Sistema de diseño 1.0

Dirección: herramienta de mostrador cálida, legible y silenciosa. Conserva el SVG maestro M/gota/copa; sin ilustraciones de botellas, fotos nuevas ni fuentes de red. El concepto generado de Inicio, selección y Reportes guía jerarquía, densidad y familias; las reglas operativas y textos actuales tienen prioridad sobre sus cifras ilustrativas.

- Fondo oscuro #121014, superficie #1d181e, superficie elevada #211920. Tema claro cálido y superficies blancas.
- Rosa #D7268F para acciones principales; texto suave #F2C6D8. Texto normal claro, secundario suficientemente contrastado. No gradientes ni brillos en el shell.
- Sans del sistema, títulos 26/32 px, cuerpo 14/16, información secundaria 13 px. Cifras tabulares; importe principal 36 px, secundarios 20/24 px; no truncar dinero.
- Controles 48 px, radios 12 px; grupos 16 px, overlays 20 px. Bordes finos y sombras solo en overlays.
- Listas con divisores, estado textual además de color; paneles para agrupar una tarea, sin paneles anidados en el carrito.
- Inicio: fecha, Resumen de hoy, vendido dominante, cobrado/fiado secundarios, nueva venta, stock, dinero y reposición. Ganancia vive en Reportes.
- Reportes: total vendido dominante; cobrado y ganancia neta estimada diferenciados; inventario actual separado del período histórico.
- Navegación móvil: Inicio, Ventas, acción central Nueva venta, Productos, Reportes. Más desde cabecera; desktop agrega accesos directos Tesorería/Movimientos. Nueva venta se conserva como acción global por su uso con una mano (desviación funcional explícita respecto del concepto de cuatro destinos sin botón central). Consulta conserva cuatro destinos y omite escritura.
- Inicio conserva CTA de venta porque es la próxima acción habitual al abrir; el botón global sirve al recorrer otras vistas.
- Pantallas enfocadas conservan atrás, borradores, deep links y protecciones. Sheets con cierre visible accesible, Escape y gesto; la navegación del sistema mantiene su función.
- Menús como filas, filtros con selección explícita y sin sombras; focos visibles, safe areas, movimiento reducido.

## Extensión a las demás vistas

Ventas/fiados, productos/categorías y movimientos comparten encabezados, búsqueda y filas. Tesorería usa saldo dominante y entradas/salidas secundarias, cuentas como filas y origen navegable. Proyecciones conserva escenarios y confianza visibles, sin prometer resultados. Configuración, dispositivo, sincronización, respaldo y exportaciones usan la misma familia de menú y formulario. PDF conserva A4 blanco e impresión local.

## Desviaciones deliberadas del concepto

Los números y fecha son datos reales del entorno local, sin métricas ficticias en el producto. La marca es el SVG existente. Se omiten botellas decorativas y gradientes del resultado generado. Reportes no repite marca en cada encabezado. La navegación enfocada oculta barra general. Se conservan restricciones y confirmaciones vigentes. El botón Más se sitúa bajo el indicador global para evitar superposición de estados largos.
