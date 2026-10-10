# Plan de reconstrucción

> **Estado actualizado en octubre de 2026:** fases 0–2 culminaron en una **demo V2 compilada y publicada en GitHub Pages**. El usuario ya la probó, señaló pulidos visuales pendientes y decidió **priorizar ahora el núcleo funcional**. La etapa siguiente es **fase 3 — contratos y arquitectura**, según `docs/HANDOFF_WORK_V2.md`. Las referencias históricas a `master` sin código y a la necesidad de crear el scaffold Vite describen estados anteriores, no el repositorio actual.

## Fase 0 — Preservación (GitHub)

- Preservar el estado anterior en `legacy/v1-final`.
- Limpiar `master` y dejar únicamente documentación de arranque.
- Conservar ramas/tags históricos y no desplegar código incompleto.
- No modificar ni borrar Supabase ni los datos locales.

## Fase 1 — Descubrimiento y decisiones

- Auditar cada regla anterior con escenarios reales, incluso si se decide conservarla.
- Priorizar uso nocturno móvil, registro de ventas, productos, stock y dinero.
- Decidir políticas de conflicto offline antes del diseño de base de datos.
- Definir alcance de primera entrega y qué se posterga.

## Fase 2 — Experiencia antes de código

- La **identidad visual móvil ya fue aprobada** el 9/10/2026: cinco mockups en `docs/diseno/mockups-aprobados-v2/`. Esta decisión sustituye referencias visuales UX 01 y UX 02/HTML.
- Queda **pendiente de validar** la traducción a un sistema de componentes y los recorridos interactivos completos; `docs/08_flujos_ux_y_navegacion.md` continúa como propuesta funcional revisable, no como diseño cerrado.
- El usuario decidió **detener la generación de mockups** para evitar inconsistencia. El fondo nocturno fue aceptado y guardado en `docs/diseno/fondo/`.
- Se tradujeron referencias existentes y reglas de negocio a tokens, componentes y contratos iniciales de UI (`docs/10_sistema_visual_v2.md`, `docs/11_contratos_pantallas_ui.md`, `src/ui/`); falta validación y refinamiento conforme se implementan funciones reales.
- La librería de presentación **ya fue integrada y compilada** con el scaffold Vite. Solo funciona como **demo sin persistencia de negocio**; no declarar funciones reales de venta, stock, costeo ni sync implementadas.

- Mapear tareas, prototipar pantallas, estados offline/pendientes y errores.
- Probar tareas reales sin explicar la interfaz.
- Aprobar sistema visual y navegación después de probar alternativas.

## Fase 3 — Contratos y arquitectura

- Modelo de dominio y transacciones críticas.
- Sincronización, autenticación de dispositivos, RLS e idempotencia.
- Separación entre entorno de pruebas y producción.
- Estrategia verificable de backup y restauración.
- Documentar migración o nuevo espacio de datos Supabase, sin ejecutarlo hasta aprobación.

## Fase 4 — Implementación vertical y pruebas

- Base PWA, datos locales y conectividad; formularios mínimos.
- Catálogo/stock; ventas/cobros; movimientos/reposiciones; lectura y reportes.
- Cada flujo incluye estados de error, pruebas offline, reinicio, duplicados y conflictos.
- Dependencias nuevas solo cuando sean justificadas.

## Fase 5 — QA y lanzamiento

- Probar en teléfonos reales con conexión variable y varios dispositivos.
- Validar consistencia de ventas, stock, dinero, historial y recuperación.
- Verificar datos anteriores, backup, instalación, accesibilidad y rendimiento.
- Habilitar publicación en GitHub Pages solo tras autorización.

## Política de publicación

**Estado actual:** `master` contiene la demo V2; `.github/workflows/deploy.yml` puede publicar automáticamente cualquier push a `master`. `legacy/v1-final` conserva V1. Por eso todo desarrollo funcional nuevo se hará en rama y PR, **sin fusión ni despliegue** hasta aprobación y QA. No interpretar la autorización anterior para publicar demos como permiso para activar Supabase, migraciones o procesamiento real de ventas.
