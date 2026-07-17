# Supabase de Mora Vinería

Esta carpeta contiene migraciones versionadas. La publishable key puede usarse en el cliente; las claves `secret` y `service_role` nunca deben incorporarse al repositorio, al navegador ni a un parche.

## Orden de configuración

1. Activar **Anonymous Sign-Ins** en Supabase Auth.
2. Aplicar `migrations/202607120001_sync_foundation.sql` como migración.
3. Aplicar `migrations/202607120002_sync_foundation_hardening.sql`.
4. Aplicar `migrations/202607120003_anon_identity_cleanup.sql` y `202607120004_cron_access_hardening.sql`.
5. Aplicar `migrations/202607120005_catalogo_sync.sql` para habilitar categorías y productos compartidos.
6. Aplicar `202607120006_catalogo_sync_indexes.sql`, `20260712232929_operaciones_operativas.sql` y `20260712234315_operaciones_operativas_indexes.sql`.
7. Para `v0.3.0`, aplicar `202607160001_tesoreria_operativa.sql`.
8. Ejecutar `crear_codigo_activacion.sql` una sola vez, cuando exista la interfaz de activación.
9. Guardar el código resultante hasta activar el primer celular.
10. Crear `.env.local` a partir de `.env.example`.

Para GitHub Pages, crear también las variables de Actions `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en **Settings → Secrets and variables → Actions → Variables**. Son valores públicos del cliente; nunca usar una secret key ni `service_role`.

Turnstile agrega la variable pública `VITE_TURNSTILE_SITE_KEY`. Su secret key se configura únicamente en **Supabase Auth → Protection** y nunca se versiona. Las migraciones `anon_identity_cleanup` y `cron_access_hardening` programan la limpieza diaria y cierran el acceso cliente al esquema de Cron.

## Alcance de la primera migración

- un único negocio;
- un único dispositivo principal activo;
- dispositivos vinculados con nombre auditable;
- modos Operación y Consulta;
- emparejamiento de cinco minutos y un solo uso;
- revocación y transferencia de principal;
- recuperación con rotación obligatoria del código;
- tablas base para operaciones y conflictos de sincronización;
- RLS cerrada y escritura únicamente mediante funciones autorizadas.

El endurecimiento posterior revoca los permisos automáticos de Supabase, mueve los auxiliares de RLS al esquema privado y agrega los índices de claves foráneas recomendados. Las advertencias restantes del asesor sobre las seis RPC públicas son intencionales: solo `authenticated` puede llamarlas y cada una valida la identidad y autoridad del dispositivo.

La migración `catalogo_sync` agrega bootstrap único desde el principal, categorías y productos versionados, lotes idempotentes, pull por cursor, aviso Realtime y resolución explícita de conflictos. `operaciones_operativas` agrega ventas, cobros, movimientos, diferencias de stock y conciliación.

`tesoreria_operativa` agrega cuentas, un libro inmutable y conteos de caja. No concede acceso directo a las tablas: el snapshot y los lotes idempotentes pasan por RPC `security definer` disponible solo para dispositivos autenticados y activos. Las salidas ordinarias se serializan por cuenta y se rechazan si superarían el saldo compartido.

La limpieza nunca debe ampliarse a una consulta genérica sobre usuarios anónimos: cualquier identidad presente en `public.dispositivos`, incluso revocada, se conserva para proteger trazabilidad y auditoría.
