-- Tesorería operativa v0.3.0: cuentas, libro inmutable y conteos de caja.
-- Las tablas no se exponen al cliente; las escrituras pasan por una RPC idempotente.

create table public.cuentas_tesoreria (
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  id text not null check (char_length(id) between 8 and 160),
  nombre text not null check (char_length(trim(nombre)) between 1 and 60),
  tipo text not null check (tipo in ('efectivo', 'digital')),
  estado text not null check (estado in ('activa', 'archivada')),
  entidad jsonb not null check (jsonb_typeof(entidad) = 'object'),
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now(),
  actualizado_por_dispositivo_id uuid not null references public.dispositivos(id),
  primary key (negocio_id, id)
);

create unique index cuentas_tesoreria_nombre_activo_idx
  on public.cuentas_tesoreria (negocio_id, lower(trim(nombre)))
  where estado = 'activa';

create table public.movimientos_tesoreria (
  negocio_id uuid not null,
  id text not null check (char_length(id) between 8 and 160),
  cuenta_id text not null,
  tipo text not null check (tipo in (
    'saldo_inicial', 'cobro_venta', 'reposicion', 'gasto_puntual',
    'aporte_externo', 'retiro', 'transferencia', 'ajuste_conteo', 'reversion'
  )),
  direccion text not null check (direccion in ('entrada', 'salida')),
  monto numeric(14, 0) not null check (monto > 0),
  fecha_hora_real timestamptz not null,
  fecha_jornada date not null,
  referencia_tipo text,
  referencia_id text,
  grupo_id text,
  entidad jsonb not null check (jsonb_typeof(entidad) = 'object'),
  creado_at timestamptz not null default now(),
  creado_por_dispositivo_id uuid not null references public.dispositivos(id),
  primary key (negocio_id, id),
  foreign key (negocio_id, cuenta_id)
    references public.cuentas_tesoreria(negocio_id, id) on delete restrict
);

create index movimientos_tesoreria_cuenta_fecha_idx
  on public.movimientos_tesoreria (negocio_id, cuenta_id, fecha_hora_real desc);
create index movimientos_tesoreria_jornada_idx
  on public.movimientos_tesoreria (negocio_id, fecha_jornada);
create index movimientos_tesoreria_referencia_idx
  on public.movimientos_tesoreria (negocio_id, referencia_tipo, referencia_id)
  where referencia_id is not null;
create index movimientos_tesoreria_grupo_idx
  on public.movimientos_tesoreria (negocio_id, grupo_id)
  where grupo_id is not null;

create table public.conteos_caja (
  negocio_id uuid not null,
  id text not null check (char_length(id) between 8 and 160),
  cuenta_id text not null,
  fecha_hora_real timestamptz not null,
  fecha_jornada date not null,
  monto_esperado numeric(14, 0) not null,
  monto_contado numeric(14, 0) not null check (monto_contado >= 0),
  diferencia numeric(14, 0) not null,
  entidad jsonb not null check (jsonb_typeof(entidad) = 'object'),
  creado_at timestamptz not null default now(),
  creado_por_dispositivo_id uuid not null references public.dispositivos(id),
  primary key (negocio_id, id),
  foreign key (negocio_id, cuenta_id)
    references public.cuentas_tesoreria(negocio_id, id) on delete restrict
);

create index conteos_caja_cuenta_fecha_idx
  on public.conteos_caja (negocio_id, cuenta_id, fecha_hora_real desc);

alter table public.cuentas_tesoreria enable row level security;
alter table public.movimientos_tesoreria enable row level security;
alter table public.conteos_caja enable row level security;

revoke all on public.cuentas_tesoreria from public, anon, authenticated;
revoke all on public.movimientos_tesoreria from public, anon, authenticated;
revoke all on public.conteos_caja from public, anon, authenticated;

create or replace function public.obtener_snapshot_tesoreria()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_negocio_id uuid := private.negocio_actual_id();
begin
  if v_negocio_id is null or private.dispositivo_actual_id() is null then
    raise exception 'El dispositivo no está autorizado.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'cuentas', coalesce((select jsonb_agg(c.entidad order by c.creado_at) from public.cuentas_tesoreria c where c.negocio_id = v_negocio_id), '[]'::jsonb),
    'movimientos', coalesce((select jsonb_agg(m.entidad order by m.fecha_hora_real) from public.movimientos_tesoreria m where m.negocio_id = v_negocio_id), '[]'::jsonb),
    'conteos', coalesce((select jsonb_agg(c.entidad order by c.fecha_hora_real) from public.conteos_caja c where c.negocio_id = v_negocio_id), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.obtener_snapshot_tesoreria() from public, anon, authenticated;
grant execute on function public.obtener_snapshot_tesoreria() to authenticated;

create or replace function public.aplicar_operaciones_tesoreria(p_operaciones jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_negocio_id uuid := private.negocio_actual_id();
  v_dispositivo_id uuid := private.dispositivo_actual_id();
  v_operacion jsonb;
  v_item jsonb;
  v_id text;
  v_entidad_id text;
  v_payload jsonb;
  v_secuencia bigint;
  v_insertada integer;
  v_estado text;
  v_resultado jsonb;
  v_codigo_error text;
  v_detalle_error text;
  v_cambios jsonb;
  v_respuestas jsonb := '[]'::jsonb;
begin
  if v_negocio_id is null or v_dispositivo_id is null or not private.puede_operar_actual() then
    raise exception 'El dispositivo no está autorizado para operar.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_operaciones) <> 'array' or jsonb_array_length(p_operaciones) > 25 then
    raise exception 'El lote de tesorería no es válido.';
  end if;

  for v_operacion in select value from jsonb_array_elements(p_operaciones)
  loop
    v_secuencia := null;
    v_insertada := 0;
    v_estado := null;
    v_resultado := null;
    v_codigo_error := null;
    v_detalle_error := null;
    v_cambios := '[]'::jsonb;
    v_id := v_operacion->>'id';
    v_entidad_id := v_operacion->>'entidadId';
    v_payload := v_operacion->'payload';
    if v_operacion->>'tipoEntidad' <> 'tesoreria'
       or v_id is null or char_length(v_id) not between 8 and 160
       or v_entidad_id is null or char_length(v_entidad_id) not between 8 and 160
       or jsonb_typeof(v_payload) <> 'object' then
      raise exception 'La operación de tesorería es inválida.';
    end if;
    if jsonb_typeof(coalesce(v_payload->'cuentas', '[]'::jsonb)) <> 'array'
       or jsonb_typeof(coalesce(v_payload->'movimientos', '[]'::jsonb)) <> 'array'
       or jsonb_typeof(coalesce(v_payload->'conteos', '[]'::jsonb)) <> 'array'
       or jsonb_array_length(coalesce(v_payload->'cuentas', '[]'::jsonb)) > 20
       or jsonb_array_length(coalesce(v_payload->'movimientos', '[]'::jsonb)) > 50
       or jsonb_array_length(coalesce(v_payload->'conteos', '[]'::jsonb)) > 10 then
      raise exception 'El contenido de tesorería excede los límites permitidos.';
    end if;

    insert into public.operaciones_sincronizacion (
      id, negocio_id, dispositivo_id, tipo_operacion, tipo_entidad,
      entidad_id, payload, creada_cliente_at
    ) values (
      v_id, v_negocio_id, v_dispositivo_id, 'registrar', 'tesoreria',
      v_entidad_id, v_payload, coalesce((v_operacion->>'creadaAt')::timestamptz, now())
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
        'dispositivoId', v_dispositivo_id
      ));
      continue;
    end if;

    begin
      for v_item in select value from jsonb_array_elements(coalesce(v_payload->'cuentas', '[]'::jsonb))
      loop
        if nullif(v_item->>'id', '') is null or nullif(trim(v_item->>'nombre'), '') is null
           or v_item->>'tipo' not in ('efectivo', 'digital')
           or v_item->>'estado' not in ('activa', 'archivada') then
          raise exception 'CUENTA_TESORERIA_INVALIDA';
        end if;
        insert into public.cuentas_tesoreria (
          negocio_id, id, nombre, tipo, estado, entidad,
          creado_at, actualizado_at, actualizado_por_dispositivo_id
        ) values (
          v_negocio_id, v_item->>'id', v_item->>'nombre', v_item->>'tipo', v_item->>'estado', v_item,
          coalesce((v_item->>'createdAt')::timestamptz, now()),
          coalesce((v_item->>'updatedAt')::timestamptz, now()), v_dispositivo_id
        ) on conflict (negocio_id, id) do update set
          nombre = excluded.nombre, tipo = excluded.tipo, estado = excluded.estado,
          entidad = excluded.entidad, actualizado_at = excluded.actualizado_at,
          actualizado_por_dispositivo_id = excluded.actualizado_por_dispositivo_id;
      end loop;

      for v_item in select value from jsonb_array_elements(coalesce(v_payload->'movimientos', '[]'::jsonb))
      loop
        if nullif(v_item->>'id', '') is null or nullif(v_item->>'cuentaId', '') is null
           or v_item->>'tipo' not in ('saldo_inicial','cobro_venta','reposicion','gasto_puntual','aporte_externo','retiro','transferencia','ajuste_conteo','reversion')
           or v_item->>'direccion' not in ('entrada','salida')
           or coalesce((v_item->>'monto')::numeric, 0) <= 0 then
          raise exception 'MOVIMIENTO_TESORERIA_INVALIDO';
        end if;
        if v_item->>'direccion' = 'salida'
           and v_item->>'tipo' in ('reposicion', 'gasto_puntual', 'retiro', 'transferencia') then
          perform 1
          from public.cuentas_tesoreria c
          where c.negocio_id = v_negocio_id and c.id = v_item->>'cuentaId'
          for update;
          if coalesce((
             select sum(case when m.direccion = 'entrada' then m.monto else -m.monto end)
             from public.movimientos_tesoreria m
             where m.negocio_id = v_negocio_id and m.cuenta_id = v_item->>'cuentaId'
           ), 0) < (v_item->>'monto')::numeric then
            raise exception 'SALDO_TESORERIA_INSUFICIENTE';
          end if;
        end if;
        insert into public.movimientos_tesoreria (
          negocio_id, id, cuenta_id, tipo, direccion, monto, fecha_hora_real,
          fecha_jornada, referencia_tipo, referencia_id, grupo_id, entidad,
          creado_at, creado_por_dispositivo_id
        ) values (
          v_negocio_id, v_item->>'id', v_item->>'cuentaId', v_item->>'tipo',
          v_item->>'direccion', (v_item->>'monto')::numeric,
          (v_item->>'fechaHoraReal')::timestamptz, (v_item->>'fechaJornada')::date,
          nullif(v_item->>'referenciaTipo',''), nullif(v_item->>'referenciaId',''),
          nullif(v_item->>'grupoId',''), v_item,
          coalesce((v_item->>'createdAt')::timestamptz, now()), v_dispositivo_id
        ) on conflict (negocio_id, id) do nothing;
      end loop;

      for v_item in select value from jsonb_array_elements(coalesce(v_payload->'conteos', '[]'::jsonb))
      loop
        insert into public.conteos_caja (
          negocio_id, id, cuenta_id, fecha_hora_real, fecha_jornada,
          monto_esperado, monto_contado, diferencia, entidad,
          creado_at, creado_por_dispositivo_id
        ) values (
          v_negocio_id, v_item->>'id', v_item->>'cuentaId',
          (v_item->>'fechaHoraReal')::timestamptz, (v_item->>'fechaJornada')::date,
          (v_item->>'montoEsperado')::numeric, (v_item->>'montoContado')::numeric,
          (v_item->>'diferencia')::numeric, v_item,
          coalesce((v_item->>'createdAt')::timestamptz, now()), v_dispositivo_id
        ) on conflict (negocio_id, id) do nothing;
      end loop;

      v_cambios := jsonb_build_array(jsonb_build_object(
        'tipoEntidad', 'tesoreria', 'entidadId', v_entidad_id,
        'eliminada', false, 'entidad', jsonb_build_object(
          'cuentas', coalesce(v_payload->'cuentas', '[]'::jsonb),
          'movimientos', coalesce(v_payload->'movimientos', '[]'::jsonb),
          'conteos', coalesce(v_payload->'conteos', '[]'::jsonb)
        )
      ));
      v_resultado := jsonb_build_object('cambios', v_cambios);
      v_estado := 'aplicada';
      update public.operaciones_sincronizacion set
        estado = v_estado, aplicada_at = now(), resultado = v_resultado
      where negocio_id = v_negocio_id and id = v_id;
    exception when others then
      v_estado := 'error';
      v_codigo_error := sqlstate;
      v_detalle_error := sqlerrm;
      v_resultado := jsonb_build_object('cambios', '[]'::jsonb);
      update public.operaciones_sincronizacion set
        estado = v_estado, aplicada_at = now(), resultado = v_resultado,
        codigo_error = v_codigo_error, detalle_error = v_detalle_error
      where negocio_id = v_negocio_id and id = v_id;
    end;

    v_respuestas := v_respuestas || jsonb_build_array(jsonb_build_object(
      'operacionId', v_id, 'secuencia', v_secuencia, 'estado', v_estado,
      'cambios', coalesce(v_resultado->'cambios', '[]'::jsonb),
      'codigoError', v_codigo_error, 'detalleError', v_detalle_error,
      'dispositivoId', v_dispositivo_id
    ));
  end loop;
  return v_respuestas;
end;
$$;

revoke all on function public.aplicar_operaciones_tesoreria(jsonb) from public, anon, authenticated;
grant execute on function public.aplicar_operaciones_tesoreria(jsonb) to authenticated;

comment on table public.movimientos_tesoreria is
  'Libro operativo inmutable: las correcciones se registran como movimientos de reversión.';
