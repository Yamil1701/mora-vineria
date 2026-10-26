# 27 — Dirección visual y control de calidad anti-slop para Mora

**Fecha:** 26/10/2026. **Estado:** **propuesta de contrato de trabajo para revisión del usuario**, no selección final de tipografías, tokens, maquetas ni software. Precede a cualquier instrucción a ChatGPT Work para materializar el diseño o construir la aplicación.

## 0. Motivo, encargo y nuevo orden de trabajo

**Necesidad nueva expresada por el usuario:** antes de terminar todos los detalles del plano funcional, realizar un **paso intermedio** y, después de **aprobar expresamente** el diseño y los componentes, **construir una primera parte importante de lo ya planeado**. **No** elegir de inmediato fuentes, tamaños o recursos ni iniciar código por adelantado: primero definir **qué calidad y personalidad esperamos**, producir evidencia visual real y **firmar** el sistema. Work debe conocer prácticas existentes de UI, UX, navegación, presentación, jerarquía, tipografía, color, accesibilidad y diseño de producto, y **evitar interfaces IA genéricas**.

**Cambio de proceso frente al texto anterior de los planos:** la regla anterior «no desarrollar ninguna funcionalidad hasta cerrar todos los planos» queda **supeditada a esta propuesta de excepción por etapas**. No es permiso de implementación: el usuario pidió un paso intermedio, condicionando cualquier construcción a la **firma previa del lenguaje visual y sistema de componentes**. Primero se debate y aprueba la nueva secuencia; luego se trabaja en diseño; después de **aprobación explícita** del sistema visual se define/autoriza una **primera entrega funcional acotada**. La revisión de los contratos restantes podrá continuar sin improvisar estilo en cada PR. Hasta esas dos autorizaciones, **PR #12 sigue documental** y no se escribe código.

**Objetivo:** que Mora se sienta como una aplicación real, propia y coherente, de uso nocturno, operativa en segundos, no un dashboard genérico de SaaS, un template de Tailwind, una colección de tarjetas «glass» o un showroom de componentes de IA.

## 1. Fuentes y precedencia que Work DEBE inspeccionar antes de diseñar

**Fuente visual principal histórica aprobada:**
- `docs/diseno/mockups-aprobados-v2/{inicio,ventas,cobro,productos,reportes}.webp` y `README.md` — cinco mockups móviles originalmente aprobados. **Deben verse de verdad**, no solo leer sus nombres; registrar sus decisiones compositivas: peso editorial, densidad, ritmo vertical, jerarquía de importes, foco de acciones, material de superficies, iconografía y uso del fucsia.
- Complementos: `docs/diseno/prototipos-v2/caja-cuentas.webp` aprobado como referencia secundaria; `carrito.webp` orientativo y **no** aprobado como arte final; `docs/diseno/fondo/fondo-nocturno-fucsia.webp` como referencia ambiental, sujeto a legibilidad/performance.
- Los cinco mockups son **referencias estéticas**; contienen detalles históricos ya reemplazados (dock antiguo, acción Venta en lugar distinto, datos ficticios, «Sincronizado», fotos no verificadas). **Nunca prevalecen sobre el producto y flujo aprobados después.**

**Producto y contratos actuales:**
- `docs/planos-v2/{10_contrato_navegacion,11_contratos_pantallas,12_sistema_componentes,20_observaciones_prueba_usuario,22_cierre_integral_por_bloques,23_auditoria_coherencia_integral,24_contratos_operaciones_y_datos,25_contrato_unificado_pantallas_y_componentes,26_revision_final_integral}.md`.
- Revisar `src/ui/theme.css`, `src/ui/components.tsx`, `src/app/app.css`, `src/App.tsx` como **evidencia de implementaciones actuales que pueden reutilizarse**, no como diseño visual aprobado por defecto.
- Prioridad de decisiones de usuario: **marca «Mora» terminada en cuadrado fucsia pequeño** del tamaño óptico de punto, sin redondez; barra inferior candidata `Inicio · Ventas · (+ Nueva venta) · Caja · Más`; Ventas = historial, + = Nueva venta; Más = raíz; header compacto de dos franjas; Reposición independiente y pedido pendiente prioritario.

**Regla de precedencia:** acuerdos expresos recientes y reglas de integridad > composición aprobada de referencias móviles (adaptada) > contratos visuales propuestos > imágenes secundarias toleradas > código actual > maquetas/UX descartadas. No «mejorar» el diseño ignorando su identidad previa.

## 2. Principios de diseño obligatorios, traducidos a decisiones observables

| Principio UX/UI | Exigencia verificable para Mora | Antipatrón que debe rechazarse |
| --- | --- | --- |
| **Jerarquía de información** | En 3 segundos se reconoce pantalla, dato principal y siguiente acción; la segunda prioridad no compite con la primera | Seis tarjetas iguales, cinco titulares grandes o métricas sin propósito |
| **Diseño por tarea** | Inicio orienta; Ventas gestiona historia; + cobra; Productos consulta; Inventario cuenta; Reposición compra; Caja mueve dinero | Una pantalla que mezcla ventas, stock, gasto, backup y reportes por conveniencia |
| **Consistencia y estándares** | Misma apariencia/comportamiento para acciones, controles, iconos, espaciado, búsqueda, error, retorno y confirmación en todas las áreas | Botones y sheets diferentes porque cada pantalla se generó separadamente |
| **Reconocimiento antes que memoria** | Accesos con etiquetas; retorno predecible; distinguir «precio», «stock», «saldo» y «ganancia» sin jerga; encontrar funciones desde un único dueño | Iconos crípticos, navegación laberíntica, acciones ocultas detrás de gesto |
| **Control y prevención de errores** | Previsualización explícita antes de modificar dinero, precio o stock; reintento seguro, restauración de contexto; deshacer solo si el dominio lo permite | Toast «Éxito» al tocar, pago confirmado sin verificación, botón atrás borra borrador |
| **Densidad móvil consciente** | Filas compactas en catálogos y operaciones repetitivas; aire en resumen/cobro o decisiones de alto impacto; 360–430 CSS px con teclado | Todos los ítems son enormes tarjetas con blur o todos son texto comprimido |
| **Tipografía con roles** | Comparar al menos 2 propuestas de tipografía por legibilidad, identidad y disponibilidad/licencia; marca/titulares pueden ser editoriales, **cuerpo, números y controles operativos deben ser claros** | Mezclar cuatro familias, serif en importes, tipografía «moderna» genérica sin motivo |
| **Color semántico** | Acento fucsia de referencia `#FF0A89`; jerarquía por contraste y rol, fondos carbón. Definir estados y superficies como tokens, no hex arbitrarios por pantalla | Neón/gradientes en todos lados, texto blanco de bajo contraste sobre fucsia, todos los datos coloreados |
| **Composición y ritmo** | Grid, alineaciones, espaciamiento, radios y bordes consistentes; usar divisores para filas y elevación solo cuando agrupa una tarea | Tarjetas anidadas en tarjetas, tres sombras, grandes huecos decorativos |
| **Iconografía y medios** | Familia de iconos única, pesos y tamaños consistentes, acciones reconocibles con etiqueta cuando hace falta; SKU con variante verificada y fallback sobrio | Emoji como icono de producción, imágenes erróneas, ilustración ajena de banco/persona inexistente |
| **Feedback de estado** | Vacío, cargando, guardando, confirmado, error y pendiente **concretos, veraces y recuperables** | Skeleton eterno, «sincronizado» sin servidor, saldos/ventas inventados |
| **Accesibilidad como restricción** | Contraste, foco, targets táctiles, fuente escalable, teclado, safe areas, navegación por atrás, lenguaje claro y reducción de movimiento | Microtipografía por estética, gestos obligatorios, botón Cobrar tapado por teclado |

### Umbrales de referencia (objetivo de diseño, no certificación automática)

- **WCAG 2.2 AA** como base de contraste y comportamiento accesible: texto regular **4,5:1**, texto grande **3:1**, foco claro, zoom y estados no dependientes solo de color. Controles web cumplen el requisito aplicable de **tamaño mínimo 24×24 CSS px con excepciones**; para acciones táctiles frecuentes Mora fija un **objetivo propio de 44–48 CSS px**, sin confundirlo con el mínimo normativo. En iOS, Apple recomienda controles cómodos de **44×44 pt**; son unidades distintas y no debe afirmarse que 44 CSS px sean equivalentes exactos a 44 pt.
- Validar diseño/scroll a **360/390/430 CSS px**, con texto ampliado y teclado abierto; no usar el tamaño fijo del mockup 941×1672 como viewport objetivo. Verificar posición del CTA con soft keyboard y safe area.
- Los colores por sí solos no comunican stock bajo, error o éxito. Verificar contraste de texto **sobre el fondo final renderizado** incluyendo blur/transparencias, no sobre una muestra plana.
- Todos los números de dinero y stock legibles en listas; ningún tamaño mínimo de cuerpo arbitrario queda «firmado» aquí. Proponer escala y probarla en pantallas completas.

## 3. Lenguaje visual esperado — dirección, NO catálogo de valores elegidos

**Identidad:** memorable, reservada y deliberada. **Marca editorial:** `Mora` más cuadrado pequeño fucsia; el signo no es un icono ni botón. Palabra de marca y título de pantalla no deben competir. Debe existir una versión compacta de header y una opción de uso en documentos, con reglas.

**Paleta:** carbón muy oscuro, jerarquías de superficies sutiles, fucsia acento definido, texto bien contrastado, secundario legible y estados semánticos sobrios. Se debe mostrar **dónde NO usar** el fucsia: no hacer que cada precio, badge, ícono, borde, gráfico y CTA destaque simultáneamente.

**Tipografía:** estudiar carácter de la marca sin sacrificar lectura nocturna. Proponer **sistema tipográfico razonado** (identidad y operativo), justificar peso, jerarquía de montos, títulos, labels, hints y largas listas. **No seleccionar una familia definitiva en esta fase**; los ejemplos y licencias se presentarán con muestras reales y aprobación posterior.

**Materiales:** superficie oscura uniforme; fondo nocturno con tratamiento ambiental sutil **en el shell**, no repetido como wallpaper dentro de tarjetas. Blur opcional, moderado y probado; efecto vidrio solo si separa una capa o foco. Borde/relieve deben significar jerarquía, no decorar cada componente.

**Composición:** Inicio con resumen dominante; Nueva venta y Productos orientados a **escaneo de filas** y uso en una mano; Cobro con total y métodos inequívocos; Reposición con pendiente y compra; Caja con cuentas reales/verificadas; Reportes centrado en interpretación. No forzar la misma «hero card» en todas las áreas.

**Sistema, no pantallas aisladas:** elementos canónicos `AppShell`, header, `BackControl`, dock con + como acción, fila producto, control de cantidad, campo de pesos, diferencias antes/después, lista/historial, estado vacío, error persistente, confirmación real, vista de impresión. **Componentes reutilizables de verdad**: consistencia de estilo, comportamiento y semántica, no 30 abstracciones sin propósito.

## 4. Qué NO debe hacer Work (rechazo explícito)

1. Entregar un «rediseño moderno» de aspecto genérico sin haber **visto** las referencias aprobadas.
2. Inventar **paletas, tipografías, radios o iconos** sin compararlos y documentar por qué resuelven un problema en Mora.
3. Copiar un template de dashboard SaaS/Tailwind y cambiarle nombre/rosa.
4. Crear paneles enormes de KPI, métricas falsas, gráficos decorativos, fondos con gradientes omnipresentes, glassmorphism masivo, bordes y sombras anidados, iconos/emoji ornamentales, tarjetas para cada fila.
5. Imponer fotos de marcas/productos no verificados, imágenes generadas como catálogo real, banners de marketing, avatares, perfiles, roles o estados sincronizados inexistentes.
6. Diseñar solamente el happy path o una captura bonita: omitir lista larga, nombres cortados, datos nulos, deuda, recibo parcial, error/recarga, offline o teclado.
7. Reemplazar el dock `Inicio · Ventas · + · Caja · Más` por el antiguo sin registrar razón y pedir aprobación de cambio.
8. Tratar `Mora.` como punto redondo o exagerar el cuadrado como «logo gigante».
9. Ocultar información crítica dentro de modales, dropdowns o `...`; sumar confirmaciones innecesarias por parecer «seguro»; hacer swipe la única manera de corregir.
10. Llamar «listo» a un documento de inspiración sin decisiones, comparar solo miniaturas, mostrar 10 teléfonos en collage para ocultar problemas, o diseñar componentes de distintas familias en cada pantalla.
11. Empezar JSX, CSS, modificar `src/`, Dexie, precios, dominio o publicación por iniciativa propia **antes de la aprobación visual y autorización específica de implementación**.

**No se rechaza una solución porque la haya producido una IA.** Se rechaza cuando carece de identidad, consistencia, evidencia de decisiones, eficiencia operativa o calidad comprobable.

## 5. Método de trabajo que Work debe seguir (fase visual previa a código)

### Entrega A — Auditoría visual y de tareas

- Abrir las **cinco imágenes principales a tamaño de pantalla**, observar los detalles de layout, tipografía, filas, relieves, colores, navegación; leer contratos vigentes y examinar implementación actual para preservar patrones válidos.
- Construir una **matriz mantener / corregir / eliminar / todavía falta**, indicando cada referencia y por qué. Diferenciar lo aprobado históricamente de lo desplazado por nuevas decisiones, no borrar referencias.
- Mostrar un **mapa de jerarquía por pantalla y tarea** antes de dibujar: el dato dominante, acción primaria, secundaria, contenido avanzado y estados. Usar usuario móvil nocturno, con una mano y compra frecuente.

### Entrega B — Exploración controlada con criterio

- Presentar **máximo 2 direcciones visuales coherentes y realmente distintas**, ambas basadas en Mora; no generar 10 opciones superficiales.
- Para cada dirección, mostrar: mini paleta por roles y contraste, jerarquía tipográfica **con texto real** y alternativas razonadas, tratamiento de superficie/relieve, familia iconográfica, spacing/grid, variante de wordmark y uso de cuadrado.
- Probar **las mismas 3 pantallas comparables** en ambas direcciones (Inicio, Nueva venta/selector y Caja o Reposición; elegir Caja/Reposición según deficiencia actual). No usar datos ficticios contradictorios; ejemplos identificados como ilustrativos.
- Debatir diferencias por **escaneabilidad, comodidad táctil, expresividad y coherencia**; explicar sacrificios. Elegir dirección **solo tras respuesta del usuario**.

### Entrega C — Sistema de diseño mínimo firmable

Una vez elegida dirección, especificar y presentar:
- **Tokens** por rol: color/surface/text/estado, tipografía y tamaños, grid y espaciado, bordes/radios, iconografía, foco/press/busy/disabled, sombras/blur si proceden, safe areas y breakpoints móviles;
- **Componentes básicos con estados** y patrones de interacción en un solo catálogo, en contexto de pantallas, no cuadros de «UI kit» que nunca aparecen realmente;
- **Pantallas representativas completas** al menos Inicio, Nueva venta, Cobro, Productos, Reposición y Caja; pantallas restantes heredan reglas sin reinventar layouts;
- **Estados no felices** a la vista: catálogo vacío, stock crítico, saldo desconocido, pedido parcial, transferencia no verificada, backup/restauración y error de operación pendiente;
- **Matriz de fidelidad:** diferencias justas respecto a mockups aprobados y correcciones obligadas por navegación/reglas vigentes;
- **Prueba documentada de coherencia**: misma cabecera, dock, campos, filas, CTA y flujo de vuelta en todos los módulos.

### Gate de firma visual — no negociar implícitamente

Work **no puede declararse terminado** si no entrega: (i) auditoría visual trazable, (ii) comparación de propuestas, (iii) contrato mínimo de design system, (iv) pantallas completas evaluables a tamaño móvil, (v) estados/errores, (vi) evidencia de contraste/tacto/teclado y (vii) lista explícita de discrepancias/riesgos. Un collage de pantallas o colores bonitos **no cuenta**.

Solo una **aprobación visual explícita del usuario** «Apruebo la dirección y componentes» (o equivalente) firma la base. Cualquier pendiente se registra con estado. **Luego** se decide qué primera porción funcional esencial y ya planificada conviene construir; requiere **otra autorización específica** de alcance, rama, datos y publicación. No usar la firma visual para anticipar código.

## 6. Fuentes externas primarias y principios, sin importar una estética ajena

**Referencias oficiales/metodológicas que Work debe consultar o citar cuando tome decisiones técnicas (no certificación automática):**

- **W3C — WCAG 2.2**: https://www.w3.org/TR/WCAG22/ — contraste, foco, texto escalable, target size, interacción de entrada.
- **Apple — UI Design Dos and Don’ts**: https://developer.apple.com/design/tips/ — contenido sin scroll horizontal, tamaño y espaciado de controles táctiles, alineación y legibilidad.
- **Apple — Accessibility HIG**: https://developer.apple.com/design/human-interface-guidelines/accessibility — gestos, cognición, controles, foco y targets según plataforma.
- **Nielsen Norman Group — 10 heurísticas**: https://www.nngroup.com/articles/ten-usability-heuristics/ — visibilidad de estado, mundo real, control, consistencia, prevención de errores, reconocimiento y minimalismo.
- **NN/g — Consistency and Standards**: https://www.nngroup.com/articles/consistency-and-standards/ — consistencia visual, funcional e iconográfica transversal.

**No** copiar la apariencia de Apple, Material, Square o Shopify para Mora. Sus principios **informan decisiones**, no son licencia para transplantar la marca o layout. Las referencias ya aprobadas por el usuario siguen siendo el norte visual.

## 7. Alcance de la primera construcción intermedia (AÚN NO AUTORIZADA)

El usuario plantea una **primera versión parcial pero completa en su recorrido**, priorizando lo importante y ya definido. **Propuesta de criterio**, todavía no fijación de alcance: construir solo un *vertical slice* que permita **consultar producto → iniciar venta → cobrar → historial / operación segura** más persistencia/backup y navegación real, con **todos sus estados** y componentes ya firmados. No construir 8 portadas que solo muestren «próximamente». El alcance concreto de Caja, Inventario o Reposición en esa primera entrega se acuerda **después de firmar UI** con verificación de compatibilidad del núcleo.

**No confundir:** construir «lo importante primero» **no** significa dejar pantallas a medias o hacer arquitectura «temporal» que se convertirá en deuda; los componentes/contratos deben poder ampliarse al resto del plano sin reescritura estética.

**El resto de los planos funcionales** continúa bajo control de cambios: no afirmar que sus pequeñas reglas pendientes están aprobadas solo porque haya una entrega parcial de software.

## 8. Estado y salida esperada de esta especificación

**Este documento es una propuesta para revisión conjunta**, no una autorización. Se debe mostrar al usuario el contrato anti-slop y la secuencia con los gates, recibir aceptación/corrección, y actualizar la portada y `AGENTS.md` para que futuras misiones Work den prioridad a esta guía. No tocar software hasta esas confirmaciones.

**Diagnóstico de consistencia documental:** documentos viejos como `docs/10_sistema_visual_v2.md`, `docs/planos-v2/14_matriz_fidelidad_visual.md` y `docs/diseno/mockups-aprobados-v2/README.md` preservan un dock histórico `Inicio/Ventas/Productos/Reportes`; su regla literal de navegación queda **reemplazada**, aunque los criterios visuales siguen aportando. Las referencias de marca `Mora.` deben leerse como histórico de puntuación, porque el signo nuevo es **cuadrado**. No pedir a Work que siga ambos órdenes de dock.
