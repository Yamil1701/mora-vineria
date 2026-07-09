# Requerimientos del Proyecto

## 1. Propósito del documento

Este documento define los requerimientos funcionales, reglas de negocio, restricciones y alcance inicial de **Mora Vinería**.

Su objetivo es servir como guía para el diseño y desarrollo de la aplicación, evitando que se agreguen funcionalidades no solicitadas o que el sistema crezca de forma innecesaria.

La app debe mantenerse simple, mobile-first y enfocada en resolver necesidades reales de una vinería pequeña.

---

# 2. Alcance general del MVP

La primera versión funcional de **Mora Vinería** debe incluir:

- Administración de productos.
- Registro de ventas.
- Registro de movimientos.
- Reposición de mercadería.
- Aportes externos.
- Gastos puntuales.
- Control simple de stock.
- Dashboard inicial.
- Reportes simples.
- Proyecciones básicas.
- Exportación general en PDF para resumen mensual.
- Backup y restauración de datos.
- Migración semiautomática de datos mediante archivo JSON.

El MVP debe priorizar la carga rápida de información desde celular, la consulta clara de datos y el orden diario del negocio.

---

# 3. Productos

## 3.1. Datos del producto

Cada producto debe permitir registrar como mínimo:

- Nombre del producto.
- Categoría.
- Precio de venta.
- Costo de compra.
- Marca.
- Presentación o tamaño.
- Stock actual.
- Estado activo o inactivo.
- Observaciones.

## 3.2. Categorías

La app debe permitir manejar categorías de productos.

Ejemplos de categorías posibles:

- Vinos.
- Espumantes.
- Cervezas.
- Bebidas blancas.
- Aperitivos.
- Gaseosas.
- Snacks.
- Otros.

Las categorías deben poder administrarse de forma simple.

## 3.3. Costo de compra

Cada producto debe tener un costo de compra registrado.

Este dato será utilizado para calcular la ganancia estimada al momento de registrar ventas.

Ejemplo:

- Precio de venta: $8.000.
- Costo de compra: $5.500.
- Ganancia estimada por unidad: $2.500.

## 3.4. Stock simple

La primera versión debe manejar stock simple.

El stock simple debe permitir:

- Registrar la cantidad disponible de cada producto.
- Descontar stock automáticamente al registrar una venta.
- Aumentar stock cuando se registre una reposición de mercadería.
- Ajustar stock manualmente si fuera necesario.

Este control de stock no debe convertirse en stock avanzado.

No se deben incluir en el MVP:

- Lotes.
- Vencimientos.
- Depósitos múltiples.
- Trazabilidad avanzada.
- Inventario complejo.
- Proveedores avanzados.
- Órdenes de compra complejas.

## 3.5. Activar, desactivar y eliminar productos

La app debe permitir activar y desactivar productos.

Un producto inactivo no debería aparecer como opción principal al registrar nuevas ventas, pero su información histórica debe conservarse.

También debe existir la opción de eliminar productos, pero con una restricción importante:

- Si el producto no tiene ventas, gastos asociados ni movimientos históricos, puede eliminarse.
- Si el producto ya fue usado en ventas o movimientos, no debe eliminarse definitivamente; en ese caso debe desactivarse.

Esto evita romper reportes históricos.

---

# 4. Ventas

## 4.1. Registro de ventas

La app debe permitir registrar ventas de forma rápida desde el celular.

Una venta puede contener uno o varios productos.

Cada venta debe permitir registrar:

- Fecha y hora real.
- Fecha de jornada calculada.
- Productos vendidos.
- Cantidad de cada producto.
- Precio unitario aplicado.
- Subtotal por producto.
- Total de la venta.
- Medio de pago.
- Observaciones opcionales.
- Estado de la venta.

## 4.2. Cantidades

Cada producto vendido debe tener una cantidad.

Ejemplo:

- 2 unidades de vino Malbec.
- 1 unidad de cerveza.
- 3 unidades de gaseosa.

El sistema debe calcular automáticamente el subtotal de cada línea y el total general de la venta.

## 4.3. Precio al momento de vender

El precio de venta debe cargarse automáticamente desde el producto.

Sin embargo, debe existir la posibilidad de modificar el precio al momento de vender.

Esta opción no debe ser la acción principal, sino una opción secundaria para casos puntuales, por ejemplo:

- Descuento.
- Promoción ocasional.
- Precio especial.
- Corrección manual.

Cuando se modifique el precio de venta, la app debería permitir dejar una observación opcional.

## 4.4. Medios de pago

Cada venta debe registrar medio de pago.

Medios de pago iniciales sugeridos:

- Efectivo.
- Transferencia.
- Tarjeta.
- Mercado Pago.
- Otro.

La app debe permitir reportar cuánto se vendió por cada medio de pago.

## 4.5. Observaciones

Las ventas deben permitir observaciones opcionales.

Ejemplos:

- Precio especial.
- Venta anotada.
- Cliente frecuente.
- Corrección manual.
- Promoción puntual.

## 4.6. Anulación de ventas

La app debe permitir anular ventas.

Una venta anulada:

- No debe contarse como ingreso activo.
- No debe sumarse en reportes de ventas vigentes.
- Debe conservarse en el historial.
- Debe revertir el impacto en stock cuando corresponda.
- Debe permitir registrar una observación o motivo de anulación.

No se debe eliminar una venta histórica de forma definitiva, porque eso puede afectar reportes y control interno.

---

# 5. Jornada de venta

La app debe utilizar una jornada de venta para agrupar ventas, movimientos, dashboard, reportes y proyecciones.

La jornada de venta inicia a las 08:00 y finaliza a las 07:59 del día siguiente.

En la interfaz no se debe usar lenguaje técnico como “día operativo”. Se deben utilizar textos simples como:

- Resumen de hoy.
- Ventas de hoy.
- Movimientos de hoy.
- Jornada actual, solo si fuera necesario.

Todas las ventas y movimientos deben conservar su fecha y hora real de carga, pero para reportes deben agruparse según la fecha de jornada calculada.

Regla general:

- Si una venta o movimiento ocurre desde las 08:00 en adelante, pertenece a la jornada de ese mismo día.
- Si una venta o movimiento ocurre antes de las 08:00, pertenece a la jornada del día anterior.

Ejemplos:

- Viernes 22:30 cuenta como viernes.
- Sábado 02:30 cuenta como viernes.
- Sábado 10:00 cuenta como sábado.
- Domingo 04:00 cuenta como sábado.
- Domingo 14:00 cuenta como domingo.

Esta regla evita que las ventas de madrugada queden separadas artificialmente del movimiento comercial de la noche anterior.

---

# 6. Movimientos

## 6.1. Registro de movimientos

La app debe permitir registrar movimientos económicos que no son ventas.

La pantalla de movimientos debe agrupar:

- Reposición de mercadería.
- Aporte externo.
- Gasto puntual.
- Historial de movimientos.

Cada movimiento debe contener:

- Fecha y hora real.
- Fecha de jornada calculada.
- Tipo de movimiento.
- Descripción.
- Monto.
- Medio de pago o ingreso, si corresponde.
- Observaciones opcionales.
- Estado del movimiento.

## 6.2. Reposición de mercadería

La reposición de mercadería representa dinero utilizado para comprar productos que luego serán vendidos.

Debe mostrarse separada de los gastos generales, porque no necesariamente representa una pérdida: es dinero que se transforma en inventario.

Cuando se registre una reposición de mercadería, la app debe poder aumentar el stock de los productos correspondientes.

Una reposición puede tener origen mixto:

- Capital del negocio.
- Aporte externo.

Ejemplo:

- El sistema tiene $100 disponibles para reposición.
- La dueña decide agregar $50 de su bolsillo.
- Se realiza una compra de mercadería por $150.
- De esos $150, $100 provienen del movimiento interno del negocio y $50 provienen de un aporte externo.

## 6.3. Aportes externos

La app debe permitir registrar aportes externos de capital.

Un aporte externo representa dinero ingresado desde fuera del movimiento normal de ventas y gastos de la vinería.

El aporte externo no debe considerarse venta, ganancia ni gasto.

Debe registrarse como ingreso de capital externo para poder explicar de dónde salió el dinero utilizado en una reposición o movimiento del negocio.

Cada aporte externo debe permitir registrar:

- Fecha.
- Monto.
- Descripción u observación.
- Medio de ingreso, si corresponde.

El aporte externo debe mostrarse separado en reportes, para no confundirlo con ventas reales del negocio.

## 6.4. Gastos generales o puntuales

La app debe permitir registrar gastos generales o puntuales, pero esta función no debe tener protagonismo dentro del MVP.

La operación principal de la vinería se concentra en:

- Ventas.
- Reposición de mercadería.
- Aportes externos.
- Control simple de stock.
- Reportes básicos.

Los gastos generales deben contemplarse solo como una opción manual para casos excepcionales o difíciles de clasificar.

Ejemplos:

- “Gasté $5.000 en Uber para ir a comprar mercadería porque el proveedor habitual no estaba disponible.”
- “Se pagó un gasto puntual relacionado al negocio.”

Para el MVP no se deben crear categorías complejas de gastos generales.

No se deben priorizar en esta etapa categorías como:

- Delivery.
- Movilidad.
- Limpieza.
- Publicidad.
- Insumos.
- Mantenimiento.

Estas categorías podrán evaluarse como mejora futura si el uso real de la app demuestra que son necesarias.

## 6.5. Medio de pago del movimiento

Cada movimiento debe permitir registrar medio de pago o ingreso cuando corresponda.

Medios iniciales sugeridos:

- Efectivo.
- Transferencia.
- Tarjeta.
- Mercado Pago.
- Otro.

## 6.6. Corrección y anulación de movimientos

La app debe permitir corregir o anular movimientos.

Un movimiento anulado:

- No debe sumarse en reportes vigentes.
- Debe conservarse en el historial.
- Debe permitir registrar una observación o motivo de anulación.
- Debe revertir su impacto en stock si estaba asociado a reposición de mercadería.

---

# 7. Ganancia y cálculos

## 7.1. Criterio general

La ganancia de la app será siempre una **ganancia estimada**, no una ganancia contable formal.

La app no reemplaza un sistema contable ni una liquidación fiscal. Su objetivo es brindar una aproximación útil para tomar decisiones diarias.

## 7.2. Total vendido

El total vendido representa todo el dinero ingresado por ventas activas.

No deben incluirse ventas anuladas.

## 7.3. Costo estimado de productos vendidos

El costo estimado de productos vendidos representa el costo de compra de los productos que fueron vendidos.

Fórmula general:

```txt
Costo estimado de productos vendidos = suma de costo de compra × cantidad vendida
```

## 7.4. Ganancia bruta estimada

La ganancia bruta estimada se calcula así:

```txt
Ganancia bruta estimada = total vendido - costo estimado de productos vendidos
```

Ejemplo:

```txt
Total vendido: $100.000
Costo estimado de productos vendidos: $65.000

Ganancia bruta estimada: $35.000
```

## 7.5. Gastos puntuales

Los gastos puntuales son gastos excepcionales que no representan compra directa de mercadería para reventa.

Deben tener menor protagonismo que ventas, reposición y aportes externos.

## 7.6. Reinversión

La reinversión corresponde principalmente a reposición de mercadería.

Debe mostrarse separada de los gastos puntuales.

La reinversión no debe interpretarse automáticamente como pérdida, porque representa dinero utilizado para generar o mantener inventario.

## 7.7. Aportes externos

Los aportes externos deben mostrarse separados de ventas, gastos y ganancias.

No deben inflar ventas ni ganancias.

## 7.8. Ganancia neta estimada

La ganancia neta estimada se calcula así:

```txt
Ganancia neta estimada = ganancia bruta estimada - gastos puntuales
```

La reinversión y los aportes externos deben mostrarse como datos separados.

Ejemplo:

```txt
Total vendido: $100.000
Costo estimado de productos vendidos: $65.000
Ganancia bruta estimada: $35.000
Gastos puntuales: $5.000
Reinversión en mercadería: $20.000
Aportes externos: $10.000

Ganancia neta estimada: $30.000
```

En este ejemplo, la reinversión y los aportes externos se informan aparte para no confundir compra de mercadería o capital externo con pérdida o ganancia operativa.

---

# 8. Reportes

## 8.1. Reportes mínimos del MVP

La app debe permitir consultar como mínimo:

- Ventas del día.
- Ventas de la semana.
- Ventas del mes.
- Movimientos del día.
- Movimientos de la semana.
- Movimientos del mes.
- Ganancia estimada.
- Productos más vendidos.
- Medios de pago más usados.
- Proyección mensual simple.

## 8.2. Períodos predeterminados de reportes

Los reportes deben ofrecer accesos rápidos a:

- Día actual, mostrado como “Resumen de hoy”.
- Semana del mes.
- Mes actual.
- Rango personalizado.

La opción “semana del mes” debe permitir elegir una semana específica dentro de un mes seleccionado.

Para el MVP, las semanas del mes se tomarán como bloques simples de gestión interna, no como semanas calendario ISO.

Criterio inicial:

- Semana 1: del día 1 al día 7.
- Semana 2: del día 8 al día 14.
- Semana 3: del día 15 al día 21.
- Semana 4: del día 22 al último día del mes.

Ejemplo:

Si se selecciona enero:

- Enero / Semana 1.
- Enero / Semana 2.
- Enero / Semana 3.
- Enero / Semana 4.

Este criterio permite analizar el mes en partes simples, sin complicar el sistema con calendarios avanzados.

## 8.3. Filtro por fecha personalizada

La app debe permitir filtrar reportes por rango de fechas.

Ejemplo:

```txt
Desde: 01/07/2026
Hasta: 15/07/2026
```

El rango personalizado debe aplicar a ventas, movimientos, ganancias estimadas y productos vendidos.

## 8.4. Reporte mensual en PDF

El MVP debe incluir una exportación general en PDF para resumen mensual.

El PDF debe ser simple y resumido.

Debe incluir como mínimo:

- Período del reporte.
- Total vendido.
- Total de gastos puntuales.
- Total de reinversión.
- Total de aportes externos.
- Ganancia bruta estimada.
- Ganancia neta estimada.
- Productos más vendidos.
- Medios de pago más usados.
- Observaciones generales si corresponde.

No debe ser un reporte contable formal.

---

# 9. Proyecciones

## 9.1. Proyección mensual simple

La app debe incluir una proyección mensual básica.

Fórmula inicial:

```txt
Promedio diario = ventas acumuladas del mes / días transcurridos

Proyección mensual = promedio diario × cantidad de días del mes
```

## 9.2. Carácter experimental de la proyección

La proyección mensual debe mostrarse como una estimación experimental.

La interfaz debe aclarar de forma humana que puede variar por factores externos como:

- Temperatura.
- Feriados.
- Diferencias entre días de semana y fines de semana.
- Mayor venta de jueves a sábado.
- Baja venta los lunes y martes.
- Menor disponibilidad de dinero cerca de fin de mes.
- Eventos o fechas especiales.

Por lo tanto, la proyección no debe presentarse como un resultado exacto.

Debe comunicarse como una ayuda orientativa.

## 9.3. Proyección de gastos

La app debe permitir una proyección simple de gastos puntuales.

Fórmula inicial sugerida:

```txt
Promedio diario de gastos = gastos acumulados del mes / días transcurridos

Proyección mensual de gastos = promedio diario de gastos × cantidad de días del mes
```

La reinversión debe mostrarse separada de los gastos puntuales también en las proyecciones.

## 9.4. Meta mensual

La app debe permitir definir una meta mensual aproximada de ventas.

La meta no debe mostrarse de forma desmotivadora.

La interfaz debe evitar mensajes agresivos o negativos.

Ejemplo de comunicación aceptable:

```txt
Vas avanzando hacia tu meta mensual.
```

```txt
Todavía falta para llegar a la meta, pero la proyección puede mejorar con los próximos días de venta fuerte.
```

```txt
La venta viene por debajo de la meta estimada, revisemos los próximos días de mayor movimiento.
```

La app debe tratar la meta como una referencia de seguimiento, no como una calificación negativa.

---

# 10. Usuarios y permisos

## 10.1. Login

La primera versión no debe incluir login.

## 10.2. Usuarios

La primera versión no debe manejar usuarios diferenciados.

## 10.3. Roles y permisos

La primera versión no debe manejar roles ni permisos complejos.

La app está pensada para uso interno de la dueña y posibles ayudantes casuales, todos con el mismo nivel de acceso funcional.

## 10.4. Registro de responsable

La primera versión no debe registrar quién cargó cada venta o gasto.

---

# 11. Dashboard inicial

## 11.1. Información principal

El dashboard inicial debe mostrar información útil y rápida para el uso diario.

Debe incluir como mínimo:

- Resumen de hoy.
- Ventas de hoy.
- Ganancia estimada de hoy.
- Ventas de la semana.
- Ganancia estimada de la semana.
- Ventas del mes.
- Movimientos del mes.
- Ganancia estimada del mes.
- Producto más vendido del mes.
- Acceso rápido a nueva venta.
- Acceso rápido a movimientos.
- Acceso rápido a productos.

## 11.2. Ganancia estimada en dashboard

La ganancia estimada debe mostrarse como aproximación, no como certeza contable.

Debe quedar claro que depende del costo de compra cargado en cada producto y de la correcta carga de ventas y movimientos.

## 11.3. Producto más vendido

El producto más vendido del mes debe calcularse a partir de las ventas registradas.

No debe mostrarse como predicción, sino como dato basado en ventas reales cargadas.

---

# 12. Backup, restauración y migración

La app debe incluir backup y restauración JSON como parte central del MVP.

La app debe permitir:

- Exportar backup JSON completo.
- Importar backup JSON.
- Ver resumen del backup antes de restaurar.
- Copiar datos desde el celular principal hacia otro celular.
- Diferenciar celular principal y celular de consulta.

El MVP no tendrá sincronización automática real entre dispositivos.

El celular principal será el único pensado para carga operativa de datos.

El celular de consulta podrá importar una copia de datos para ver información, pero no debe modificar información operativa por defecto.

---

# 13. Restricciones del MVP

La primera versión de **Mora Vinería** no debe incluir:

- Combos.
- Facturación fiscal.
- Múltiples sucursales.
- Contabilidad avanzada.
- Stock avanzado.
- Roles complejos.
- Funciones propias de un ERP.
- Backend.
- Base de datos remota.
- Sincronización automática real.

Cualquier funcionalidad nueva debe evaluarse antes de incorporarse, verificando que no contradiga el objetivo de mantener la app simple, rápida y útil.

---

# 14. Prioridad de desarrollo

El orden recomendado de desarrollo será:

1. Productos.
2. Ventas.
3. Movimientos.
4. Dashboard.
5. Reportes.
6. Proyecciones.
7. Backup, restore y migración.

La primera prioridad real es construir correctamente la administración de productos y el registro de ventas, ya que ambas funciones dependen entre sí.

Sin productos cargados, no puede existir un registro de ventas útil.
