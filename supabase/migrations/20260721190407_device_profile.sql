-- Perfil y desvinculacion voluntaria del dispositivo actual.
-- Las escrituras permanecen encapsuladas: no se habilita UPDATE directo sobre dispositivos.

create or replace function public.actualizar_nombre_dispositivo_actual(p_nombre text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dispositivo public.dispositivos%rowtype;
  v_nombre_anterior text;
begin
  if auth.uid() is null then
    raise exception 'El dispositivo no tiene una sesión válida.';
  end if;
  if p_nombre is null or char_length(trim(p_nombre)) not between 1 and 60 then
    raise exception 'Ingresá un nombre de entre 1 y 60 caracteres.';
  end if;

  select * into v_dispositivo
  from public.dispositivos
  where auth_user_id = auth.uid() and estado = 'activo'
  for update;
  if not found then
    raise exception 'Este dispositivo ya no está autorizado.';
  end if;

  v_nombre_anterior := v_dispositivo.nombre;
  update public.dispositivos
  set nombre = trim(p_nombre), actualizado_at = now()
  where id = v_dispositivo.id
  returning * into v_dispositivo;

  insert into public.auditoria_dispositivos (
    negocio_id, actor_dispositivo_id, dispositivo_objetivo_id, accion, detalle
  ) values (
    v_dispositivo.negocio_id,
    v_dispositivo.id,
    v_dispositivo.id,
    'nombre_dispositivo_actualizado',
    jsonb_build_object('anterior', v_nombre_anterior, 'nuevo', v_dispositivo.nombre)
  );

  return to_jsonb(v_dispositivo);
end;
$$;

create or replace function public.desvincular_dispositivo_actual()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dispositivo public.dispositivos%rowtype;
begin
  if auth.uid() is null then
    raise exception 'El dispositivo no tiene una sesión válida.';
  end if;

  select * into v_dispositivo
  from public.dispositivos
  where auth_user_id = auth.uid() and estado = 'activo'
  for update;
  if not found then
    raise exception 'Este dispositivo ya no está autorizado.';
  end if;
  if v_dispositivo.tipo = 'principal' then
    raise exception 'Transferí primero el control principal a otro dispositivo.';
  end if;

  update public.dispositivos
  set estado = 'revocado', actualizado_at = now()
  where id = v_dispositivo.id
  returning * into v_dispositivo;

  insert into public.auditoria_dispositivos (
    negocio_id, actor_dispositivo_id, dispositivo_objetivo_id, accion
  ) values (
    v_dispositivo.negocio_id,
    v_dispositivo.id,
    v_dispositivo.id,
    'dispositivo_desvinculado'
  );

  return to_jsonb(v_dispositivo);
end;
$$;

revoke all on function public.actualizar_nombre_dispositivo_actual(text) from public, anon;
revoke all on function public.desvincular_dispositivo_actual() from public, anon;
grant execute on function public.actualizar_nombre_dispositivo_actual(text) to authenticated;
grant execute on function public.desvincular_dispositivo_actual() to authenticated;

comment on function public.actualizar_nombre_dispositivo_actual(text) is
  'Permite que un dispositivo activo cambie únicamente su propio nombre.';
comment on function public.desvincular_dispositivo_actual() is
  'Revoca voluntariamente el dispositivo autenticado; el principal debe transferir antes el control.';
