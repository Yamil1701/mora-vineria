# 28 — Encargo preparado para ChatGPT Work: dirección visual, componentes y firma ANTES de código

**Estado:** texto **para una futura misión de Work**, no misión enviada ni autorizada para ejecutar, no código ni despliegue. **Primero confirmar este encargo con el usuario**. El detalle normativo y anti-slop está en [27](27_direccion_visual_y_control_anti_slop.md).

## Contexto del proyecto

Repositorio `Yamil1701/mora-vineria`; rama documental draft PR #12, `docs/plano-maestro-producto-v2`. MVP local-first, PWA mobile-first, React/Vite/TypeScript/Tailwind, Dexie/IndexedDB, GitHub Pages con `base: "/mora-vineria/"`, respaldo JSON obligatorio y PDF mensual por `window.print()`. **No backend, login, Supabase o sincronización**. Los tres grandes bloques de producto ya tienen dirección conceptual acordada; aún falta cierre integral y **firma de diseño visual**.

El usuario criticó varias interfaces previas como **genéricas, inconexas y «IA slopping»**. No basta cambiar una paleta o juntar diez capturas; hay que construir un **sistema de diseño propio** y justificado, aplicable a toda Mora, con buena jerarquía, navegación, ergonomía y una familia de componentes consistente. **No elegir de entrada tipografía ni tokens definitivos sin revisar y mostrar alternativas**. No escribas nuevo JSX/CSS ni refactorices app todavía.

### Insumos de lectura y observación OBLIGATORIOS

- `docs/planos-v2/27_direccion_visual_y_control_anti_slop.md` (**reglas y gate de calidad**).
- `docs/planos-v2/{10_contrato_navegacion,11_contratos_pantallas,12_sistema_componentes,20_observaciones_prueba_usuario,22_cierre_integral_por_bloques,23_auditoria_coherencia_integral,24_contratos_operaciones_y_datos,25_contrato_unificado_pantallas_y_componentes,26_revision_final_integral}.md`.
- **Abrir e inspeccionar visualmente** las cinco referencias `docs/diseno/mockups-aprobados-v2/{inicio,ventas,cobro,productos,reportes}.webp`; inspeccionar como secundaria la aprobada `docs/diseno/prototipos-v2/caja-cuentas.webp` y solo como orientación `carrito.webp`. Consultar el README de cada carpeta.
- Contrastar la implementación actual `src/ui/theme.css`, `src/ui/components.tsx`, `src/app/app.css` y `src/App.tsx` para detectar patrones útiles o inconsistentes, sin tomarlos como objetivo automático.
- Usar **W3C WCAG 2.2 AA**, **Apple HIG** y las heurísticas de **Nielsen Norman Group** como principios, no como plantillas estéticas; URLs y parámetros en documento 27.
- Precedencia: **decisiones recientes del usuario > referencias móviles aprobadas, adaptadas a flujos vigentes > contratos propuestos > maquetas históricas > implementación vieja**. El dock viejo no manda. La marca es `Mora` + **cuadrado pequeño fucsia como punto**, no punto redondo.

## Misión exacta de Work (solo diseño, sin ejecución de producto)

**Objetivo:** definir, comparar y llevar a firma **dirección de arte y sistema de componentes** suficientemente precisos para que una primera implementación esencial no caiga en diseño genérico ni requiera rehacer cada pantalla.

**Etapa 1 — Auditoría contrastada:** presentar una matriz `preservar / corregir / eliminar / falta diseñar` por referencia y pantalla, problemas actuales verificables, jerarquía de tareas, navegación y principios de contraste/tacto. **No omitir mirar las imágenes** ni trasladar literalmente datos, fotos, menú, sincronización o user avatars ficticios.

**Etapa 2 — Dos direcciones argumentadas:** como máximo **dos propuestas** coherentes, con tipografía de marca e interfaz (sin compra obligatoria ni tipografía elegida arbitrariamente), roles de color, materiales, relieve, densidad, grid, iconografía, patrón de navegación y significado de acciones. Ambas deben conservar identidad carbón/fucsia y distinguirse por soluciones reales. Mostrar las **mismas tres pantallas**, preferentemente Inicio, Nueva venta y Caja/Reposición, a tamaño móvil. Explicar decisiones, compensaciones y por qué no son una plantilla SaaS retematizada.

**Etapa 3 — Esperar selección/aprobación del usuario:** no fabricar un «ganador» ni pasar a componentes definitivos sin respuesta. Resolver detalles menores dentro de la dirección elegida.

**Etapa 4 — Contrato final de design system:** tokens justificados y auditados, wordmark de cuadrado, tipografía/espaciado/relieve, un `AppShell`, header contextual, `BottomNav` con `+` como acción, un kit real de botones, filas, campos monetarios, búsqueda, cantidad, revisión de precios, confirmación y feedback; estados interactivos y vacíos; reglas de teclado/safe area/touch/foco. Adjuntar pantallas completas Inicio, Nueva venta, Cobro, Productos, Reposición y Caja **en el mismo lenguaje visual**, y reglas para Reportes, Inventario y Configuración. Identificar diferencias obligadas por negocio, no atribuirlas a «estilo».

**Etapa 5 — QA de diseño y entrega para firma:** presentar comparativa, referencias y matriz de fidelidad, inspección de contraste sobre fondos reales, muestra 360/390/430 CSS px, teclado, texto largo, estados normal/error/vacío/pendiente/confirmado, accesibilidad y navegación/back. Listar discrepancias y correcciones. **No declarar completado** con miniaturas, collage o párrafos vagos. Pedir **aprobación explícita del usuario** del sistema visual y componentes.

**Etapa 6 — Solo tras firma visual:** preparar (no ejecutar sin autorización) una propuesta de **primera implementación esencial acotada pero completa en flujos** con criterios de éxito, archivos, regresión y riesgo de datos. El usuario definirá y autorizará alcance y despliegue aparte; diseño firmado no implica merge ni código automático.

## No negociables para el resultado

- **No estética genérica** de Tailwind dashboard, 8 tarjetas iguales, iconos sin texto, 3 fondos con gradiente, glassmorphism por todas partes, neón en todos los datos, animaciones sin sentido o métricas inventadas.
- En cada pantalla se debe reconocer **tarea/dato principal/acción principal** y distinguir claramente acción primaria vs secundaria. Filas compactas para producto/historial, foco real en venta/cobro, Caja y Reposición propias.
- Colores por **roles** y contrastes comprobables: `#FF0A89` es acento, no todo el texto. Referencia WCAG 2.2 AA texto normal 4.5:1, grande 3:1, área mínima web AA 24×24 CSS px con excepciones; **objetivo propio para uso frecuente: 44–48 CSS px**. No confundir métricas iOS en puntos.
- **Marca** cuadrado pequeño, del tamaño visual de un punto, no un bloque grande; auditar tamaño/alineación en mobile.
- Dejar claro qué está **aprobado, propuesto y pendiente**. Si no pudiste inspeccionar la imagen o probar un contraste, **declararlo** y no inventar una verificación.
- **Sin código, migración, backend, servicios nuevos, PR de implementación, merge o despliegue** durante esta misión.

## Entregables exactos

1. Auditoría visual estructurada con las referencias examinadas y problemas priorizados.
2. Máximo dos direcciones estéticas completas y comparables, con razones y *trade-offs*.
3. Visuales de referencia **a tamaño móvil** y variantes críticas, no collage ornamental.
4. Propuesta de sistema de diseño con tokens/componentes reutilizables, roles/estados y comportamiento.
5. Matriz de fidelidad a referencias, contraste/accesibilidad/teclado y checklist anti-slop con fallos evidentes.
6. Documentación versionada dentro de PR #12 o rama documental apropiada, sin tocar archivos de producción.
7. Lista corta de **verdaderas decisiones que necesitan aprobación** del usuario y gate explícito. No bombardearlo con una pregunta por control.

**Entrega a usuario:** un paquete de revisión del lenguaje visual **listo para firmar**, sin prometer app ya construida. La primera implementación intermedia será **otra misión**.
