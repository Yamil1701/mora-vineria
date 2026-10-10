# Documentación — Mora Vinería 2.0

**Si vas a continuar el proyecto desde ChatGPT Work, empezá por [HANDOFF_WORK_V2.md](HANDOFF_WORK_V2.md).** Es el traspaso consolidado de decisiones y la primera misión autorizada.

Estado actual: **demo V2 en `master` y GitHub Pages, con datos ficticios solo en memoria**. React/Vite/PWA y el UI Kit existen, compilaron y fueron revisados en un móvil. El usuario autorizó la publicación de demos V2, pero todavía no aprobó el diseño final. **Siguiente etapa: contratos técnicos de negocio, FIFO, Dexie/outbox, autenticación/RLS y recuperación; no migrar ni alterar Supabase sin permiso específico.**

La documentación se reconstruye a partir del uso real y no hereda automáticamente los contratos de V1. Algunos documentos conservan afirmaciones históricas previas a la demo; prevalecen las decisiones expresas y el handoff actualizado.

| Documento | Estado | Finalidad |
| --- | --- | --- |
| **[HANDOFF_WORK_V2.md](HANDOFF_WORK_V2.md)** | **Actual — leer primero en Work** | Contexto, decisiones, código presente, misión inicial, salvaguardas y autorización |
| [00_producto_y_experiencia.md](00_producto_y_experiencia.md) | Principios iniciales | Problema, experiencia, alcance y criterios de aceptación |
| [01_revision_de_reglas.md](01_revision_de_reglas.md) | Preguntas abiertas | Reevaluación explícita de decisiones previas |
| [02_sincronizacion_y_offline.md](02_sincronizacion_y_offline.md) | Requisito aprobado; detalles abiertos | Supabase, operación sin red y conflictos |
| [03_plan_de_trabajo.md](03_plan_de_trabajo.md) | Plan propuesto | Etapas, pruebas y publicación |
| [04_descubrimiento_operativo.md](04_descubrimiento_operativo.md) | Hechos reales, propuestas y pendientes | Registro consolidado de conversaciones de negocio |
| [05_ejemplo_lista_proveedor.md](05_ejemplo_lista_proveedor.md) | Fixture histórico | Lista de WhatsApp textual usada para pruebas futuras |
| [06_lector_de_codigos.md](06_lector_de_codigos.md) | Hipótesis por validar | Viabilidad de escaneo de productos y consulta externa de catálogo |
| [07_cierre_relevamiento_16_preguntas.md](07_cierre_relevamiento_16_preguntas.md) | Decisiones registradas y pendientes | Respuestas integrales sobre ventas, dinero, catálogo, reportes y dispositivos |
| [08_flujos_ux_y_navegacion.md](08_flujos_ux_y_navegacion.md) | Propuesta UX sin aprobar | Navegación, tareas, estados y criterios para prototipos |
| [09_investigacion_visual_y_direccion_ux02.md](09_investigacion_visual_y_direccion_ux02.md) | Investigación + propuesta visual sin aprobar | Referencias POS, decisiones, fucsia y criterios de evaluación |

## Identidad visual aprobada

**Mockups móviles de referencia (9/10/2026):** [Inicio, Ventas, Cobro, Productos y Reportes](diseno/mockups-aprobados-v2/README.md). La dirección aprobada es oscura con **acento rosa fucsia**; no usar el prototipo UX 01 ni UX 02/HTML como guía estética. Los documentos de investigación previos siguen siendo útiles como antecedentes funcionales, no como diseño visual a copiar. La demo V2 ya implementa múltiples recorridos con datos ficticios; las pantallas secundarias y los estados reales se deben construir por verticales, con persistencia y tests.

## Prototipos de recorrido (todavía no definitivos)

[Carrito y Caja/Cuentas](diseno/prototipos-v2/README.md): Carrito validado para prototipar; Caja/Cuentas aprobada visualmente el 9/10/2026. Estas imágenes complementan, pero no reemplazan, la identidad visual oficial de los cinco mockups originales.

## Sistema visual y componentes (trabajo actual)

- [Fondo nocturno fucsia](diseno/fondo/README.md): imagen aceptada y uso previsto.
- [Sistema visual v0.1](10_sistema_visual_v2.md): tokens, tipografía, superficies, contraste, fondo y componentes.
- [Contratos UI v0.1](11_contratos_pantallas_ui.md): datos, acciones y estados de cada pantalla, respetando el negocio.
- [Componentes React TypeScript](../src/ui/): base ya integrada en la **demo V2 compilada**, pero sin datos reales ni lógica de sincronización. Revisar `src/App.tsx`, `docs/12_qa_visual_iteracion_02.md` y `docs/13_publicacion_demo_v2.md`.

## Primera implementación local

[Vertical local](arquitectura-v2/07_nucleo_local.md): productos, lotes, efectivo, FIFO provisional, borradores/outbox y pruebas. Solo en modo explícito `?mode=local`; demo normal separada, sin backend ni sync. Ver el documento para alcance, QA y limitaciones.

## Núcleo técnico para revisión

[Arquitectura V2](arquitectura-v2/README.md): auditoría real, dominio/operaciones, Dexie/outbox, FIFO, seguridad de dispositivos/RLS, recuperación, matriz de pruebas y primera vertical. Es diseño propuesto, sin migraciones remotas ni habilitación operativa.

## Convenciones

- **Aprobado:** declarado por el usuario en esta nueva etapa.
- **Propuesto:** opción técnica o de producto que necesita validación.
- **Pendiente:** no se implementa hasta definir la regla.
- **Histórico:** datos/documentos en `legacy/v1-final` solo para consulta.

Cualquier cambio de decisión debe actualizar el documento pertinente antes de programar.
