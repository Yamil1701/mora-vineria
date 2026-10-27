# Construcción desde el plano maestro · 26/10/2026

Base funcional: `master` `90264e5`. Fuente documental: PR #12, commit `f3eba1f`, consultado en checkout separado. Rama de implementación: `work/v2-construccion-plano-maestro`. No se fusiona ni despliega. Los archivos rechazados de `e53fa66` (29–31 y visual-01) no forman parte de esta rama ni de las referencias utilizadas.

La misión adjunta del usuario autoriza implementar lo suficientemente decidido y sustituye, exclusivamente para esta misión, las prohibiciones anteriores de programar. No firma una nueva estética ni aprueba por extensión todas las propuestas de los planos. No se altera la PR documental.

## Auditoría inicial

La aplicación publicada usa un único `App.tsx`; ventas, productos, stock inicial, recepciones, gastos, aportes y conteos persisten en Dexie. El esquema es 4 y el respaldo formato 2; el validador reproduce el journal completo y verifica sus efectos. Los costos son racionales exactos. Una venta sin lote se conserva con revisión, sin costo cero inventado. Las operaciones de formularios tienen un slot durable; la venta tiene borrador y comando sellado propios. Hay CAS para productos/conteos/borradores. No existe backend.

Problemas comprobados: Ventas abre selector en lugar de historial; Caja no tiene destino; conteos están mezclados con dinero; recepción UI guarda sólo un artículo aunque el servicio admite varios; reabrir recepción toma `lines[0]`; vuelta/cambio de sección pierde filtros; no hay historial nativo de navegación; el header cambia por pantalla; hay controles de funciones futuras deshabilitados; IDs y FIFO ocupan espacio operativo. El CSS redefine superficies con blur y gradientes de forma generalizada. El modelo de dinero sólo representa efectivo, sin cuentas, fiados ni rectificaciones.

## Trazabilidad y precedencia

El inventario adjunto identifica cada documento e imagen del corte documental con hash. Se relevó estructura, estados, reglas y conflictos de toda la documentación; se profundizaron los contratos de las áreas intervenidas. Los textos históricos se conservan y no se presentan como vigentes.

| Origen | Decisión o información | Estado para esta misión | Área / implementación | Conflicto y resolución |
| --- | --- | --- | --- | --- |
| Encargo adjunto, §§1–10 | Construir A/B, reservar C/D; sin merge/deploy | Aprobado | Todas las etapas | Sustituye gates temporales de AGENTS/27/28 |
| AGENTS, README, docs/README, HANDOFF | Fuentes y proceso; historia del reinicio | Mixto: reglas vigentes e historia | Núcleo y entrega | Demo/múltiples equipos/Supabase no describen master; prevalece MVP local |
| docs/00, 03 | Uso nocturno y tareas; reconstrucción por etapas | Aprobado; fases antiguas históricas | Inicio y flujo venta | No reconstruir scaffold ya existente |
| docs/01, 04, 07 | Precio +50%/redondeo500, unidad, jornada, FIFO, objetivo, venta física | Aprobado | Dominio existente; proveedor futuro | No convertir sugerencia en precio automático ni promedio en FIFO |
| docs/02 | Supabase/sync/offline distribuido | Histórico, fuera de MVP | Outbox conservado por compatibilidad | No activar nube ni prometer envío |
| docs/05 | Lista real irregular del proveedor | Insumo, no catálogo | Parser/revisión | No inferir variantes o packs ambiguos |
| docs/06 | Lector de códigos | Propuesto, pendiente | Sin control ficticio en catálogo | No requisito ni dependencia |
| docs/08–09 | Flujos y estética UX01/02 | Historia; principios compatibles | Auditoría | No reutilizar estética descartada |
| docs/10–11 | Kit inicial, contratos de pantallas | Base provisional | Reutilizar theme/components | Nuevo dock/propiedad desplazan los anteriores |
| docs/12–13 | QA/demo publicada | Histórico | Referencia de regresiones | No atribuir esas pruebas a esta entrega |
| arquitectura/00–06 | Dominio, FIFO, recuperación, modelo distribuido y oráculo | Núcleo compatible vigente; servidor histórico | Preservar invariantes/tests | No portar SQL/RLS/dispositivos |
| arquitectura/07–08 | Núcleo efectivo, IDs, integración, umbrales 20/10% | Implementado | Servicio, catálogo y venta | Preservar; sin objetivo no alerta inventada |
| arquitectura/09–10 | Backup, esquema4, gastos/aportes, conteos CAS | Implementado | Regresión de datos y recuperación | No resetear ni rebajar validador |
| arquitectura/11 | Refoco provisional | Historia de UI y pruebas | Evaluar composición | No equivale a aprobación visual definitiva |
| diseño/mockups (5 imágenes y README) | Carbón, fucsia, títulos expresivos, filas y total dominante | Referencia aprobada | Sistema visual conservador | Quitar avatar/sync/fotos falsas/dock antiguo |
| diseño/prototipos y fondo | Caja aprobada; Carrito orientativo; fondo aceptado | Diferenciados | Caja, venta, shell | No copiar saldos ni descuentos ficticios |
| planos/01–04 | Propiedad de áreas, recorridos, capas e invariantes | Contratos con enmiendas posteriores | Navegación y módulos | Inventario/Reposición hermanos; no subrutas obligatorias de Productos |
| planos/05–09 | Investigación, auditoría, benchmark y gates | Evidencia/propuestas | Validación por tareas | Gates de código reemplazados por encargo, calidad conservada |
| planos/10,17,21 | Ventas historial; + acción; Más raíz; retorno contextual; header | Aprobado por encargo y decisiones | Shell y navegación | No implementar dock histórico de ADR17 |
| planos/11–12,25 | Pantallas, componentes, estados, accesibilidad | Base contractual, concreción B | Kit único, filas, formularios | Sin segundo kit ni portadas futuras |
| planos/13–16,18–19 | Pruebas, fidelidad y secuencia | Plan de QA, no resultados | Regresión y capturas | Tree test no ejecutado; no simular aprobación de usuarios |
| planos/20 | Palabras del usuario, revisiones posteriores | Evidencia primaria | Alcance A/B/C | Aprobación conceptual no firma modelo detallado |
| planos/22–23 | Consolidación y conflictos C01–C12 | Base de precedencia | Matriz de alcance | Prohibición de código sustituida por encargo actual |
| planos/24,26 | Modelo de cuentas/deudas/correcciones/proyección | Propuesta técnica con riesgos abiertos | Evaluación C cuando afecta dinero/historia | Corrección FIFO y cobertura de días no se inventan |
| planos/27–28 | Calidad visual profesional | Obligatorio como calidad | Investigación y QA reales | No otra entrega A/B; no recuperar e53fa66 |
| src/domain, local, app, ui | Implementación real | Fuente de integridad, UI no firmada | Reutilizar y extender | React no escribe stock/caja directamente |
| tests/unit, architecture, e2e, fixtures | Oráculos, recuperación, versiones y recorridos | Regresión obligatoria | Mantener aserciones de negocio | Adaptar rutas esperadas al contrato nuevo |
| Vite/TS/Tailwind/package/lock/PWA/workflows | Root, base Pages, build y deploy automático en master | Vigente | Sin nuevos servicios/dependencias de producto | Trabajar en rama; push a master prohibido |
| PR #6–11 y #12 | Contrato→núcleo→UI→backup→movimientos→refoco→planos | Historia verificable | Base de revisión | Descripción de #12 menciona visual rechazado; su head ya no lo incluye |

## Clasificación previa

**A:** shell/dock/Volver/Más, catálogo, favoritos, consulta sin agregar, venta y borrador durable, efectivo, historial, inventario/conteos, gastos/aportes, recepción multiproducto, reportes, impresión y recuperación JSON.

**B:** decisiones técnicas conservadoras sin nueva regla comercial: historial navegador y contexto de consulta; extensión de componentes; validaciones de compra y guardado de planificación; migraciones aditivas con respaldo y pruebas cuando corresponda. Se documentan por etapa.

**C:** rectificación de ventas con FIFO ya consumido; reglas de reconciliación de deuda/pagos; bases iniciales/conteos/correcciones de cuentas; cobertura de jornadas sin ventas para proyección. No convertir propuestas en decisiones del usuario. La falta de soporte demostrado para una operación monetaria impide habilitarla parcialmente.

**D:** backend, sync, login/roles, integración bancaria, facturación, lector/OCR no aprobado, efectos/fotos ficticios y visuales rechazados.

La entrega final detalla lo efectivamente implementado y lo que permanezca pendiente, sin equiparar esta clasificación al trabajo terminado.
