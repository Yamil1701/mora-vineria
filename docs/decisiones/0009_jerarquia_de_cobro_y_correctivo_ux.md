# 0009 — Jerarquía de cobro y correctivo UX

- Estado: aceptada
- Fecha: 2026-07-21

## Contexto

El primer reordenamiento llegó a producción con decisiones de experiencia aplicadas parcialmente. En especial, Nueva venta conservó controles anteriores y algunas reglas visibles no coincidían con lo consensuado.

## Decisión

- Efectivo y Transferencia son las formas de cobro visibles por defecto.
- Pago combinado, Fiado, Tarjeta y Otro se agrupan bajo Otras formas de cobro.
- El carrito no despliega precio y observación debajo de cada producto.
- Aplicar descuento vive en la revisión de cobro y afecta el total completo.
- Fiado no ofrece atajos como La mitad o Faltan `$1.000`.
- El registro de un cobro fiado comienza vacío y anticipa el saldo restante.
- Los historiales extensos se revelan por bloques y no se truncan silenciosamente.
- Una exclusión de reposición dura solo mientras no cambie la propuesta calculada.

## Consecuencias

Las pruebas de cierre deben comprobar los textos y la jerarquía visibles, además de cálculos y persistencia. Compilar correctamente no demuestra por sí solo que este recorrido esté completo.
