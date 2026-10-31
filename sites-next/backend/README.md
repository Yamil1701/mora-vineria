# Servicio candidato Mora dev

El servicio nuevo deriva comandos con el dominio de `dist/` y los confirma atómicamente mediante PostgreSQL. Las pruebas locales usan PGlite con roles de prueba; no se desplegó Supabase ni se conectó la app.

Leer [informe RC1](../docs/rc1/04-supabase.md) y [seguridad/límites](../docs/rc1/03-seguridad-integridad.md) antes de cualquier aplicación.

Migración vigente candidata: `supabase/migrations/20261031101555_secure_command_gateway.sql`, para una **base Mora dev exclusiva, vacía y descartable**. La propuesta antigua `migrations/001_dev_foundation.sql` (sólo metas) es histórica; no aplicar ambas como una secuencia.

Reproducir SQL/servicio: `npm test` desde `sites-next/`. La prueba levanta PostgreSQL local WASM, crea identidades sintéticas, aplica SQL, ensaya permisos y operaciones, y cierra la base. No requiere ni usa credenciales externas.

La función Edge en `supabase/functions/mora-command/index.ts` es código preparado. Falta probar Deno/bundle, Auth alojada, secretos, RPC, carreras multiconexión y todos los flujos de pantalla en el proyecto dedicado. Se debe provisionar el negocio/dispositivos por un operador y agregar lectura/bootstrap y recuperación antes de activar.

No modificar Chofer Utilities. No hay claves privilegiadas en el navegador. `dist/remote-queue.js` e `idb-store.js` no son dependencias de `app.js`.
