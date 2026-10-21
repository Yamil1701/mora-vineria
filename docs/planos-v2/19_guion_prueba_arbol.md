# 19 — Guion de prueba de encontrabilidad (sin pistas ni datos reales)

**Preparado:** 21/10/2026. **Estado de resultados:** **SIN EJECUTAR**. Este documento es el instrumento de evaluación, no evidencia de que el mapa haya sido validado. Puede aplicarse desde el celular con un moderador y una nota; **no necesita instalar nada, iniciar sesión ni compartir la base de Mora**. Las rutas esperadas están en [18 — Prevalidación heurística](18_prevalidacion_heuristica.md) y **no deben mostrarse al participante**.

## Objetivo

Comprobar si la persona encuentra de forma natural cómo anotar una venta, consultar ventas anteriores, gestionar dinero, contar mercadería, recibir compras, preparar un pedido y respaldar datos.

**Decisión ya aprobada (ADR 17):** «Ventas» es un área de gestión y el + central inicia/retoma Nueva venta. Las pruebas sirven para descubrir si la diferencia es comprensible en uso, no para convertir el + en otra pestaña.

## 1. Cómo ejecutar una sesión breve

1. Buscar una persona que atienda el local, idealmente sin conocimiento previo de los planos. Si solo participa el dueño, anotar «participante conoce el proyecto».
2. Un moderador lee **una tarea a la vez** y revela **sólo un nivel del árbol por elección**; no entregar toda la jerarquía ni las respuestas de los documentos 01–18.
3. Mostrar los cinco elementos visuales del dock: **Inicio | Ventas | + | Productos | Reportes**. No leer preventivamente el significado del +; si pregunta, aclarar su etiqueta accesible y anotar que la necesitó.
4. Mostrar los hijos de la sección que eligió, no las opciones de otra sección.
5. Preguntar **«¿A dónde entrarías?»**, no «¿Buscarías esto en Inventario?». Registrar primer destino, alternativas, dudas y destino final.
6. Para funciones futuras, aclarar **después de la elección** que todavía no funcionan en la PWA; se prueba solamente dónde esperaría encontrarlas.
7. No corregir la respuesta durante la tarea. Al finalizar, pedir explicación breve de por qué buscó allí.
8. Mezclar el orden de tareas, para evitar que una le enseñe las etiquetas de otra.

Con pocas personas reportar observaciones textuales, no tasas de éxito representativas. Ver [NN/g Tree Testing](https://www.nngroup.com/articles/tree-testing/).

## 2. Árbol de prueba — revelar progresivamente

### Primer nivel siempre visible

~~~text
Inicio        Ventas        +        Productos        Reportes
~~~

El + es una acción, no pestaña. Registrar si la persona sabe qué acción representa antes de explicarlo.

### Segundo/tercer nivel, visible solo después de elegir

- **Inicio:** Resumen de hoy; Para reponer; acceso a Caja (candidata A); Configuración/Datos (solo alternativa B al probarla).
- **Ventas:** Historial → Detalle → Corregir [futuro]; Fiados → Cliente → Abonar [futuro]; venta en preparación si existe.
- **+ Nueva venta:** Buscar/seleccionar productos → Carrito opcional o Cobro directo → Confirmación local.
- **Productos:** Catálogo → Ficha/Editar; Inventario → Conteo/Historial de stock; Reposición → Preparar pedido [futuro] / Recibir mercadería.
- **Reportes:** Hoy/Semana/Mes → Ventas y ganancias / Productos vendidos / Dinero (lectura).
- **Caja** (si elige su acceso): Resumen → Contar efectivo [futuro]; Movimientos → Gasto/Aporte/Retiro [futuro]; Cuentas → Traspasos [futuro].
- **Configuración/Datos** (si elige su acceso): Datos → Descargar respaldo / Restaurar / Estado local.

**Alternativas a comparar:** Caja desde Inicio frente a acceso global identificado; Configuración global frente a entrada en Inicio; Productos abre Catálogo con subselector frente a portada de tres áreas. No presentar dos alternativas simultáneamente en una sola tarea, porque sería entrenamiento.

## 3. Tarjetas de tareas — SOLO texto al participante

Las frases intentan no incluir literalmente el nombre del destino. Las rutas esperadas **no figuran** aquí.

| ID | Situación planteada | Disponibilidad |
| --- | --- | --- |
| TA-01 | «Un cliente se llevó una bebida y quiero anotarla ahora.» | Actual |
| TA-02 | «Quiero volver a ver cuánto cobré por una compra de ayer.» | Actual |
| TA-03 | «Anoté un precio incorrecto en una operación que ya terminé. ¿Dónde irías a revisarlo?» | Corrección futura, historial actual |
| TA-04 | «Se rompió una botella. Necesito anotar que hay una menos.» | Actual |
| TA-05 | «El proveedor trajo dos cajones y le pagué. Necesito registrarlo.» | Actual, recepción simple |
| TA-06 | «Mañana voy a mandar la lista de lo que tengo que comprar.» | Futuro: pedido |
| TA-07 | «Compré un elemento de limpieza con plata del negocio.» | Actual: gasto |
| TA-08 | «Puse plata mía en el negocio para tener cambio.» | Actual: aporte |
| TA-09 | «Conté los billetes que hay físicamente y quiero dejar constancia.» | Futuro: conteo de caja |
| TA-10 | «Voy a cambiar de teléfono y quiero guardar mis registros para recuperarlos.» | Actual: backup |
| TA-11 | «Me preguntaron el precio de una botella, pero todavía no vendí nada.» | Actual |
| TA-12 | «Quiero ver cuánto vendí esta semana y cuáles fueron los productos más vendidos.» | Actual |
| TA-13 | «Estoy anotando las bebidas que se llevó un cliente, salgo a consultar un precio y quiero retomar lo que había cargado.» | Borrador actual; nuevo acceso pendiente |
| TA-14 | «Se vendió una bebida que el sistema marcaba sin unidades disponibles. Quiero revisar la diferencia.» | Venta y revisión pendiente actuales |
| TA-15 | «Una persona me abona una parte de lo que me debía por una compra anterior.» | Futuro: fiados |

Para TA-13 preguntar después de la elección qué espera del botón central al volver, sin mencionar las opciones antes de que responda.

## 4. Registro de una observación — una ficha por tarea

~~~text
Sesión:                   Fecha:                    Dispositivo:
Participante (seudónimo):                          Conocía el plano: sí / no
Alternativa probada:      Caja A/B · Config A/B · Productos A/B

Tarea: TA-__
Primera elección: __
Camino elegido: __ → __ → __
Volvió atrás: sí / no        Veces: __
Destino final señalado: __
Encontró el lugar: directo / con desvíos / no lo encontró
Qué dijo (cita literal o resumen fiel): __
Por qué lo buscó allí: __
Observación del moderador: __
~~~

No registrar nombres de clientes, montos reales, datos bancarios ni contenido de backup. La ficha puede guardarse como texto local o papel.

## 5. Cómo interpretar (sin inventar participantes)

- **Primer destino equivocado:** revisar la etiqueta o el punto de entrada al área.
- **Primer destino correcto pero acción invisible:** revisar subnavegación y nombres internos.
- **Alterna dos áreas razonables:** valorar enlace contextual al **único** dueño operativo, no otro formulario.
- **No reconoce +:** estudiar rótulo visible, tamaño y comunicación semántica, **sin** reinterpretarlo como quinta pestaña.
- **Encuentra la ruta en texto pero falla con la app:** probablemente es un problema visual, de foco o de estado; requiere QA móvil.
- **Es función futura:** dejarla en plano, no añadir botones que simulen que está implementada.

Una sesión no justifica afirmar «100 % de éxito»: registrar «TA-xx fue encontrada directamente en esta sesión». [NN/g — Interpreting Tree Test Results](https://www.nngroup.com/articles/interpreting-tree-test-results/).

## 6. Cierre y puerta de aprobación

Solo al terminar, cotejar las rutas elegidas con [18 — Prevalidación heurística](18_prevalidacion_heuristica.md), y registrar:

| Tema | Evidencia real observada | Decisión |
| --- | --- | --- |
| + y área Ventas | **Sin datos todavía** | Pendiente de validar el uso |
| Caja | **Sin datos todavía** | Pendiente |
| Inventario | **Sin datos todavía** | Pendiente |
| Reposición | **Sin datos todavía** | Pendiente |
| Configuración y respaldo | **Sin datos todavía** | Pendiente |
| Retomar borrador | **Sin datos todavía** | Pendiente |

Al disponer de observaciones, corregir primero los documentos 01/02/10/11/16 y solicitar aprobación antes de implementar. No publicar rutas nuevas basadas solo en la primera intuición del asistente.
