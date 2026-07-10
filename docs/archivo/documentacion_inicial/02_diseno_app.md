# Diseño de la App

## 1. Propósito del documento

Este documento define los lineamientos visuales, de experiencia de usuario, navegación, pantallas principales y comportamiento general de la interfaz de **Mora Vinería**.

Su objetivo es mantener una experiencia coherente, simple y mobile-first durante todo el desarrollo de la aplicación.

La app debe diseñarse pensando en el uso real de una vinería pequeña, con carga rápida de ventas, consulta simple de información y uso frecuente durante la noche y la madrugada.

---

# 2. Estilo visual general

La app debe tener una estética:

- Cálida y cercana.
- Elegante pero no cara.
- Moderna y limpia.
- Joven e informal.
- Simple.
- Minimalista.
- Visualmente agradable.
- Rápida de usar.
- Pensada primero para celular.
- No empresarial pesada.

La interfaz no debe sentirse como un sistema administrativo complejo ni como un ERP. Debe sentirse como una herramienta práctica, clara y cómoda para el uso diario.

La app debe transmitir orden, confianza y facilidad, sin perder personalidad visual.

---

# 3. Contexto de uso

La app será utilizada en una vinería donde gran parte de las ventas se concentran entre la noche y la madrugada.

Por este motivo, el diseño debe priorizar:

- Fondo oscuro.
- Alto contraste.
- Botones grandes.
- Lectura rápida.
- Poca fricción.
- Acciones visibles.
- Formularios simples.
- Carga rápida de ventas.
- Confirmaciones claras.
- Uso cómodo en ambientes con poca luz.

Aunque la app pueda usarse durante todo el día, debe estar especialmente optimizada para el uso nocturno.

---

# 4. Paleta de colores

## 4.1. Paleta base

La paleta base del proyecto será:

| Color | Uso general |
| --- | --- |
| `#D7268F` | Color principal, CTA, acentos importantes |
| `#121014` | Fondo principal oscuro |
| `#F2C6D8` | Fondo suave, destacados leves, detalles visuales |
| `#28D970` | Estados correctos o positivos |
| `#0D3927` | Secundario oscuro, contraste elegante, texto sobre fondos claros verdes |

## 4.2. Colores funcionales

| Función | Color recomendado | Uso |
| --- | ---: | --- |
| CTA principal | `#D7268F` | Botones principales, acciones importantes, enlaces destacados |
| CTA hover | `#B91F79` | Estado hover del botón principal |
| CTA activo / presionado | `#941862` | Estado activo o seleccionado |
| CTA secundario oscuro | `#0D3927` | Botones secundarios elegantes o acciones alternativas |
| Fondo principal oscuro | `#121014` | Fondo general, navbar, sidebar, cards oscuras |
| Fondo suave / destacado leve | `#F2C6D8` | Fondos de secciones suaves, badges claros, cards livianas |

## 4.3. Colores semánticos

| Estado | Color | Fondo suave | Texto oscuro | Uso |
| --- | ---: | ---: | ---: | --- |
| Correcto / éxito | `#28D970` | `#DDFBE9` | `#0D3927` | Confirmaciones, aprobado, disponible, completado |
| Advertencia | `#F5B82E` | `#FFF3CF` | `#5C3B00` | Pendiente, atención, revisión necesaria |
| Error / peligro | `#E5484D` | `#FFE1E3` | `#5F1013` | Errores, eliminar, cancelar, bloqueo |
| Información | `#3BA7FF` | `#DCEEFF` | `#08365C` | Ayuda, mensajes informativos, estados neutrales |

## 4.4. Reglas de uso del color

El color principal `#D7268F` debe reservarse para acciones importantes.

No debe usarse en exceso para evitar que la interfaz pierda jerarquía visual.

El fondo principal debe ser oscuro, utilizando `#121014`.

El color `#F2C6D8` debe usarse como acento suave, no como fondo general dominante.

Los colores semánticos deben usarse de forma consistente:

- Verde para acciones exitosas o estados positivos.
- Amarillo para advertencias o atención.
- Rojo para errores, anulaciones o eliminaciones.
- Azul para información o ayuda.

La app debe evitar una estética demasiado premium. No se deben usar dorados fuertes ni negro puro como recurso principal de lujo.

---

# 5. Navegación principal

La navegación principal debe ser mobile-first.

La app debe utilizar una barra inferior tipo aplicación móvil, con iconos y etiquetas claras.

La barra inferior debe tener 4 accesos principales:

- Inicio.
- Ventas.
- Productos.
- Reportes.

La barra inferior debe estar siempre disponible en las pantallas principales.

Las acciones como nueva venta, reposición, aporte externo o gasto puntual no deben ocupar la barra inferior principal. Deben mostrarse como acciones dentro de las pantallas correspondientes.

---

# 6. Pantallas principales

El MVP debe contemplar las siguientes pantallas principales:

1. Inicio / Dashboard.
2. Nueva venta.
3. Ventas.
4. Productos.
5. Movimientos.
6. Reportes.
7. Proyecciones.
8. Configuración.

La pantalla “Movimientos” reemplaza el enfoque de una pantalla llamada solamente “Gastos”, porque dentro de ella se administrarán:

- Reposición de mercadería.
- Aporte externo.
- Gasto puntual.
- Historial de movimientos.

La app debe evitar crear pantallas innecesarias o dividir en exceso la navegación.

---

# 7. Jornada de venta en la interfaz

La app debe utilizar internamente una jornada de venta desde las 08:00 hasta las 07:59 del día siguiente.

Sin embargo, en la interfaz no debe usarse lenguaje técnico como “día operativo”.

En su lugar, se deben utilizar textos simples como:

- Resumen de hoy.
- Ventas de hoy.
- Movimientos de hoy.
- Hoy.
- Jornada actual, solo si fuera necesario.

Cuando sea necesario aclararlo, se puede mostrar un texto secundario discreto:

“Este resumen toma las ventas desde las 08:00 hasta las 07:59 del día siguiente.”

La jornada de venta afecta:

- Dashboard.
- Ventas de hoy.
- Movimientos de hoy.
- Reportes diarios.
- Proyecciones.
- PDF mensual.

---

# 8. Dashboard inicial

## 8.1. Prioridad del dashboard

El dashboard debe priorizar la visión semanal, sin perder el acceso al resumen diario.

La app debe mostrar primero información útil para entender cómo viene la semana, pero también permitir ver rápidamente el movimiento de hoy.

## 8.2. Contenido principal

El dashboard debe incluir:

- Resumen de hoy.
- Ventas de hoy.
- Ganancia estimada de hoy.
- Ventas de la semana.
- Ganancia estimada de la semana.
- Ventas del mes.
- Gastos o movimientos del mes.
- Ganancia estimada del mes.
- Producto más vendido del mes.
- Meta mensual, si fue configurada.

## 8.3. Acción principal

El dashboard debe tener un botón principal muy destacado para:

- Nueva venta.

Esta acción debe ser la más visible de la app, porque registrar ventas es el flujo más importante.

## 8.4. Acciones secundarias

Las acciones secundarias deben estar disponibles sin saturar la pantalla.

Acciones secundarias:

- Reposición.
- Aporte externo.
- Gasto puntual.
- Productos.

Estas acciones pueden estar ubicadas en cards, accesos rápidos o dentro de la pantalla correspondiente, según se defina en diseño visual detallado.

---

# 9. Nueva venta

## 9.1. Objetivo de la pantalla

La pantalla de nueva venta debe permitir registrar una venta de forma rápida, clara y segura desde el celular.

Debe estar optimizada para uso nocturno y para momentos de atención rápida.

## 9.2. Flujo principal

El flujo de nueva venta será:

1. Buscar producto.
2. Seleccionar producto.
3. Agregar al carrito.
4. Ajustar cantidad.
5. Agregar más productos si corresponde.
6. Elegir medio de pago.
7. Revisar resumen compacto.
8. Confirmar venta.
9. Volver automáticamente a nueva venta.

## 9.3. Buscador

El buscador de productos debe ser uno de los primeros elementos visibles.

Debe permitir encontrar productos rápidamente por nombre, marca o categoría.

## 9.4. Productos frecuentes

La pantalla puede mostrar hasta 4 productos frecuentes.

Estos productos deben facilitar la venta rápida, pero no deben ocupar demasiado espacio.

## 9.5. Carrito

La venta debe funcionar como carrito.

El carrito puede permanecer oculto o compacto en primera instancia mientras se eligen productos.

Debe poder expandirse para revisar:

- Productos agregados.
- Cantidades.
- Precios.
- Subtotales.
- Total de la venta.

## 9.6. Precio editable

El precio de venta debe cargarse automáticamente desde el producto.

La modificación manual del precio debe estar oculta en una opción secundaria, como “Más opciones”.

No debe ser una acción principal.

Cuando se modifique el precio, se recomienda permitir una observación.

## 9.7. Confirmación de venta

Antes de guardar una venta, debe mostrarse un resumen compacto.

El resumen debe incluir:

- Productos.
- Cantidades.
- Total.
- Medio de pago.
- Advertencias si corresponde.

Luego de confirmar la venta, la app debe volver automáticamente a la pantalla de nueva venta.

---

# 10. Productos

## 10.1. Vista principal

La pantalla de productos debe permitir consultar y administrar productos de forma simple.

La vista predeterminada será mediante cards.

También debe existir la opción de cambiar a vista de lista compacta.

## 10.2. Información visible en listado

En el listado principal debe mostrarse:

- Nombre del producto.
- Marca.
- Categoría.
- Presentación o tamaño.
- Precio de venta.
- Stock actual.
- Estado de stock si corresponde.

El costo de compra no debe mostrarse en el listado principal.

El costo de compra debe estar visible solo al entrar al detalle del producto.

## 10.3. Stock

El stock debe estar visible en el listado.

Los productos con bajo stock deben destacarse con una advertencia suave.

La advertencia no debe ser agresiva ni generar alarma innecesaria.

Ejemplo:

“Quedan pocas unidades.”

## 10.4. Productos inactivos

Los productos inactivos deben ocultarse por defecto.

Debe existir una opción para ver productos inactivos cuando sea necesario.

## 10.5. Agregar producto

La app puede incluir un botón flotante para agregar producto, siempre que no estorbe la navegación ni la lectura.

Como no se espera cargar productos constantemente, esta acción no debe tener más protagonismo que la venta.

---

# 11. Movimientos

## 11.1. Objetivo de la pantalla

La pantalla de movimientos debe centralizar las operaciones económicas que no son ventas.

Debe permitir registrar:

- Reposición de mercadería.
- Aporte externo.
- Gasto puntual.
- Historial de movimientos.

## 11.2. Acciones principales

La pantalla debe mostrar acciones diferenciadas para:

- Registrar reposición.
- Registrar aporte externo.
- Registrar gasto puntual.

Estas acciones deben verse como opciones distintas.

## 11.3. Reposición de mercadería

La reposición de mercadería debe permitir aumentar stock y registrar el dinero invertido.

Una reposición puede incluir aporte externo dentro del mismo formulario.

Ejemplo:

- Reposición total: $150.000.
- Capital del negocio: $100.000.
- Aporte externo: $50.000.

La interfaz debe mostrar claramente de dónde salió el dinero utilizado para la reposición.

## 11.4. Aporte externo

El aporte externo también debe poder cargarse por separado.

Debe quedar claro que el aporte externo:

- No es una venta.
- No es ganancia.
- No es gasto.
- Es capital ingresado desde fuera del movimiento normal del negocio.

## 11.5. Gasto puntual

El gasto puntual debe existir como opción secundaria.

No debe tener tanto protagonismo como ventas, reposición o aporte externo.

Debe utilizarse para casos excepcionales o difíciles de clasificar.

## 11.6. Historial de movimientos

El historial debe mostrar claramente el tipo de movimiento.

Ejemplos de etiquetas:

- Reposición.
- Aporte externo.
- Gasto puntual.
- Movimiento anulado.

Cada movimiento debe mostrar:

- Fecha.
- Monto.
- Tipo.
- Observación breve.
- Estado.

---

# 12. Reportes

## 12.1. Enfoque general

Los reportes deben usar lenguaje simple, claro y no contable.

La app no debe presentar los reportes como balances formales ni como informes fiscales.

Deben servir para entender el negocio de forma práctica.

## 12.2. Filtros

Los reportes deben permitir filtrar por:

- Resumen de hoy.
- Semana del mes.
- Mes.
- Rango personalizado.

## 12.3. Semana del mes

La opción de semana del mes debe permitir elegir una semana específica dentro de un mes seleccionado.

Criterio inicial:

- Semana 1: día 1 al día 7.
- Semana 2: día 8 al día 14.
- Semana 3: día 15 al día 21.
- Semana 4: día 22 al último día del mes.

Este criterio debe mantenerse simple y no debe complicarse con semanas calendario ISO.

## 12.4. Información del reporte

Los reportes deben mostrar:

- Total vendido.
- Costo estimado de productos vendidos.
- Ganancia bruta estimada.
- Gastos puntuales.
- Reinversión.
- Aportes externos.
- Ganancia neta estimada.
- Productos más vendidos.
- Medios de pago más usados.
- Ventas recientes.
- Movimientos recientes.

## 12.5. Gráficos

Los reportes pueden incluir gráficos simples.

Ejemplos:

- Barras por día.
- Gráfico de medios de pago.
- Ranking de productos.
- Evolución de ventas por período.

Los gráficos deben ser fáciles de leer desde celular.

No deben sobrecargar la pantalla.

## 12.6. PDF mensual

El PDF mensual debe generarse desde la pantalla de reportes.

El PDF debe tener:

- Diseño simple.
- Fondo claro.
- Buena legibilidad.
- Información escaneable.
- Lenguaje no contable.

El PDF debe ser un resumen de gestión, no un documento fiscal ni contable.

---

# 13. Proyecciones

## 13.1. Ubicación

Proyecciones será una pantalla separada.

Sin embargo, reportes puede mostrar información resumida o accesos relacionados con proyecciones.

## 13.2. Enfoque

Las proyecciones deben presentarse como estimaciones orientativas.

No deben comunicarse como datos exactos.

La app debe explicar de forma humana que la proyección puede variar.

Ejemplo:

“La proyección es una guía. Puede cambiar por días fuertes, clima, feriados o por cómo se mueva la venta cerca de fin de mes.”

## 13.3. Meta mensual

La app debe permitir definir una meta mensual de ventas.

La meta debe mostrarse de forma positiva, realista y no desmotivadora.

No deben usarse textos agresivos como:

- “Vas mal.”
- “No llegás.”
- “Meta fallida.”

Se deben usar textos más humanos, por ejemplo:

- “Todavía hay margen para acercarse a la meta.”
- “Los días fuertes pueden mejorar la proyección.”
- “La venta viene tranquila, revisemos cómo evoluciona esta semana.”

## 13.4. Días fuertes

La app puede destacar que ciertos días suelen tener más movimiento, especialmente jueves, viernes y sábado.

Esto no es prioridad del MVP, pero puede sumarse si mejora la claridad del diseño.

## 13.5. Mejora futura

En futuras versiones, las proyecciones podrán mejorarse considerando:

- Día de la semana.
- Feriados.
- Temperatura.
- Fechas especiales.
- Fin de mes.
- Historial de ventas por jornada.

Para el MVP, la proyección puede ser simple, siempre que se comunique como experimental y orientativa.

---

# 14. Tono de textos

## 14.1. Estilo de comunicación

La app debe usar textos:

- Humanos.
- Claros.
- Simples.
- Amables.
- Casi motivadores.
- Directos.
- Sin exagerar.

La interfaz debe evitar lenguaje técnico, contable o empresarial pesado.

## 14.2. Mensajes exitosos

Ejemplos aceptables:

- “Venta guardada. Ya quedó sumada al resumen de hoy.”
- “El stock se actualizó con esta reposición.”
- “Producto actualizado correctamente.”
- “Movimiento registrado.”

## 14.3. Mensajes de error

Los errores deben explicar qué pasó de forma amable y directa.

No deben sentirse como reto, culpa o desmotivación.

Ejemplos aceptables:

- “No hay stock suficiente para completar esta venta.”
- “Falta elegir un medio de pago.”
- “El monto ingresado no alcanza para esta reposición.”
- “Revisá los datos marcados antes de continuar.”

## 14.4. Mensajes de proyección

Los mensajes de proyección deben ser realistas y alentadores.

Ejemplos aceptables:

- “La proyección puede mejorar en los próximos días fuertes.”
- “Este número es orientativo y puede variar durante el mes.”
- “La semana viene tranquila, pero todavía queda margen para recuperar ritmo.”

---

# 15. Confirmaciones y acciones sensibles

## 15.1. Criterio general

La app debe pedir confirmación en acciones mutables o sensibles.

Esto ayuda a evitar errores, especialmente durante el uso nocturno o en momentos de atención rápida.

## 15.2. Acciones que requieren confirmación

Deben requerir confirmación:

- Guardar venta.
- Anular venta.
- Registrar reposición.
- Registrar aporte externo.
- Registrar gasto puntual.
- Anular movimiento.
- Eliminar producto.
- Ajustar stock manualmente.

## 15.3. Confirmación de venta

La confirmación de venta debe ser compacta.

Debe mostrar:

- Productos.
- Cantidades.
- Total.
- Medio de pago.
- Advertencias relevantes.

## 15.4. Anulaciones

Anular una venta o movimiento debe requerir motivo.

El motivo debe quedar guardado como parte del historial.

## 15.5. Eliminar producto

Eliminar producto debe ser más difícil que desactivar producto.

La app debe priorizar desactivar productos antes que eliminarlos.

Si el producto tiene historial, no debe permitirse eliminación definitiva.

## 15.6. Stock insuficiente

La app debe bloquear ventas cuando no haya stock suficiente.

No debe limitarse a mostrar advertencia.

Ejemplo:

“No hay stock suficiente para vender esta cantidad.”

La app no debe permitir stock negativo en el MVP.

---

# 16. Principios finales de diseño

Durante el diseño y desarrollo de la interfaz, se deben respetar estos principios:

- Mobile-first siempre.
- Fondo oscuro como base.
- Alto contraste.
- Pocos pasos.
- Botones claros y grandes.
- Acciones principales bien diferenciadas.
- Textos simples y humanos.
- Nada de lenguaje contable pesado.
- Nada de pantallas innecesarias.
- Nada de sobrecargar el dashboard.
- La venta debe ser el flujo más rápido de toda la app.
- Los reportes deben ayudar a entender, no intimidar.
- Las proyecciones deben orientar, no presionar.
- La app debe sentirse útil, linda y liviana.
