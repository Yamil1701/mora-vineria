# 14 — Matriz de fidelidad visual: referencias oficiales vs interfaz implementada

**Fecha:** 21/10/2026. **Estado:** revisión visual de las imágenes originales disponibles + comparación de estructura estática del código de \`master\` \`90264e5\`. **No es todavía un diff de capturas renderizadas del sitio actual** ni auditoría de contraste pixel a pixel. No modificar \`src/\` por esta investigación.

## Método y procedencia

- Referencias oficiales: \`docs/diseno/mockups-aprobados-v2/{inicio,ventas,cobro,productos,reportes}.webp\`, todas de **941 × 1672** según README. Complemento aprobado: \`docs/diseno/prototipos-v2/caja-cuentas.webp\`; carrito.webp sólo prototipado.
- Se examinaron visualmente los originales PNG disponibles en los recursos del proyecto: \`panel_de_ventas_de_mora_vinería.png\` (Inicio), \`interfaz_de_ventas_nocturna_para_vinoteca.png\` (Ventas), \`pantalla_de_cobro_con_transferencia_bancaria.png\` (Cobro), \`catálogo_de_productos_en_neón_magenta.png\` (Productos), \`panel_de_reportes_de_mora_vinería.png\` (Reportes), \`mora-v2-propuesta-caja-cuentas.png\` (Caja). Se inspeccionaron además archivos \`productos.webp\` y \`cobro.webp\` presentes con **la misma dimensión y composición que los PNG** (diferencia de compresión media por canal cercana a un valor RGB). Para los otros tres, la correspondencia se basa en nombre, dimensión y composición; no se hizo comparación binaria contra los WebP remotos.
- Se inspeccionaron \`src/App.tsx\`, \`src/ui/components.tsx\`, \`src/ui/theme.css\`, \`src/app/app.css\` y \`src/app/Movements.tsx\` desde \`master\`.
- Las referencias son **imágenes estáticas generadas**, no especificaciones de importes/productos/fotos/transferencias reales. No copiar estados falsos de sincronización, fotos equivocadas ni características inexistentes.
- Se verificó el código publicado, **no** se obtuvo screenshot contemporáneo renderizado de GitHub Pages ni una sesión Safari/Android. «Brecha confirmada» en esta matriz significa **diferencia comprobable de estructura o funcionalidad en el código**, no medida de píxeles finales.

## 1. Inicio — IN-01

**Referencia:** marca grande «Mora Vinería» serif, subtítulo «Resumen de hoy», columna vertical de tres prioridades: (1) Ventas de hoy en una tarjeta dominante, (2) Ganancia estimada en tarjeta más compacta, (3) Para reponer como lista condensada de artículos. **Nueva venta** es CTA fucsia ancho después de ese resumen, cercano al pulgar. Barra inferior limpia.

**Implementación actual comprobada:** \`src/App.tsx:179-193\` recupera titular y los tres grupos, pero coloca **Nueva venta en fila superior junto a fecha**; debajo, «Movimientos de hoy» con botón Movimientos, backup y nota local ocupa un nuevo espacio funcional. El resumen de reposición lista hasta tres productos (correcto); los accesos se mezclan con una sección de administración. La PR #11 mejoró la jerarquía pero no restauró el recorrido entero de escaneo y decisión de la referencia.

**Brechas clasificadas:**
- **VH-01 / P1:** CTA de mayor frecuencia no se encuentra en el papel visual de la referencia (tras el tablero). No ordenar moverlo ciegamente: probar alcance del pulgar, longitud y acceso desde encabezado/bottom nav; decidir ubicación única o dos accesos contextuales sin duplicar lógica.
- **VH-02 / P1:** herramientas operativas extendidas en Inicio; Caja y Datos necesitan **destino propio** antes de retirar atajos.
- **VH-03 / P2:** números comparativos «vs. ayer» son ficticios en imagen. No copiarlos hasta que exista proyección real y períodos comparables.
- **VH-04 / P2:** referencia incluye campana/avatar de fantasía y etiqueta de ventas pendientes de «sincronizar»; **NO** implementar literalmente en MVP sin login/sync.
- **Preservar:** identidad serif, hero de ventas, ganancias cuando calculables, máximo tres faltantes, CTA Nueva venta, fucsia reservado a prioridades.

**Criterio de aceptación:** abrir Inicio vacío, con ventas, con stock bajo y con revisión; usuario identifica la acción de venta, ventas/ganancias y faltantes sin distraerse con historial/backup; restauración sigue siendo localizable desde Configuración.

## 2. Ventas — VE-01

**Referencia:** titular «Nueva venta» de alto contraste; búsqueda prominente; chips de categorías; favoritos en fila visual horizontal con botón añadir; **lista vertical simple de todos los productos**; barra fija inferior interna con subtotal + Cobrar, sobre bottom nav de cuatro destinos. Presentación comercial clara sin formularios administrativos.

**Implementación comprobada:** \`src/App.tsx:195-201\` tiene búsqueda, chips, favoritos, lista y barra Cobrar. La búsqueda comparte estado \`search/category/sort/lowOnly\` con catálogo de Productos, gestionado desde la raíz; las reglas de navegación pueden borrar contexto (\`navigate\` línea 81). Productos se ilustran con \`ProductArt\`, sin fotos de SKU verificadas. Favoritos usan \`m2-favorite-card\` y los productos \`ProductLine\`: parte de la intención visual está resuelta.

**Brechas:**
- **VH-05 / P1:** estado de filtro compartido con otra misión de pantalla. Contrato: filtros independientes por ámbito y retorno predecible, sin perder borrador.
- **VH-06 / P1:** si existe escáner deshabilitado como affordance de la referencia, no debe consumir prominencia de tarea ni prometer lectura futura; mantener sólo si explicita indisponibilidad.
- **VH-07 / P2:** comparativa visual de densidad/favoritos necesita captura real 360/390/430: no inferir que el grid cabe porque la imagen generada presenta cuatro mini-productos.
- **Preservar:** selección una o varias unidades, carrito opcional, cobro directo, precio legible y atajos.

**Criterio:** venta de una unidad sin entrar al carrito; favoritos accesibles sin desplazamiento excesivo; búsqueda no altera filtro de Productos; teclado no tapa Cobrar.

## 3. Cobro — VE-03

**Referencia:** tarjeta superior con total muy dominante, 4 métodos Efectivo/Transferencia/Mixto/Fiado y estados; **transferencia seleccionada en la ilustración**, Brubank y confirmación de acreditación humana; CTA fucsia «Confirmar venta» al final. Se reconoce una experiencia de decisión de pago separada de edición del carrito.

**Implementación comprobada:** \`src/App.tsx:208-218\` muestra total, métodos, recibido/vuelto y CTA; **solo efectivo habilitado** (\`disabled={i !== 0}\`). El sistema registra una venta real durable en efectivo. El resto es maqueta explícitamente etiquetada como pendiente.

**Brechas:**
- **VH-08 / P0 dominio-futuro:** no copiar la selección visual «Transferencia» como si estuviera operativa; cuando se implemente requerirá revisión manual del movimiento real y un contrato transaccional nuevo con backup compatible.
- **VH-09 / P1:** la decisión real de pago debe ser inequívoca; evaluar si mostrar tres botones deshabilitados añade ruido/confusión y si deben trasladarse a información secundaria mientras no existan.
- **VH-10 / P1:** confirmación durable preparada/reintento no aparece en mockup; es **obligatoria aunque requiera espacio visual**, no esconder para «parecerse».
- **Preservar:** total legible, método separado, importes del dinero, vuelto, advertencias, CTA de una sola escritura.

**Criterio:** con efectivo exacto/recibido insuficiente/fallo de IndexedDB/reinicio, se conoce qué está registrado y no hay doble venta; futuro método transferido nunca indica acreditación sin revisión humana.

## 4. Productos — PR-01/02

**Referencia:** titular editorial, búsqueda, filtros compactos, **único CTA claro Agregar producto**, lista densa con imagen de cada SKU, nombre, variante, precio, cantidad, señal de stock y chevron a ficha. Un artículo crítico destaca sin convertir toda la lista en tarjetas hero.

**Implementación comprobada:** \`src/App.tsx:221-227\` reutiliza búsqueda/categorías/filtros de la venta, lista de productos y \`ProductLine\` con stock y detalle. Añade botón de escaneo deshabilitado. La ficha queda como bloque bajo encabezado de Productos con acciones «Editar», «Favorito», «Recibir mercadería», stock inicial y costos/historial avanzados. **Falta separación estructural entre Catálogo, Inventario y Reposición**.

**Brechas:**
- **VH-11 / P1:** ficha de producto mezcla administración comercial y recepción/stock técnico sin rutas de ámbito; separar contexto de consulta de operaciones físicas.
- **VH-12 / P1:** icono de escáner inactivo no debe competir con botón principal; el presupuesto de navegación visual es limitado.
- **VH-13 / P2:** imágenes de bebidas del mockup no constituyen base de datos confiable. \`ProductArt\` ilustrado es mejor que foto de marca/variante equivocada; cuando exista imagen, validar SKU, compresión y disponibilidad offline.
- **VH-14 / P2:** el listado y el badge por producto deben expresar bajo/crítico según objetivo individual, no fijo por unidades.
- **Preservar:** jerarquía lista compacta, precio, cantidad, estado comercial y acceso a ficha.

**Criterio:** consultar precio sin vender ni abrir modal; ajustar conteo desde Inventario; recibir desde Reposición; filtros restaurados al volver a catálogo.

## 5. Reportes — RE-01/02/03/04

**Referencia:** pestañas Hoy/Semana/Mes, **dos cifras de jerarquía equilibrada** (ventas y ganancia), gráfico magenta de evolución con horas en el día, ranking con producto/imagen/unidades/importe y alerta contextual de reposición. No aparecen ocho resúmenes financieros.

**Implementación comprobada:** \`src/App.tsx:228-236\` tiene períodos y dos métricas; gráfico de **barras por jornada** (no una línea por hora), top cinco con nombre y unidades (sin foto/importe por fila). Al final \`<details>\` para desglose dinero/mercadería e historial de ventas. Esta variación del gráfico es **semántica además de estética**: en la referencia «Ventas del día» por horas, mientras la proyección actual agrupa por jornadas.

**Brechas:**
- **VH-15 / P1:** **no reemplazar barras por una curva falsa**. Decidir primero qué responde cada horizonte: Hoy por horas reales \`registeredAt\` vs Semana/Mes por jornada \`businessDate\`, con especificación de corte 08:00–07:59, zonas horarias y volumen de datos.
- **VH-16 / P1:** historial de ventas repetido bajo Reportes crea una segunda ubicación. Convertir en enlace a Ventas > Historial con retorno al período, sin duplicar escritura.
- **VH-17 / P2:** ranking de referencia combina SKU, unidades e importe; evaluar cuáles ayudan a decidir reposición y qué columnas caben sin truncar.
- **VH-18 / P2:** alertas de «reponer pronto» proceden de stock objetivo y datos reales, no de frase inventada ni predicción sin historia.
- **Preservar:** período claro, dos cifras principales, tendencia significativa, más vendidos y contexto.

**Criterio:** las métricas provienen de datos reales; gráfico siempre declara qué intervalo representa, y no mezcla «hora de carga» con «hora real de venta» no registrada; no inventa comparaciones.

## 6. Caja y cuentas — CA-01/02/07

**Referencia secundaria aprobada visualmente:** pantalla compacta «Caja y cuentas», resumen, pestañas internas o categorías Resumen/Movimientos/Cuentas, acciones cortas y movimientos en lista. El principio aprobado en README es mantener esas tres vistas, con desgloses opcionales.

**Implementación comprobada:** **no existe pantalla propia de Caja**; \`src/app/Movements.tsx\` actúa como mezcla de efectivo y stock, accesible desde Inicio. \`MovementSummary\` aparece en Inicio/Reportes. No hay efectivo **real contado**, cuentas propias ni traspasos.

**Brechas:**
- **VH-19 / P1:** crear primero el destino de Caja y mover gastos/aportes/historial monetario sin inventar \`cash balance\`; conteos físicos de stock a Inventario.
- **VH-20 / P1:** no copiar cifras reales de la imagen o vista «Dinero en caja» sin referencia de saldo inicial ni conteo fechado.
- **VH-21 / P2:** las acciones de Caja futura deben ser compactas y no saturar Inicio; validar jerarquía de tres vistas secundarias.
- **Preservar:** patrón general de densidad, listas, resumen y grupos locales.

**Criterio:** usuario puede encontrar gasto/aporte, identificar compras pagadas sin registrarlas otra vez y distinguir efectivo esperado vs contado sólo cuando datos existen.

## 7. Diferencias que **no** deben corregirse por fidelidad literal

| Elemento estático | Por qué NO copiarlo literalmente |
| --- | --- |
| Cuenta «LP» y campana con alerta | No hay login/identidad notificada actual; inventarlos sería engañoso |
| «Sincronizado» / «ventas pendientes por sincronizar» | MVP local no emite ni confirma operaciones a un servidor |
| Transferencia seleccionada y Brubank acreditado | Cobro transferencia no implementado; confirmación humana pendiente |
| Cifras de ventas/ganancia, % vs ayer, importe en caja | Ejemplos generados sin fuente real |
| Fotos de botellas generadas | No demuestran identidad marca/variante/licencia |
| Hora exacta/ventas por horas de maqueta | Aplicación registra hora de **carga**, no siempre hora física de venta |
| Stock «bajo» por número absoluto | Umbral real por objetivo individual 20 % / 10 % |
| Unidades y precios de ranking inventados | Deben provenir de ventas cargadas en esa instalación |
| Forma precisa del teléfono / notch | Es marco decorativo externo; no es parte del CSS PWA |

## 8. Reglas visuales derivadas de las referencias

1. **Una prioridad visual por tarea**, no múltiples CTA fucsia idénticos: Nueva venta en Inicio, Cobrar en Ventas, Guardar en Cobro, Agregar producto en Catálogo.
2. **Marca editorial controlada:** serif en títulos de portada y algunas cabeceras; números, etiquetas y acciones en sans tabular legible.
3. **Fondo casi negro con rosa de acento**, relieve moderado de superficies; no generar «vidrio» en cada fila, mezcla de gradientes y sombras porque existe un componente \`GlassPanel\`.
4. **Producto reconocible, no necesariamente fotográfico:** nunca intercambiar precisión por una foto falsa.
5. **Barra inferior siempre cuatro áreas**; no usar «Más» ni Caja como quinta pestaña.
6. **Contenido principal antes del detalle técnico**. Costos por lote, UUID y journal no compiten visualmente con precio/unidades.
7. **El mismo espaciado y jerarquía son contratos repetibles**, no recreaciones de cada mockup con márgenes pixel a pixel.
8. **Estado real prevalece sobre mockup**: error, pendiente y confirmación ocupan el espacio que necesitan. No ocultar una falla por fidelidad visual.

## 9. Pendientes para declarar «fidelidad visual comprobada»

- Capturas de **la implementación actual renderizada** en 360/390/430 CSS px, tema nocturno, datos vacíos y registros sintéticos (pestañas, Cobro, ficha, Movimientos, backup).
- Comparar a escala lógica (los mockups 941×1672 incluyen marco de teléfono y no son CSS px): **jerarquía, agrupaciones, densidad, alineación, énfasis, iconos y legibilidad**, no diferencias de píxel brutas.
- Capturas con teclado, scroll, snackbar/confirmación pendiente, costo desconocido, stock bajo/crítico.
- QA del usuario en móvil físico y revisión de accesibilidad; el diseño actual #11 sólo obtuvo aceptación provisional, no conformidad estética.
- Usar capturas y datos **de prueba aislados**. No vaciar base real ni hacer restore sobre un equipo en uso.

**Conclusión:** existe suficiente evidencia para que la nueva arquitectura separe Inventario, Reposición, Caja, Ventas y Reportes y detalle responsabilidades. **No existe todavía evidencia para aprobar píxeles finales o declarar que la nueva UI ya coincide con las cinco referencias**.
