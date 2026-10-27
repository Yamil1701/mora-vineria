# Base visual conservadora y evidencia previa

Se inspeccionaron individualmente a resolución suficiente inicio, ventas, cobro, productos, reportes, caja-cuentas y carrito. No se utilizan 29–31/visual-01. Se conserva la marca nocturna; esta traducción operativa es provisional para revisión, no una nueva firma visual.

| Referencia | Conservar | Corregir / retirar | Aplicación |
| --- | --- | --- | --- |
| Inicio | Ventas domina; ganancia secundaria; faltantes breves | Avatar, nube, porcentajes inventados y CTA duplicado | Un resumen principal y hasta tres prioridades |
| Ventas | Búsqueda primero, favoritos, filas, total/Cobrar | Dock durante flujo; fotos sin variante comprobada | Consulta independiente de Agregar; carrito opcional |
| Cobro | Total dominante, lectura del medio y siguiente acción | Métodos simulados; estado bancario falso | Sólo medios completos, error persistente, vuelto real |
| Productos | Nombre, variante, precio y stock juntos | Mínimos globales, tarjeta enorme, escáner inerte | Lista compacta y ficha; enlace al dueño de inventario/recepción |
| Reportes | Períodos, números, destacados | Tendencias sin base y KPI equivalentes | Ventas primero; ganancia con cobertura y desglose |
| Caja | Resumen/Movimientos/Cuentas y agrupación por causa | «Dinero real» inferido y cifras bancarias | Variación registrada explícita; saldo desconocido |
| Carrito | Cantidades, líneas, total | Descuento/nota no implementados y fotos erróneas | Stepper existente, precios del borrador, cobro directo |

## Investigación consultada el 26/10/2026

- [NN/g heurísticas](https://www.nngroup.com/articles/ten-usability-heuristics/): misma navegación y controles; lenguaje del operador; persistencia y recuperación visibles. No justifica una apariencia de dashboard.
- [WCAG contraste](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [targets](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) y [foco](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html): texto 4.5:1, grandes 3:1; objetivo propio táctil 44–48 CSS px (mínimo AA 24 con excepciones); scroll/foco sin barras encima.
- [Apple tips](https://developer.apple.com/design/tips/) y [layout](https://developer.apple.com/design/human-interface-guidelines/layout): alineaciones y targets; 44 pt de iOS no equivale literalmente a CSS px. Evitar desplazamiento horizontal de página.
- [Shopify carritos](https://help.shopify.com/en/manual/sell-in-person/shopify-pos/order-management/manage-recent-carts): recuperar preparación sin duplicar venta. Mora conserva su contrato local/offline propio.
- [Square recepción](https://squareup.com/help/us/en/article/6110-manage-inventory-with-the-retail-pos-app): recepción agrupada y ajuste con causa distinguibles.
- [Loyverse pedidos](https://help.loyverse.com/help/how-purchase-orders-and-suppliers): separar preparación/recepción y entregas parciales. No importar su estética ni sus integraciones.

## Sistema único antes de pantallas

Se extiende `src/ui/theme.css` y `src/ui/components.tsx`; `app.css` conserva composición y se corrigen los estilos que contradicen el sistema. Familias ya disponibles: Georgia para identidad/título editorial, system-ui para lectura/controles/importes. Se comparó usar todo system-ui: reduce carácter frente a los originales; se conserva pareja existente, sin fuentes nuevas ni descarga. Elección provisional.

Tokens de color existentes: canvas #101013, surface #19191e, raised #222228, texto #f4f3f5, secundario #b8b8c3, acento #FF0A89 con texto #111013; warning #ffbc6a/error #ff6488/success #32d68a acompañados de texto. Contraste se verifica con QA final. Importes tabulares, escala 4/8/12/16/20/24/32, controles ≥44 px, primarios48. Marca 30px con cuadrado .15em, sin radio. Títulos28, cuerpo16, metadatos13; no comprimir a 10px para encajar.

Superficies: fondo ambiental único atenuado, panel sólo para agrupación funcional; filas con divisor; sin blur generalizado ni gradiente en cada control. Header sticky en dos franjas y dock opaco, cinco posiciones (cuatro destinos más acción). Fucsia en marca, selección y acción principal; importes ordinarios claros. Iconos SVG existentes con trazo común y etiquetas accesibles. Estados busy/error/focus compartidos; contorno visible y reduced-motion.

360/390/430px: una columna, ancho máximo520; separación16–20px; nombres envuelven, importes no empujan controles fuera. CTA de cobro separado del dock oculto; safe-area y viewport visual para teclado. Formularios conservan borradores o piden descarte explícito si hay edición sin guardar. Una misma función usa una misma pantalla/servicio.

QA real y diferencias finales se documentan después de implementar; investigación y capturas originales no certifican accesibilidad ni usabilidad de la app.
