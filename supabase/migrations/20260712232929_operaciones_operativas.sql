-- Mora Vinería v0.2 — ventas, cobros, movimientos y conciliación de stock.
-- Los clientes no escriben tablas directamente: toda mutación pasa por RPC
-- idempotentes que validan el dispositivo y operan dentro de una transacción.

create table public.ventas_operativas (
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  id text not null check (char_length(id) between 8 and 160),
  entidad jsonb not null check (jsonb_typeof(entidad) = 'object'),
  fecha_jornada date not null,
  total numeric(14, 2) not null check (total >= 0),
  condicion_pago text not null check (condicion_pago in ('contado', 'fiado')),
  estado text not null check (estado in ('activa', 'anulada')),
  creado_por_dispositivo_id uuid not null references public.dispositivos(id),
  actualizado_por_dispositivo_id uuid not null references public.dispositivos(id),
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now(),
  primary key (negocio_id, id)
);

create table public.cobros_ventas (
  negocio_id uuid not null,
  id text not null check (char_length(id) between 8 and 160),
  venta_id text not null,
  entidad jsonb not null check (jsonb_typeof(entidad) = 'object'),
  fecha_jornada date not null,
  monto numeric(14, 2) not null check (monto > 0),
  estado text not null check (estado in ('activo', 'anulado')),
  creado_por_dispositivo_id uuid not null references public.dispositivos(id),
  actualizado_por_dispositivo_id uuid not null references public.dispositivos(id),
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now(),
  primary key (negocio_id, id),
  foreign key (negocio_id, venta_id)
    references public.ventas_operativas(negocio_id, id) on delete cascade
);

create table public.movimientos_operativos (
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  id text not null check (char_length(id) between 8 and 160),
  entidad jsonb not null check (jsonb_typeof(entidad) = 'object'),
  fecha_jornada date not null,
  tipo text not null check (tipo in ('reposicion', 'aporte_externo', 'gasto_puntual')),
  estado text not null check (estado in ('activo', 'anulado')),
  creado_por_dispositivo_id uuid not null references public.dispositivos(id),
  actualizado_por_dispositivo_id uuid not null references public.dispositivos(id),
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now(),
  primary key (negocio_id, id)
);

create table public.diferencias_stock (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  producto_id text not null,
  operacion_id text not null references public.operaciones_sincronizacion(id),
  origen_tipo text not null,
  origen_id text not null,
  unidades_faltantes integer not null check (unidades_faltantes > 0),
  detalle jsonb not null default '{}'::jsonb,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'resuelta')),
  creado_at timestamptz not null default now(),
  resuelta_at timestamptz,
  resuelta_por_dispositivo_id uuid references public.dispositivos(id),
  stock_contado integer check (stock_contado >= 0),
  nota_resolucion text,
  foreign key (negocio_id, producto_id)
    references public.productos_catalogo(negocio_id, id)
);

create index ventas_operativas_jornada_idx
  on public.ventas_operativas (negocio_id, fecha_jornada desc);
create index ventas_operativas_fiado_idx
  on public.ventas_operativas (negocio_id, condicion_pago, estado)
  where condicion_pago = 'fiado';
create index cobros_ventas_venta_idx
  on public.cobros_ventas (negocio_id, venta_id, estado);
create index cobros_ventas_jornada_idx
  on public.cobros_ventas (negocio_id, fecha_jornada desc);
create index movimientos_operativos_jornada_idx
  on public.movimientos_operativos (negocio_id, fecha_jornada desc);
create index diferencias_stock_pendientes_idx
  on public.diferencias_stock (negocio_id, estado, creado_at)
  where estado = 'pendiente';

alter table public.ventas_operativas enable row level security;
alter table public.cobros_ventas enable row level security;
alter table public.movimientos_operativos enable row level security;
alter table public.diferencias_stock enable row level security;

revoke all on public.ventas_operativas from public, anon, authenticated;
revoke all on public.cobros_ventas from public, anon, authenticated;
revoke all on public.movimientos_operativos from public, anon, authenticated;
revoke all on public.diferencias_stock from public, anon, authenticated;

create or replace function private.cambio_producto(p_negocio_id uuid, p_producto_id text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'tipoEntidad', 'producto', 'entidadId', p.id, 'version', p.version,
    'eliminada', p.eliminado_at is not null,
    'entidad', case when p.eliminado_at is not null then null else jsonb_build_object(
      'id', p.id, 'categoriaId', p.categoria_id, 'nombre', p.nombre,
      'precioVenta', p.precio_venta, 'costoCompra', p.costo_compra,
      'marca', p.marca, 'presentacion', p.presentacion,
      'stockActual', p.stock_actual, 'stockObjetivo', p.stock_objetivo,
      'estado', p.estado, 'observaciones', p.observaciones,
      'createdAt', p.creado_cliente_at, 'updatedAt', p.actualizado_cliente_at,
      'deletedAt', p.eliminado_cliente_at
    ) end
  )
  from public.productos_catalogo p
  where p.negocio_id = p_negocio_id and p.id = p_producto_id;
$$;

create or replace function private.cambio_venta(p_negocio_id uuid, p_venta_id text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'tipoEntidad', 'venta', 'entidadId', v.id, 'eliminada', false,
    'entidad', jsonb_build_object(
      'venta', v.entidad - 'detalles',
      'detalles', coalesce(v.entidad->'detalles', '[]'::jsonb),
      'cobros', coalesce((
        select jsonb_agg(c.entidad order by c.entidad->>'fechaHoraReal', c.id)
        from public.cobros_ventas c
        where c.negocio_id = v.negocio_id and c.venta_id = v.id
      ), '[]'::jsonb)
    )
  )
  from public.ventas_operativas v
  where v.negocio_id = p_negocio_id and v.id = p_venta_id;
$$;

create or replace function private.cambio_movimiento(p_negocio_id uuid, p_movimiento_id text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'tipoEntidad', 'movimiento', 'entidadId', m.id, 'eliminada', false,
    'entidad', jsonb_build_object(
      'movimiento', m.entidad - 'detalles',
      'detalles', coalesce(m.entidad->'detalles', '[]'::jsonb)
    )
  )
  from public.movimientos_operativos m
  where m.negocio_id = p_negocio_id and m.id = p_movimiento_id;
$$;

create or replace function private.cambio_diferencia(p_diferencia_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'tipoEntidad', 'diferencia_stock', 'entidadId', d.id::text, 'eliminada', false,
    'entidad', jsonb_build_object(
      'id', d.id, 'productoId', d.producto_id, 'operacionId', d.operacion_id,
      'origenTipo', d.origen_tipo, 'origenId', d.origen_id,
      'unidadesFaltantes', d.unidades_faltantes, 'detalle', d.detalle,
      'estado', d.estado, 'creadoAt', d.creado_at, 'resueltaAt', d.resuelta_at,
      'stockContado', d.stock_contado, 'notaResolucion', d.nota_resolucion
    )
  )
  from public.diferencias_stock d where d.id = p_diferencia_id;
$$;

create or replace function private.crear_conflicto_operativo(
  p_negocio_id uuid,
  p_operacion_id text,
  p_tipo text,
  p_tipo_entidad text,
  p_entidad_id text,
  p_detalle jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  insert into public.conflictos_sincronizacion (
    negocio_id, operacion_id, tipo, tipo_entidad, entidad_id, detalle
  ) values (
    p_negocio_id, p_operacion_id, p_tipo, p_tipo_entidad, p_entidad_id, p_detalle
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.aplicar_operaciones_operativas(p_operaciones jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_negocio_id uuid := private.negocio_actual_id();
  v_dispositivo_id uuid := private.dispositivo_actual_id();
  v_operacion jsonb;
  v_id text;
  v_tipo text;
  v_tipo_entidad text;
  v_entidad_id text;
  v_payload jsonb;
  v_entidad jsonb;
  v_detalles jsonb;
  v_cobros jsonb;
  v_detalle jsonb;
  v_cobro jsonb;
  v_secuencia bigint;
  v_estado text;
  v_resultado jsonb;
  v_cambios jsonb;
  v_insertada integer;
  v_codigo_error text;
  v_detalle_error text;
  v_conflicto_id uuid;
  v_diferencia_id uuid;
  v_producto_id text;
  v_cantidad integer;
  v_stock integer;
  v_faltante integer;
  v_total numeric;
  v_total_detalles numeric;
  v_total_cobrado numeric;
  v_movimiento public.movimientos_operativos%rowtype;
  v_venta public.ventas_operativas%rowtype;
  v_respuestas jsonb := '[]'::jsonb;
begin
  if v_negocio_id is null or v_dispositivo_id is null or not private.puede_operar_actual() then
    raise exception 'El dispositivo no está autorizado para operar.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_operaciones) <> 'array' or jsonb_array_length(p_operaciones) > 25 then
    raise exception 'El lote operativo no es válido.';
  end if;

  for v_operacion in select value from jsonb_array_elements(p_operaciones)
  loop
    v_id := v_operacion->>'id';
    v_tipo := v_operacion->>'tipoOperacion';
    v_tipo_entidad := v_operacion->>'tipoEntidad';
    v_entidad_id := v_operacion->>'entidadId';
    v_payload := v_operacion->'payload';
    v_cambios := '[]'::jsonb;
    v_resultado := null;
    v_codigo_error := null;
    v_detalle_error := null;
    v_conflicto_id := null;

    if v_id is null or char_length(v_id) not between 8 and 160
       or v_entidad_id is null or char_length(v_entidad_id) not between 8 and 160 then
      raise exception 'La operación contiene identificadores inválidos.';
    end if;

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
        'conflictoId', v_resultado->>'conflictoId', 'dispositivoId', v_dispositivo_id
      ));
      continue;
    end if;

    begin
      if v_tipo_entidad = 'venta' and v_tipo = 'registrar' then
        v_entidad := v_payload->'venta';
        v_detalles := coalesce(v_payload->'detalles', '[]'::jsonb);
        v_cobros := coalesce(v_payload->'cobros', '[]'::jsonb);
        if jsonb_array_length(v_detalles) = 0 then raise exception 'VENTA_SIN_DETALLES'; end if;
        v_total := (v_entidad->>'total')::numeric;
        select coalesce(sum((d->>'subtotal')::numeric), 0)
        into v_total_detalles from jsonb_array_elements(v_detalles) d;
        if v_total <> v_total_detalles then raise exception 'TOTAL_VENTA_INVALIDO'; end if;

        insert into public.ventas_operativas (
          negocio_id, id, entidad, fecha_jornada, total, condicion_pago, estado,
          creado_por_dispositivo_id, actualizado_por_dispositivo_id
        ) values (
          v_negocio_id, v_entidad_id, v_entidad || jsonb_build_object('detalles', v_detalles),
          (v_entidad->>'fechaJornada')::date, v_total,
          coalesce(v_entidad->>'condicionPago', 'contado'), v_entidad->>'estado',
          v_dispositivo_id, v_dispositivo_id
        );

        for v_cobro in select value from jsonb_array_elements(v_cobros)
        loop
          insert into public.cobros_ventas (
            negocio_id, id, venta_id, entidad, fecha_jornada, monto, estado,
            creado_por_dispositivo_id, actualizado_por_dispositivo_id
          ) values (
            v_negocio_id, v_cobro->>'id', v_entidad_id, v_cobro,
            (v_cobro->>'fechaJornada')::date, (v_cobro->>'monto')::numeric,
            v_cobro->>'estado', v_dispositivo_id, v_dispositivo_id
          );
        end loop;

        for v_detalle in select value from jsonb_array_elements(v_detalles)
        loop
          v_producto_id := v_detalle->>'productoId';
          v_cantidad := (v_detalle->>'cantidad')::integer;
          select stock_actual into v_stock
          from public.productos_catalogo
          where negocio_id = v_negocio_id and id = v_producto_id
            and eliminado_at is null and estado = 'activo'
          for update;
          if not found then raise exception 'PRODUCTO_NO_DISPONIBLE'; end if;
          v_faltante := greatest(v_cantidad - v_stock, 0);
          update public.productos_catalogo set
            stock_actual = greatest(stock_actual - v_cantidad, 0),
            version = version + 1, actualizado_cliente_at = now(),
            actualizado_por_dispositivo_id = v_dispositivo_id
          where negocio_id = v_negocio_id and id = v_producto_id;
          v_cambios := v_cambios || jsonb_build_array(private.cambio_producto(v_negocio_id, v_producto_id));
          if v_faltante > 0 then
            insert into public.diferencias_stock (
              negocio_id, producto_id, operacion_id, origen_tipo, origen_id,
              unidades_faltantes, detalle
            ) values (
              v_negocio_id, v_producto_id, v_id, 'venta', v_entidad_id,
              v_faltante, jsonb_build_object('stockRemotoAntes', v_stock, 'cantidadVendida', v_cantidad)
            ) returning id into v_diferencia_id;
            v_cambios := v_cambios || jsonb_build_array(private.cambio_diferencia(v_diferencia_id));
            if v_conflicto_id is null then
              v_conflicto_id := private.crear_conflicto_operativo(
                v_negocio_id, v_id, 'STOCK_FALTANTE', 'venta', v_entidad_id,
                jsonb_build_object('mensaje', 'La venta superó el stock compartido y necesita conciliación.')
              );
            end if;
          end if;
        end loop;
        v_cambios := v_cambios || jsonb_build_array(private.cambio_venta(v_negocio_id, v_entidad_id));

      elsif v_tipo_entidad = 'venta' and v_tipo = 'anular' then
        select * into v_venta from public.ventas_operativas
        where negocio_id = v_negocio_id and id = v_entidad_id for update;
        if not found then raise exception 'VENTA_NO_ENCONTRADA'; end if;
        if v_venta.estado <> 'anulada' then
          for v_detalle in select value from jsonb_array_elements(v_venta.entidad->'detalles')
          loop
            v_producto_id := v_detalle->>'productoId';
            v_cantidad := (v_detalle->>'cantidad')::integer;
            update public.productos_catalogo set
              stock_actual = stock_actual + v_cantidad, version = version + 1,
              actualizado_cliente_at = now(), actualizado_por_dispositivo_id = v_dispositivo_id
            where negocio_id = v_negocio_id and id = v_producto_id;
            if not found then raise exception 'PRODUCTO_NO_DISPONIBLE'; end if;
            v_cambios := v_cambios || jsonb_build_array(private.cambio_producto(v_negocio_id, v_producto_id));
          end loop;
          v_entidad := v_payload->'venta';
          update public.ventas_operativas set
            entidad = v_entidad || jsonb_build_object('detalles', v_venta.entidad->'detalles'),
            estado = 'anulada', actualizado_at = now(),
            actualizado_por_dispositivo_id = v_dispositivo_id
          where negocio_id = v_negocio_id and id = v_entidad_id;
          update public.cobros_ventas set
            entidad = entidad || jsonb_build_object(
              'estado', 'anulado', 'anuladoAt', v_entidad->>'anuladaAt',
              'motivoAnulacion', concat('Venta anulada: ', v_entidad->>'motivoAnulacion'),
              'updatedAt', v_entidad->>'updatedAt'
            ), estado = 'anulado', actualizado_at = now(),
            actualizado_por_dispositivo_id = v_dispositivo_id
          where negocio_id = v_negocio_id and venta_id = v_entidad_id and estado = 'activo';
        end if;
        v_cambios := v_cambios || jsonb_build_array(private.cambio_venta(v_negocio_id, v_entidad_id));

      elsif v_tipo_entidad = 'cobro_venta' and v_tipo = 'registrar' then
        v_cobro := v_payload->'cobro';
        select * into v_venta from public.ventas_operativas
        where negocio_id = v_negocio_id and id = v_cobro->>'ventaId' for update;
        if not found or v_venta.estado <> 'activa' then raise exception 'VENTA_NO_DISPONIBLE'; end if;
        insert into public.cobros_ventas (
          negocio_id, id, venta_id, entidad, fecha_jornada, monto, estado,
          creado_por_dispositivo_id, actualizado_por_dispositivo_id
        ) values (
          v_negocio_id, v_entidad_id, v_cobro->>'ventaId', v_cobro,
          (v_cobro->>'fechaJornada')::date, (v_cobro->>'monto')::numeric,
          v_cobro->>'estado', v_dispositivo_id, v_dispositivo_id
        );
        select coalesce(sum(monto), 0) into v_total_cobrado
        from public.cobros_ventas
        where negocio_id = v_negocio_id and venta_id = v_cobro->>'ventaId' and estado = 'activo';
        if v_total_cobrado > v_venta.total then
          v_conflicto_id := private.crear_conflicto_operativo(
            v_negocio_id, v_id, 'COBRO_EXCEDENTE', 'venta', v_cobro->>'ventaId',
            jsonb_build_object('totalVenta', v_venta.total, 'totalCobrado', v_total_cobrado,
              'mensaje', 'Los cobros superan el total de la venta.')
          );
        end if;
        v_cambios := jsonb_build_array(private.cambio_venta(v_negocio_id, v_cobro->>'ventaId'));

      elsif v_tipo_entidad = 'cobro_venta' and v_tipo = 'anular' then
        v_cobro := v_payload->'cobro';
        update public.cobros_ventas set
          entidad = v_cobro, estado = 'anulado', actualizado_at = now(),
          actualizado_por_dispositivo_id = v_dispositivo_id
        where negocio_id = v_negocio_id and id = v_entidad_id and estado = 'activo'
        returning venta_id into v_producto_id;
        if not found then raise exception 'COBRO_NO_DISPONIBLE'; end if;
        select total into v_total from public.ventas_operativas
        where negocio_id = v_negocio_id and id = v_producto_id;
        select coalesce(sum(monto), 0) into v_total_cobrado from public.cobros_ventas
        where negocio_id = v_negocio_id and venta_id = v_producto_id and estado = 'activo';
        if v_total_cobrado <= v_total then
          update public.conflictos_sincronizacion set
            estado = 'resuelto', resuelto_at = now(), resuelto_por_dispositivo_id = v_dispositivo_id
          where negocio_id = v_negocio_id and tipo = 'COBRO_EXCEDENTE'
            and entidad_id = v_producto_id and estado = 'pendiente';
        end if;
        v_cambios := jsonb_build_array(private.cambio_venta(v_negocio_id, v_producto_id));

      elsif v_tipo_entidad = 'movimiento' and v_tipo = 'registrar' then
        v_entidad := v_payload->'movimiento';
        v_detalles := coalesce(v_payload->'detalles', '[]'::jsonb);
        insert into public.movimientos_operativos (
          negocio_id, id, entidad, fecha_jornada, tipo, estado,
          creado_por_dispositivo_id, actualizado_por_dispositivo_id
        ) values (
          v_negocio_id, v_entidad_id, v_entidad || jsonb_build_object('detalles', v_detalles),
          (v_entidad->>'fechaJornada')::date, v_entidad->>'tipo', v_entidad->>'estado',
          v_dispositivo_id, v_dispositivo_id
        );
        if v_entidad->>'tipo' = 'reposicion' then
          for v_detalle in select value from jsonb_array_elements(v_detalles)
          loop
            v_producto_id := v_detalle->>'productoId';
            v_cantidad := (v_detalle->>'cantidad')::integer;
            update public.productos_catalogo set
              stock_actual = stock_actual + v_cantidad, version = version + 1,
              actualizado_cliente_at = now(), actualizado_por_dispositivo_id = v_dispositivo_id
            where negocio_id = v_negocio_id and id = v_producto_id and eliminado_at is null;
            if not found then raise exception 'PRODUCTO_NO_DISPONIBLE'; end if;
            v_cambios := v_cambios || jsonb_build_array(private.cambio_producto(v_negocio_id, v_producto_id));
          end loop;
        end if;
        v_cambios := v_cambios || jsonb_build_array(private.cambio_movimiento(v_negocio_id, v_entidad_id));

      elsif v_tipo_entidad = 'movimiento' and v_tipo = 'anular' then
        select * into v_movimiento from public.movimientos_operativos
        where negocio_id = v_negocio_id and id = v_entidad_id for update;
        if not found then raise exception 'MOVIMIENTO_NO_ENCONTRADO'; end if;
        if v_movimiento.estado <> 'anulado' and v_movimiento.tipo = 'reposicion' then
          for v_detalle in select value from jsonb_array_elements(v_movimiento.entidad->'detalles')
          loop
            v_producto_id := v_detalle->>'productoId';
            v_cantidad := (v_detalle->>'cantidad')::integer;
            select stock_actual into v_stock from public.productos_catalogo
            where negocio_id = v_negocio_id and id = v_producto_id for update;
            if not found or v_stock < v_cantidad then raise exception 'ANULACION_REPOSICION_SIN_STOCK'; end if;
          end loop;
          for v_detalle in select value from jsonb_array_elements(v_movimiento.entidad->'detalles')
          loop
            v_producto_id := v_detalle->>'productoId';
            v_cantidad := (v_detalle->>'cantidad')::integer;
            update public.productos_catalogo set
              stock_actual = stock_actual - v_cantidad, version = version + 1,
              actualizado_cliente_at = now(), actualizado_por_dispositivo_id = v_dispositivo_id
            where negocio_id = v_negocio_id and id = v_producto_id;
            v_cambios := v_cambios || jsonb_build_array(private.cambio_producto(v_negocio_id, v_producto_id));
          end loop;
        end if;
        v_entidad := v_payload->'movimiento';
        update public.movimientos_operativos set
          entidad = v_entidad || jsonb_build_object('detalles', v_movimiento.entidad->'detalles'),
          estado = 'anulado', actualizado_at = now(),
          actualizado_por_dispositivo_id = v_dispositivo_id
        where negocio_id = v_negocio_id and id = v_entidad_id;
        v_cambios := v_cambios || jsonb_build_array(private.cambio_movimiento(v_negocio_id, v_entidad_id));

      elsif v_tipo_entidad = 'movimiento' and v_tipo = 'eliminar' then
        select * into v_movimiento from public.movimientos_operativos
        where negocio_id = v_negocio_id and id = v_entidad_id for update;
        if not found then
          v_cambios := jsonb_build_array(jsonb_build_object(
            'tipoEntidad', 'movimiento', 'entidadId', v_entidad_id,
            'eliminada', true, 'entidad', null
          ));
        else
          if v_movimiento.estado <> 'anulado' then raise exception 'MOVIMIENTO_NO_ANULADO'; end if;
          delete from public.movimientos_operativos
          where negocio_id = v_negocio_id and id = v_entidad_id;
          v_cambios := jsonb_build_array(jsonb_build_object(
            'tipoEntidad', 'movimiento', 'entidadId', v_entidad_id,
            'eliminada', true, 'entidad', null
          ));
        end if;
      else
        raise exception 'OPERACION_NO_ADMITIDA';
      end if;

      v_resultado := jsonb_build_object('cambios', v_cambios, 'conflictoId', v_conflicto_id);
      update public.operaciones_sincronizacion set
        estado = 'aplicada', aplicada_at = now(), resultado = v_resultado
      where id = v_id;
      v_estado := 'aplicada';
    exception when others then
      v_codigo_error := case when sqlerrm in (
        'ANULACION_REPOSICION_SIN_STOCK', 'PRODUCTO_NO_DISPONIBLE',
        'VENTA_NO_DISPONIBLE', 'COBRO_NO_DISPONIBLE', 'MOVIMIENTO_NO_ANULADO'
      ) then sqlerrm else 'OPERACION_INVALIDA' end;
      v_detalle_error := case v_codigo_error
        when 'ANULACION_REPOSICION_SIN_STOCK' then 'No se puede anular la reposición porque el stock compartido quedaría negativo.'
        when 'PRODUCTO_NO_DISPONIBLE' then 'Uno de los productos ya no está disponible.'
        when 'VENTA_NO_DISPONIBLE' then 'La venta ya no admite este cambio.'
        when 'COBRO_NO_DISPONIBLE' then 'El cobro ya no admite este cambio.'
        when 'MOVIMIENTO_NO_ANULADO' then 'Solo se puede eliminar un movimiento anulado.'
        else 'La operación no pudo validarse.'
      end;
      v_conflicto_id := private.crear_conflicto_operativo(
        v_negocio_id, v_id, v_codigo_error, v_tipo_entidad, v_entidad_id,
        jsonb_build_object('mensaje', v_detalle_error, 'payloadLocal', v_payload)
      );
      v_resultado := jsonb_build_object('cambios', '[]'::jsonb, 'conflictoId', v_conflicto_id);
      update public.operaciones_sincronizacion set
        estado = 'conflicto', aplicada_at = now(), codigo_error = v_codigo_error,
        detalle_error = v_detalle_error, resultado = v_resultado
      where id = v_id;
      v_estado := 'conflicto';
    end;

    v_respuestas := v_respuestas || jsonb_build_array(jsonb_build_object(
      'operacionId', v_id, 'secuencia', v_secuencia, 'estado', v_estado,
      'cambios', coalesce(v_resultado->'cambios', '[]'::jsonb),
      'codigoError', v_codigo_error, 'detalleError', v_detalle_error,
      'conflictoId', v_resultado->>'conflictoId', 'dispositivoId', v_dispositivo_id
    ));
  end loop;

  update public.dispositivos set ultima_actividad_at = now(), actualizado_at = now()
  where id = v_dispositivo_id;
  return v_respuestas;
end;
$$;

create or replace function public.listar_diferencias_stock()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.es_principal_actual() then
    raise exception 'Solo el celular principal puede revisar diferencias de stock.' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(private.cambio_diferencia(d.id)->'entidad' order by d.creado_at)
    from public.diferencias_stock d
    where d.negocio_id = private.negocio_actual_id() and d.estado = 'pendiente'
  ), '[]'::jsonb);
end;
$$;

create or replace function public.resolver_diferencia_stock(
  p_diferencia_id uuid,
  p_stock_contado integer,
  p_nota text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_negocio_id uuid := private.negocio_actual_id();
  v_dispositivo_id uuid := private.dispositivo_actual_id();
  v_diferencia public.diferencias_stock%rowtype;
  v_operacion_id text := concat('conciliacion-', gen_random_uuid());
  v_cambios jsonb;
  v_secuencia bigint;
begin
  if not private.es_principal_actual() then
    raise exception 'Solo el celular principal puede conciliar stock.' using errcode = '42501';
  end if;
  if p_stock_contado < 0 then raise exception 'El stock contado no puede ser negativo.'; end if;
  select * into v_diferencia from public.diferencias_stock
  where id = p_diferencia_id and negocio_id = v_negocio_id and estado = 'pendiente'
  for update;
  if not found then raise exception 'La diferencia ya no está pendiente.'; end if;

  update public.productos_catalogo set
    stock_actual = p_stock_contado, version = version + 1,
    actualizado_cliente_at = now(), actualizado_por_dispositivo_id = v_dispositivo_id
  where negocio_id = v_negocio_id and id = v_diferencia.producto_id;
  update public.diferencias_stock set
    estado = 'resuelta', resuelta_at = now(), resuelta_por_dispositivo_id = v_dispositivo_id,
    stock_contado = p_stock_contado, nota_resolucion = nullif(trim(p_nota), '')
  where id = p_diferencia_id;
  update public.conflictos_sincronizacion set
    estado = 'resuelto', resuelto_at = now(), resuelto_por_dispositivo_id = v_dispositivo_id
  where negocio_id = v_negocio_id and operacion_id = v_diferencia.operacion_id
    and tipo = 'STOCK_FALTANTE' and estado = 'pendiente';

  v_cambios := jsonb_build_array(
    private.cambio_producto(v_negocio_id, v_diferencia.producto_id),
    private.cambio_diferencia(p_diferencia_id)
  );
  insert into public.operaciones_sincronizacion (
    id, negocio_id, dispositivo_id, tipo_operacion, tipo_entidad,
    entidad_id, payload, estado, creada_cliente_at, aplicada_at, resultado
  ) values (
    v_operacion_id, v_negocio_id, v_dispositivo_id, 'conciliar', 'diferencia_stock',
    p_diferencia_id::text, jsonb_build_object('stockContado', p_stock_contado, 'nota', p_nota),
    'aplicada', now(), now(), jsonb_build_object('cambios', v_cambios)
  ) returning secuencia into v_secuencia;
  return jsonb_build_object('operacionId', v_operacion_id, 'secuencia', v_secuencia,
    'estado', 'aplicada', 'cambios', v_cambios);
end;
$$;

create or replace function public.resolver_conflicto_operativo(
  p_conflicto_id uuid
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
  v_origen public.operaciones_sincronizacion%rowtype;
  v_operacion_id text := 'resolucion-operativa-' || p_conflicto_id::text;
  v_venta_id text;
  v_detalle jsonb;
  v_cambio jsonb;
  v_cambios jsonb := '[]'::jsonb;
  v_secuencia bigint;
begin
  if not private.es_principal_actual() then
    raise exception 'Solo el celular principal puede resolver este conflicto.' using errcode = '42501';
  end if;
  select * into v_conflicto from public.conflictos_sincronizacion
  where id = p_conflicto_id and negocio_id = v_negocio_id and estado = 'pendiente'
  for update;
  if not found then raise exception 'El conflicto ya no está pendiente.'; end if;
  if v_conflicto.tipo in ('STOCK_FALTANTE', 'COBRO_EXCEDENTE') then
    raise exception 'Este conflicto debe resolverse desde su conciliación específica.';
  end if;

  select * into v_origen from public.operaciones_sincronizacion
  where negocio_id = v_negocio_id and id = v_conflicto.operacion_id;
  if not found then raise exception 'No se encontró la operación original.'; end if;

  if v_conflicto.tipo_entidad = 'venta' then
    v_cambio := private.cambio_venta(v_negocio_id, v_conflicto.entidad_id);
    if v_cambio is not null then v_cambios := v_cambios || jsonb_build_array(v_cambio); end if;
  elsif v_conflicto.tipo_entidad = 'cobro_venta' then
    v_venta_id := v_origen.payload->'cobro'->>'ventaId';
    v_cambio := private.cambio_venta(v_negocio_id, v_venta_id);
    if v_cambio is not null then v_cambios := v_cambios || jsonb_build_array(v_cambio); end if;
  elsif v_conflicto.tipo_entidad = 'movimiento' then
    v_cambio := private.cambio_movimiento(v_negocio_id, v_conflicto.entidad_id);
    if v_cambio is null then
      v_cambio := jsonb_build_object(
        'tipoEntidad', 'movimiento', 'entidadId', v_conflicto.entidad_id,
        'eliminada', true, 'entidad', null
      );
    end if;
    v_cambios := v_cambios || jsonb_build_array(v_cambio);
  end if;

  for v_detalle in select value
    from jsonb_array_elements(coalesce(v_origen.payload->'detalles', '[]'::jsonb))
  loop
    v_cambio := private.cambio_producto(v_negocio_id, v_detalle->>'productoId');
    if v_cambio is not null then v_cambios := v_cambios || jsonb_build_array(v_cambio); end if;
  end loop;

  update public.conflictos_sincronizacion set
    estado = 'resuelto', resuelto_at = now(), resuelto_por_dispositivo_id = v_dispositivo_id
  where id = p_conflicto_id;
  insert into public.operaciones_sincronizacion (
    id, negocio_id, dispositivo_id, tipo_operacion, tipo_entidad,
    entidad_id, payload, estado, creada_cliente_at, aplicada_at, resultado
  ) values (
    v_operacion_id, v_negocio_id, v_dispositivo_id, 'resolver_remoto',
    v_conflicto.tipo_entidad, v_conflicto.entidad_id,
    jsonb_build_object('conflictoId', p_conflicto_id), 'aplicada', now(), now(),
    jsonb_build_object('cambios', v_cambios, 'conflictoResueltoId', p_conflicto_id)
  ) on conflict (id) do update set id = excluded.id
  returning secuencia into v_secuencia;

  return jsonb_build_object(
    'operacionId', v_operacion_id, 'secuencia', v_secuencia, 'estado', 'aplicada',
    'cambios', v_cambios, 'conflictoResueltoId', p_conflicto_id,
    'dispositivoId', v_dispositivo_id
  );
end;
$$;

revoke execute on function private.cambio_producto(uuid, text) from public, anon, authenticated;
revoke execute on function private.cambio_venta(uuid, text) from public, anon, authenticated;
revoke execute on function private.cambio_movimiento(uuid, text) from public, anon, authenticated;
revoke execute on function private.cambio_diferencia(uuid) from public, anon, authenticated;
revoke execute on function private.crear_conflicto_operativo(uuid, text, text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.aplicar_operaciones_operativas(jsonb) from public, anon;
revoke execute on function public.listar_diferencias_stock() from public, anon;
revoke execute on function public.resolver_diferencia_stock(uuid, integer, text) from public, anon;
revoke execute on function public.resolver_conflicto_operativo(uuid) from public, anon;
grant execute on function public.aplicar_operaciones_operativas(jsonb) to authenticated;
grant execute on function public.listar_diferencias_stock() to authenticated;
grant execute on function public.resolver_diferencia_stock(uuid, integer, text) to authenticated;
grant execute on function public.resolver_conflicto_operativo(uuid) to authenticated;
