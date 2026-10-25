# 03 — Recorridos completos y estados de experiencia

**Estado:** plano funcional v0.1, sin modificación de lógica. Ningún flujo futuro se considera implementado por estar dibujado.

## 0. Gramática común de un recorrido

Para cualquier acción que cambie datos, dibujar siempre:
1. **Origen/contexto:** por qué el usuario llegó y desde qué entidad.
2. **Entrada:** qué datos son indispensables; otros opcionales.
3. **Vista previa:** qué cambiará en unidades, dinero, saldo/deuda o costo, usando valores ciertos.
4. **Confirmación:** lenguaje claro sobre hecho físico verificado.
5. **Guardado durable:** comando con ID estable y momento real en IndexedDB; transacción y resultado.
6. **Estado posterior:** éxito, pendiente de reintentar, revisión necesaria o fallo sin escritura.
7. **Retorno seguro:** regresar al trabajo habitual sin duplicar la operación ni perder borrador.
8. **Persistencia/recuperación:** cerrar PWA, abrir otra pestaña, quedar offline o quedarse sin almacenamiento.

**Estados de pantalla:** vacía / con registros / filtrada sin coincidencias / editando / validando / confirmando / guardada / preparada (reintento mismo ID) / error de datos / error de persistencia / revisión pendiente. «Sin red» puede coexistir con estado guardado local; no existe «sincronizado» en este MVP.

### Máquina conceptual de operación durable

~~~mermaid
flowchart TD
 A["Editar formulario o venta"] --> B{"Datos válidos"}
 B -- "No" --> A
 B -- "Sí" --> C["Revisar efecto y confirmar"]
 C --> D["Sellar comando durable"]
 D --> E{"Transacción IndexedDB"}
 E -- "Éxito" --> F["Confirmación local única"]
 E -- "Fallo" --> G["Pendiente · mismo comando"]
 G --> E
 G --> H["Volver a editar con protección"]
 F --> I["Cerrar confirmación / próxima tarea"]
~~~

Este esquema no ordena mover estados de un servicio existente: describe el contrato de experiencia que debe respetarse al reorganizar UI.

## R1. Consulta rápida de producto

**Pregunta real:** «¿Tenés tal bebida? ¿Cuánto cuesta?».

- Entrada: Productos > Catálogo o **buscador/lista de disponibles dentro de Nueva venta**, sin abandonar el selector ni abrir obligatoriamente una ficha. **Observación del usuario del 21/10/2026:** con tres productos en el borrador, consultaría otro mediante búsqueda/listado y espera leer allí lo necesario, sin abrir detalles; ver [20 — Observaciones](20_observaciones_prueba_usuario.md).
- Buscar por nombre/variante; lista compacta, precio grande, stock legible y alerta si corresponde.
- Acción: «Agregar a venta» **explícita y separada de consultar** dentro de Nueva venta; buscar o mirar el resultado no modifica el borrador. «Ver ficha» desde Productos sigue disponible sin imponerla a una consulta rápida.
- No pedir confirmar compra/stock ni abrir ficha para consultar un precio.
- Si no hay productos: «Agregá tu primer producto» con atajo a alta. Si no hay resultados: «No encontramos ese nombre», conservar búsqueda y permitir borrarla.
- Producto desactivado no se ofrece para nueva venta, pero sigue apareciendo en historial y donde sea administrativamente pertinente.

## R2. Venta de efectivo de un producto

La pestaña **Ventas** abre historial y gestión. La entrada global al flujo de carga es el botón central **+ Nueva venta** (ADR 17), no la pestaña. Si existe borrador en curso, + retoma ese mismo borrador, sin crear otro.

~~~mermaid
flowchart LR
 A["(+) Nueva venta · desde cualquier área"] --> B["Buscar / Favorito"]
 B --> C["Agregar unidad"]
 C --> D["Cobrar directo"]
 D --> E["Efectivo · importe recibido opcional"]
 E --> F["Revisar total/vuelto"]
 F --> G["Guardar venta local"]
 G --> H["Nueva venta / detalle"]
~~~

- El botón Cobrar no obliga a entrar al carrito. Si el dinero recibido está vacío, significa «importe exacto» expresamente; si hay importe menor al total, validación visible sin perder borrador.
- En R2 no se fuerza el teclado de cantidad ni la categoría.
- Fecha del registro real y jornada 08:00–07:59 se guardan. En venta ingresada de madrugada se atribuye la jornada previa; quien atiende no necesita pensar en esa regla.
- Si se toca dos veces Guardar o falla la transacción, no hay dos ventas: reintento con mismo comando durable.

## R3. Venta multiproducto / cambio de cantidad / ajuste de precio

- Selector admite agregar distintos productos y sumar unidades del mismo.
- Barra persistente: cantidad y total, botón Cobrar; la opción «Ver carrito» lleva a edición.
- Carrito: corregir unidades, eliminar una línea, mostrar subtotales y volver al selector.
- Precio excepcional manual: pantalla contextual de línea, registra precio original y precio efectivo; no debe modificar catálogo ni histórico. **Todavía pendiente**.
- Al cambiar pantalla/reabrir PWA, borrador durable reaparece sin reintroducir contenido. Durante teclado móvil, CTA no debe tapar campo enfocado.
- Si cambia catálogo después de iniciar venta, distinguir borrador e información vigente; no sobrescribir precio seleccionado silenciosamente.

## R4. Transferencia, mixto y fiado — alcance pendiente

**Transferencia (P):** Cobro > Transferencia > elegir Brubank por defecto u otra cuenta atribuible al negocio > verificar movimiento en aplicación bancaria > confirmar manualmente acreditación > guardar la venta. Si no verificó, no marcar como cobrada ni simular validación. Definir qué sucede si físicamente se entregó producto pero acreditación permanece pendiente.

**Mixto (P):** Cobro > Mixto > parte en efectivo + parte transferida y cuenta > total comprobado = venta, confirmación bancaria humana para parte transferida > guardar **una sola venta**. No duplicar recibos ni crear dos ventas.

**Fiado (P):** Cobro > Fiado > cliente identificable por nombre > registrar venta y deuda, **sin sumar caja**. Abono posterior desde Ventas > Fiados > Cliente > Abonar: registrar cobro por medio/cuenta y reducir deuda sin generar nueva venta. No imponer fecha de vencimiento ni límite que el usuario no confirmó.

Hasta implementarse, los métodos no efectivos no deben parecer funcionales.

## R5. Venta física con stock insuficiente

- El cliente recibió realmente la bebida, aunque la app marque cero o menos.
- Guardar la venta, conservar stock negativo/diferencia real y crear revisión pendiente, con costo no calculable si faltan lotes verificables.
- Confirmación comunica «Venta guardada; revisá el stock» sin bloquear venta real ni generar stock ficticio.
- Inicio muestra aviso accionable, que lleva a Productos > Inventario > Revisiones. El ajuste físico tiene motivo y no reescribe asignaciones/costos históricos.
- La futura conciliación permite resolver revisión con pruebas, no solo ocultar una alerta.

## R6. Historial y corrección de venta

- Ventas > Historial > Venta > Detalle > Corregir.
- Se muestra qué se registró, qué se propone corregir y el **efecto neto** sobre unidades/cobro/deuda/costos antes de confirmar.
- Debe usar operaciones compensatorias auditadas, no editar silenciosamente venta original ni asignaciones FIFO previas.
- Falla: conservar formulario y estado previo, sin efectos parciales. Doble toque: un resultado.
- Casos que requieren especificación especial antes de desarrollar: costo de lote agotado por ventas posteriores, cambio de método de pago, cambio de precio, corrección cruzando jornadas, múltiples correcciones e historial de fiados.
- Si corregir ya no es posible por incertidumbre, explicar la revisión necesaria, no simular éxito.

## R7. Alta/edición de producto y stock inicial

- Productos > Agregar. Mínimos: nombre, variante/presentación si distingue SKU, precio; categoría/objetivo opcionales según necesidad. Desactivación no elimina ventas o lotes.
- Producto creado sin stock no recibe unidades inventadas.
- Desde ficha → «Stock inicial»: cantidad física, costo total histórico conocido o explícitamente desconocido. No descontar caja como compra del presente.
- Confirmación duradera de formulario; volver a Productos y ficha, sin obligar a navegar al histórico de operaciones.
- Edición de precio solo para ventas siguientes; anteriores conservan lo cobrado.

## R8. Conteo y ajustes de stock

~~~mermaid
flowchart LR
 A["Productos"] --> B["Inventario"]
 B --> C["Seleccionar producto"]
 C --> D["Cantidad contada"]
 D --> E["Comparar contra stock actual"]
 E --> F["Motivo y confirmación"]
 F --> G["Guardar ajuste único"]
 G --> H["Historial / revisión"]
~~~

- CAS comprueba que la línea base no cambió en otra pestaña; si cambió, no ajustar sobre valor viejo: mostrar diferencia actual y pedir nuevo recuento/confirmación.
- Si sobran unidades, crear lote de costo desconocido; no cambiar ganancia histórica. Si faltan unidades, registrar baja con costo FIFO si es determinable.
- Un conteo sin diferencia puede ser evidencia de verificación sin movimiento de dinero.
- Conteo no equivale a compra, venta, gasto ni entrada de efectivo.

### Interrupción excepcional durante Nueva venta: incidencia física de mercadería

**Observación del usuario (21/10/2026):** no incorporar operaciones especiales para cada excepción dentro de Nueva venta. Si ocurre una rotura mientras se prepara un pedido, continuar el cobro habitual y corregir existencias **después** desde Inventario; ver [20 — Observaciones](20_observaciones_prueba_usuario.md).

- Si el artículo roto **no** integra el carrito, no tocar el borrador.
- Si estaba en el carrito y ya no se venderá, ajustar/eliminar la línea sólo modifica el contenido de la venta, **no** descuenta una merma física del stock.
- Tras la atención: **Más → Inventario → Producto → Ajustar stock**, utilizando el mecanismo validado con motivo, verificación del stock vigente, costo/FIFO/journal según aplique; sin duplicar la venta ni autoajustar el inventario.
- No crear un modal «Registrar rotura» en Selector o Cobro ni exigir que se abandone la pantalla concentrada. No ocultar que la actualización de inventario queda por hacer: es responsabilidad operativa explícita, no un registro automático.

### Precedencia del flujo: lista semanal del proveedor → precios revisados → reposición (25/10/2026)

**El operador confirmó que recibe costos por presentación y quiere empezar por pegar la lista semanal del proveedor, sanearla y calcular sugerencias de precios de venta antes de corregirlas manualmente.** La reposición no debería comenzar exigiendo costos manuales por producto si ya están disponibles en esa lista.

**Ruta lógica propuesta:** Lista del proveedor (texto pegado desde WhatsApp) → normalizar filas/nombres/presentaciones y advertir coincidencias dudosas → asignar al producto de Mora → convertir **precio de presentación ÷ cantidad de unidades** a costo unitario → precio sugerido = **techo a múltiplo de $500 de (costo unitario × 1,50)** → vista comparativa **precio vigente / sugerido** → corrección manual → confirmación explícita de cambios de catálogo para ventas futuras → preparar pedido o precargar carrito de recepción con costos de referencia → **verificar recepción y precio efectivamente pagado** antes de guardar.

- **Nunca al pegar/interpretar:** cambiar precios publicados, stock, lotes, historial de ventas o saldo de Caja; un dato no identificado no se aplica por coincidencia aproximada silenciosa.
- **Al aprobar precios:** modificar precio futuro del catálogo; los importes ya cobrados y los costos históricos FIFO permanecen intactos.
- **Al confirmar recepción:** usar `ReceivePurchase` y **el costo real total de cada línea**, corregible contra la lista; una salida monetaria sumada, stock en unidades y lotes/costo exacto por línea.
- **Costos no son precios de venta:** el recargo del 50 % es **sobre costo unitario**, y el redondeo de $500 se aplica sólo a propuesta de **precio público**, no a costo FIFO. Presentaciones x4/x6/x8/x12 no son universales; cada producto/lista debe verificarlas.
- La lectura de imágenes/OCR queda fuera de esta decisión: no añadir servicios remotos, IA pagada ni sincronización para poder completar el flujo con texto.

Referencia de observación y límites: [20](20_observaciones_prueba_usuario.md).

## R9. Reposición semanal (área propia; pedido aún por diseñar)## R9. Reposición semanal (área propia; pedido aún por diseñar)

~~~mermaid
flowchart TD
 A["Inicio · Para reponer"] --> B["Reposición · área propia de Mercadería"]
 B --> C["Sugerencia por objetivo"]
 C --> D["Editar cantidades y packs"]
 D --> E["Preparar mensaje WhatsApp"]
 E --> F["Pedido enviado · sin stock ni caja"]
 F --> G["Llega mercadería"]
 G --> H["Verificar unidades/costo real"]
 H --> I["Confirmar recepción y pago"]
 I --> J["Stock + · lote FIFO · efectivo -"]
 J --> K["Reporte y Caja consultan mismo evento"]
~~~

- **Entrada principal:** Más → Reposición, independiente de Productos. **Atajo contextual:** desde la ficha de un producto hacia la misma Reposición, con ese artículo preseleccionado. La recepción mantiene un solo servicio/comando y un solo impacto monetario registrado; Caja lo consulta, no vuelve a cargar la compra.
- Presentación compra (fardo, cajón, caja) se convierte a **unidades individuales**. Cambio de precio nunca modifica el precio público automáticamente.
- El proveedor recibe efectivo cuando entrega; no se descuenta Caja al preparar o enviar pedido.
- Entrega parcial: recibir únicamente lo físico; pendiente queda como pedido, no stock fantasma.
- Compra de emergencia reutiliza recepción, diferenciando origen/costo/motivo sin crear un módulo nuevo.
- Reclamo/mercadería defectuosa y reemplazo quedan para especificación posterior, sin inventar compra duplicada.

### Nueva decisión aprobada — recibir una compra completa en un carrito (22/10/2026)

**La persona usuaria eligió una sola compra con múltiples productos**, con un **carrito de Reposición similar al carrito de Ventas**, pero con diferencias reales: packs/cajones/cajas, conversión a unidades, costo total real por línea, costo unitario derivado e impacto monetario. Ver la evidencia literal en [20 — Observaciones](20_observaciones_prueba_usuario.md).

1. **Seleccionar** los artículos recibidos desde Reposición, con búsqueda/listado y posibilidad de iniciar desde una ficha comercial contextual.
2. **Carrito de compra:** agregar/retirar productos, corregir cantidad física real, packs y unidades, revisar costo por línea y suma total. El carrito no es pedido enviado y **no genera stock ni dinero** hasta guardar.
3. **Revisión final:** verificar que todo llegó físicamente y que los costos por línea explican el total real pagado; mostrar resumen de unidades resultantes y dinero que saldrá de Caja. Si el importe registrado no corresponde a lo pagado, **no inventar conciliación ni repartir costos en silencio**.
4. **Una confirmación durable:** un solo `ReceivePurchase` con `receiptId` y varias `PurchaseLine`, lote FIFO y entrada de stock por línea, **una salida de dinero por la suma de costos**, una recepción/historial agrupado; no cargar adicionalmente Gasto desde Caja. Todo en transacción local con idempotencia.
5. **Recuperación:** si se sale del carrito antes de confirmar o se recarga la PWA, definir protección/persistencia adecuada para no perder trabajo; si el comando está sellado, reabrir/reintentar **las mismas líneas**, sin reiniciar a `lines[0]`.

**Auditoría del código vigente (22/10/2026):** el dominio/servicio **ya acepta varias líneas** en `ReceivePurchase` (`src/domain/types.ts`, `src/local/service.ts`), pero `src/App.tsx` aún crea recepciones desde una ficha con una sola línea y `reopenWrite` recupera esa primera línea. **El carrito, sus rutas y recuperación multisproducto son diseño por implementar**, no un cambio de esquema Dexie autorizado por esta decisión.

## R10. Gasto o aporte

- Caja → Movimientos → **Registrar** → **Gasto** o **Aporte**. **Tercera opción principal aprobada como texto y recorrido (22/10/2026): «Mover dinero» → «Entre cuentas» o «Retirar del negocio»**; todavía no implica acción habilitada en el MVP vigente. El retiro saca fondos de Mora; el traspaso efectivo/Brubank conserva fondos de Mora.
- Importe, concepto/por qué, nota opcional y confirmación de efectivo observado.
- Tras guardar, volver al historial de dinero con el registro nuevo. En Reportes se refleja según su naturaleza.
- No registrar una compra de mercadería como gasto puntual: se registra desde recepción, que ya genera salida de dinero.
- Un aporte externo aumenta efectivo registrado, pero no ventas ni ganancia bruta.
- Actualmente este núcleo existe; cambiar solo su ubicación visual y contextual, preservando commandId/datos.

## R11. Retiro/ahorro y transferencia interna (P)

- Caja → Movimientos → Extraer: efectivo que **sale del negocio**. No es un gasto operativo ni continúa dentro de caja de Mora.
- Caja → Cuentas → Traspasar: origen, destino, monto; se restan y suman saldos atribuibles al negocio de forma coherente, sin segunda venta.
- Intercambiar Brubank por efectivo: requiere anotación comprobada de ambas partes, sin inventar saldos bancarios globales.
- Definir cómo registrar ajustes de caja si el dinero contado difiere del esperado: el conteo no debe crear ingresos mágicos ni ocultar la diferencia.

## R12. Caja: comparar sin mentir

- Caja → Resumen muestra movimientos de dinero desde la última referencia conocida, no un saldo físico presunto.
- Usuario introduce valor de efectivo contado y fecha; solo entonces puede mostrarse diferencia contra esperado **si la referencia de apertura es confiable**.
- En ausencia de conteo o saldos iniciales, mostrar «No informado», no $0 por defecto.
- Brubank requiere ingreso/verificación humana; Naranja X/Mercado Pago solo movimientos propios del negocio, no todo el dinero personal.

## R13. Consulta de reportes

- Reportes > Hoy/Semana/Mes > ventas, ganancias estimadas, productos y señales útiles.
- Sin costos completos, ganancia total = no calculable; se puede explicar cuánto sí tiene costo conocido, sin presentarlo como total.
- Gastos y aportes separados de ganancia comercial; las compras no se restan dos veces (ya entran como costo de productos vendidos cuando corresponde).
- Comparaciones y metas solo si hay horizonte y datos suficientes. No mostrar gráficos de ficción o tendencias arbitrarias.
- Desde un importe/historial se puede ir al dueño canónico, conservando el período al regresar.

## R14. Backup y recuperación

- Configuración > Datos > Preparar respaldo JSON > verificar datos > descargar archivo independiente del navegador.
- Restauración: elegir archivo, validar integridad semántica y formato, mostrar vista previa, verificar que la base destino esté vacía, pedir confirmación expresa, restaurar en una sola transacción o dejar intacto el destino.
- Archivo antiguo formato 1 de PR #9 debe seguir importable; backup nuevo formato 2 no puede degradarse a cliente antiguo.
- No usar la restauración para fusionar dos instalaciones con datos ni describirla como sincronización.
- Si almacenamiento está lleno, conservar estado pendiente e indicar solución que **no borre los datos del sitio**.
- Desde Inicio puede haber recordatorio si pasó mucho sin backup; acción abre Configuración > Datos sin crear otro exportador.

## R15. Actualización de PWA y funcionamiento offline

- El service worker mantiene shell para uso offline; las transacciones de negocio se guardan en Dexie, no en caché de assets.
- Cuando existe actualización, informar y permitir aplicar sin interrumpir acción en curso o borrador. Nunca borrar IndexedDB por actualizar interfaz.
- Cada navegador conserva dataset propio. Sin conexión: venta local real sigue pudiendo guardarse. No prometer sincronización entre dispositivos.
- Si se cambia versión de esquema, migración aditiva y backups previos verificados, sin reescribir historial.

## Tareas de evaluación de navegación

Antes de aprobar el mapa, pedir buscar, **sin ayuda de pistas técnicas**, estos destinos:
1. «Se rompió una botella: quiero ajustar las unidades».
2. «Puse efectivo de mi bolsillo para comprar mercadería».
3. «Llegaron dos cajones y acabo de pagarlos».
4. «Quiero saber cuánto vendí el fin de semana».
5. «Cobré mal una venta anterior».
6. «Quiero guardar mis datos antes de cambiar de teléfono».
7. «Quiero confirmar cuánto efectivo real quedó».
8. «Tengo un cliente que me paga una deuda».
9. «Quiero preparar el pedido del jueves».
10. «Quiero consultar el precio sin registrar una venta».

**Medir** primer destino elegido, aciertos, retrocesos y explicaciones. Si el mapa falla, cambiar el plano antes del JSX; no arreglarlo con un botón extra en Inicio.
