# Implementación y línea base

## Evidencia de entrada

Se leyó la auditoría crítica del 31/10 y la documentación v26–v29. El ZIP contiene 113 archivos; las 112 entradas de su inventario se verificaron por tamaño y SHA-256. Se procesaron los JSON y los contratos aprobados. Se leyeron los documentos actuales de `sites-next/` y se distinguieron como historia los informes de entregas anteriores.

GitHub inicial: PR #14 abierta/borrador, rama `work/sites-v27-entregas-3-4`, commit `37085976c97ec2a3ab0e77613b7a3f059fbdb2d7`, árbol `42f5e6ed1e45dae9ac0ce4fd0039453ff9d70eb1`. Master: `296c2aa1a95273ccd86af784c14595af33573602`. Referencia local recuperable: tag `baseline-rc-v29-20261031`, bundle Git local y commit remoto recuperable. Sites v29: `fdc349fcfbafa76883602a49106e98b1f29777a8`. El primer `npm test` aprobó las 20 entradas anteriores.

## Cambios y archivos

| Cambio | Archivos principales | Verificación |
|---|---|---|
| Bloqueo sin Web Locks; clave local RC separada | `dist/writer-gate.js`, `dist/app.js`, `dist/local-data.js` | VM, dos pestañas HTTPS, navegador sin locks, aislamiento de clave antigua |
| Fechas naturales, stock y correcciones comprensibles | `dist/display-dates.js`, `app.js`, `correction-ui.js`, `reports-model.js`, `reports-ui.js` | Dominio, pantallas y PDF |
| Aviso de correcciones posteriores | `reports-model.js`, `reports-ui.js` | Venta octubre/cobro noviembre; dinero no trasladado al mes original |
| Costos resistentes al orden de claves JSONB | `local-data.js` | Fracciones exactas tras PostgreSQL real local; se conserva validación de valores |
| Comandos derivados en servidor | `backend/command-service.js`, `http-handler.js`, `supabase-repository.js`, función Edge y migración versionada | PostgreSQL PGlite, permisos, rollback, errores negativos |
| Identidad/fecha estable y transporte Edge preparado | `dist/remote-queue.js` | Transporte simulado, reintentos, error de permisos, fecha faltante y conservación de evidencia |
| Almacenamiento atómico candidato | `dist/idb-store.js` | IndexedDB real, dos conexiones, recuperación y 100 repeticiones |
| Primera instalación y navegación rápida | `dist/update-gate.js`, `app.js` | Prueba de eventos y navegador HTTPS; doble activación sin duplicar venta |
| Motivo de conteo sin perder foco/entrada | `dist/workflow-ui.js` | Formularios reales en tres anchos |
| Impresión clara en A4 | `dist/workflows.css` | PDF nativo regenerado y páginas renderizadas |
| Pruebas reproducibles | `tests/*`, `scripts/browser-*.mjs`, workflow específico | Node + SQL + Chromium; ninguna prueba publica |

La aplicación usa `app.js` y sus módulos de dominio/pantalla desde `index.html`. **No importa `remote-queue.js`, `idb-store.js` ni `backend/`**. Son piezas candidatas verificadas por pruebas independientes. El SQL anterior `backend/migrations/001_dev_foundation.sql` queda como antecedente v28: no es el procedimiento RC1 y no debe aplicarse junto a la nueva migración.

## Diseño y divergencia

La única implementación técnica de esta misión es `sites-next/`. No se editó el checkout Sites. El diseño móvil permanece oscuro, cálido y fucsia; se inspeccionaron referencias y capturas actuales. Las modificaciones CSS afectan sólo impresión.

No existe un enlace automático GitHub → Sites probado en esta misión. Para un traslado futuro: elegir un commit, producir inventario SHA-256 de `sites-next/dist/`, copiar exactamente esos archivos al destino candidato, verificar igualdad de inventario y recorrerlo allí antes de publicar. Un Site creado en otro origen no recibe localStorage. No publicar a modo de prueba.

## Commits

El archivo `commits.txt` de la entrega registra los SHA y mensajes completos. Se conservaron los commits de v29. No se reescribió master ni se tocaron módulos de la aplicación antigua.
