-- Mora Vinería v0.2 — primer dominio operativo sincronizado: categorías y productos.
-- Requiere las migraciones 0001 a 0004.

alter table public.negocios
  add column if not exists catalogo_inicializado_at timestamptz;

alter table public.operaciones_sincronizacion
  add column if not exists resultado jsonb;

create table public.categorias_catalogo (
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  id text not null check (char_length(id) between 8 and 160),
  nombre text not null check (char_length(trim(nombre)) between 1 and 80),
  activa boolean not null default true,
  creado_cliente_at timestamptz not null,
  actualizado_cliente_at timestamptz not null,
  version bigint not null default 1 check (version > 0),
  eliminado_at timestamptz,
  actualizado_por_dispositivo_id uuid not null references public.dispositivos(id),
  primary key (negocio_id, id)
);

create unique index categorias_catalogo_nombre_activo_unico
  on public.categorias_catalogo (negocio_id, lower(trim(nombre)))
  where eliminado_at is null;

create table public.productos_catalogo (
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  id text not null check (char_length(id) between 8 and 160),
  categoria_id text not null,
  nombre text not null check (char_length(trim(nombre)) between 1 and 120),
  precio_venta numeric(14, 2) not null check (precio_venta >= 0),
  costo_compra numeric(14, 2) not null check (costo_compra >= 0),
  marca text,
  presentacion text,
  stock_actual integer not null check (stock_actual >= 0),
  stock_objetivo integer not null check (stock_objetivo >= 0),
  estado text not null check (estado in ('activo', 'inactivo')),
  observaciones text,
  creado_cliente_at timestamptz not null,
  actualizado_cliente_at timestamptz not null,
  eliminado_cliente_at timestamptz,
  version bigint not null default 1 check (version > 0),
  eliminado_at timestamptz,
  actualizado_por_dispositivo_id uuid not null references public.dispositivos(id),
  primary key (negocio_id, id),
  foreign key (negocio_id, categoria_id)
    references public.categorias_catalogo(negocio_id, id)
);

create index productos_catalogo_categoria_idx
  on public.productos_catalogo (negocio_id, categoria_id)
  where eliminado_at is null;

alter table public.categorias_catalogo enable row level security;
alter table public.productos_catalogo enable row level security;

create policy categorias_catalogo_del_negocio
  on public.categorias_catalogo
  for select
  to authenticated
  using (negocio_id = (select private.negocio_actual_id()));

create policy productos_catalogo_del_negocio
  on public.productos_catalogo
  for select
  to authenticated
  using (negocio_id = (select private.negocio_actual_id()));

revoke all on public.categorias_catalogo from public, anon, authenticated;
revoke all on public.productos_catalogo from public, anon, authenticated;

create or replace function private.snapshot_catalogo(p_negocio_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'inicializado', n.catalogo_inicializado_at is not null,
    'cursor', coalesce((
      select max(o.secuencia)
      from public.operaciones_sincronizacion o
      where o.negocio_id = p_negocio_id
    ), 0),
    'categorias', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'entidad', jsonb_build_object(
            'id', c.id,
            'nombre', c.nombre,
            'activa', c.activa,
            'createdAt', c.creado_cliente_at,
            'updatedAt', c.actualizado_cliente_at
          ),
          'version', c.version,
          'eliminada', false
        ) order by lower(c.nombre), c.id
      )
      from public.categorias_catalogo c
      where c.negocio_id = p_negocio_id and c.eliminado_at is null
    ), '[]'::jsonb),
    'productos', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'entidad', jsonb_strip_nulls(jsonb_build_object(
            'id', p.id,
            'nombre', p.nombre,
            'categoriaId', p.categoria_id,
            'precioVenta', p.precio_venta,
            'costoCompra', p.costo_compra,
            'marca', p.marca,
            'presentacion', p.presentacion,
            'stockActual', p.stock_actual,
            'stockObjetivo', p.stock_objetivo,
            'estado', p.estado,
            'observaciones', p.observaciones,
            'createdAt', p.creado_cliente_at,
            'updatedAt', p.actualizado_cliente_at,
            'deletedAt', p.eliminado_cliente_at
          )),
          'version', p.version,
          'eliminada', false
        ) order by lower(p.nombre), p.id
      )
      from public.productos_catalogo p
      where p.negocio_id = p_negocio_id and p.eliminado_at is null
    ), '[]'::jsonb)
  )
  from public.negocios n
  where n.id = p_negocio_id;
$$;

revoke all on function private.snapshot_catalogo(uuid) from public, anon, authenticated;

create or replace function public.obtener_snapshot_catalogo()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_negocio_id uuid := private.negocio_actual_id();
begin
  if v_negocio_id is null then
    raise exception 'El dispositivo no está autorizado.' using errcode = '42501';
  end if;
  return private.snapshot_catalogo(v_negocio_id);
end;
$$;

create or replace function public.inicializar_catalogo(
  p_operacion_id text,
  p_categorias jsonb,
  p_productos jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_negocio_id uuid := private.negocio_actual_id();
  v_dispositivo_id uuid := private.dispositivo_actual_id();
  v_item jsonb;
  v_cambios jsonb := '[]'::jsonb;
  v_secuencia bigint;
  v_insertadas integer := 0;
begin
  if v_negocio_id is null or v_dispositivo_id is null or not private.es_principal_actual() then
    raise exception 'Solo el dispositivo principal puede inicializar el catálogo.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_categorias) <> 'array' or jsonb_typeof(p_productos) <> 'array' then
    raise exception 'El catálogo inicial no es válido.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_categorias) > 500 or jsonb_array_length(p_productos) > 10000 then
    raise exception 'El catálogo inicial supera el límite permitido.' using errcode = '22023';
  end if;

  perform 1 from public.negocios where id = v_negocio_id for update;
  if (select catalogo_inicializado_at is not null from public.negocios where id = v_negocio_id) then
    return private.snapshot_catalogo(v_negocio_id);
  end if;

  for v_item in select value from jsonb_array_elements(p_categorias)
  loop
    insert into public.categorias_catalogo (
      negocio_id, id, nombre, activa, creado_cliente_at,
      actualizado_cliente_at, actualizado_por_dispositivo_id
    ) values (
      v_negocio_id,
      v_item->>'id',
      trim(v_item->>'nombre'),
      coalesce((v_item->>'activa')::boolean, true),
      (v_item->>'createdAt')::timestamptz,
      (v_item->>'updatedAt')::timestamptz,
      v_dispositivo_id
    );
    v_cambios := v_cambios || jsonb_build_array(jsonb_build_object(
      'tipoEntidad', 'categoria', 'entidadId', v_item->>'id',
      'version', 1, 'eliminada', false, 'entidad', v_item
    ));
  end loop;

  for v_item in select value from jsonb_array_elements(p_productos)
  loop
    insert into public.productos_catalogo (
      negocio_id, id, categoria_id, nombre, precio_venta, costo_compra,
      marca, presentacion, stock_actual, stock_objetivo, estado, observaciones,
      creado_cliente_at, actualizado_cliente_at, eliminado_cliente_at,
      actualizado_por_dispositivo_id
    ) values (
      v_negocio_id,
      v_item->>'id',
      v_item->>'categoriaId',
      trim(v_item->>'nombre'),
      (v_item->>'precioVenta')::numeric,
      (v_item->>'costoCompra')::numeric,
      nullif(v_item->>'marca', ''),
      nullif(v_item->>'presentacion', ''),
      (v_item->>'stockActual')::integer,
      (v_item->>'stockObjetivo')::integer,
      v_item->>'estado',
      nullif(v_item->>'observaciones', ''),
      (v_item->>'createdAt')::timestamptz,
      (v_item->>'updatedAt')::timestamptz,
      nullif(v_item->>'deletedAt', '')::timestamptz,
      v_dispositivo_id
    );
    v_cambios := v_cambios || jsonb_build_array(jsonb_build_object(
      'tipoEntidad', 'producto', 'entidadId', v_item->>'id',
      'version', 1, 'eliminada', false, 'entidad', v_item
    ));
  end loop;

  insert into public.operaciones_sincronizacion (
    id, negocio_id, dispositivo_id, tipo_operacion, tipo_entidad,
    entidad_id, payload, estado, creada_cliente_at, aplicada_at, resultado
  ) values (
    p_operacion_id, v_negocio_id, v_dispositivo_id, 'inicializar', 'catalogo',
    'catalogo', jsonb_build_object('categorias', p_categorias, 'productos', p_productos),
    'aplicada', now(), now(), jsonb_build_object('cambios', v_cambios)
  )
  on conflict (id) do nothing
  returning secuencia into v_secuencia;

  get diagnostics v_insertadas = row_count;
  if v_insertadas = 0 then
    raise exception 'El identificador de inicialización ya fue utilizado.' using errcode = '23505';
  end if;

  update public.negocios
  set catalogo_inicializado_at = now(), actualizado_at = now()
  where id = v_negocio_id;

  return private.snapshot_catalogo(v_negocio_id);
end;
$$;

create or replace function public.aplicar_operaciones_catalogo(p_operaciones jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_negocio_id uuid := private.negocio_actual_id();
  v_dispositivo_id uuid := private.dispositivo_actual_id();
  v_operacion jsonb;
  v_payload jsonb;
  v_entidad jsonb;
  v_id text;
  v_tipo text;
  v_tipo_entidad text;
  v_entidad_id text;
  v_base_version bigint;
  v_version_actual bigint;
  v_nueva_version bigint;
  v_secuencia bigint;
  v_resultado jsonb;
  v_estado text;
  v_codigo_error text;
  v_detalle_error text;
  v_conflicto_id uuid;
  v_respuestas jsonb := '[]'::jsonb;
  v_insertada integer;
begin
  if v_negocio_id is null or v_dispositivo_id is null or not private.puede_operar_actual() then
    raise exception 'El dispositivo no está autorizado para operar.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_operaciones) <> 'array' or jsonb_array_length(p_operaciones) > 50 then
    raise exception 'El lote de sincronización no es válido.' using errcode = '22023';
  end if;

  for v_operacion in select value from jsonb_array_elements(p_operaciones)
  loop
    v_id := v_operacion->>'id';
    v_tipo := v_operacion->>'tipoOperacion';
    v_tipo_entidad := v_operacion->>'tipoEntidad';
    v_entidad_id := v_operacion->>'entidadId';
    v_payload := v_operacion->'payload';
    v_entidad := v_payload->'entidad';
    v_base_version := coalesce((v_payload->>'baseVersion')::bigint, 0);
    v_conflicto_id := null;
    v_resultado := null;
    v_codigo_error := null;
    v_detalle_error := null;

    insert into public.operaciones_sincronizacion (
      id, negocio_id, dispositivo_id, tipo_operacion, tipo_entidad,
      entidad_id, payload, creada_cliente_at
    ) values (
      v_id, v_negocio_id, v_dispositivo_id, v_tipo, v_tipo_entidad,
      v_entidad_id, v_payload,
      coalesce((v_operacion->>'creadaAt')::timestamptz, now())
    ) on conflict (id) do nothing
    returning secuencia into v_secuencia;
    get diagnostics v_insertada = row_count;

    if v_insertada = 0 then
      select secuencia, estado, resultado, codigo_error, detalle_error
      into v_secuencia, v_estado, v_resultado, v_codigo_error, v_detalle_error
      from public.operaciones_sincronizacion
      where negocio_id = v_negocio_id and id = v_id;
      v_respuestas := v_respuestas || jsonb_build_array(jsonb_build_object(
        'operacionId', v_id, 'secuencia', v_secuencia, 'estado', v_estado,
        'cambios', coalesce(v_resultado->'cambios', '[]'::jsonb),
        'codigoError', v_codigo_error, 'detalleError', v_detalle_error,
        'conflictoId', null,
        'dispositivoId', v_dispositivo_id
      ));
      continue;
    end if;

    begin
      if v_tipo_entidad = 'categoria' then
        select version into v_version_actual
        from public.categorias_catalogo
        where negocio_id = v_negocio_id and id = v_entidad_id
        for update;

        if v_tipo = 'upsert' and v_version_actual is null and v_base_version = 0 then
          insert into public.categorias_catalogo (
            negocio_id, id, nombre, activa, creado_cliente_at,
            actualizado_cliente_at, actualizado_por_dispositivo_id
          ) values (
            v_negocio_id, v_entidad_id, trim(v_entidad->>'nombre'),
            (v_entidad->>'activa')::boolean, (v_entidad->>'createdAt')::timestamptz,
            (v_entidad->>'updatedAt')::timestamptz, v_dispositivo_id
          );
          v_nueva_version := 1;
        elsif v_version_actual is null or v_version_actual <> v_base_version then
          raise exception 'VERSION_CONFLICTO';
        elsif v_tipo = 'upsert' then
          update public.categorias_catalogo set
            nombre = trim(v_entidad->>'nombre'),
            activa = (v_entidad->>'activa')::boolean,
            creado_cliente_at = (v_entidad->>'createdAt')::timestamptz,
            actualizado_cliente_at = (v_entidad->>'updatedAt')::timestamptz,
            version = version + 1,
            eliminado_at = null,
            actualizado_por_dispositivo_id = v_dispositivo_id
          where negocio_id = v_negocio_id and id = v_entidad_id
          returning version into v_nueva_version;
        elsif v_tipo = 'eliminar' then
          if exists (
            select 1 from public.productos_catalogo
            where negocio_id = v_negocio_id and categoria_id = v_entidad_id
              and eliminado_at is null
          ) then
            raise exception 'CATEGORIA_CON_PRODUCTOS';
          end if;
          update public.categorias_catalogo set
            version = version + 1, eliminado_at = now(),
            actualizado_por_dispositivo_id = v_dispositivo_id
          where negocio_id = v_negocio_id and id = v_entidad_id
          returning version into v_nueva_version;
        else
          raise exception 'OPERACION_NO_ADMITIDA';
        end if;
      elsif v_tipo_entidad = 'producto' then
        select version into v_version_actual
        from public.productos_catalogo
        where negocio_id = v_negocio_id and id = v_entidad_id
        for update;

        if v_tipo = 'upsert' and not exists (
          select 1 from public.categorias_catalogo
          where negocio_id = v_negocio_id and id = v_entidad->>'categoriaId'
            and eliminado_at is null
        ) then
          raise exception 'CATEGORIA_NO_DISPONIBLE';
        end if;

        if v_tipo = 'upsert' and v_version_actual is null and v_base_version = 0 then
          insert into public.productos_catalogo (
            negocio_id, id, categoria_id, nombre, precio_venta, costo_compra,
            marca, presentacion, stock_actual, stock_objetivo, estado, observaciones,
            creado_cliente_at, actualizado_cliente_at, eliminado_cliente_at,
            actualizado_por_dispositivo_id
          ) values (
            v_negocio_id, v_entidad_id, v_entidad->>'categoriaId', trim(v_entidad->>'nombre'),
            (v_entidad->>'precioVenta')::numeric, (v_entidad->>'costoCompra')::numeric,
            nullif(v_entidad->>'marca', ''), nullif(v_entidad->>'presentacion', ''),
            (v_entidad->>'stockActual')::integer, (v_entidad->>'stockObjetivo')::integer,
            v_entidad->>'estado', nullif(v_entidad->>'observaciones', ''),
            (v_entidad->>'createdAt')::timestamptz, (v_entidad->>'updatedAt')::timestamptz,
            nullif(v_entidad->>'deletedAt', '')::timestamptz, v_dispositivo_id
          );
          v_nueva_version := 1;
        elsif v_version_actual is null or v_version_actual <> v_base_version then
          raise exception 'VERSION_CONFLICTO';
        elsif v_tipo = 'upsert' then
          update public.productos_catalogo set
            categoria_id = v_entidad->>'categoriaId', nombre = trim(v_entidad->>'nombre'),
            precio_venta = (v_entidad->>'precioVenta')::numeric,
            costo_compra = (v_entidad->>'costoCompra')::numeric,
            marca = nullif(v_entidad->>'marca', ''),
            presentacion = nullif(v_entidad->>'presentacion', ''),
            stock_actual = (v_entidad->>'stockActual')::integer,
            stock_objetivo = (v_entidad->>'stockObjetivo')::integer,
            estado = v_entidad->>'estado', observaciones = nullif(v_entidad->>'observaciones', ''),
            creado_cliente_at = (v_entidad->>'createdAt')::timestamptz,
            actualizado_cliente_at = (v_entidad->>'updatedAt')::timestamptz,
            eliminado_cliente_at = nullif(v_entidad->>'deletedAt', '')::timestamptz,
            version = version + 1, eliminado_at = null,
            actualizado_por_dispositivo_id = v_dispositivo_id
          where negocio_id = v_negocio_id and id = v_entidad_id
          returning version into v_nueva_version;
        elsif v_tipo = 'eliminar' then
          update public.productos_catalogo set
            version = version + 1, eliminado_at = now(),
            actualizado_por_dispositivo_id = v_dispositivo_id
          where negocio_id = v_negocio_id and id = v_entidad_id
          returning version into v_nueva_version;
        else
          raise exception 'OPERACION_NO_ADMITIDA';
        end if;
      else
        raise exception 'ENTIDAD_NO_ADMITIDA';
      end if;

      v_resultado := jsonb_build_object('cambios', jsonb_build_array(jsonb_build_object(
        'tipoEntidad', v_tipo_entidad, 'entidadId', v_entidad_id,
        'version', v_nueva_version, 'eliminada', v_tipo = 'eliminar',
        'entidad', case when v_tipo = 'eliminar' then null else v_entidad end
      )));
      update public.operaciones_sincronizacion
      set estado = 'aplicada', aplicada_at = now(), resultado = v_resultado
      where id = v_id;
      v_estado := 'aplicada';
    exception when others then
      v_codigo_error := case
        when sqlerrm in ('VERSION_CONFLICTO', 'CATEGORIA_CON_PRODUCTOS', 'CATEGORIA_NO_DISPONIBLE')
          then sqlerrm
        else 'OPERACION_INVALIDA'
      end;
      v_detalle_error := case v_codigo_error
        when 'VERSION_CONFLICTO' then 'El registro cambió en otro dispositivo.'
        when 'CATEGORIA_CON_PRODUCTOS' then 'La categoría tiene productos remotos asociados.'
        when 'CATEGORIA_NO_DISPONIBLE' then 'La categoría del producto no está disponible.'
        else 'La operación no pudo validarse.'
      end;
      insert into public.conflictos_sincronizacion (
        negocio_id, operacion_id, tipo, tipo_entidad, entidad_id, detalle
      ) values (
        v_negocio_id, v_id, v_codigo_error, v_tipo_entidad, v_entidad_id,
        jsonb_build_object('baseVersion', v_base_version, 'versionRemota', v_version_actual,
          'mensaje', v_detalle_error, 'payloadLocal', v_payload)
      ) returning id into v_conflicto_id;
      update public.operaciones_sincronizacion
      set estado = 'conflicto', aplicada_at = now(), codigo_error = v_codigo_error,
          detalle_error = v_detalle_error,
          resultado = jsonb_build_object('cambios', '[]'::jsonb, 'conflictoId', v_conflicto_id)
      where id = v_id;
      v_estado := 'conflicto';
      v_resultado := jsonb_build_object('cambios', '[]'::jsonb);
    end;

    v_respuestas := v_respuestas || jsonb_build_array(jsonb_build_object(
      'operacionId', v_id, 'secuencia', v_secuencia, 'estado', v_estado,
      'cambios', coalesce(v_resultado->'cambios', '[]'::jsonb),
      'codigoError', v_codigo_error, 'detalleError', v_detalle_error,
      'conflictoId', v_conflicto_id,
      'dispositivoId', v_dispositivo_id
    ));
  end loop;

  update public.dispositivos set ultima_actividad_at = now(), actualizado_at = now()
  where id = v_dispositivo_id;
  return v_respuestas;
end;
$$;

create or replace function public.obtener_cambios_catalogo(
  p_cursor bigint default 0,
  p_limite integer default 100
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_negocio_id uuid := private.negocio_actual_id();
  v_cursor bigint;
  v_operaciones jsonb;
  v_hay_mas boolean;
begin
  if v_negocio_id is null then
    raise exception 'El dispositivo no está autorizado.' using errcode = '42501';
  end if;
  p_limite := greatest(1, least(coalesce(p_limite, 100), 500));

  with lote as (
    select o.*
    from public.operaciones_sincronizacion o
    where o.negocio_id = v_negocio_id and o.secuencia > greatest(p_cursor, 0)
    order by o.secuencia
    limit p_limite
  )
  select
    coalesce(max(secuencia), greatest(p_cursor, 0)),
    coalesce(jsonb_agg(jsonb_build_object(
      'operacionId', id, 'secuencia', secuencia, 'estado', estado,
      'cambios', coalesce(resultado->'cambios', '[]'::jsonb),
      'codigoError', codigo_error, 'detalleError', detalle_error,
      'conflictoId', resultado->>'conflictoId',
      'conflictoResueltoId', resultado->>'conflictoResueltoId',
      'dispositivoId', dispositivo_id
    ) order by secuencia), '[]'::jsonb)
  into v_cursor, v_operaciones
  from lote;

  select exists (
    select 1 from public.operaciones_sincronizacion
    where negocio_id = v_negocio_id and secuencia > v_cursor
  ) into v_hay_mas;

  return jsonb_build_object(
    'cursor', v_cursor, 'hayMas', v_hay_mas, 'operaciones', v_operaciones
  );
end;
$$;

create or replace function public.resolver_conflicto_catalogo(
  p_conflicto_id uuid,
  p_resolucion text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_negocio_id uuid := private.negocio_actual_id();
  v_dispositivo_id uuid := private.dispositivo_actual_id();
  v_conflicto public.conflictos_sincronizacion%rowtype;
  v_operacion public.operaciones_sincronizacion%rowtype;
  v_payload jsonb;
  v_cambio jsonb;
  v_respuesta jsonb;
  v_version bigint;
  v_secuencia bigint;
begin
  if v_negocio_id is null or v_dispositivo_id is null or not private.es_principal_actual() then
    raise exception 'Solo el dispositivo principal puede resolver conflictos.' using errcode = '42501';
  end if;
  if p_resolucion not in ('remoto', 'local') then
    raise exception 'La resolución no es válida.' using errcode = '22023';
  end if;

  select * into v_conflicto
  from public.conflictos_sincronizacion
  where id = p_conflicto_id and negocio_id = v_negocio_id
  for update;
  if v_conflicto.id is null then
    raise exception 'No encontramos el conflicto.' using errcode = 'P0002';
  end if;
  if v_conflicto.estado = 'resuelto' then
    return jsonb_build_object('estado', 'resuelto', 'operaciones', '[]'::jsonb);
  end if;

  select * into v_operacion
  from public.operaciones_sincronizacion
  where id = v_conflicto.operacion_id and negocio_id = v_negocio_id;

  if p_resolucion = 'local' then
    if v_conflicto.tipo_entidad = 'categoria' then
      select version into v_version from public.categorias_catalogo
      where negocio_id = v_negocio_id and id = v_conflicto.entidad_id;
    else
      select version into v_version from public.productos_catalogo
      where negocio_id = v_negocio_id and id = v_conflicto.entidad_id;
    end if;
    v_payload := jsonb_set(v_operacion.payload, '{baseVersion}', to_jsonb(coalesce(v_version, 0)), true);
    v_respuesta := public.aplicar_operaciones_catalogo(jsonb_build_array(jsonb_build_object(
      'id', 'resolucion-' || p_conflicto_id::text,
      'tipoOperacion', v_operacion.tipo_operacion,
      'tipoEntidad', v_operacion.tipo_entidad,
      'entidadId', v_operacion.entidad_id,
      'payload', v_payload,
      'creadaAt', now()
    )));
    if v_respuesta->0->>'estado' <> 'aplicada' then
      return jsonb_build_object('estado', 'pendiente', 'operaciones', v_respuesta);
    end if;
    update public.operaciones_sincronizacion
    set resultado = jsonb_set(
      coalesce(resultado, '{}'::jsonb),
      '{conflictoResueltoId}',
      to_jsonb(p_conflicto_id::text),
      true
    )
    where id = 'resolucion-' || p_conflicto_id::text;
  else
    if v_conflicto.tipo_entidad = 'categoria' then
      select version,
        jsonb_build_object(
          'tipoEntidad', 'categoria', 'entidadId', id, 'version', version,
          'eliminada', eliminado_at is not null,
          'entidad', case when eliminado_at is not null then null else jsonb_build_object(
            'id', id, 'nombre', nombre, 'activa', activa,
            'createdAt', creado_cliente_at, 'updatedAt', actualizado_cliente_at
          ) end
        )
      into v_version, v_cambio
      from public.categorias_catalogo
      where negocio_id = v_negocio_id and id = v_conflicto.entidad_id;
    else
      select version,
        jsonb_build_object(
          'tipoEntidad', 'producto', 'entidadId', id, 'version', version,
          'eliminada', eliminado_at is not null,
          'entidad', case when eliminado_at is not null then null else jsonb_strip_nulls(jsonb_build_object(
            'id', id, 'nombre', nombre, 'categoriaId', categoria_id,
            'precioVenta', precio_venta, 'costoCompra', costo_compra,
            'marca', marca, 'presentacion', presentacion,
            'stockActual', stock_actual, 'stockObjetivo', stock_objetivo,
            'estado', estado, 'observaciones', observaciones,
            'createdAt', creado_cliente_at, 'updatedAt', actualizado_cliente_at,
            'deletedAt', eliminado_cliente_at
          )) end
        )
      into v_version, v_cambio
      from public.productos_catalogo
      where negocio_id = v_negocio_id and id = v_conflicto.entidad_id;
    end if;

    if v_cambio is null then
      v_cambio := jsonb_build_object(
        'tipoEntidad', v_conflicto.tipo_entidad,
        'entidadId', v_conflicto.entidad_id,
        'version', greatest(coalesce(v_version, 0), 1),
        'eliminada', true,
        'entidad', null
      );
    end if;
    insert into public.operaciones_sincronizacion (
      id, negocio_id, dispositivo_id, tipo_operacion, tipo_entidad,
      entidad_id, payload, estado, creada_cliente_at, aplicada_at, resultado
    ) values (
      'resolucion-' || p_conflicto_id::text,
      v_negocio_id, v_dispositivo_id, 'resolver_remoto', v_conflicto.tipo_entidad,
      v_conflicto.entidad_id, jsonb_build_object('conflictoId', p_conflicto_id),
      'aplicada', now(), now(), jsonb_build_object(
        'cambios', jsonb_build_array(v_cambio),
        'conflictoResueltoId', p_conflicto_id
      )
    )
    on conflict (id) do update set id = excluded.id
    returning secuencia into v_secuencia;
    v_respuesta := jsonb_build_array(jsonb_build_object(
      'operacionId', 'resolucion-' || p_conflicto_id::text,
      'secuencia', v_secuencia, 'estado', 'aplicada',
      'cambios', jsonb_build_array(v_cambio), 'dispositivoId', v_dispositivo_id
      , 'conflictoResueltoId', p_conflicto_id
    ));
  end if;

  update public.conflictos_sincronizacion
  set estado = 'resuelto', resuelto_at = now(),
      resuelto_por_dispositivo_id = v_dispositivo_id
  where id = p_conflicto_id;

  return jsonb_build_object('estado', 'resuelto', 'operaciones', v_respuesta);
end;
$$;

revoke execute on function public.obtener_snapshot_catalogo() from public, anon;
revoke execute on function public.inicializar_catalogo(text, jsonb, jsonb) from public, anon;
revoke execute on function public.aplicar_operaciones_catalogo(jsonb) from public, anon;
revoke execute on function public.obtener_cambios_catalogo(bigint, integer) from public, anon;
revoke execute on function public.resolver_conflicto_catalogo(uuid, text) from public, anon;

grant execute on function public.obtener_snapshot_catalogo() to authenticated;
grant execute on function public.inicializar_catalogo(text, jsonb, jsonb) to authenticated;
grant execute on function public.aplicar_operaciones_catalogo(jsonb) to authenticated;
grant execute on function public.obtener_cambios_catalogo(bigint, integer) to authenticated;
grant execute on function public.resolver_conflicto_catalogo(uuid, text) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'operaciones_sincronizacion'
  ) then
    alter publication supabase_realtime add table public.operaciones_sincronizacion;
  end if;
end;
$$;

notify pgrst, 'reload schema';
