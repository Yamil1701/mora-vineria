# Supabase: preparación aislada, integración bloqueada

No se configuró una URL, clave ni cuenta en la aplicación. `dist/remote-queue.js` no se importa desde la interfaz y no envía operaciones locales. Sólo se probó con un transporte simulado.

La inspección autorizada encontró únicamente el proyecto «Chofer Utilities», inactivo y ajeno a Mora. No se ejecutó SQL, no se leyeron filas de negocio, no se crearon tablas, usuarios, branches ni políticas en ese proyecto.

`migrations/001_dev_foundation.sql` es un candidato para una base descartable de Mora. Exige un parámetro explícito de ambiente aislado. Crea un esquema propio, membresía por `auth.uid()`, dispositivos revocables, comandos con identidad compuesta por negocio/ID, revisión bloqueada, resultados recuperables, tablas de preparación de migración y una RPC atómica **solamente para metas mensuales**. Revoca escrituras directas; las tablas expuestas tienen RLS y los únicos accesos de escritura son las funciones concretas. Nada de esto fue aplicado ni probado contra Postgres/Supabase.

Los comandos de ventas, recepciones, FIFO, abonos, revisiones y correcciones **no están implementados en servidor**. La RPC los rechaza; no acepta snapshots arbitrarios del cliente como hechos autoritativos. Por ello este SQL no es un backend definitivo ni habilita sincronización. El contrato actualizado enumera las tablas y transacciones que faltan antes de cualquier conexión.

Antes de probar: crear un proyecto Mora dev explícito, revisar/aplicar la migración en una base vacía, configurar Auth para dos usuarios de prueba, provisionar negocio/membresía/dispositivos mediante un operador, revisar grants/RLS y ejecutar las pruebas de aislamiento, rollback y carreras descritas en `tests/acceptance.md`. No ejecutar la migración en el único proyecto existente.

Referencias oficiales consultadas: [funciones de base](https://supabase.com/docs/guides/database/functions), [seguridad de API](https://supabase.com/docs/guides/api/securing-your-api), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). Las políticas declaradas en SQL no sustituyen pruebas con JWT de usuarios diferentes.
