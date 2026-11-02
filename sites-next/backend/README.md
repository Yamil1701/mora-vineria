# Servicio Mora de desarrollo · RC2

El servidor deriva los 25 tipos de comandos con el dominio de `dist/`; el cliente no confirma snapshots arbitrarios. Proyecto exclusivo `dedcvvgiuxpwdzqqdifn`, esquema `mora_rc`, Edge `mora-command` v5. Auth y prueba del dispositivo preceden a cada operación; membresía/dispositivo y revisión se revalidan en el commit SQL.

Leer [Supabase real](../docs/rc2/04-supabase.md), [seguridad](../docs/rc2/03-seguridad-integridad.md) y [pruebas](../docs/rc2/07-resultados-pruebas.md). La infraestructura RC1 ya estaba aplicada; se cotejó antes de agregar tres incrementales RC2. No ejecutar otra vez la instalación inicial ni usar la propuesta histórica `migrations/001_dev_foundation.sql` como secuencia nueva.

`npm test` reproduce SQL/servicio con PostgreSQL PGlite y roles de prueba. Las pruebas alojadas son distintas: `scripts/hosted-qa.py` y `scripts/hosted-browser-qa.mjs` utilizan sólo un fixture privado sintético. `scripts/provision-hosted-qa.mjs` prepara nuevas identidades con credencial de operador server-only y genera DML privado; verificar/aplicar ese seed únicamente en Mora RC y después enrolar. Nunca enviar esa credencial al navegador.

El operador Edge temporal de esta misión quedó retirado. `mora_legacy_archive` permanece conservado e inaccesible desde los roles de la app; no se importa ni reutiliza. No usar Chofer Utilities. Autenticación mínima por enlace privado, sin nueva administración comercial.

Límites abiertos: recuperación asistida de pendientes ajenos, configuración global Auth, incidencia externa PGRST303, ensayo de carga prolongada, CI alojado con secretos nuevos, vista previa móvil y QA físico. El servicio de desarrollo probado no implica una publicación autorizada.
