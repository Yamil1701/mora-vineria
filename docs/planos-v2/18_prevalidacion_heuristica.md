# 18 — Prevalidación heurística: Caja, Inventario, Reposición, Datos y acción +

> **Documento histórico de hipótesis ANTERIOR a escuchar las respuestas del usuario.** El operador no encontró Caja en la barra propuesta y eligió Stock por producto antes de Contar; ver [20](20_observaciones_prueba_usuario.md). Esta recomendación de entrada a Caja por Inicio **no queda aprobada**. Se comparan alternativas nuevas en [21](21_hipotesis_shell_mas_header.md).

**Estado:** análisis de arquitectura de información realizado sobre el árbol propuesto, el código real de `master` y los contratos 01–17. **NO es una prueba de usuarios**, no incluye porcentajes ni afirma que una ruta ya resulte intuitiva. Fecha: 21/10/2026.

## 0. Decisiones vigentes y límite del análisis

**Aprobado expresamente:** dock con cuatro destinos y acción central `Inicio · Ventas · + Nueva venta · Productos · Reportes`; Ventas abre gestión/historial, + abre/retoma una venta. Fuente: [ADR 17](17_adr_ventas_y_nueva_venta.md). Los cuatro destinos y el funcionamiento local ya eran decisiones previas.

**Propuesto y pendiente de probar:** acceso a Caja y Configuración, y forma de navegar desde Productos hacia Catálogo/Inventario/Reposición. La **propiedad funcional** de esas tareas se establece en el mapa 01, pero el **primer acceso visual** todavía no está aprobado.

**No realizado:** tree testing con persona operadora; comparación de renders y uso con teclado móvil; pruebas de accesibilidad. Ninguna observación de este documento equivale a «el usuario encontró X».

## 1. Árbol mínimo candidato de uso cotidiano

~~~mermaid
flowchart TB
  Dock["Dock: Inicio | Ventas | (+ Nueva venta) | Productos | Reportes"]
  Dock --> IN["Inicio: resumen, avisos y acceso a Caja"]
  Dock --> VE["Ventas: historial y gestión"]
  Dock --> PLUS["(+) Nueva venta: selector → carrito opcional → cobro"]
  Dock --> PR["Productos"]
  Dock --> RE["Reportes: consultar períodos"]
  PR --> CAT["Catálogo: ficha, precio, alta/edición"]
  PR --> INV["Inventario: cantidades, conteos y ajustes"]
  PR --> REP["Reposición: faltantes, pedido futuro, recepción real"]
  IN -. "acceso contextual" .-> CA["Caja y dinero: resumen, movimientos, cuentas"]
  Dock -. "icono/entrada estable por confirmar" .-> CO["Configuración: Datos y respaldo"]
~~~

Las flechas de acceso en la figura **no implican una quinta pestaña**. El + es una acción, no un destino de informe/administración.

**Camino canónico** y **primer acceso** son dos cosas distintas. Ejemplo: registrar un gasto **pertenece** a Caja → Movimientos → Gasto aunque se permita un enlace contextual desde Reportes. Si el operador abre ese acceso desde Reportes, no se crea otra implementación de gasto en Reportes.

## 2. Tres alternativas de entrada que vale la pena comparar

### CAJA — dónde poner un acceso suficientemente visible

| Alternativa | Ventaja | Riesgo / impacto visual | Estado |
| --- | --- | --- | --- |
| A. Acceso identificable «Caja» en Inicio, con lectura compacta si hay datos | Lugar predecible para operar; no ocupa tab principal | Inicio vuelve a acumular tarjetas si se presenta con muchas cifras y formularios | **Candidata preferida**, requiere tree test |
| B. Icono de cartera en encabezado global | Acceso desde cualquier destino, sin ocupar Inicio | Icono ambiguo, compite con Configuración, poco claro sin etiqueta | Candidata alternativa |
| C. Acceso exclusivo desde Reportes | Relacionado a indicadores de dinero | Falla para quien solo desea registrar un aporte/gasto sin analizar resultados | **Desaconsejada por heurística**, no resultado de usuarios |

**Condición común:** Caja incluye operaciones monetarias y cuentas; no contiene conteos de mercadería. El resumen físico real no puede mostrar monto contado sin que una persona lo haya registrado.

**Candidata a verificar:** Inicio muestra un solo acceso claro a Caja, sin desplegar registro de gastos en el tablero; Reportes puede enlazar a detalle de Caja cuando la consulta lo requiera. Si la prueba con operador indica que Caja debe estar más disponible, revisar su entrada, **no** crear un quinto destino sin decisión explícita.

### PRODUCTOS — cómo ofrecer tres tareas distintas

| Alternativa | Ventaja | Riesgo / costo de acceso | Estado |
| --- | --- | --- | --- |
| A. Al tocar Productos abre **Catálogo**; un selector local visible ofrece Catálogo / Inventario / Reposición | Consulta de precio sigue rápida, áreas secundarias encontrables | Tres rótulos pueden comprimirse en 320–360 px; deben probarse con letra grande | **Candidata preferida**, no aprobada |
| B. Productos abre portada con tres botones grandes (Catálogo/Inventario/Reposición) | Clasificación muy explícita | Añade una pantalla/paso a consulta de precio, que es frecuente | Alternativa si A falla |
| C. Catálogo + menú desplegable con Inventario/Reposición | Mantiene catálogo limpio | Riesgo alto de ocultar tareas frecuentes | **Desaconsejada por heurística** |

**Rutas propuestas:** `Productos > Inventario > Contar stock`; `Productos > Reposición > Recibir mercadería`; `Productos > Catálogo > Ficha > Editar`. Inicio puede enlazar «Para reponer» a Reposición **sin** convertir Inicio en gestor de pedidos.

**Prueba crítica:** alguien que debe anotar una botella rota no debería buscar «Movimientos» dentro de Caja. Si lo hace, revisar rótulo «Inventario» y su visibilidad antes de duplicar la acción.

### CONFIGURACIÓN/DATOS — cómo asegurar recuperabilidad

| Alternativa | Ventaja | Riesgo | Estado |
| --- | --- | --- | --- |
| A. Ajustes identificable en encabezado global con nombre accesible y etiqueta visible cuando corresponda | El respaldo puede encontrarse desde cualquier sección | En algunos estados/overlays puede no existir encabezado; icono sin texto poco reconocible | **Candidata preferida**, probar |
| B. «Configuración y datos» como entrada estable al pie de Inicio | Explícita, sin crear tab | Puede quedar debajo del scroll y convertir Inicio en menú | Alternativa |
| C. Backup sólo como acción dentro de Caja o Reportes | Agrupa información administrativa | Hay riesgo de no encontrarlo antes de cambiar navegador | **Descartar como único acceso** |

**Regla transversal:** un aviso temporal «Hace tiempo que no descargás un respaldo» (siempre basado en metadata confiable) puede abrir **Configuración > Datos**, no desplegar un segundo exportador. El hecho de preparar un JSON no confirma que la persona lo haya guardado externamente.

## 3. Evaluación estática de encontrabilidad por tarea

Esto es una **predicción heurística del equipo**, no una tasa de acierto. La persona operadora deberá elegir sin ayuda en [19 — Guion de validación](19_guion_prueba_arbol.md).

| Pregunta natural | Destino canónico en plano | Primer acceso candidato | Riesgo de confusión a investigar |
| --- | --- | --- | --- |
| «Anotar lo que acabo de vender» | + → selector/cobro | **+ central** | Que se pulse Ventas por hábito previo |
| «Ver lo que vendí ayer» | Ventas → Historial | **Ventas** | Que se pulse + o Reportes |
| «Cargué mal una venta anterior» | Ventas → Historial → Detalle | **Ventas** | Que se intente cambiar precio en Productos |
| «Se rompió una botella» | Productos → Inventario → Conteo | **Productos** | Que «movimiento» se interprete como dinero |
| «Llegaron cajones pagados» | Productos → Reposición → Recibir | **Productos** | Que se anote como gasto y como recepción |
| «Preparar pedido de la semana» | Productos → Reposición → Pedido **futuro** | **Productos** | Que se confunda envío con recepción |
| «Anotar gasto de limpieza» | Caja → Movimientos → Gasto | **Inicio → Caja** | Que Caja no sea visible sin scrollear |
| «Puse dinero mío en el negocio» | Caja → Movimientos → Aporte | **Inicio → Caja** | Que se trate como venta/ganancia |
| «Quiero contar billetes» | Caja → Resumen → Contar **futuro** | **Inicio → Caja** | Que «Conteo» remita al stock |
| «Guardar datos en un archivo» | Configuración → Datos → Backup | **Ajustes global** | Que se espere en Reportes o Inicio |
| «Precio de un producto sin vender» | Productos → Catálogo | **Productos** | Que se pulse + y se cree borrador innecesario |
| «¿Cuánto vendí esta semana?» | Reportes → Semana | **Reportes** | Que se lea solo historial sin métricas |

**Nota:** Que la misma tarea tenga un enlace contextual desde otra pantalla **no** implica segunda implementación ni segunda base; todos los caminos terminan en la misma pantalla/operación.

## 4. Problemas específicos que podrían escapar al árbol

1. **Dock con 5 posiciones físicas:** la diferencia semántica del + no será visible en un tree test de texto; se necesita después un prototipo en móvil. El + no obtiene `aria-current` y no representa «sección activa».
2. **Nombres del negocio:** «Caja», «Dinero», «Movimientos», «Inventario» y «Reposición» tienen límites conceptuales distintos. Un árbol puede resultar lógico al diseñador y no al operador. No adoptar etiquetas por preferencia técnica.
3. **Tareas futuras:** Fiados, Correcciones, Preparar pedido y Conteo de caja están en el mapa para probar estructura, pero no disponibles en producción. El ensayo debe aclararlo sin hacer creer que funcionan.
4. **Ingreso a Caja:** la navegación inferior de cuatro destinos + centro no tiene lugar para un icono extra. Encontrabilidad debe provenir de jerarquía secundaria clara, no de saturar el dock.
5. **Regreso contextual:** al entrar en Inventario desde una alerta de Inicio, el botón Volver puede retornar a Inicio; al entrar desde Productos, debe retornar a Productos con contexto. Es un problema de estado de navegación, no de base de datos.
6. **Borrador de venta:** ir desde + a Ventas (historial) **no** descarta el borrador; al volver a + se retoma. El estado duradero manda sobre la apariencia de tab activa.

## 5. Criterios de decisión antes de congelar la navegación

- **Encontrabilidad:** el operador llega a destino correcto sin pistas del facilitador. Si toma ruta alternativa, registrar *cuál* y por qué.
- **Diferencia de responsabilidades:** no hay dos formularios independientes para el mismo hecho ni compra contabilizada dos veces.
- **Costo de acceso:** consulta de precio y nueva venta siguen siendo directas; Inventario/Caja/Backup no requieren peregrinar por varios contextos.
- **Integridad y recuperación:** rutas no resetean Draft/WriteIntent ni ocultan backup; los errores críticos bloquean operaciones incompatibles, no internet.
- **Coherencia visual:** las pestañas y el + ocupan exactamente la jerarquía solicitada por el usuario; datos críticos visibles; acceso a área secundaria reconocible.
- **Evidencia:** sin una prueba de operador, la preferencia A es una **candidata heurística**, no decisión final aprobada.

## 6. Fuentes y límites

- [NN/g — Tree Testing: Evaluate Menu Labels and Categories](https://www.nngroup.com/articles/tree-testing/) (revisado agosto 2026): útil para probar etiquetas y jerarquía antes de diseñar pantallas; método cualitativo con pocas personas.
- [NN/g — Interpreting Tree Test Results](https://www.nngroup.com/articles/interpreting-tree-test-results/): analizar primeras elecciones, éxito y retrocesos; no atribuir valores cuantitativos con n pequeño.
- [Home Office — Navigation](https://design.homeoffice.gov.uk/accessibility/page-structure/navigation): consistencia de acceso y formas de orientación; múltiples caminos no implican duplicar operación.
- [Android — Layout and Navigation Patterns](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns): una acción destacada principal y controles secundarios en contexto.
- [WCAG 2.2 SC 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum): foco no totalmente tapado por dock, CTA sticky, teclado.

**Resultado de esta fase:** caminos candidatos y conflictos identificados para testear; **no** se realizó test de usuario y **no** se aprobaron pantallas ni diseño final.
