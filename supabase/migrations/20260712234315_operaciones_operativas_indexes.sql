-- Índices de soporte para claves foráneas operativas. Evitan bloqueos y
-- recorridos completos durante revocaciones, auditorías y conciliaciones.
create index ventas_operativas_creado_por_idx
  on public.ventas_operativas (creado_por_dispositivo_id);
create index ventas_operativas_actualizado_por_idx
  on public.ventas_operativas (actualizado_por_dispositivo_id);
create index cobros_ventas_creado_por_idx
  on public.cobros_ventas (creado_por_dispositivo_id);
create index cobros_ventas_actualizado_por_idx
  on public.cobros_ventas (actualizado_por_dispositivo_id);
create index movimientos_operativos_creado_por_idx
  on public.movimientos_operativos (creado_por_dispositivo_id);
create index movimientos_operativos_actualizado_por_idx
  on public.movimientos_operativos (actualizado_por_dispositivo_id);
create index diferencias_stock_producto_idx
  on public.diferencias_stock (negocio_id, producto_id);
create index diferencias_stock_operacion_idx
  on public.diferencias_stock (operacion_id);
create index diferencias_stock_resuelta_por_idx
  on public.diferencias_stock (resuelta_por_dispositivo_id);
