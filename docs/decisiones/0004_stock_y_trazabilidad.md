# 0004 — Stock, anulaciones y trazabilidad

- Estado: aceptada
- Fecha: 2026-07-10

## Decisión

El stock es simple y se compara con un objetivo por producto. No puede ser negativo.

En la primera versión, el ajuste manual se realiza editando el producto con advertencia y confirmación. Una venta histórica se anula, no se elimina. Un movimiento se corrige anulando su impacto; registrar un reemplazo es opcional.

Un movimiento anulado se conserva por defecto y solo puede eliminarse si la reversión terminó y no rompe relaciones ni integridad histórica.

## Consecuencias

Productos con historial se desactivan. Las anulaciones requieren motivo. Si más adelante se necesita auditoría completa de ajustes manuales, deberá diseñarse explícitamente antes de cambiar el modelo.
