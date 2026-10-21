# 07 — Investigación de estándares UX/UI, calidad y seguridad de datos

**Investigación documental iniciada:** 21/10/2026. **Estado:** revisión de fuentes públicas primarias y guías técnicas, **no** lectura del texto integral de normas ISO comerciales ni certificación de conformidad. Hipótesis de aplicación a Mora distinguidas de requisitos literales de cada fuente. Última comprobación de enlaces: esta revisión.

## 1. Jerarquía de evidencia

1. **Hecho del negocio** confirmado por el usuario y observaciones de uso en su contexto.
2. **Regla técnica verificable** en código, base y pruebas.
3. **Norma oficial** para delimitar criterios de calidad; distinguir obligación normativa, recomendación y criterio adoptado voluntariamente.
4. **Guía de plataforma / patrón** (W3C, Apple HIG, React, GOV.UK, MDN/Dexie), interpretada con contexto.
5. **Benchmark de otras POS** como evidencia de soluciones viables, no prueba de que sean mejores para Mora.
6. **Hipótesis del equipo**, pendiente de task testing.

Una norma no define dónde debe colocarse el botón «Contar stock» de Mora, pero ayuda a formular requisitos de predictibilidad, claridad y control. Evitar «ISO obliga a usar X layout» sin fundamento. No confundir certificación con intención de diseño.

## 2. Normas ISO consideradas

| Referencia vigente confirmada en ficha pública | Alcance oficial conocido | Traducción propuesta para Mora | Alcance de nuestra revisión |
| --- | --- | --- | --- |
| ISO 9241-210:2019 (confirmada 2025) | Principios/actividades de diseño centrado en las personas, durante el ciclo de vida de sistemas interactivos | Partir de tareas de ventanilla, reposición semanal y caja; contrastar con operadores; iterar antes de codificar | Se leyó resumen y ficha, no todo el estándar |
| ISO 9241-11:2018 (confirmada 2023) | Marco de conceptos para comprender y evaluar usabilidad | Valorar si las tareas se completan correctamente, con poco esfuerzo y claridad; especificar contexto (celular/noche/desconexión) | Ficha/resumen oficial |
| ISO 9241-110:2020 (confirmada 2025) | Principios de interacción de alcance general para sistemas interactivos | Acciones predecibles, feedback comprensible, retorno seguro, controles consistentes, prevención de errores en dinero/stock | Ficha/resumen oficial; no atribuir lista exhaustiva no leída |
| ISO 9241-143:2012 (confirmada 2024) | Requisitos/recomendaciones para diseñar y evaluar formularios, entradas o selecciones etiquetadas | Formularios de efectivo, cantidades, costos, conteos, restauración y confirmación con lenguaje y validación pertinentes | Ficha/resumen oficial |
| ISO/IEC 25010:2023 | Modelo de calidad de producto ICT/software con nueve características, subdivididas | Evaluar fiabilidad local, experiencia, rendimiento, facilidad de mantenimiento, comportamiento offline y compatibilidad, sin inventar una «nota ISO» | Ficha/resumen oficial |
| ISO/IEC 25012:2008 (confirmada 2025) | Modelo de calidad de datos estructurados, 15 características según perspectivas del dato/sistema | Integridad de importes/stock, datos faltantes explícitos, no duplicar ventas y consistencia entre vista, journal y JSON | Ficha/resumen oficial |

**Fuentes oficiales:**
- [ISO 9241-210:2019](https://www.iso.org/standard/77520.html)
- [ISO 9241-11:2018](https://www.iso.org/standard/63500.html)
- [ISO 9241-110:2020](https://www.iso.org/es/contents/data/standard/07/52/75258.html)
- [ISO 9241-143:2012](https://www.iso.org/standard/53590.html)
- [ISO/IEC 25010:2023](https://www.iso.org/standard/78176.html)
- [ISO/IEC 25012:2008](https://www.iso.org/standard/35736.html)

**No afirmamos:** que Mora cumpla estas normas; que sus listas de subcriterios se hayan leído integralmente; que una acreditación ISO sea necesaria para un POS local; que sus versiones deban reevaluarse sin comprobar el catálogo ISO.

## 3. WCAG 2.2 y accesibilidad de interacción móvil

**Marco:** [WCAG 2.2](https://www.w3.org/TR/WCAG22/), W3C. Evaluar **nivel AA como objetivo voluntario de diseño**, sin asegurar conformidad antes de pruebas manuales/asistidas.

| Criterio o pauta | Hecho documentado por W3C | Aplicación medible a Mora |
| --- | --- | --- |
| 1.4.3 Contraste mínimo (AA) | Texto normal 4,5:1 y grande 3:1, con excepciones | Medir cada combinación real de texto sobre fondo, tarjeta semitransparente y botón fucsia, incluidos overlays nocturnos y estados |
| 2.5.8 Tamaño de objetivo mínimo (AA) | 24×24 px CSS como mínimo con excepciones de espaciado/equivalencia, etc. | Objetivo **propio** más cómodo para acciones frecuentes y críticas: 44–48 px; no decir «WCAG obliga a 44» |
| 2.4.11 Foco no oculto (mínimo, AA) | Elemento con foco por teclado no debe quedar completamente tapado por contenido generado por autor | Probar compra con teclado, carrito sticky, menú inferior, modal, teclado de pantalla y regreso |
| 3.3.7 Entrada redundante (A) | Minimizar reingreso innecesario de información en un mismo proceso bajo condiciones descritas | No pedir cantidades o montos ya introducidos salvo confirmación de hechos físicos nuevos |
| 3.3.8 Autenticación accesible (AA) | Relevante si se incorporara auth futura | No introducir login en MVP ni usar criterio para justificar complejidad inexistente |
| Patrones complementarios | Etiqueta, orden, errores, estado, zoom, teclado y semántica de controles | Testing de inputs/summary/diálogo y feedback con lector de pantalla; el color no debe ser único código de significado |

Fuentes: [contraste](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum), [tamaño de objetivo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum), [WCAG 2.2 completa](https://www.w3.org/TR/WCAG22/). La verificación de accesibilidad necesita además revisar HTML/ARIA renderizados, foco y tareas reales; tests automatizados por sí solos no prueban todo WCAG.

**Diseño nocturno:** fucsia es acento de marca, no sustituto de contraste ni semáforo universal. El texto sobre fucsia se selecciona por contraste real, no por estética. Las informaciones críticas (efectivo, diferencia, crítico) deben distinguirse por texto y estructura, no sólo por color.

## 4. Arquitectura de información y navegación — pruebas, no intuiciones

[NN/g: Tree Testing](https://www.nngroup.com/articles/tree-testing/) explica que:
- **Card sorting** sirve para explorar agrupaciones y nombres sugeridos por usuarios; **tree testing** evalúa una jerarquía ya propuesta.
- Pruebas cualitativas iniciales son útiles para descubrir errores de etiquetas sin diseñar pantallas; no deben confundirse con estimaciones estadísticas.
- Registrar destino elegido, desviaciones, retrocesos y confusión. Una arquitectura sólo parece lógica en papel hasta que personas reales encuentran tareas.

[Apple HIG: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) (guía revisada en 2026) diferencia **navegación entre secciones de primer nivel** de acciones sobre contenido; recomienda pestañas reconocibles con etiquetas y evitar «More» como desborde frecuente. [Apple HIG: Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars) separa comandos y búsqueda respecto de destinos de tab bar.

**Aplicación a Mora:**
1. Barra inferior estable Inicio/Ventas/Productos/Reportes. Caja y Ajustes secundarios sin inventar una quinta pestaña.
2. Para «me equivoqué al cargar gasto», el destino de dinero está en Caja y el mensaje de error se presenta allí; no agregar botón aislado en Inicio.
3. Un enlace contextual puede traer al destino canónico con filtro/producto preseleccionado, **sin otra ejecución del mismo registro**.
4. Jerarquía de tres niveles cuando sea razonable: pestaña > lista/área > detalle/acción. No convertir todo en modales de un solo nivel, ni forzar una ruta larga para vender una botella.
5. Contexto de regreso: dónde estaba el usuario y qué estaba haciendo; no confundir estado de borrador de venta con un filtro visual que puede reiniciarse.

**No asumir:** que ubicar una función en un dominio «conceptualmente correcto» asegura que el usuario la encontrará. Primero tree test con escenarios propios.

## 5. Diseño de formularios, errores y divulgación progresiva

El [GOV.UK Design System: Error message](https://design-system.service.gov.uk/components/error-message/) recomienda presentar el error asociado al campo que debe corregirse. Diferenciar error de validación de fallo general del servicio/almacenamiento. Aplicación:
- Importe recibido insuficiente: explicar junto al campo, conservar texto.
- Stock baseline cambió antes de confirmar: explicar junto al resumen de comparación y exigir comprobación actualizada.
- IndexedDB sin espacio: pantalla de recuperación sin sugerir borrar datos del sitio.
- Restauración de JSON: explicar qué archivo, qué datos y por qué no puede importarse sobre base con actividad.

[GOV.UK: Details](https://design-system.service.gov.uk/components/details/) distingue detalle opcional de información que la mayoría necesita. **No ocultar datos indispensables para completar una venta o recuperar información solo porque una tarjeta queda grande.** Ejemplos:
- Correcto: segmentos FIFO con IDs bajo «Información avanzada».
- Incorrecto: confirmación de transferencia real u origen del dinero oculta dentro de una explicación desplegable.
- Correcto: desgloses secundarios de Reportes bajo demanda.
- A verificar: historial completo debajo de un acordeón si es un destino frecuente.

La jerarquía visual no se mide por número de tarjetas sino por cuál es la acción y decisión principal y cuánta información requiere la persona para actuar.

## 6. Componentes y estado frontend — documentación React

[React: Thinking in React](https://react.dev/learn/thinking-in-react) propone crear jerarquía de componentes a partir de responsabilidades, diseñar sus estados, decidir dónde vive el estado y mantener datos en una sola dirección.

[React: Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure) advierte sobre datos redundantes, estados contradictorios y duplicación.

**Aplicación a Mora:**
- Un único snapshot/proyección sirve a Inicio, Productos, Caja y Reportes. No duplicar monto/stock en \`useState\` sin necesidad.
- \`src/App.tsx\` debe dejar de administrar todas las pantallas; responsabilidades aisladas por ámbito.
- Evitar un sistema de estado, router o librería UI nueva como respuesta automática. Primero diseñar un pequeño contrato \`destination + screen + context\` y demostrar que no rompe navegación/borrador.
- Reducir estilos duplicados; no sobre-normalizar todos los \`GlassPanel\` como iguales cuando la jerarquía de producto necesita roles distintos.

## 7. Persistencia y continuidad — MDN y Dexie

[MDN: Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API) distingue almacenamiento web de mejor esfuerzo vs persistente, cuotas, presión de almacenamiento y posible expulsión del origen. \`navigator.storage.persist()\` puede solicitar persistencia donde corresponda, pero no reemplaza una copia externa; soporte/decisión depende del navegador.

[Dexie: Best practices](https://dexie.org/docs/Tutorial/Best-Practices) advierte sobre esperar APIs asíncronas ajenas a IndexedDB dentro de transacciones; puede finalizar una transacción prematuramente.

**Aplicación a Mora:**
1. IndexedDB + PWA funcionan localmente; **no prometer conservación indefinida** de todos los registros en cualquier dispositivo.
2. Backup y restauración JSON siguen como funciones de primera categoría, con navegación estable, aviso accionable y prueba real de archivo.
3. Al rediseñar formularios, mantener \`writeIntent\`, commandId y transacciones intactos; estado de UI jamás garantiza por sí solo que se guardó.
4. Si se evalúa persistencia reforzada del almacenamiento, hacerlo como mejora de riesgo con pruebas Safari/Android y mensajes comprensibles; no integrarlo silenciosamente con este refactor.
5. Una PWA offline no es sinónimo de registros sincronizados ni de respaldo externo.

## 8. Checklist de criterios transformados en decisiones evaluables

| Nº | Regla de producto propuesta | Evidencia de aprobación que exigiríamos |
| --- | --- | --- |
| ST-01 | Ninguna función sin un propietario y una ruta canónica | Todas las tareas listadas en árbol, sin dos formularios |
| ST-02 | Destinos de bottom nav son categorías estables, no botones de acción | Cuatro tabs y retorno consistente |
| ST-03 | Pantalla con acción principal clara, no tarjetas acumulativas sin jerarquía | Un operador describe qué puede hacer en pocos segundos |
| ST-04 | Errores específicos al contexto, sin pérdida de datos | Fallos probados + recuperación |
| ST-05 | Contraste y objetivos táctiles comprobados en render | Matriz real AA donde aplica + decisión objetivo 44–48 |
| ST-06 | Información crítica visible, detalles técnicos secundarios | Tests de task completion, no sólo screenshots |
| ST-07 | Costos/saldos/cobros desconocidos no se presentan como reales | Tests de datos parciales y formatos |
| ST-08 | UI y dominio desacoplados | Ninguna operación recalculada en JSX |
| ST-09 | Backup alcanzable y portable | Descargar, mover a otro origen, restaurar y comparar |
| ST-10 | Diseño modular sin dependencia innecesaria | Revisión de diffs por área + tests de regresión |
| ST-11 | Cuatro áreas top-level, pero área Caja y Configuración con acceso obvio | Tree testing con 10 tareas |
| ST-12 | Flujo de venta rápido sin carrito obligatorio | Ruta directa de un producto a cobro con historial intacto |

## 9. Qué falta investigar para cerrar la norma aplicada

- Acceso al cuerpo autorizado del estándar ISO (si se requiere un análisis de cláusulas, no sólo resumen); no incluir texto protegido ni ofrecer falsa conformance.
- Pruebas de lector de pantalla, zoom, foco, teclado nativo y contraste real sobre el wallpaper.
- Árbol propuesto sometido a usuarios reales. No sustituir test con decisiones del asistente.
- Benchmark POS revisado como decisiones **transferibles/no transferibles** en el documento 08.
- Versiones de librerías y navegadores de dispositivos de prueba específicas, antes de recomendar cambios técnicos.
