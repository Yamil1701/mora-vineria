-- Ejecutar una sola vez DESPUÉS de la migración inicial.
-- El resultado es el código de activación del primer celular.
-- Guardarlo temporalmente y no incorporarlo al repositorio.

with generado as materialized (
  select encode(extensions.gen_random_bytes(24), 'hex') as codigo
), guardado as (
  insert into public.app_bootstrap (id, activation_hash)
  select true, extensions.digest(codigo, 'sha256') from generado
  on conflict (id) do update
    set activation_hash = excluded.activation_hash,
        created_at = now(),
        used_at = null
  returning id
)
select generado.codigo as codigo_activacion
from generado cross join guardado;
