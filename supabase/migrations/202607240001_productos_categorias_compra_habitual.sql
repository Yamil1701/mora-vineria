-- Mora Vinería — compra habitual de productos y catálogo compatible.
-- Mantiene "unidad" como valor seguro para productos existentes y clientes anteriores.

alter table public.productos_catalogo
  add column if not exists modo_compra_habitual text not null default 'unidad',
  add column if not exists nombre_pack text,
  add column if not exists unidades_por_pack integer;

alter table public.productos_catalogo
  drop constraint if exists productos_catalogo_modo_compra_habitual_check,
  add constraint productos_catalogo_modo_compra_habitual_check
    check (modo_compra_habitual in ('unidad', 'pack')),
  drop constraint if exists productos_catalogo_pack_completo_check,
  add constraint productos_catalogo_pack_completo_check
    check (
      modo_compra_habitual = 'unidad'
      or (
        char_length(trim(nombre_pack)) between 1 and 40
        and unidades_por_pack > 0
      )
    );

create or replace function private.completar_preferencia_compra_catalogo()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_item jsonb;
  v_entidad jsonb;
  v_modo text;
  v_nombre_pack text;
  v_unidades_por_pack integer;
begin
  if new.estado <> 'aplicada' then
    return new;
  end if;

  if new.tipo_operacion = 'inicializar' and new.tipo_entidad = 'catalogo' then
    for v_item in
      select value from jsonb_array_elements(
        coalesce(new.payload->'productos', '[]'::jsonb)
      )
    loop
      if not (v_item ? 'modoCompraHabitual') then
        continue;
      end if;
      v_modo := v_item->>'modoCompraHabitual';
      v_nombre_pack := nullif(trim(v_item->>'nombrePack'), '');
      v_unidades_por_pack := nullif(v_item->>'unidadesPorPack', '')::integer;
      if v_modo = 'pack' and (v_nombre_pack is null or v_unidades_por_pack is null or v_unidades_por_pack <= 0) then
        raise exception 'PREFERENCIA_COMPRA_INVALIDA';
      end if;
      update public.productos_catalogo
      set
        modo_compra_habitual = case when v_modo = 'pack' then 'pack' else 'unidad' end,
        nombre_pack = case when v_modo = 'pack' then v_nombre_pack else null end,
        unidades_por_pack = case when v_modo = 'pack' then v_unidades_por_pack else null end
      where negocio_id = new.negocio_id and id = v_item->>'id';
    end loop;
  elsif new.tipo_entidad = 'producto' and new.tipo_operacion = 'upsert' then
    v_entidad := new.payload->'entidad';
    if not exists (
      select 1
      from public.categorias_catalogo c
      where c.negocio_id = new.negocio_id
        and c.id = v_entidad->>'categoriaId'
        and c.activa
        and c.eliminado_at is null
    ) then
      raise exception 'CATEGORIA_NO_DISPONIBLE';
    end if;
    if v_entidad ? 'modoCompraHabitual' then
      v_modo := v_entidad->>'modoCompraHabitual';
      v_nombre_pack := nullif(trim(v_entidad->>'nombrePack'), '');
      v_unidades_por_pack := nullif(v_entidad->>'unidadesPorPack', '')::integer;
      if v_modo = 'pack' and (v_nombre_pack is null or v_unidades_por_pack is null or v_unidades_por_pack <= 0) then
        raise exception 'PREFERENCIA_COMPRA_INVALIDA';
      end if;
      update public.productos_catalogo
      set
        modo_compra_habitual = case when v_modo = 'pack' then 'pack' else 'unidad' end,
        nombre_pack = case when v_modo = 'pack' then v_nombre_pack else null end,
        unidades_por_pack = case when v_modo = 'pack' then v_unidades_por_pack else null end
      where negocio_id = new.negocio_id and id = new.entidad_id;
    end if;
  end if;

  if (
    new.tipo_operacion = 'resolver_remoto'
    and new.tipo_entidad = 'producto'
    and new.resultado#>>'{cambios,0,entidad,id}' is not null
  ) then
    select coalesce(new.resultado#>'{cambios,0,entidad}', '{}'::jsonb)
      || jsonb_strip_nulls(jsonb_build_object(
        'modoCompraHabitual', p.modo_compra_habitual,
        'nombrePack', p.nombre_pack,
        'unidadesPorPack', p.unidades_por_pack
      ))
    into v_entidad
    from public.productos_catalogo p
    where p.negocio_id = new.negocio_id and p.id = new.entidad_id;

    if v_entidad is not null then
      new.resultado := jsonb_set(
        new.resultado,
        '{cambios,0,entidad}',
        v_entidad,
        true
      );
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.completar_preferencia_compra_catalogo()
  from public, anon, authenticated;

drop trigger if exists completar_preferencia_compra_catalogo
  on public.operaciones_sincronizacion;

create trigger completar_preferencia_compra_catalogo
before insert or update of estado, resultado
on public.operaciones_sincronizacion
for each row execute function private.completar_preferencia_compra_catalogo();

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
            'modoCompraHabitual', p.modo_compra_habitual,
            'nombrePack', p.nombre_pack,
            'unidadesPorPack', p.unidades_por_pack,
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

revoke all on function private.snapshot_catalogo(uuid)
  from public, anon, authenticated;

create or replace function private.cambio_producto(
  p_negocio_id uuid,
  p_producto_id text
)
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
      'modoCompraHabitual', p.modo_compra_habitual,
      'nombrePack', p.nombre_pack, 'unidadesPorPack', p.unidades_por_pack,
      'stockActual', p.stock_actual, 'stockObjetivo', p.stock_objetivo,
      'estado', p.estado, 'observaciones', p.observaciones,
      'createdAt', p.creado_cliente_at, 'updatedAt', p.actualizado_cliente_at,
      'deletedAt', p.eliminado_cliente_at
    ) end
  )
  from public.productos_catalogo p
  where p.negocio_id = p_negocio_id and p.id = p_producto_id;
$$;

revoke all on function private.cambio_producto(uuid, text)
  from public, anon, authenticated;

notify pgrst, 'reload schema';
