# 21 — Hipótesis de shell: 3 destinos principales, + Nueva venta, Más y encabezado fijo

**Fecha:** 21/10/2026. **Estado:** **alternativas para evaluar**; la preferencia posterior del usuario favorece **Variante B, con Caja visible**, pero NO es arquitectura final aprobada ni permiso para implementar. Surge de las respuestas del usuario registradas en [20](20_observaciones_prueba_usuario.md) y conserva [ADR 17](17_adr_ventas_y_nueva_venta.md): Ventas es un área, + inicia/retoma venta.

## 0. Problema planteado por el usuario

El operador no identificó ningún destino apropiado para registrar un aporte de dinero en el dock anterior (Inicio, Ventas, +, Productos, Reportes). Propuso sustituir Reportes por Caja/Movimientos, permitir **más secciones en un índice accesible**, y exploró una barra de **tres áreas + acción central + + Más**. También sugirió un **header sticky** con identidad y accesos importantes (búsqueda, ajustes, estado); **no** necesita perfil porque el MVP no maneja usuario/login.

### Principios no negociables mientras evaluamos alternativas

- + central hace **exclusivamente Nueva venta**, nunca actúa como quinta sección ni muestra un menú de acciones.
- Ventas es **historial y gestión**, no Nueva venta.
- Una tarea escribe datos en **un solo propietario canónico**; los accesos pueden ser múltiples, la operación/journal no.
- Caja y dinero ≠ Reportes ≠ Inventario. Los gastos/aportes van a Caja; recepción de mercadería va a Reposición y su egreso aparece en Caja una sola vez.
- Offline y datos reales: Dexie/IndexedDB, FIFO y backup JSON sin alterar; no simular perfil, banco conectado o sincronización.
- La estética oficial oscura/fucsia de las referencias sigue vigente, pero el **shell se debe adaptar** a la navegación revisada. No copiar la barra antigua de las imágenes ciegamente.

## 1. Dos variantes principales de dock para contrastar

**Variante A — Productos visible, Caja desde encabezado + Más**

~~~text
[Inicio] [Ventas] [(+) Nueva venta] [Productos] [Más]
~~~

- **Ventaja:** mantiene consulta de productos, Inventario y Reposición en un acceso directo; útil para consultar precios, mermas y compras.
- **Costo:** Caja, que el operador echó de menos, queda fuera de los tres destinos del dock. Para hacer A viable habría que ofrecer un **acceso «Caja» rotulado y persistente en el encabezado**, además de aparecer en Más. Un icono sin etiqueta no resuelve el hallazgo de encontrabilidad por sí solo.
- **Test decisivo:** registrar aporte de $5.000 y gasto puntual sin pasar por Reportes ni recorrer varias pantallas.

**Variante B — Caja visible, Productos desde Más (**PREFERIDA POR EL USUARIO**, pendiente de prueba)**

~~~text
[Inicio] [Ventas] [(+) Nueva venta] [Caja] [Más]
~~~

- **Ventaja:** Caja queda disponible permanentemente, sin exigir un rodeo para aportes, gastos y dinero real. Respeta la propuesta espontánea de sacar Reportes de la barra.
- **Costo:** Catálogo/Inventario/Reposición dejan de ser destinos del dock. Necesita que el índice Más los presente con nombre evidente; consulta de precio sin venta y registrar merma podrían costar un paso adicional.
- **Test decisivo:** botella rota, consultar precio sin crear borrador, recepción de cajones y pedido semanal. **La prioridad de Caja quedó confirmada cualitativamente**, pero no se ha probado que estos recorridos sigan siendo fáciles a través de «Más».

**Variante C — reconsiderar Inicio como destino permanente** (opción de respaldo, sin asumirla):
- Si los ensayos muestran que tanto Caja como Productos son críticos y la gente rara vez abre Inicio, evaluar **Ventas, Productos, Caja, +, Más** u otro orden **con el usuario**. No se adoptará por cálculo abstracto de frecuencia.
- La decisión sobre **qué tres accesos son los más importantes no está tomada**. Ninguna A/B/C es aprobada por escribirse en este documento.

### Evaluación rápida que debemos pedir al operador

1. ¿Cuáles tres áreas toca con mayor frecuencia al trabajar y cuáles solo consulta ocasionalmente?
2. ¿Qué destino espera para un aporte? Ya observamos que la barra original falla.
3. ¿Qué primera opción elige para una botella rota? Observado: Productos > Inventario > Stock por producto.
4. ¿Qué le significa «Más»: directorio de secciones, opciones de cuenta o menú de operaciones? No asumir.
5. ¿Encuentra el acceso a respaldo en Más > Configuración > Datos sin recibir una pista?
6. ¿Un botón «Caja» en el header resuelve realmente la barrera de alcance táctil desde el teléfono?

### Decisión confirmada sobre Mercadería en «Más» (21/10/2026)

**El usuario eligió expresamente la opción A:** en el directorio **«Más»**, mostrar **tres accesos directos, distintos y rotulados**, bajo el grupo **Mercadería**:

1. **Productos** → Catálogo, consulta de precios, fichas, categorías y edición comercial.
2. **Inventario** → Stock por producto, recuentos, ajustes con motivo e historial de existencias.
3. **Reposición** → Faltantes y recepción de mercadería; preparación de pedido sólo cuando se implemente.

**Estos son tres puntos de entrada, NO tres dominios independientes.** Inventario y Reposición conservan su dueño funcional dentro de Productos; los enlaces reutilizan las pantallas y operaciones canónicas. «Más» no duplica formularios, datos, comandos ni historial. Las entradas que hoy no tengan una función implementada mostrarán solamente las capacidades reales y no prometerán disponibilidad futura.

**Jerarquía aprobada para probar:**

~~~text
Más
├─ Mercadería
│  ├─ Productos        → Catálogo
│  ├─ Inventario       → Stock por producto
│  └─ Reposición       → Compras / recepciones existentes
├─ Análisis
│  └─ Reportes
└─ Aplicación y datos
   └─ Configuración / Datos y respaldos (ubicación exacta aún a validar)
~~~

**Pendiente de validación:** apariencia visual final de «Más», ergonomía y accesibilidad de estos tres enlaces; regla de tab activo y retorno; y decidir si «Datos y respaldos» aparece como entrada directa además de Configuración. Esta aprobación **no cierra por sí sola** la variante B del dock ni autoriza implementar, fusionar o desplegar.


## 2. «Más» es un directorio de secciones, no un cajón desordenado

La cuarta ubicación es un **destino real, explícitamente rotulado «Más»**, que abre un **índice navegable agrupado**. No es un botón que abre 14 operaciones directas en un panel flotante. El índice puede tener una barra de búsqueda de **secciones** si el árbol es grande (no confundirla con búsqueda de productos).

**Propuesta de IA para la Variante A:**

| Grupo | Entradas | Propietario operativo |
| --- | --- | --- |
| **Dinero** | Caja y dinero → Resumen / Movimientos / Cuentas | Caja |
| **Analizar** | Reportes → Hoy/Semana/Mes | Reportes |
| **Mercadería** | Inventario; Reposición (accesos rápidos opcionales) | Productos |
| **Datos y ajustes** | Configuración → Respaldo/Restauración/Estado local | Configuración |

**Propuesta de IA para la Variante B:**

| Grupo | Entradas | Propietario operativo |
| --- | --- | --- |
| **Mercadería** | **Productos**, **Inventario** y **Reposición**: tres entradas directas desde Más (decisión aprobada; ver sección anterior) | Productos (un único dueño funcional) |
| **Analizar** | Reportes → Hoy/Semana/Mes | Reportes |
| **Datos y ajustes** | Configuración → Respaldo/Restauración/Estado local | Configuración |
| **Dinero** | Caja y dinero → (enlace contextual sólo si se justifica, sin segundo módulo) | Caja |

**Criterio reforzado por el usuario:** que Productos no tenga un botón propio en el dock **no equivale a perder acceso**; mostrar **Productos** como opción claramente identificada, desplegando Catálogo / Inventario / Reposición sin esconderlas bajo rótulos vagos. Reportes y Configuración también deben quedar localizables. 

**Lo que «Más» NO contiene:** duplicados de «Nueva venta», formularios paralelos de gasto, conteo, recepción o abono; iconos sin nombre; enlaces a login, Supabase, funciones fiscales, banco conectado, múltiples perfiles o cloud. Los apartados futuros pueden figurar en el **plano**, pero no necesariamente como opciones vacías/decorativas de una app publicada.

**Enlaces transversales:** una alerta «Para reponer» en Inicio puede saltar a Productos > Reposición; un ítem Reportes puede abrir Ventas > Detalle. El destino final mantiene su propietario y el botón Volver devuelve al contexto de origen.

### Decisión confirmada — tocar «Más» abre siempre su directorio principal (21/10/2026)

**Aprobada por el usuario:** cada pulsación explícita sobre **«Más» en la barra inferior** abre **la raíz del directorio «Más»**, aun si la vista actual es Productos, Inventario, Reposición, Reportes, Configuración o un detalle al que se llegó desde ese directorio. **No** debe devolver automáticamente a la última subpantalla visitada dentro de «Más».

**Separar esta acción del botón Volver:**

- **«Más» (destino global):** navegación deliberada hacia el índice raíz, con el contexto visual de «Más»; no reabrir una pantalla hija por recordar su ruta.
- **«Volver» (navegación contextual):** regresar al padre o al origen de acceso correspondiente, conservando filtros, búsqueda y estado de consulta cuando corresponda. Por ejemplo, «Más → Inventario → Producto → Volver» retorna a Inventario; «Inicio → aviso de stock → Inventario → Volver» respeta el origen Inicio según la política de retorno a validar.
- **Datos y operaciones:** entrar al índice no debe eliminar el borrador durable de venta, crear comandos nuevos ni descartar silenciosamente formularios con cambios sin guardar o confirmaciones críticas. Las operaciones selladas mantienen sus guardas; si cambiar de destino no es seguro, primero se resuelve la protección del flujo.
- **Pendiente de definir en el contrato integral:** historial de navegación del sistema/navegador, indicador de destino activo para subpantallas y política exacta de restauración de contexto tras volver. **No** reinterpretar el botón global «Más» como acción de historial.

Esta decisión de apertura de «Más» queda **cerrada para los planos**. No significa aprobar aún la implementación del dock completo ni la apariencia final del directorio.

## 3. Encabezado sticky coherente con Mora

### Decisión de estructura confirmada por el usuario (21/10/2026)

**Aprobado como criterio para el plano y el prototipo — no es autorización para implementar:** un **único header global compacto, con dos franjas visuales dentro del mismo componente**:

1. **Franja de identidad global, fija:** nombre estilístico exacto **«Mora.»**, manteniendo el tratamiento gráfico de marca observado en Inicio. Incluye pocos **accesos secundarios pertinentes**; no perfil, login, notificaciones o sincronización ficticios. Configuración puede ser un acceso secundario global, además de su lugar inequívoco en «Más». El número/orden final de accesos se valida visualmente; no llenar por llenar.
2. **Franja contextual, inmediatamente debajo y también persistente al desplazarse por las pantallas habituales:** presenta título, orientación/Volver y **acciones propias del área actual**, cambiando de contenido al navegar. Forma parte del mismo header; no requiere un segundo componente independiente. La búsqueda es contextual cuando corresponde, no una búsqueda global implícita. No duplicar un título gigante de contenido con esta franja.

Esquema conceptual aprobado:

~~~text
┌────────────────────────────────────────┐
│ Mora.                  [accesos útiles]│  identidad global
│ [Volver si aplica]  Área / contexto   │  cambia según pantalla
├────────────────────────────────────────┤
│ Contenido del área                     │
│ ...                                    │
├────────────────────────────────────────┤
│ Inicio · Ventas · (+) · Caja · Más     │  dock B: candidato, por validar
└────────────────────────────────────────┘
~~~

Ejemplos de contenido contextual (sin comprometer iconos finales):

| Área | Franja contextual |
| --- | --- |
| Inicio | «Resumen de hoy», sin duplicar la marca como gran título |
| Ventas | «Ventas», búsqueda/filtros del historial según necesidad |
| Caja | «Caja», contexto de Resumen / Movimientos / Cuentas |
| Más | «Más», orientación y búsqueda de secciones **solo si se justifica** |
| Productos / Inventario / Reposición | Título de la subárea, Volver coherente con procedencia, búsqueda cuando aporte valor |
| Reportes | «Reportes», período/filtro contextual sin sustituir su barra propia si fuera necesaria |
| + Nueva venta | Estado de venta y búsqueda operativa prioritaria, compactando controles secundarios si el teclado resta altura |
| Cobro / recuperación crítica | Cabecera adaptada o condensada con título y regreso seguros; nunca pérdida silenciosa de borrador/writeIntent |

**Alcance exacto de la aprobación:** el usuario confirmó este **patrón de header de dos niveles** y el nombre «Mora.». El dock de Variante B y la maqueta definitiva de «Más» siguen **candidatos principales** hasta validar recorridos y visuales; no considerarlos aprobados para implementación. El boceto previo de una sola línea de marca con título debajo en contenido se conserva como antecedente, pero **prevalece esta decisión**.


### Boceto previo (orientativo; sustituido por el contrato de dos franjas)

~~~text
┌──────────────────────────────────────────┐
│  Marca Mora (identidad)      [Acceso] [⋮] │  ← encabezado fijo
├──────────────────────────────────────────┤
│  Título contextual de la pantalla          │
│  Métrica / formulario / lista             │  ← contenido desplazable
│  …                                       │
├──────────────────────────────────────────┤
│  3 destinos   (+)    Más                 │  ← dock persistente
└──────────────────────────────────────────┘
~~~

**Distinción:** marca global y **título real de pantalla** no deben convertirse en dos encabezados gigantes duplicados. En Inicio puede conservarse el logo editorial de la referencia y en el resto compactarse a una fila con título corto o logo secundario. El usuario pidió **uniformidad**, no una franja ornamental permanente que robe altura útil al teclado.

### Slots del header y límites

| Slot | Posible comportamiento | Regla |
| --- | --- | --- |
| Marca «Mora Vinería» | Identidad de app y orientación. Eventual enlace a Inicio sólo si se prueba | No fingir perfil ni notificaciones |
| Contexto (título/back) | «Ventas», «Caja», «Inventario», «Cobro» y Volver cuando corresponda | No duplicar grandes cabeceras ni romper el stack |
| Búsqueda | Solo donde la búsqueda ayuda (producto, historial, directorio Más); puede abrir campo de búsqueda del destino actual | **No** buscar «globalmente» a través de entidades sin contrato; no crear borrador solo por consultar SKU |
| Acceso prioritario | «Caja» etiquetado en A, o herramienta/estado contextual si B | Máximo uno; no convertir la cabecera en quinta/sexta barra |
| Configuración | Entrada estable a Datos/Respaldo, desde Más y/o engranaje global si se valida | No duplicar el exportador JSON |
| Estado local | Sólo estado relevante y real: «Guardado en este equipo», operación pendiente, respaldo riesgoso, sin conexión | No «Sincronizado», cuenta conectada ni nube |

**Mínimo recomendado para prototipo:** marca + un acceso contextual y Configuración accesible desde Más. **No** mostrar siempre 3–5 íconos diminutos al mismo tiempo para «llenar» el header.

### Sticky vs scroll y excepciones

- **Sticky dentro del shell**, colocado por encima de contenido con z-index y zonas seguras controlados; no implementar duplicado por pantalla ni múltiples portales.
- En Inicio o Reportes, un título grande puede pasar a formato compacto al desplazar **sin saltos** en la distribución del contenido; no es requisito implementar animación.
- En Nueva venta, priorizar búsqueda/lista y Cobrar por encima del header; con teclado abierto, evitar que header + footer reduzcan todo el alto disponible. Se puede compactar u ocultar acciones secundarias.
- En Cobro, restauración de datos, confirmación crítica o modal nativo, el header puede compactarse/ocultarse **si existe título propio, regreso seguro y foco correcto**. +/Más no deben permitir interrumpir una operación sellada incompatible.
- En móviles 320, 360, 390 y 430 CSS px validar safe-area superior/notch, teclado, orientación, zoom y VoiceOver/TalkBack.
- Los botones críticos deben tener nombres accesibles y target cómodo (objetivo propio 44–48 px), contraste y foco comprobables sobre el fondo realmente renderizado.

**No requiere backend, router externo, librería de animaciones ni UI kit nuevo**. Puede reutilizar `AppShell`, `BottomNav`, `Dialog`, tokens y `LocalService`; extender sus contratos tras la aprobación del diseño, no ahora.

### Decisiones confirmadas de comportamiento del shell y regreso (21/10/2026)

**Aprobación expresa del usuario para los planos:**

- **Destino activo por área mostrada:** Movimientos de dinero → Caja; Inventario/Productos/Reposición/Reportes/Configuración → Más; historial/detalle de ventas → Ventas. **Nueva venta (+) nunca se marca como tab activa.**
- **Volver contextual:** retrocede al padre o procedencia real, no fuerza Inicio. Si se llegó desde «Más», se vuelve al directorio al agotar hijas; si desde alerta de Inicio, se regresa a Inicio. Enlaces cruzados conservan contexto de origen, filtros y período cuando sea seguro.
- **«Más» es siempre raíz al tocarlo en dock**, independiente del botón Volver (decisión ya confirmada arriba).
- **Nueva venta en pantalla concentrada (variante B de flujo):** esconder el dock inferior global durante Selector, Carrito, Cobro y confirmaciones relevantes, dejando espacio a selección, edición y CTA Cobrar; mantener cabecera «Mora.» compacta y regreso seguro. Salir del Selector vuelve al destino de procedencia sin borrar borrador; Carrito vuelve a Selector; Cobro vuelve a la etapa de entrada. Un `writeIntent` sellado/pendiente debe resolverse con el mismo ID, sin permitir otra operación incompatible. «Volver» ≠ «Cancelar venta».

**Botón Volver propio de Mora — ubicación aprobada expresamente por el usuario (21/10/2026):** un único patrón `BackControl` situado **siempre al inicio, a la izquierda, de la segunda franja contextual** del header de dos niveles (primera franja: marca «Mora.» + accesos secundarios; segunda: Volver + contexto y acciones). Utilizar icono de flecha izquierda coherente, mismo objetivo táctil (44–48 px), texto «Volver» visible cuando quepa y nombre accesible que identifique destino. El contenido contextual cambia, **el control no cambia de ubicación**. En raíces sin padre navegable (Inicio/Ventas/Caja/Más), no dibujar una flecha inerte; alinear contenido de forma estable. En pantallas concentradas mantiene su sitio, evitando sustituirlo por un botón de cerrar ambiguo; si hay una operación crítica pendiente, guardia y recuperación prevalecen.

**Pendientes para el prototipo físico:** verificar interacción con el botón del navegador/gesto Android/iOS, retroceso desde la raíz, foco al retornar, teclado, safe areas y comportamiento durante confirmaciones. Estos criterios no garantizan por sí mismos accesibilidad ni validación de usuario.


## 4. Conclusiones de investigación, sin convertirlas en mandatos

- [Apple HIG — Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) (actualizada junio 2026): favorece destinos de primer nivel y desaconseja ocultar secciones frecuentes en «More» porque se vuelven menos visibles. **Por eso A/B depende del uso real de Caja vs Productos.**
- [Android — Layouts and navigation patterns](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns): navegación visible, FAB de una sola acción importante y barra superior con controles de segundo nivel son patrones conocidos; admite combinaciones.
- [Apple HIG — Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars): título, volver, búsqueda y acciones, seleccionados sin saturar el espacio.
- [NN/g — Beyond the Hamburger](https://www.nngroup.com/articles/find-navigation-mobile-even-hamburger/): recomienda menú mixto de opciones visibles y ocultas cuando la jerarquía lo requiere, señalización comprensible y acceso persistente.
- [Android — Navigation bar](https://developer.android.com/develop/ui/compose/components/navigation-bar): componente para destinos de igual nivel; + debe ser botón de acción en vez de seleccionado como cuarta/quinta sección.

Una app PWA en navegador no hereda automáticamente los controles nativos de iOS/Android. Estas guías **fundamentan decisiones de interacción**, no implementaciones obligatorias en React.

## 5. Casos de aceptación adicionales, por ejecutar

| ID | Situación | Qué se debe observar |
| --- | --- | --- |
| SH-01 | «Aporté $5.000 de mi bolsillo» | Primer lugar elegido para Caja en A y B; número de desvíos sin pistas |
| SH-02 | «Se rompió una botella» | Encuentra Stock por producto y registro seguro de -1 sin tarea oculta |
| SH-03 | «¿Cuánto cuesta este producto?» | Encuentra consulta sin añadirlo a un carrito y sin borrador ficticio |
| SH-04 | «Guardar backup antes de cambiar teléfono» | Encuentra Configuración/Datos desde dock/Header/Más sin adivinar icono |
| SH-05 | «Ver ganancia de la semana» | Encuentra Reportes en Más y conserva período al volver |
| SH-06 | Estaba pagando y necesita volver a carrito | Recupera flujo; header y + no descartan el borrador ni duplican commandId |
| SH-07 | Barra y cabecera en móvil con teclado | CTA/campo/foco visibles, targets alcanzables y safe areas |
| SH-08 | Lector de pantalla anuncia + y Más | «Nueva venta» botón, «Más» destino, «Caja» destino; aria-current solo en destino activo |
| SH-09 | Tab activo mientras navega desde Más a detalle de Caja/Productos | Se indica ubicación coherente; Volver regresa al directorio o al contexto de origen según política |
| SH-10 | Restauro desde JSON sobre destino vacío | No se pierde acceso al estado crítico por hide del header; no se sobrescribe base ocupada |

La prueba ya realizada en conversación ([20](20_observaciones_prueba_usuario.md)) **aporta dos hallazgos**, pero **no reemplaza** esta comparación de variantes ni constituye aprobación de A/B.

## 6. Decisiones que sí hay que pedir al usuario

1. **Preferencia de los tres accesos directos ya expresada:** Inicio, Ventas, Caja. **Confirmar mediante prototipo** que Productos/Inventario/Reposición desde Más resultan encontrables y rápidos. Mantener A sólo como alternativa si aparecen problemas de uso.
2. Aprobar que el cuarto destino se llame y funcione como **«Más»** (directorio de secciones), ya que fue sugerido como posibilidad, no ordenado como requisito cerrado.
3. Aprobar el **principio de header global compacto**, su punto de acceso a Configuración y dónde exhibe Caja si no está en el dock.
4. Decidir qué contenido mínimo debe verse en la portada de Más, sin amontonar operaciones.

**No se pregunta de nuevo** si Ventas debe ser área o si + inicia Nueva venta: eso ya fue decidido.

## 7. Impacto en los planos vigentes

- El **ADR 17 sigue vigente en la separación Ventas/+**.
- Su orden visual literal Inicio/Ventas/+ /Productos/Reportes queda **bajo reconsideración por comentario posterior**; no se reemplaza como hecho consumado.
- `01_mapa_conceptual.md`, `02_catalogo_pantallas.md`, `10_contrato_navegacion.md` y los prototipos actuales describen la **versión anterior a validar**; cuando se apruebe A/B deben actualizarse, no mantenerse dos órdenes activos.
- `18_prevalidacion_heuristica.md` recomendó una entrada de Caja en Inicio antes de escuchar estas respuestas; esa recomendación fue **cuestionada** por el hallazgo y no debe tratarse como solución final.
- `19_guion_prueba_arbol.md` usa el dock antiguo: conservarlo como **instrumento de la primera versión**, preparar una variante neutral para A/B cuando sea oportuno.
- `16_secuencia_constructiva.md` requerirá una PR de shell/header/índice Más antes de la redistribución de pantallas; **sin** tocar el dominio/local/backup.

**Estado final de esta investigación:** hipótesis de navegación ampliada, lista para validación. **No se ejecutó código, UI ni prueba física.**
