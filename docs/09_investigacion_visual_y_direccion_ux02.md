# Investigación visual 02 — Mora Vinería 2.0

> **REFERENCIA HISTÓRICA (no vigente para estética ni maquetación):** el usuario descartó esta propuesta visual y el HTML/escritorio relacionado. La nueva identidad móvil aprobada se encuentra en [`diseno/mockups-aprobados-v2/`](diseno/mockups-aprobados-v2/README.md). Conservar aquí únicamente la investigación comparativa como contexto.

**9 de octubre de 2026. Estado: dirección de diseño propuesta y prototipo externo, SIN aprobación ni cambios de código de la PWA.**

## Motivo para descartar UX 01

El usuario percibió el primer prototipo como «muy IA slopping» y pidió una investigación de otras apps y una propuesta saneada. La paleta «mora vino» queda descartada: **la marca debe usar acento ROSA FUCSIA**. La crítica principal no se resuelve cambiando solo el hex: la composición de muchos indicadores/tarjetas redondeadas priorizaba una estética genérica antes que el trabajo en ventanilla.

## Investigación de referencias (documentación pública consultada)

| Aplicación/fuente | Hallazgo documentado | Qué adoptar | Qué evitar |
| --- | --- | --- | --- |
| Square POS | Accesos rápidos y cuadrícula editable desde checkout. https://squareup.com/help/us/en/article/8334-set-up-item-grid | Favoritos accesibles, cobro siempre claro | Copiar cuadrícula ancha de tablet a móvil |
| Shopify POS | Smart grid con productos y acciones configurables. https://help.shopify.com/en/manual/sell-in-person/getting-started/smart-grid | Atajos a productos de alta rotación y operaciones frecuentes | Panel lleno de botones/colores poco necesarios |
| Loyverse POS | Favoritos de smartphones y elección entre lista/cuadrícula; los nombres largos se leen mejor en lista. https://help.loyverse.com/es/help/favorites-on-smartphones y https://help.loyverse.com/help/home-sale-screen-layouts | Combinar 3-6 favoritos con lista compacta de precios y búsqueda instantánea | Muchas fotos sin verificar o tarjetas enormes |
| SumUp | Catálogo con variantes, categorías y carrito accesible desde el cobro. https://help.sumup.com/en-US/articles/74F2rqZbj4XluwdQCMvc1H-sumup-app-item-catalog | Categorías secundarias y carrito persistente | Pasos/acciones financieras de un POS con integración bancaria que Mora no tiene |
| Lightspeed Retail | Venta central, búsqueda, promociones y cobro desde el mismo proceso. https://x-series-support.lightspeedhq.com/hc/en-us/articles/25534062778651-Using-the-Retail-POS-Sell-screen | Prioridad operativa de ventas, corrección desde historial | Capas de ERP para un negocio pequeño |
| Baymard Institute | En investigación de listas móviles, comparabilidad, atributos distinguibles y scannability importan. https://baymard.com/research-articles/current-state-product-list-and-filtering | Lista de producto con marca, tamaño, precio y estado claros, sin depender solo de fotografía | Multiplicar variantes y chips sin necesidad |
| Nielsen Norman Group | Divulgación progresiva: mantener lo frecuente visible y opciones secundarias detrás de acción clara. https://www.nngroup.com/articles/progressive-disclosure/ | No saturar Inicio; fiados, movimientos y ajustes como contextos secundarios | Esconder la tarea más frecuente bajo submenús |
| W3C WCAG 2.2 | Texto corriente al menos 4,5:1; blancos táctiles AA al menos 24×24 o separación equivalente. https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum y https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum | Diseñar controles primarios >=44-48 CSS px y revisar contraste | Botones diminutos, texto gris excesivamente apagado |

Estas referencias son **principios seleccionados**, no permiso para copiar pantallas, imágenes o marcas de terceros.

## Propuesta de diseño: «Fucsia utilitario»

**Objetivo estético:** POS minimalista nocturno, identidad propia reconocible, denso donde hay listas e importes, con espacios generosos solo en titulares y tareas decisivas. Sin degradados, brillos, neón, efectos glassmorphism, porcentajes arbitrarios, tarjetas KPI por todas partes ni estética empresarial pesada.

### Paleta inicial (a validar visualmente)

- Fondo carbón neutro `#101013`.
- Superficie `#19191E`, segundo nivel `#222228`, divisores `#2C2C32`.
- Texto principal `#F4F3F5`, auxiliar `#9A9AA5`.
- Acento fucsia `#FF0A89`. Solo CTA principal, selección activa, vínculos o un detalle pequeño de marca.
- Precaución de contraste: con `#FF0A89`, texto blanco sobre relleno fucsia alcanza aprox. **3,71:1**, insuficiente para texto normal de 4,5:1; se elige **texto casi negro `#111013` sobre botón fucsia** (~5,2:1). Fucsia sobre fondo carbón también supera ~5:1.
- Estados: amarillo suave para stock pendiente; verde discreto para sincronización realmente confirmada; los estados deben tener texto, no solo color.

### Sistema visual propuesto

- Tipografía del sistema (nativa) antes que descargar fuentes decorativas. Números con cifras tabulares; importes grandes, sin decimales en ARS.
- Grid móvil a 21-24 px, espacios por escala 8/12/16/24/32, bordes delgados, radios 7-10 px en elementos interactivos.
- Listas separadas por líneas sutiles en lugar de meter cada fila en tarjeta. Foto de producto solo si la variante exacta fue verificada, comprimida y cacheada; si no, silueta sobria.
- Una llamada a la acción principal por contexto. Barra inferior con Inicio, Ventas, Productos, Reportes; menú lateral únicamente al adaptar a escritorio.
- Todas las pantallas tienen un estado normal, vacío, offline, guardado local, pendiente de servidor y error, según corresponda.

## Composición por recorrido

**Inicio:** marca pequeña; fecha; tres respuestas: ventas de hoy como dato dominante, ganancia bruta estimada y cantidad de ventas como par de valores subordinados, botón fucsia «Nueva venta». Debajo: reponer (2-3 filas) y movimientos recientes. No gráficos ni 12 KPIs.

**Ventas:** búsqueda visible inmediata, categorías en chips secundarios, acceso rápido a más vendidos, lista compacta (nombre + presentación + precio legible + agregar), total y acceso al carrito **siempre visibles**. Pago en siguiente pantalla, no un panel bancario completo.

**Cobro:** total dominante, efectivo/transferencia primero, mixto y fiado secundarios en la misma elección. Transferencia con Brubank por defecto y **check manual explícito** de acreditación; no simular integración bancaria. Efectivo con vuelto opcional.

**Productos:** búsqueda y lista clara, foto reducida, precio de venta, unidades y objetivo. Destacar únicamente stock realmente escaso. Agregar / comprobar stock como acciones contextuales.

**Reportes:** período y dos importes principales (venta y ganancia bruta FIFO), gráfico simple bajo demanda y hallazgos comprensibles. Evitar PDF mensual como función central.

## Prototipo UX 02 (artefacto de evaluación, NO integrado a GitHub)

Archivo HTML autocontenido para visualización local; no guarda datos ni usa Supabase. Incluye navegación adaptable entre cuatro pestañas, simulación de carrito, cobro en efectivo/transferencia/mixto/fiado, confirmación manual para transferencia, lista de productos, filtros y reportes con datos falsos. Las siluetas de envases son **placeholders de prototipo** y no imágenes definitivas.

**Comprobación realizada:** flujo móvil Inicio → Ventas → Carrito → Cobro con transferencia manual; botones deshabilitados hasta comprobación; Productos y Reportes; vista 390×844 y escritorio 1280×900; sin errores JS en prueba automatizada. No hubo prueba de uso con operarios reales ni aprobación estética todavía.

## Criterio de aceptación para UX 02

- Probar comparando UX 01 y 02 en tareas de venta simple, multiproducto, efectivo con vuelto y transferencia.
- Confirmar que el rosa fucsia sea marca, **no tinta para todos los indicadores**.
- Validar densidad e interacción con pulgar en celular real, contraste/lectura nocturna y estado sin foto.
- Medir pasos, toques fallidos, retrocesos y si se comprende claramente el cobro y la necesidad de revisar stock.
- Recién tras aprobación de estilo y estructura, traducir diseño a tokens/componentes React y especificaciones implementables.

**Estado:** propuesta para revisión del usuario. No elegir componentes ni desplegar sobre producción aún.
