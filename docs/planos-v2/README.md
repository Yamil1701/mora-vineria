# Planos de Mora Vinería 2.0

**Versión:** propuesta 0.2 — 21/10/2026. **Estado:** planos en borrador con **primera ronda de investigación documental y auditoría de código completada** (documentos 06–09). **No constituye aprobación automática, especificación cerrada ni autorización de implementación.**

**Estado QA actualizado por el usuario:** PR #10 aprobada en el teléfono; PR #11 probada y aceptada solo **provisionalmente** en diseño. La investigación no necesita repetir sus pruebas básicas, pero debe protegerlas al reorganizar pantallas.

## Propósito

Este conjunto de documentos es el **mapa maestro del producto**. Responde, antes de construir otra pantalla: ¿qué tarea representa?, ¿a qué área pertenece?, ¿de dónde se accede?, ¿qué cambia al guardarla?, ¿qué datos utiliza?, ¿cuál es su estado y cómo se verifica?

Separar **área** (hogar de una responsabilidad), **pantalla** (vista orientada a una tarea), **acción** (operación del usuario), **flujo** (recorrido), **dominio** (reglas/datos) y **componente** (pieza reutilizable). Una misma información puede aparecer como resumen o vínculo en varias áreas, pero **cada escritura tiene un solo propietario funcional**.

## Índice

1. [01 — Mapa conceptual integral](01_mapa_conceptual.md): jerarquía y relaciones, dentro y fuera del alcance, decisiones de ubicación.
2. [02 — Catálogo de pantallas y funciones](02_catalogo_pantallas.md): inventario de destinos, qué hace cada pantalla, estado real frente al deseado, dueño único de operaciones.
3. [03 — Recorridos, excepciones y estados](03_recorridos_y_estados.md): tareas de ventanilla, mercadería, dinero y recuperación; navegación de vuelta, errores, offline, datos desconocidos.
4. [04 — Arquitectura de interfaz y reglas de construcción](04_arquitectura_y_guardarrailes.md): fronteras UI/dominio, estructura técnica sugerida, componentes, accesibilidad, contratos.
5. [05 — Decisiones, investigación y secuencia](05_decisiones_e_investigacion.md): asuntos abiertos, investigación posterior, pruebas de encontrabilidad y protocolo para modificar los planos.
6. [06 — Auditoría verificada](06_auditoria_verificada.md): hallazgos localizados en código publicado y cambios de ubicación recomendados.
7. [07 — Investigación de normas y UX](07_investigacion_normas_y_ux.md): fuentes oficiales ISO, WCAG, NN/g, Apple, React, GOV.UK, MDN y Dexie, límites y aplicaciones concretas.
8. [08 — Benchmark de POS y componentes](08_benchmark_pos_y_componentes.md): patrones de Shopify, Square y Loyverse evaluados para el negocio.
9. [09 — Decisiones, pruebas y puertas de calidad](09_decisiones_pruebas_y_gates.md): matriz de evidencia, test de árbol con tareas, riesgos y condiciones antes de implementar.

## Fuente de verdad y trazabilidad

- **Negocio:** docs/04_descubrimiento_operativo.md y docs/07_cierre_relevamiento_16_preguntas.md; incluir correcciones posteriores expresas. Un documento propositivo antiguo no deroga una decisión explícita.
- **Diseño:** cinco imágenes y README de docs/diseno/mockups-aprobados-v2/; como complemento visual, caja-cuentas.webp aprobado y carrito.webp aceptado solo para prototipar. Otras propuestas históricas rechazadas no mandan.
- **Ejecución real:** master después de PR #11 (90264e5c4f27132e7314722e38c08edfbb16e73f). El código determina qué funciona **hoy**, pero no define por sí solo lo que **debería** existir.
- **Antecedentes técnicos:** docs/arquitectura-v2/{07_nucleo_local,08_interfaz_integrada,09_backup_json,10_movimientos,11_refoco_visual}.md.
- **Alcance MVP vigente:** React/Vite/TS/Tailwind, PWA, IndexedDB/Dexie, GitHub Pages, datos por navegador y backup/restauración JSON manual. **Sin backend ni sincronización automática en el MVP.** La aspiración histórica de 3–4 equipos sincronizados se conserva para discusión posterior, no se introduce silenciosamente.

## Estados de cada capacidad

- **V — Verificado con QA móvil del usuario:** núcleo de productos/ventas/FIFO/persistencia y backup JSON previo a PR #10.
- **T — Implementado y cubierto por pruebas automáticas; QA móvil completo pendiente:** nuevas operaciones de PR #10 y cambios visuales PR #11.
- **P — Planeado, asociado a necesidad aprobada; no implementado aún:** transferencia manual, pago mixto, fiados, corrección de ventas, retiros, conciliación de caja y preparación de pedidos.
- **E — Exploración condicionada a validar valor/alcance:** escáner, imágenes exactas automáticas, OCR/importación de lista de proveedor, proyecciones avanzadas, PDF de uso dudoso.
- **F — Futuro ajeno al MVP local:** autenticación multi-equipo y sincronización automática, dispositivos habilitados/revocación, servidor, RLS.

Las etiquetas son **evaluaciones de alcance por funcionalidad**, no un certificado de calidad de toda la app. V indica QA de recorridos realizados, no cobertura exhaustiva de todos los casos.

## Principios no negociables

1. Cuatro pestañas en la navegación principal: Inicio, Ventas, Productos, Reportes. Caja y Configuración son destinos contextuales, no pestañas adicionales.
2. Cada acción operativa tiene un **único lugar canónico**. Otros lugares muestran resumen o enlace contextual, nunca crean implementaciones independientes de la operación.
3. Inicio = orientación y próximos pasos; Reportes = interpretación; Productos = mercadería; Ventas = operación comercial; Caja = dinero y cuentas; Configuración = seguridad de datos y preferencias.
4. Las funciones no implementadas no se presentan como disponibles. Los estados de costo/saldo/cobro/stock desconocidos no se inventan.
5. Jornada 08:00–07:59 en Salta internamente, con fecha/hora real y fecha de jornada; **no usar «día operativo» como texto de interfaz**.
6. FIFO e historial auditables, sin duplicar cargos, stock ni ventas; operaciones durables y recuperables.
7. Backup JSON visible y recuperable, sin falso lenguaje de sincronización; nunca borrar datos locales sin autorización y prueba de recuperación.
8. El sistema visual fucsia/carbón y los mockups aprobados guían el render; respetar contraste y uso táctil antes de copiar proporciones.
9. No se mueve lógica de negocio a React mientras se refactoriza la interfaz.
10. El mapa no se declara congelado por autoridad: se **valida con tareas reales** y se versiona bajo control de cambios antes de servir como contrato implementable.

## Regla para evitar nuevas «arenas movedizas»

Ninguna PR funcional nueva se inicia sin: pantalla y dueño documentados, entrada/salida definida, estados/error claros, impacto en datos/backup revisado, prueba de navegación y caso de regresión. Si la funcionalidad no tiene lugar en el mapa, la PR de implementación se pausa y se decide su ubicación **primero**, con cambio explícito a estos planos. No se agregan accesos a Inicio por descarte.

## Actualización documental pendiente

README.md, AGENTS.md y docs/HANDOFF_WORK_V2.md conservan frases históricas de etapas anteriores. No fueron reescritos en esta PR para evitar borrar evidencia. Al aprobar estos planos, incorporar referencias a este índice y una tabla breve de estado vigente que reduzca contradicciones; conservar la historia rotulada como historia.
