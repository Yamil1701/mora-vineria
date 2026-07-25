# 0011 — Reposiciones pendientes y costos históricos

## Decisión

Una reposición se guarda primero como `pendiente`. En ese estado conserva productos, cantidades, presentación y plan de pago, pero no cambia stock ni Tesorería. Puede editarse para reflejar lo realmente recibido, confirmarse o anularse.

La confirmación es el único paso que suma stock y registra las salidas de Tesorería. Una reposición confirmada conserva `confirmadoAt`; si luego se anula, stock y dinero se revierten mediante las reglas existentes. Pendientes y anuladas no participan del costo.

`costoCompra` permanece como costo inicial o de referencia. El último costo surge de la reposición confirmada más reciente y el promedio ponderado se calcula como:

`suma de subtotales confirmados / suma de unidades confirmadas`.

Las ventas nuevas guardan ese promedio como costo al momento; si no existen compras confirmadas usan el costo inicial. Los detalles históricos de ventas no se recalculan.

Productos se ordena por unidades de ventas activas, de mayor a menor, con nombre alfabético como desempate.

## Compatibilidad

Dexie avanza a v7 y el backup a v5. Las reposiciones activas anteriores se migran como confirmadas en su fecha original. Supabase acepta `pendiente` y procesa registrar, actualizar, confirmar, anular y eliminar mediante un RPC idempotente específico.
