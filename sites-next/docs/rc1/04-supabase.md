# Supabase: candidato local, infraestructura alojada bloqueada

## Infraestructura real

Se inspeccionaron los proyectos accesibles. Sólo estaba «Chofer Utilities», inactivo y ajeno a Mora. **No se utilizó. No se crearon proyectos, tablas, usuarios, funciones, políticas ni claves en Supabase alojado.** No hay URL/credencial configurada en la app activa.

La revisión automática rechazó un intento del CLI de contactar `eu.i.posthog.com` para analítica. No se reintentó ese acceso ni se sustituyó por otro proyecto. La preparación y ejecución local continuaron sin el CLI.

## Archivos de la RC

- `backend/supabase/migrations/20261031101555_secure_command_gateway.sql`: migración versionada generada inicialmente con CLI 2.122.0 y completada localmente; guardia `mora.environment=mora-isolated-dev` antes del DDL.
- `backend/command-service.js`: validación y ejecución de comandos con dominio compartido.
- `backend/supabase-repository.js`: RPC servidor → PostgreSQL.
- `backend/http-handler.js`: frontera HTTP de tamaño limitado, sesión y origen.
- `backend/supabase/functions/mora-command/index.ts`: entrada Deno/Edge preparada; exige `MORA_ENVIRONMENT=mora-isolated-dev`.
- `dist/remote-queue.js`: transporte preparado a `/functions/v1/mora-command`; no está importado por app.js.
- `tests/server-postgres.case.mjs`: SQL real en PGlite con usuarios/roles sintéticos y pruebas negativas.

`backend/migrations/001_dev_foundation.sql` es material anterior sólo para metas. No aplicar ambas propuestas como si fueran migraciones sucesivas compatibles. La nueva candidata se valida sobre una base descartable vacía con esquema `mora_rc`.

## Pasos pendientes reproducibles en Mora dev

1. Confirmar por nombre, propietario y referencia que el proyecto es exclusivo de Mora dev y descartable. No usar Chofer Utilities.
2. Revisar migración, grants y configuración Data API. No exponer `mora_rc` como un esquema editable. Ejecutar guardia y migración en una única sesión controlada; registrar SHA del SQL. Mantener producción separada.
3. Crear dos usuarios de prueba mediante Auth. Provisionar negocio con `validateData(emptyData())` y membresía/dispositivos mediante operador. El frontend no tiene esa facultad.
4. Configurar secretos únicamente en Edge: URL, clave privilegiada, clave pública y origen exacto HTTPS; bloquear otros ambientes. Revisar bundle/imports y ejecutar Deno/Edge en desarrollo antes de desplegar.
5. Ensayar dos JWT reales: lectura/403 entre negocios, escritura directa rechazada, RPC sensible denegada a anon/authenticated, suplantación y dispositivo revocado.
6. Ensayar dos conexiones/dispositivos independientes: mismo comando ×100, mismo ID diferente contenido, CAS competidor, sobreabono, corte antes/después de confirmar, consulta del resultado y rollback. Comparar tablas/saldos/unidades/lotes, no sólo mensajes.
7. Medir tamaño/tiempo del snapshot y proyección con historial creciente. Decidir modelo definitivo antes de habilitar negocio compartido.
8. Sólo después integrar adaptador, lecturas, estados comprensibles, respaldo de pendientes, errores y recuperación. Volver a probar todos los comandos desde pantallas.

## Fuentes oficiales consultadas

[Funciones de base](https://supabase.com/docs/guides/database/functions), [Auth en Edge](https://supabase.com/docs/guides/functions/auth), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [seguridad API](https://supabase.com/docs/guides/api/securing-your-api), [cambios vigentes](https://supabase.com/changelog), [API PostgreSQL local PGlite](https://pglite.dev/docs/api). Consultadas el 31/10/2026. Documentación no equivale a infraestructura ejecutada.
