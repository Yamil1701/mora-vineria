# Núcleo técnico V2 — contrato para revisión

Fecha: 2026-10-10 UTC / 2026-10-09 en Salta. Base inspeccionada: `f0c7970` de `master`.

Esta es la primera misión del handoff: **diseño implementable, no implementación productiva**. No contiene migraciones ejecutables ni habilita Supabase. Las propuestas técnicas siguientes requieren revisión de esta PR; no se atribuyen al usuario como reglas nuevas. La demo permanece intacta.

| Lectura | Contenido |
| --- | --- |
| [00_estado_real.md](00_estado_real.md) | Evidencia de código, restricciones e inconsistencias |
| [01_dominio_y_operaciones.md](01_dominio_y_operaciones.md) | Entidades, claves, comandos, efectos e invariantes |
| [02_persistencia_y_sync.md](02_persistencia_y_sync.md) | Dexie, outbox, RPC, cursores, snapshots y versiones |
| [03_fifo_y_conciliacion.md](03_fifo_y_conciliacion.md) | Orden oficial, exactitud, correcciones y ejemplos |
| [04_seguridad_y_dispositivos.md](04_seguridad_y_dispositivos.md) | Auth, permisos, RLS, invitación y amenazas |
| [05_recuperacion.md](05_recuperacion.md) | Respaldo independiente y restauración segura |
| [06_pruebas_y_entrega.md](06_pruebas_y_entrega.md) | Matriz, criterios, evidencia y primera vertical |

## Decisiones aplicadas y propuestas

Se aplican las decisiones de `07_cierre_relevamiento_16_preguntas.md`: FIFO, jornada 08:00, fiados simples, venta física conservada con diferencias, iguales permisos en 3–4 equipos, nuevo negocio vacío sin borrar V1. Supabase como autoridad V2 prevalece sobre la restricción histórica sin backend de V1. No se cambia navegación, identidad ni UI.

Propuestas técnicas recomendadas: comandos inmutables; orden de aceptación por negocio en servidor; serialización inicial por negocio; costos racionales exactos; ledgers compensatorios; proyección oficial separada de pendientes locales; Auth por instalación con sesión vinculada; restauración en staging y deduplicación por ID. Cada documento detalla límites y alternativas.

## Puntos que necesitan decisión antes de activar producción

| Punto | Alternativas y recomendación | Qué puede avanzar |
| --- | --- | --- |
| FIFO concurrente | Orden de aceptación servidor (recomendado: estable, sin reloj confiable) o reordenar por hora local (reescribe asignaciones y es manipulable) | Referencia local, esquema y tests aislados bajo propuesta explícita |
| Equipo revocado offline | Permitir registro en cuarentena y revisión desde otro equipo (recomendado) o bloquear carga después de caducar autorización; ninguno borra pendientes | Diseño de cuarentena, exportación y rechazo servidor |
| Recuperación sin ningún equipo | Credencial independiente custodiada por titular (recomendado) o intervención administrativa manual | Ensayo con datos sintéticos; definir custodio antes de emitir credencial |
| Entorno remoto V2 | Proyecto nuevo aislado (recomendado) o espacio V2 separado en proyecto existente | Todo trabajo local; ninguna creación remota ahora |
| Reemplazos de proveedor | Trasladar valor del reclamo a reemplazo (recomendado) o reconocer pérdida y recuperación separadas | Modelo de reclamo; no resolver valoración económica silenciosamente |

Estas cuestiones no bloquean esta misión documental. No se implementarán como política definitiva sin revisión. Umbrales de stock, base de costo para precio sugerido, fotos y casos raros de consumo quedan fuera de la primera vertical y sin valores globales inventados.

## Fuentes técnicas verificadas

Consulta de documentación oficial el 10/10/2026: [transacciones Dexie](https://dexie.org/docs/Dexie/Dexie.transaction()), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [funciones Postgres](https://supabase.com/docs/guides/database/functions), [sesiones Auth](https://supabase.com/docs/guides/auth/sessions), [seguridad API](https://supabase.com/docs/guides/api/securing-your-api), [changelog](https://supabase.com/changelog.md). Se revisó la advertencia [Postgres 15.19/17.11](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes): verificar versión/extensiones antes de migraciones futuras; aquí no se usan operadores personalizados ni se modifica servidor. Versiones/plan Auth/PITR reales no fueron inspeccionados: no asumir prestaciones pagas.
