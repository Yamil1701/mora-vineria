# Publicación de Mora Vinería 2.0 — demo para QA

**Autorización:** el usuario aprobó el 9/10/2026 reemplazar la V1 publicada en GitHub Pages con las siguientes demos de V2. La V1 no está en uso y **permanece preservada** en `legacy/v1-final`, junto con sus datos históricos sin borrar.

## Alcance de esta publicación
- Publica la **demo UI V2**, no una app operativa ni un MVP conectado.
- Datos ficticios y en memoria; no hay IndexedDB, Auth, cobros bancarios, lotes FIFO, Syncronización con Supabase ni bases de datos nuevas.
- La URL existente se reutiliza: https://Yamil1701.github.io/mora-vineria/
- No se migran ni borran datos de V1. Los datos almacenados anteriormente pueden permanecer en el navegador, sin ser leídos por la demo actual.
- El PWA previo puede seguir cacheado en un teléfono: cerrar/reabrir, actualizar o reinstalar la PWA solo si aparece contenido antiguo. Antes de borrar los datos del sitio hay que confirmar si hay registros locales de la V1 que todavía requieran respaldo.

## Pipeline
- `.github/workflows/deploy.yml` se ejecuta en `master`.
- Node 22; instalar dependencias, typecheck, Vitest, build y deploy Pages.
- **No** inyecta credenciales ni configuraciones de Supabase en el frontend.
- Mantiene `base: '/mora-vineria/'`.

## QA
- La lista concreta de cambios según las 20 imágenes/notas aportadas por el usuario está en [QA visual 02](12_qa_visual_iteracion_02.md).
- **No declarar aprobada la fidelidad visual hasta recibir nueva revisión de usuario en teléfono.**
- El UI Kit y las decisiones de negocio están en `docs/10_sistema_visual_v2.md` y `docs/11_contratos_pantallas_ui.md`.
- **Riesgo pendiente:** incorporar `package-lock.json` para builds reproducibles; el pipeline utiliza por ahora `npm install`. Solo se despliega si pasaron las pruebas y el build.
