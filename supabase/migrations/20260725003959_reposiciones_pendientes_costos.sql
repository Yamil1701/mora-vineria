alter table public.movimientos_operativos
  drop constraint if exists movimientos_operativos_estado_check;

alter table public.movimientos_operativos
  add constraint movimientos_operativos_estado_check
  check (estado in ('pendiente', 'activo', 'anulado'));

create or replace function public.aplicar_reposiciones_pendientes(p_operaciones jsonb)
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
  v_entidad_id text;
  v_payload jsonb;
  v_entidad jsonb;
  v_detalles jsonb;
  v_detalle jsonb;
  v_movimiento public.movimientos_operativos%rowtype;
  v_secuencia bigint;
  v_estado text;
  v_resultado jsonb;
  v_cambios jsonb;
  v_insertada integer;
  v_codigo_error text;
  v_detalle_error text;
  v_conflicto_id uuid;
  v_producto_id text;
  v_cantidad integer;
  v_stock integer;
  v_total numeric;
  v_total_detalles numeric;
  v_respuestas jsonb := '[]'::jsonb;
begin
  if v_negocio_id is null or v_dispositivo_id is null
     or not private.puede_operar_actual() then
    raise exception 'El dispositivo no está autorizado para operar.'
      using errcode = '42501';
  end if;
  if jsonb_typeof(p_operaciones) <> 'array'
     or jsonb_array_length(p_operaciones) > 25 then
    raise exception 'El lote de reposiciones no es válido.';
  end if;

  for v_operacion in select value from jsonb_array_elements(p_operaciones)
  loop
    v_id := v_operacion->>'id';
    v_tipo := v_operacion->>'tipoOperacion';
    v_entidad_id := v_operacion->>'entidadId';
    v_payload := v_operacion->'payload';
    v_entidad := v_payload->'movimiento';
    v_detalles := coalesce(v_payload->'detalles', '[]'::jsonb);
    v_cambios := '[]'::jsonb;
    v_resultado := null;
    v_codigo_error := null;
    v_detalle_error := null;
    v_conflicto_id := null;

    if v_id is null or char_length(v_id) not between 8 and 160
       or v_entidad_id is null or char_length(v_entidad_id) not between 8 and 160
       or v_operacion->>'tipoEntidad' <> 'movimiento'
       or v_entidad->>'tipo' <> 'reposicion' then
      raise exception 'La operación de reposición es inválida.';
    end if;

    insert into public.operaciones_sincronizacion (
      id, negocio_id, dispositivo_id, tipo_operacion, tipo_entidad,
      entidad_id, payload, creada_cliente_at
    ) values (
      v_id, v_negocio_id, v_dispositivo_id, v_tipo, 'movimiento',
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
        'conflictoId', v_resultado->>'conflictoId',
        'dispositivoId', v_dispositivo_id
      ));
      continue;
    end if;

    begin
      if v_tipo in ('registrar', 'actualizar') then
        if jsonb_array_length(v_detalles) = 0 then
          raise exception 'REPOSICION_SIN_DETALLES';
        end if;
        v_total := (v_entidad->>'monto')::numeric;
        select coalesce(sum((d->>'subtotal')::numeric), 0)
        into v_total_detalles from jsonb_array_elements(v_detalles) d;
        if abs(v_total - v_total_detalles) > 0.01 then
          raise exception 'TOTAL_REPOSICION_INVALIDO';
        end if;
        if v_entidad->>'estado' <> 'pendiente' then
          raise exception 'ESTADO_REPOSICION_INVALIDO';
        end if;

        if v_tipo = 'registrar' then
          insert into public.movimientos_operativos (
            negocio_id, id, entidad, fecha_jornada, tipo, estado,
            creado_por_dispositivo_id, actualizado_por_dispositivo_id
          ) values (
            v_negocio_id, v_entidad_id,
            v_entidad || jsonb_build_object('detalles', v_detalles),
            (v_entidad->>'fechaJornada')::date, 'reposicion', 'pendiente',
            v_dispositivo_id, v_dispositivo_id
          );
        else
          select * into v_movimiento
          from public.movimientos_operativos
          where negocio_id = v_negocio_id and id = v_entidad_id
          for update;
          if not found then raise exception 'MOVIMIENTO_NO_ENCONTRADO'; end if;
          if v_movimiento.estado <> 'pendiente' then
            raise exception 'REPOSICION_NO_PENDIENTE';
          end if;
          update public.movimientos_operativos set
            entidad = v_entidad || jsonb_build_object('detalles', v_detalles),
            fecha_jornada = (v_entidad->>'fechaJornada')::date,
            estado = 'pendiente', actualizado_at = now(),
            actualizado_por_dispositivo_id = v_dispositivo_id
          where negocio_id = v_negocio_id and id = v_entidad_id;
        end if;
        v_cambios := jsonb_build_array(
          private.cambio_movimiento(v_negocio_id, v_entidad_id)
        );

      elsif v_tipo = 'confirmar' then
        select * into v_movimiento
        from public.movimientos_operativos
        where negocio_id = v_negocio_id and id = v_entidad_id
        for update;
        if not found then raise exception 'MOVIMIENTO_NO_ENCONTRADO'; end if;
        if v_movimiento.estado <> 'pendiente' then
          raise exception 'REPOSICION_NO_PENDIENTE';
        end if;
        v_detalles := coalesce(v_movimiento.entidad->'detalles', '[]'::jsonb);
        if jsonb_array_length(v_detalles) = 0 then
          raise exception 'REPOSICION_SIN_DETALLES';
        end if;

        for v_detalle in select value from jsonb_array_elements(v_detalles)
        loop
          v_producto_id := v_detalle->>'productoId';
          v_cantidad := (v_detalle->>'cantidad')::integer;
          update public.productos_catalogo set
            stock_actual = stock_actual + v_cantidad,
            version = version + 1,
            actualizado_cliente_at = now(),
            actualizado_por_dispositivo_id = v_dispositivo_id
          where negocio_id = v_negocio_id and id = v_producto_id
            and eliminado_at is null and estado = 'activo';
          if not found then raise exception 'PRODUCTO_NO_DISPONIBLE'; end if;
          v_cambios := v_cambios || jsonb_build_array(
            private.cambio_producto(v_negocio_id, v_producto_id)
          );
        end loop;
        update public.movimientos_operativos set
          entidad = v_entidad || jsonb_build_object('detalles', v_detalles),
          fecha_jornada = (v_entidad->>'fechaJornada')::date,
          estado = 'activo', actualizado_at = now(),
          actualizado_por_dispositivo_id = v_dispositivo_id
        where negocio_id = v_negocio_id and id = v_entidad_id;
        v_cambios := v_cambios || jsonb_build_array(
          private.cambio_movimiento(v_negocio_id, v_entidad_id)
        );

      elsif v_tipo = 'anular' then
        select * into v_movimiento
        from public.movimientos_operativos
        where negocio_id = v_negocio_id and id = v_entidad_id
        for update;
        if not found then raise exception 'MOVIMIENTO_NO_ENCONTRADO'; end if;
        if v_movimiento.estado = 'anulado' then
          raise exception 'REPOSICION_YA_ANULADA';
        end if;
        v_detalles := coalesce(v_movimiento.entidad->'detalles', '[]'::jsonb);
        if v_movimiento.estado = 'activo' then
          for v_detalle in select value from jsonb_array_elements(v_detalles)
          loop
            v_producto_id := v_detalle->>'productoId';
            v_cantidad := (v_detalle->>'cantidad')::integer;
            select stock_actual into v_stock
            from public.productos_catalogo
            where negocio_id = v_negocio_id and id = v_producto_id
            for update;
            if not found or v_stock < v_cantidad then
              raise exception 'ANULACION_REPOSICION_SIN_STOCK';
            end if;
          end loop;
          for v_detalle in select value from jsonb_array_elements(v_detalles)
          loop
            v_producto_id := v_detalle->>'productoId';
            v_cantidad := (v_detalle->>'cantidad')::integer;
            update public.productos_catalogo set
              stock_actual = stock_actual - v_cantidad,
              version = version + 1,
              actualizado_cliente_at = now(),
              actualizado_por_dispositivo_id = v_dispositivo_id
            where negocio_id = v_negocio_id and id = v_producto_id;
            v_cambios := v_cambios || jsonb_build_array(
              private.cambio_producto(v_negocio_id, v_producto_id)
            );
          end loop;
        end if;
        update public.movimientos_operativos set
          entidad = v_entidad || jsonb_build_object('detalles', v_detalles),
          estado = 'anulado', actualizado_at = now(),
          actualizado_por_dispositivo_id = v_dispositivo_id
        where negocio_id = v_negocio_id and id = v_entidad_id;
        v_cambios := v_cambios || jsonb_build_array(
          private.cambio_movimiento(v_negocio_id, v_entidad_id)
        );

      elsif v_tipo = 'eliminar' then
        select * into v_movimiento
        from public.movimientos_operativos
        where negocio_id = v_negocio_id and id = v_entidad_id
        for update;
        if found and v_movimiento.estado <> 'anulado' then
          raise exception 'MOVIMIENTO_NO_ANULADO';
        end if;
        delete from public.movimientos_operativos
        where negocio_id = v_negocio_id and id = v_entidad_id;
        v_cambios := jsonb_build_array(jsonb_build_object(
          'tipoEntidad', 'movimiento', 'entidadId', v_entidad_id,
          'eliminada', true, 'entidad', null
        ));
      else
        raise exception 'OPERACION_NO_ADMITIDA';
      end if;

      v_resultado := jsonb_build_object(
        'cambios', v_cambios, 'conflictoId', v_conflicto_id
      );
      update public.operaciones_sincronizacion set
        estado = 'aplicada', aplicada_at = now(), resultado = v_resultado
      where id = v_id;
      v_estado := 'aplicada';
    exception when others then
      v_codigo_error := case when sqlerrm in (
        'ANULACION_REPOSICION_SIN_STOCK', 'PRODUCTO_NO_DISPONIBLE',
        'MOVIMIENTO_NO_ANULADO', 'MOVIMIENTO_NO_ENCONTRADO',
        'REPOSICION_NO_PENDIENTE', 'REPOSICION_YA_ANULADA'
      ) then sqlerrm else 'OPERACION_INVALIDA' end;
      v_detalle_error := case v_codigo_error
        when 'ANULACION_REPOSICION_SIN_STOCK' then
          'No se puede anular la reposición porque el stock compartido quedaría negativo.'
        when 'PRODUCTO_NO_DISPONIBLE' then
          'Uno de los productos ya no está disponible.'
        when 'MOVIMIENTO_NO_ANULADO' then
          'Solo se puede eliminar un movimiento anulado.'
        when 'MOVIMIENTO_NO_ENCONTRADO' then
          'La reposición no existe en el inventario compartido.'
        when 'REPOSICION_NO_PENDIENTE' then
          'La reposición ya no está pendiente.'
        when 'REPOSICION_YA_ANULADA' then
          'La reposición ya está anulada.'
        else 'La operación no pudo validarse.'
      end;
      v_conflicto_id := private.crear_conflicto_operativo(
        v_negocio_id, v_id, v_codigo_error, 'movimiento', v_entidad_id,
        jsonb_build_object('mensaje', v_detalle_error, 'payloadLocal', v_payload)
      );
      v_resultado := jsonb_build_object(
        'cambios', '[]'::jsonb, 'conflictoId', v_conflicto_id
      );
      update public.operaciones_sincronizacion set
        estado = 'conflicto', aplicada_at = now(),
        codigo_error = v_codigo_error, detalle_error = v_detalle_error,
        resultado = v_resultado
      where id = v_id;
      v_estado := 'conflicto';
    end;

    v_respuestas := v_respuestas || jsonb_build_array(jsonb_build_object(
      'operacionId', v_id, 'secuencia', v_secuencia, 'estado', v_estado,
      'cambios', coalesce(v_resultado->'cambios', '[]'::jsonb),
      'codigoError', v_codigo_error, 'detalleError', v_detalle_error,
      'conflictoId', v_resultado->>'conflictoId',
      'dispositivoId', v_dispositivo_id
    ));
  end loop;

  update public.dispositivos
  set ultima_actividad_at = now(), actualizado_at = now()
  where id = v_dispositivo_id;
  return v_respuestas;
end;
$$;

revoke execute on function public.aplicar_reposiciones_pendientes(jsonb)
  from public, anon;
grant execute on function public.aplicar_reposiciones_pendientes(jsonb)
  to authenticated;
