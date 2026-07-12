-- Mora Vinería v0.2 — identidad del negocio, dispositivos y base de sincronización.
-- No contiene datos operativos ni secretos versionados.

create extension if not exists pgcrypto with schema extensions;

create table public.app_bootstrap (
  id boolean primary key default true check (id),
  activation_hash bytea not null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create table public.negocios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(trim(nombre)) between 1 and 80),
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

create table public.dispositivos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) between 1 and 60),
  tipo text not null check (tipo in ('principal', 'vinculado')),
  modo text not null check (modo in ('operacion', 'consulta')),
  estado text not null default 'activo' check (estado in ('activo', 'revocado')),
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now(),
  ultima_actividad_at timestamptz
);

create unique index dispositivos_principal_activo_unico
  on public.dispositivos (negocio_id)
  where tipo = 'principal' and estado = 'activo';

create index dispositivos_negocio_idx on public.dispositivos (negocio_id, estado);

create table public.codigos_emparejamiento (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  creado_por_dispositivo_id uuid not null references public.dispositivos(id),
  codigo_hash bytea not null unique,
  modo text not null check (modo in ('operacion', 'consulta')),
  vence_at timestamptz not null,
  usado_at timestamptz,
  usado_por_dispositivo_id uuid references public.dispositivos(id),
  creado_at timestamptz not null default now()
);

create index codigos_emparejamiento_busqueda_idx
  on public.codigos_emparejamiento (codigo_hash, vence_at)
  where usado_at is null;

create table public.recuperacion_negocio (
  negocio_id uuid primary key references public.negocios(id) on delete cascade,
  codigo_hash bytea not null unique,
  rotado_at timestamptz not null default now()
);

create table public.auditoria_dispositivos (
  id bigint generated always as identity primary key,
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  actor_dispositivo_id uuid references public.dispositivos(id),
  dispositivo_objetivo_id uuid references public.dispositivos(id),
  accion text not null,
  detalle jsonb not null default '{}'::jsonb,
  creado_at timestamptz not null default now()
);

create index auditoria_dispositivos_negocio_idx
  on public.auditoria_dispositivos (negocio_id, creado_at desc);

create table public.operaciones_sincronizacion (
  secuencia bigint generated always as identity unique,
  id text primary key check (char_length(id) between 8 and 160),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  dispositivo_id uuid not null references public.dispositivos(id),
  tipo_operacion text not null,
  tipo_entidad text not null,
  entidad_id text not null,
  payload jsonb not null,
  estado text not null default 'recibida'
    check (estado in ('recibida', 'aplicada', 'conflicto', 'error')),
  creada_cliente_at timestamptz not null,
  recibida_at timestamptz not null default now(),
  aplicada_at timestamptz,
  codigo_error text,
  detalle_error text,
  unique (negocio_id, id)
);

create index operaciones_sincronizacion_pull_idx
  on public.operaciones_sincronizacion (negocio_id, secuencia);
create index operaciones_sincronizacion_dispositivo_idx
  on public.operaciones_sincronizacion (dispositivo_id, recibida_at desc);

create table public.conflictos_sincronizacion (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  operacion_id text not null references public.operaciones_sincronizacion(id),
  tipo text not null,
  tipo_entidad text not null,
  entidad_id text not null,
  detalle jsonb not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'resuelto')),
  creado_at timestamptz not null default now(),
  resuelto_at timestamptz,
  resuelto_por_dispositivo_id uuid references public.dispositivos(id)
);

create index conflictos_sincronizacion_pendientes_idx
  on public.conflictos_sincronizacion (negocio_id, estado, creado_at);

create or replace function public.dispositivo_actual_id()
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

create or replace function public.negocio_actual_id()
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

create or replace function public.es_principal_actual()
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

create or replace function public.puede_operar_actual()
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

create or replace function public.activar_negocio_inicial(
  p_nombre_negocio text,
  p_nombre_dispositivo text,
  p_codigo_activacion text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_bootstrap public.app_bootstrap%rowtype;
  v_negocio_id uuid;
  v_dispositivo_id uuid;
  v_codigo_recuperacion text;
begin
  if auth.uid() is null then
    raise exception 'El dispositivo no tiene una sesión válida.';
  end if;
  if char_length(trim(p_nombre_negocio)) not between 1 and 80
     or char_length(trim(p_nombre_dispositivo)) not between 1 and 60 then
    raise exception 'Revisá el nombre del negocio y del dispositivo.';
  end if;

  select * into v_bootstrap from public.app_bootstrap where id = true for update;
  if not found or v_bootstrap.used_at is not null
     or v_bootstrap.activation_hash <> digest(p_codigo_activacion, 'sha256') then
    raise exception 'El código de activación no es válido.';
  end if;
  if exists (select 1 from public.negocios) then
    raise exception 'El negocio inicial ya fue creado.';
  end if;
  if exists (select 1 from public.dispositivos where auth_user_id = auth.uid()) then
    raise exception 'Esta sesión ya está vinculada a un dispositivo.';
  end if;

  insert into public.negocios (nombre)
  values (trim(p_nombre_negocio))
  returning id into v_negocio_id;

  insert into public.dispositivos (
    negocio_id, auth_user_id, nombre, tipo, modo, estado, ultima_actividad_at
  ) values (
    v_negocio_id, auth.uid(), trim(p_nombre_dispositivo),
    'principal', 'operacion', 'activo', now()
  ) returning id into v_dispositivo_id;

  v_codigo_recuperacion := encode(gen_random_bytes(24), 'hex');
  insert into public.recuperacion_negocio (negocio_id, codigo_hash)
  values (v_negocio_id, digest(v_codigo_recuperacion, 'sha256'));

  update public.app_bootstrap set used_at = now() where id = true;
  insert into public.auditoria_dispositivos (
    negocio_id, actor_dispositivo_id, dispositivo_objetivo_id, accion
  ) values (
    v_negocio_id, v_dispositivo_id, v_dispositivo_id, 'negocio_activado'
  );

  return jsonb_build_object(
    'negocio_id', v_negocio_id,
    'dispositivo_id', v_dispositivo_id,
    'codigo_recuperacion', v_codigo_recuperacion
  );
end;
$$;

create or replace function public.generar_codigo_emparejamiento(
  p_modo text default 'operacion'
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_actor public.dispositivos%rowtype;
  v_codigo text;
  v_vence_at timestamptz := now() + interval '5 minutes';
begin
  select * into v_actor
  from public.dispositivos
  where auth_user_id = auth.uid() and tipo = 'principal' and estado = 'activo'
  for update;
  if not found then raise exception 'Solo el dispositivo principal puede emparejar.'; end if;
  if p_modo not in ('operacion', 'consulta') then raise exception 'Modo no válido.'; end if;

  update public.codigos_emparejamiento
  set usado_at = now()
  where negocio_id = v_actor.negocio_id and usado_at is null;

  v_codigo := encode(gen_random_bytes(18), 'hex');
  insert into public.codigos_emparejamiento (
    negocio_id, creado_por_dispositivo_id, codigo_hash, modo, vence_at
  ) values (
    v_actor.negocio_id, v_actor.id, digest(v_codigo, 'sha256'), p_modo, v_vence_at
  );

  return jsonb_build_object('codigo', v_codigo, 'vence_at', v_vence_at, 'modo', p_modo);
end;
$$;

create or replace function public.emparejar_dispositivo(
  p_codigo text,
  p_nombre_dispositivo text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_codigo public.codigos_emparejamiento%rowtype;
  v_dispositivo_id uuid;
begin
  if auth.uid() is null then raise exception 'El dispositivo no tiene una sesión válida.'; end if;
  if char_length(trim(p_nombre_dispositivo)) not between 1 and 60 then
    raise exception 'Revisá el nombre del dispositivo.';
  end if;
  if exists (select 1 from public.dispositivos where auth_user_id = auth.uid()) then
    raise exception 'Esta sesión ya está vinculada a un dispositivo.';
  end if;

  select * into v_codigo
  from public.codigos_emparejamiento
  where codigo_hash = digest(p_codigo, 'sha256')
    and usado_at is null
    and vence_at > now()
  for update;
  if not found then raise exception 'El código venció o no es válido.'; end if;

  insert into public.dispositivos (
    negocio_id, auth_user_id, nombre, tipo, modo, estado, ultima_actividad_at
  ) values (
    v_codigo.negocio_id, auth.uid(), trim(p_nombre_dispositivo),
    'vinculado', v_codigo.modo, 'activo', now()
  ) returning id into v_dispositivo_id;

  update public.codigos_emparejamiento
  set usado_at = now(), usado_por_dispositivo_id = v_dispositivo_id
  where id = v_codigo.id;

  insert into public.auditoria_dispositivos (
    negocio_id, actor_dispositivo_id, dispositivo_objetivo_id, accion
  ) values (
    v_codigo.negocio_id, v_codigo.creado_por_dispositivo_id,
    v_dispositivo_id, 'dispositivo_emparejado'
  );

  return jsonb_build_object(
    'negocio_id', v_codigo.negocio_id,
    'dispositivo_id', v_dispositivo_id,
    'tipo', 'vinculado',
    'modo', v_codigo.modo
  );
end;
$$;

create or replace function public.revocar_dispositivo(p_dispositivo_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor public.dispositivos%rowtype;
  v_objetivo public.dispositivos%rowtype;
begin
  select * into v_actor from public.dispositivos
  where auth_user_id = auth.uid() and tipo = 'principal' and estado = 'activo';
  if not found then raise exception 'Solo el dispositivo principal puede revocar.'; end if;

  select * into v_objetivo from public.dispositivos
  where id = p_dispositivo_id and negocio_id = v_actor.negocio_id and estado = 'activo'
  for update;
  if not found then raise exception 'No encontramos ese dispositivo activo.'; end if;
  if v_objetivo.tipo = 'principal' then raise exception 'No se puede revocar el principal actual.'; end if;

  update public.dispositivos
  set estado = 'revocado', actualizado_at = now()
  where id = v_objetivo.id
  returning * into v_objetivo;

  insert into public.auditoria_dispositivos (
    negocio_id, actor_dispositivo_id, dispositivo_objetivo_id, accion
  ) values (v_actor.negocio_id, v_actor.id, v_objetivo.id, 'dispositivo_revocado');

  return to_jsonb(v_objetivo);
end;
$$;

create or replace function public.transferir_dispositivo_principal(p_dispositivo_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor public.dispositivos%rowtype;
  v_objetivo public.dispositivos%rowtype;
begin
  select * into v_actor from public.dispositivos
  where auth_user_id = auth.uid() and tipo = 'principal' and estado = 'activo'
  for update;
  if not found then raise exception 'Solo el dispositivo principal puede transferir el control.'; end if;

  select * into v_objetivo from public.dispositivos
  where id = p_dispositivo_id and negocio_id = v_actor.negocio_id
    and tipo = 'vinculado' and estado = 'activo'
  for update;
  if not found then raise exception 'El dispositivo de destino no está disponible.'; end if;

  update public.dispositivos
  set tipo = 'vinculado', modo = 'operacion', actualizado_at = now()
  where id = v_actor.id;
  update public.dispositivos
  set tipo = 'principal', modo = 'operacion', actualizado_at = now()
  where id = v_objetivo.id
  returning * into v_objetivo;

  insert into public.auditoria_dispositivos (
    negocio_id, actor_dispositivo_id, dispositivo_objetivo_id, accion
  ) values (v_actor.negocio_id, v_actor.id, v_objetivo.id, 'principal_transferido');

  return to_jsonb(v_objetivo);
end;
$$;

create or replace function public.recuperar_dispositivo_principal(
  p_codigo_recuperacion text,
  p_nombre_dispositivo text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_recuperacion public.recuperacion_negocio%rowtype;
  v_dispositivo public.dispositivos%rowtype;
  v_codigo_nuevo text;
begin
  if auth.uid() is null then raise exception 'El dispositivo no tiene una sesión válida.'; end if;
  if char_length(trim(p_nombre_dispositivo)) not between 1 and 60 then
    raise exception 'Revisá el nombre del dispositivo.';
  end if;

  select * into v_recuperacion from public.recuperacion_negocio
  where codigo_hash = digest(p_codigo_recuperacion, 'sha256')
  for update;
  if not found then raise exception 'El código de recuperación no es válido.'; end if;

  update public.dispositivos
  set estado = 'revocado', actualizado_at = now()
  where negocio_id = v_recuperacion.negocio_id
    and tipo = 'principal' and estado = 'activo';

  select * into v_dispositivo from public.dispositivos
  where auth_user_id = auth.uid()
  for update;

  if found then
    if v_dispositivo.negocio_id <> v_recuperacion.negocio_id then
      raise exception 'Esta sesión pertenece a otro negocio.';
    end if;
    update public.dispositivos
    set nombre = trim(p_nombre_dispositivo), tipo = 'principal', modo = 'operacion',
        estado = 'activo', actualizado_at = now(), ultima_actividad_at = now()
    where id = v_dispositivo.id
    returning * into v_dispositivo;
  else
    insert into public.dispositivos (
      negocio_id, auth_user_id, nombre, tipo, modo, estado, ultima_actividad_at
    ) values (
      v_recuperacion.negocio_id, auth.uid(), trim(p_nombre_dispositivo),
      'principal', 'operacion', 'activo', now()
    ) returning * into v_dispositivo;
  end if;

  v_codigo_nuevo := encode(gen_random_bytes(24), 'hex');
  update public.recuperacion_negocio
  set codigo_hash = digest(v_codigo_nuevo, 'sha256'), rotado_at = now()
  where negocio_id = v_recuperacion.negocio_id;

  insert into public.auditoria_dispositivos (
    negocio_id, actor_dispositivo_id, dispositivo_objetivo_id, accion
  ) values (
    v_recuperacion.negocio_id, v_dispositivo.id,
    v_dispositivo.id, 'principal_recuperado'
  );

  return jsonb_build_object(
    'negocio_id', v_recuperacion.negocio_id,
    'dispositivo_id', v_dispositivo.id,
    'codigo_recuperacion', v_codigo_nuevo
  );
end;
$$;

alter table public.app_bootstrap enable row level security;
alter table public.negocios enable row level security;
alter table public.dispositivos enable row level security;
alter table public.codigos_emparejamiento enable row level security;
alter table public.recuperacion_negocio enable row level security;
alter table public.auditoria_dispositivos enable row level security;
alter table public.operaciones_sincronizacion enable row level security;
alter table public.conflictos_sincronizacion enable row level security;

create policy negocios_del_dispositivo on public.negocios
  for select to authenticated
  using (id = (select public.negocio_actual_id()));

create policy dispositivos_del_negocio on public.dispositivos
  for select to authenticated
  using (negocio_id = (select public.negocio_actual_id()));

create policy auditoria_del_negocio on public.auditoria_dispositivos
  for select to authenticated
  using (negocio_id = (select public.negocio_actual_id()));

create policy operaciones_del_negocio on public.operaciones_sincronizacion
  for select to authenticated
  using (negocio_id = (select public.negocio_actual_id()));

create policy conflictos_del_negocio on public.conflictos_sincronizacion
  for select to authenticated
  using (negocio_id = (select public.negocio_actual_id()));

revoke all on public.app_bootstrap from anon, authenticated;
revoke all on public.codigos_emparejamiento from anon, authenticated;
revoke all on public.recuperacion_negocio from anon, authenticated;
revoke all on public.negocios from anon;
revoke all on public.dispositivos from anon;
revoke all on public.auditoria_dispositivos from anon;
revoke all on public.operaciones_sincronizacion from anon;
revoke all on public.conflictos_sincronizacion from anon;

grant select on public.negocios to authenticated;
grant select on public.dispositivos to authenticated;
grant select on public.auditoria_dispositivos to authenticated;
grant select on public.operaciones_sincronizacion to authenticated;
grant select on public.conflictos_sincronizacion to authenticated;

revoke all on function public.activar_negocio_inicial(text, text, text) from public;
revoke all on function public.generar_codigo_emparejamiento(text) from public;
revoke all on function public.emparejar_dispositivo(text, text) from public;
revoke all on function public.revocar_dispositivo(uuid) from public;
revoke all on function public.transferir_dispositivo_principal(uuid) from public;
revoke all on function public.recuperar_dispositivo_principal(text, text) from public;
revoke all on function public.dispositivo_actual_id() from public;
revoke all on function public.negocio_actual_id() from public;
revoke all on function public.es_principal_actual() from public;
revoke all on function public.puede_operar_actual() from public;

grant execute on function public.activar_negocio_inicial(text, text, text) to authenticated;
grant execute on function public.generar_codigo_emparejamiento(text) to authenticated;
grant execute on function public.emparejar_dispositivo(text, text) to authenticated;
grant execute on function public.revocar_dispositivo(uuid) to authenticated;
grant execute on function public.transferir_dispositivo_principal(uuid) to authenticated;
grant execute on function public.recuperar_dispositivo_principal(text, text) to authenticated;
grant execute on function public.dispositivo_actual_id() to authenticated;
grant execute on function public.negocio_actual_id() to authenticated;
grant execute on function public.es_principal_actual() to authenticated;
grant execute on function public.puede_operar_actual() to authenticated;

comment on table public.app_bootstrap is
  'Código de activación inicial almacenado únicamente como SHA-256.';
comment on table public.operaciones_sincronizacion is
  'Sobre idempotente y ordenado para operaciones offline; la aplicación del dominio se agrega en capas posteriores.';
