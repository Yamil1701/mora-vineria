-- Índices de claves foráneas del catálogo recomendados por el asesor de rendimiento.

create index if not exists categorias_catalogo_actualizado_por_idx
  on public.categorias_catalogo (actualizado_por_dispositivo_id);

create index if not exists productos_catalogo_actualizado_por_idx
  on public.productos_catalogo (actualizado_por_dispositivo_id);
