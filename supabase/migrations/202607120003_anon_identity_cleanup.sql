-- Mora Vinería v0.2 — limpieza segura de identidades anónimas nunca vinculadas.
-- Conserva para siempre cualquier identidad que aparezca en public.dispositivos,
-- incluso si el dispositivo fue revocado.

create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create or replace function private.limpiar_identidades_anonimas_no_vinculadas()
returns integer
language plpgsql
security invoker
set search_path = auth, public, pg_temp
as $$
declare
  v_eliminadas integer;
begin
  delete from auth.users as usuario
  where usuario.is_anonymous is true
    and usuario.created_at < now() - interval '7 days'
    and not exists (
      select 1
      from public.dispositivos as dispositivo
      where dispositivo.auth_user_id = usuario.id
    );

  get diagnostics v_eliminadas = row_count;
  return v_eliminadas;
end;
$$;

revoke all on function private.limpiar_identidades_anonimas_no_vinculadas()
  from public, anon, authenticated;
grant execute on function private.limpiar_identidades_anonimas_no_vinculadas()
  to postgres;

select cron.unschedule(jobid)
from cron.job
where jobname = 'mora-limpiar-identidades-anonimas';

select cron.schedule(
  'mora-limpiar-identidades-anonimas',
  '17 4 * * *',
  $cron$select private.limpiar_identidades_anonimas_no_vinculadas();$cron$
);
