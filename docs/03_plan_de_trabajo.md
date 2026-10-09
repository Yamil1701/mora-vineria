# Plan de reconstrucción

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
- Siguientes mockups prioritarios: carrito, reposición, caja y cuentas; luego fiados, edición de venta, stock y permisos/dispositivos.

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

Al archivar el código y retirar workflows de `master`, la URL existente podría seguir sirviendo una implementación previamente publicada o cacheada. No confundir `master` limpio con producción actualizada. La transición de producción requiere un plan específico.
