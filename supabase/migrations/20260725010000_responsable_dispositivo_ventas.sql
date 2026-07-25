-- Conserva en la entidad de cada venta nueva la identidad visible del
-- dispositivo que el servidor autenticó como creador.

create or replace function private.fijar_responsable_dispositivo_venta()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_nombre text;
begin
  select d.nombre
  into v_nombre
  from public.dispositivos d
  where d.id = new.creado_por_dispositivo_id
    and d.negocio_id = new.negocio_id;

  new.entidad := new.entidad || jsonb_build_object(
    'dispositivoResponsableId', new.creado_por_dispositivo_id,
    'dispositivoResponsableNombre', coalesce(v_nombre, 'Dispositivo')
  );
  return new;
end;
$$;

revoke all on function private.fijar_responsable_dispositivo_venta()
  from public, anon, authenticated;

drop trigger if exists fijar_responsable_dispositivo_venta
  on public.ventas_operativas;

create trigger fijar_responsable_dispositivo_venta
before insert on public.ventas_operativas
for each row execute function private.fijar_responsable_dispositivo_venta();

comment on function private.fijar_responsable_dispositivo_venta() is
  'Fija ID y nombre del dispositivo creador dentro del snapshot histórico de una venta nueva.';

notify pgrst, 'reload schema';
