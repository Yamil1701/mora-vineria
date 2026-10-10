# Auditoría del estado real

Inspección local de `master` en `f0c7970`, 10/10/2026 UTC. Checkout limpio inicial. `origin/master`, `origin/legacy/v1-final` y `origin/feature/mora-v2-app-shell` existen. No se inspeccionó ni alteró Supabase; no hay autorización para migrar recursos. Las fuentes leídas son AGENTS, handoff, docs 00–13 y READMEs de referencias visuales. Se inspeccionaron las cinco imágenes oficiales, Caja, Carrito y fondo existentes; no se crearon mockups.

| Evidencia | Hallazgo e implicación |
| --- | --- |
| `src/App.tsx` | Productos, ventas, carrito y cobro mediante `useState`; comentario explícito de RAM/demo; cambios se pierden al recargar |
| `src/app/demo-data.ts` | Productos e importes ficticios; ventas iniciales sin detalle real; nunca enviar estos fixtures al negocio |
| `src/app/demo-state.ts` | Cantidades, totales y stock calculados en memoria; negativo visible; reposición compara contra objetivo, no umbral aprobado |
| `src/app/demo-state.test.ts` | 4 tests de helpers demo; no prueban operaciones durables, FIFO ni seguridad |
| `package.json` | React 19, Vite 6, TS 5, Tailwind 3, PWA; no Dexie ni cliente Supabase |
| `vite.config.ts` | Base `/mora-vineria/`, manifest y assets Workbox; caché de aplicación, no de operaciones |
| `src/app/pwa.ts` | Actualización manual, aún sin guardia de borradores/outbox durable |
| `src/ui/format.ts` | Formatea redondeando; no sirve para validar importes o redondear costos internamente |
| `.github/workflows/deploy.yml` | Push a master o dispatch despliega tras tests/build; no tocar en esta misión |
| `.github/workflows/v2-checks.yml` | Solo rama antigua/dispatch; no cubre nueva PR; propuesta de checks sin deploy |
| `package-lock.json` | Ausente en HEAD base; reproducibilidad pendiente |

## Inconsistencias documentales

El final de docs 07 dice «sin pantallas», docs 10 dice «raíz no configurada», docs 11 recomienda scaffold inicial, docs 04 mantiene pendientes FIFO/categorías ya aprobados. Son cierres históricos subordinados al handoff y docs 07 en sus decisiones expresas. Se añade aviso de estado, conservando antecedentes. READMEs visuales recomiendan más mockups: el pedido actual los prohíbe; no se ejecuta esa recomendación.

## Alcance y límites de la verificación

Código y configuración confirman el estado demo; no se certifica instalación iOS/Android ni disponibilidad actual de Pages mediante una prueba de dispositivo. No se cambian `src/`, assets, deploy ni historial V1. El diseño no asegura que Postgres/RLS funcionen hasta ejecutar la matriz en entorno aislado autorizado. Una PR documental no convierte la demo en herramienta de ventas.
