# Supabase de Mora Vinería

Esta carpeta contiene migraciones versionadas. La publishable key puede usarse en el cliente; las claves `secret` y `service_role` nunca deben incorporarse al repositorio, al navegador ni a un parche.

## Orden de configuración

1. Activar **Anonymous Sign-Ins** en Supabase Auth.
2. Aplicar `migrations/202607120001_sync_foundation.sql` como migración.
3. Aplicar `migrations/202607120002_sync_foundation_hardening.sql`.
4. Ejecutar `crear_codigo_activacion.sql` una sola vez, cuando exista la interfaz de activación.
5. Guardar el código resultante hasta activar el primer celular.
6. Crear `.env.local` a partir de `.env.example`.

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

Antes de publicar el flujo de emparejamiento se debe activar Cloudflare Turnstile para proteger la creación de sesiones anónimas y definir una limpieza que elimine únicamente identidades antiguas que nunca llegaron a vincularse. Nunca se debe ejecutar una limpieza genérica que borre sesiones pertenecientes a dispositivos autorizados.
