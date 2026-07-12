-- Mora Vinería v0.2 — endurecimiento posterior a los asesores de Supabase.
-- Reduce la superficie pública, explicita el deny-by-default y completa índices FK.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.dispositivo_actual_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select id
  from public.dispositivos
  where auth_user_id = auth.uid() and estado = 'activo'
  limit 1;
$$;

create or replace function private.negocio_actual_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select negocio_id
  from public.dispositivos
  where auth_user_id = auth.uid() and estado = 'activo'
  limit 1;
$$;

create or replace function private.es_principal_actual()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.dispositivos
    where auth_user_id = auth.uid()
      and tipo = 'principal'
      and estado = 'activo'
  );
$$;

create or replace function private.puede_operar_actual()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.dispositivos
    where auth_user_id = auth.uid()
      and modo = 'operacion'
      and estado = 'activo'
  );
$$;

revoke all on function private.dispositivo_actual_id() from public, anon;
revoke all on function private.negocio_actual_id() from public, anon;
revoke all on function private.es_principal_actual() from public, anon;
revoke all on function private.puede_operar_actual() from public, anon;
grant execute on function private.dispositivo_actual_id() to authenticated;
grant execute on function private.negocio_actual_id() to authenticated;
grant execute on function private.es_principal_actual() to authenticated;
grant execute on function private.puede_operar_actual() to authenticated;

drop policy if exists negocios_del_dispositivo on public.negocios;
create policy negocios_del_dispositivo on public.negocios
  for select to authenticated
  using (id = (select private.negocio_actual_id()));

drop policy if exists dispositivos_del_negocio on public.dispositivos;
create policy dispositivos_del_negocio on public.dispositivos
  for select to authenticated
  using (negocio_id = (select private.negocio_actual_id()));

drop policy if exists auditoria_del_negocio on public.auditoria_dispositivos;
create policy auditoria_del_negocio on public.auditoria_dispositivos
  for select to authenticated
  using (negocio_id = (select private.negocio_actual_id()));

drop policy if exists operaciones_del_negocio on public.operaciones_sincronizacion;
create policy operaciones_del_negocio on public.operaciones_sincronizacion
  for select to authenticated
  using (negocio_id = (select private.negocio_actual_id()));

drop policy if exists conflictos_del_negocio on public.conflictos_sincronizacion;
create policy conflictos_del_negocio on public.conflictos_sincronizacion
  for select to authenticated
  using (negocio_id = (select private.negocio_actual_id()));

drop function public.dispositivo_actual_id();
drop function public.negocio_actual_id();
drop function public.es_principal_actual();
drop function public.puede_operar_actual();

drop policy if exists app_bootstrap_sin_acceso_directo on public.app_bootstrap;
create policy app_bootstrap_sin_acceso_directo on public.app_bootstrap
  for all to anon, authenticated
  using (false)
  with check (false);

drop policy if exists codigos_emparejamiento_sin_acceso_directo
  on public.codigos_emparejamiento;
create policy codigos_emparejamiento_sin_acceso_directo
  on public.codigos_emparejamiento
  for all to anon, authenticated
  using (false)
  with check (false);

drop policy if exists recuperacion_negocio_sin_acceso_directo
  on public.recuperacion_negocio;
create policy recuperacion_negocio_sin_acceso_directo
  on public.recuperacion_negocio
  for all to anon, authenticated
  using (false)
  with check (false);

revoke all on all tables in schema public from anon;
revoke all on public.app_bootstrap from authenticated;
revoke all on public.codigos_emparejamiento from authenticated;
revoke all on public.recuperacion_negocio from authenticated;
revoke all on public.negocios from authenticated;
revoke all on public.dispositivos from authenticated;
revoke all on public.auditoria_dispositivos from authenticated;
revoke all on public.operaciones_sincronizacion from authenticated;
revoke all on public.conflictos_sincronizacion from authenticated;

grant select on public.negocios to authenticated;
grant select on public.dispositivos to authenticated;
grant select on public.auditoria_dispositivos to authenticated;
grant select on public.operaciones_sincronizacion to authenticated;
grant select on public.conflictos_sincronizacion to authenticated;

revoke execute on function public.activar_negocio_inicial(text, text, text) from public, anon;
revoke execute on function public.generar_codigo_emparejamiento(text) from public, anon;
revoke execute on function public.emparejar_dispositivo(text, text) from public, anon;
revoke execute on function public.revocar_dispositivo(uuid) from public, anon;
revoke execute on function public.transferir_dispositivo_principal(uuid) from public, anon;
revoke execute on function public.recuperar_dispositivo_principal(text, text) from public, anon;

grant execute on function public.activar_negocio_inicial(text, text, text) to authenticated;
grant execute on function public.generar_codigo_emparejamiento(text) to authenticated;
grant execute on function public.emparejar_dispositivo(text, text) to authenticated;
grant execute on function public.revocar_dispositivo(uuid) to authenticated;
grant execute on function public.transferir_dispositivo_principal(uuid) to authenticated;
grant execute on function public.recuperar_dispositivo_principal(text, text) to authenticated;

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;

create index if not exists auditoria_dispositivos_actor_idx
  on public.auditoria_dispositivos (actor_dispositivo_id);
create index if not exists auditoria_dispositivos_objetivo_idx
  on public.auditoria_dispositivos (dispositivo_objetivo_id);
create index if not exists codigos_emparejamiento_creador_idx
  on public.codigos_emparejamiento (creado_por_dispositivo_id);
create index if not exists codigos_emparejamiento_negocio_idx
  on public.codigos_emparejamiento (negocio_id);
create index if not exists codigos_emparejamiento_usado_por_idx
  on public.codigos_emparejamiento (usado_por_dispositivo_id);
create index if not exists conflictos_sincronizacion_operacion_idx
  on public.conflictos_sincronizacion (operacion_id);
create index if not exists conflictos_sincronizacion_resuelto_por_idx
  on public.conflictos_sincronizacion (resuelto_por_dispositivo_id);

notify pgrst, 'reload schema';
