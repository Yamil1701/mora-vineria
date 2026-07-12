# Supabase de Mora Vinería

Esta carpeta contiene migraciones versionadas. La publishable key puede usarse en el cliente; las claves `secret` y `service_role` nunca deben incorporarse al repositorio, al navegador ni a un parche.

## Orden de configuración

1. Activar **Anonymous Sign-Ins** en Supabase Auth.
2. Aplicar `migrations/202607120001_sync_foundation.sql` como migración.
3. Aplicar `migrations/202607120002_sync_foundation_hardening.sql`.
4. Ejecutar `crear_codigo_activacion.sql` una sola vez, cuando exista la interfaz de activación.
5. Guardar el código resultante hasta activar el primer celular.
6. Crear `.env.local` a partir de `.env.example`.

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

Todavía no replica productos, ventas o movimientos. Esa integración se agrega después de verificar esta frontera de seguridad.

La limpieza nunca debe ampliarse a una consulta genérica sobre usuarios anónimos: cualquier identidad presente en `public.dispositivos`, incluso revocada, se conserva para proteger trazabilidad y auditoría.
