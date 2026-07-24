# 0010 — Compra habitual y relación de categorías

- Estado: aceptada
- Fecha: 2026-07-24

## Contexto

El costo de una compra concreta pertenece a la reposición, mientras que el producto necesita recordar cómo suele comprarse para agilizar la carga. También se observó que productos podían terminar en “Aperitivos” porque el formulario completaba silenciosamente la primera categoría al encontrar una relación vacía.

## Decisión

- `costoCompra` se presenta como costo inicial o de referencia; los costos históricos se resolverán con las reposiciones confirmadas.
- El producto guarda compra habitual por unidad o por pack. Un pack requiere nombre y unidades, y solo autocompleta la reposición: puede cambiarse en cada compra.
- Crear un producto exige elegir categoría. Editar conserva la relación existente y, si ya no está disponible, informa el problema en vez de reemplazarla.
- La capa local vuelve a validar que la categoría exista y esté activa dentro de la transacción de guardado.
- Las categorías iniciales se crean únicamente durante la primera inicialización de la app.
- El valor disponible de un producto y el valor de una categoría se calculan con stock actual por precio de venta actual.

## Consecuencias

Dexie avanza a v6, el backup a v4 y el catálogo remoto agrega los campos de compra habitual. Los productos anteriores migran como compra por unidad. Las asignaciones históricas ya incorrectas no se corrigen automáticamente porque no existe información segura para deducir la categoría anterior.
