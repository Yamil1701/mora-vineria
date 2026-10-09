# Descubrimiento operativo — Mora Vinería 2.0

Fecha de revisión: 2026-10-09. **Fuente: conversación directa sobre la operación real del negocio.**

## Cómo leer este documento

- **HECHO CONFIRMADO:** descripción de cómo se trabaja hoy; no implica que haya sido diseñada una funcionalidad.
- **PREFERENCIA/REQUISITO EXPRESO:** el usuario pidió un comportamiento futuro.
- **PROPUESTA:** interpretación o solución planteada por el asistente; todavía hay que validarla.
- **PENDIENTE:** falta una decisión o una prueba.

Este documento **complementa** `docs/01_revision_de_reglas.md`, que sigue siendo la lista maestra de decisiones por revisar. No transforma propuestas en requisitos aprobados.

## 1. Atención y venta al público

### HECHOS CONFIRMADOS
- El cliente llega a una ventanilla, pregunta si hay un producto y cuánto cuesta; si acepta, entrega el dinero.
- Quien atiende verifica el monto recibido, prepara el vuelto si hace falta, toma el producto y lo entrega junto al cambio.
- En el proceso físico no se anota nada.
- Existencias: se saben mayormente de memoria; ante dudas se revisan freezers o el único estante del local.
- Precios al público: se recuerdan de memoria y se dispone de una lista manuscrita de referencia.
- A veces es cómodo usar el celular mientras se atiende; otras se atiende y se registra después.
- Son igual de frecuentes las compras de un solo producto y las de varios productos.
- La mercadería se **vende por unidad**: incluso cuando alguien compra cinco botellas, son cinco unidades sueltas; no se vende al público por fardo.

### PREFERENCIAS/REQUISITOS EXPRESOS
- Priorizar registrar mientras se atiende, permitiendo también carga posterior cuando sea necesario.
- Experiencia simple, natural, no intimidante, claramente superior en calidad visual a V1.
- Hacer mockups y revisar alternativas gráficas **después** de definir las necesidades y recorridos.

### PROPUESTAS
- Un solo flujo de venta rápida para una o varias unidades, con búsqueda, selección, cantidades, cobro y confirmación.
- Consulta opcional de precios y stock sin pasos obligatorios.
- Borrador durable ante bloqueo de pantalla, cambio de app, recarga y desconexión.
- Registro posterior simplificado sin obligar a repetir pasos que ya ocurrieron.

### PENDIENTES
- Definir fecha/hora al registrar más tarde, relación con jornada y reportes, cobro ya realizado y consecuencias de stock offline.
- No asumir que la venta es definitiva para todos los dispositivos hasta confirmación remota.

## 2. Cobro y formas de pago

### HECHOS CONFIRMADOS
- **Efectivo y transferencia** son las formas de pago más frecuentes, con importancia similar.
- A veces se hace un **pago combinado**.
- Existe el **fiado**, de uso limitado.
- Ocasionalmente hay regateo o ajuste mínimo de precio a criterio de quien vende; ejemplos habituales de diferencia: $100, $200 o hasta $300, **sin límite formal establecido**.
- Ante transferencia, esperan la acreditación **antes de entregar el producto**; también se verifica la acreditación de la parte transferida de un pago combinado.
- Mayormente se espera la notificación de **Brubank**; si demora, se abre la app bancaria y se revisan movimientos.
- La **gran mayoría** de las transferencias se recibe en Brubank. Ocasionalmente llegan a **Naranja X** o **Mercado Pago** porque pertenecen a la misma persona; posteriormente se transfieren a Brubank.
- Brubank se usa **exclusivamente para el negocio**. No se confirmó que las otras cuentas sean exclusivas.

### PROPUESTAS
- Efectivo y transferencia accesibles directamente; pago combinado y fiado como opciones menos prominentes.
- Para efectivo, ingresar opcionalmente recibido y mostrar vuelto.
- Para transferencia, confirmar manualmente después de ver el movimiento en Brubank u otra cuenta; no simular verificación bancaria.
- Brubank como cuenta predeterminada; Naranja X y Mercado Pago alternativas seleccionables.
- Cada cobro conserva su cuenta receptora real.
- Permitir ajustes excepcionales de precio, guardando precio de referencia y precio efectivamente cobrado, sin tope inventado.
- Una transferencia posterior entre cuentas propias **no** cuenta como segunda venta o ganancia.
- No exigir registrar el saldo total personal de las cuentas que también usan para otros fines.

### PENDIENTES
- Confirmar si el fiado exige cliente, vencimiento, parciales o límites y cómo mostrar la deuda.
- Definir cobros fallidos/pendientes y operaciones sin internet.
- Determinar si las cuentas alternativas necesitan saldo operativo de Mora separado del saldo bancario real.
- Política de ajustes de precios, descuentos y auditoría.

## 3. Efectivo, ahorro y reinversión

### HECHOS CONFIRMADOS
- El efectivo recaudado también se usa para dar vuelto.
- Hay una caja con billetes de $100, $200 y $500, sumando aproximadamente **$10.000–$20.000** en sencillo.
- Se intenta conservar además **$10.000–$20.000** en billetes de $1.000, con variación según disponibilidad, especialmente en el sencillo.
- Diaria o semanalmente, según necesidad, se separa el efectivo excedente.
- **Corrección expresa del usuario:** lo clasificado como **ahorro se quita del negocio**; debe verse como una **extracción**, también puede haber retiros personales. NO registrar este ahorro como un simple traslado a otra caja que continúa dentro de la tesorería operativa.
- **Reinversión** significa usar dinero del negocio para comprar mercadería: se cambia dinero por stock; NO equivale a ahorro o retiro.

### PROPUESTAS
- Registrar caja destinada a atención/vuelto con montos objetivo orientativos, no límites obligatorios.
- Registrar extracción/ahorro fuera del negocio de manera diferenciada de un gasto operativo.
- Registrar retiros personales separadamente cuando sea relevante; no tratarlos automáticamente como costo de ventas.
- Registrar compras/reposiciones como salida de dinero y entrada de unidades; evitar contarlas dos veces como gasto y costo del producto.
- Distinguir resultados estimados, dinero disponible y retiros en los reportes.

### PENDIENTES
- Precisar el tratamiento de retiros/ahorro en indicadores y cierres; identificar si la reserva se considera dinero personal o separado de la operación.
- Determinar si se necesita conteo por billetes, fondo objetivo, arqueo o solo saldo y movimientos.

## 4. Reposición y proveedor

### HECHOS CONFIRMADOS
- Principalmente se compra mercadería con la recaudación del negocio, a veces denominada coloquialmente «ganancias de ventas»; no asumir que toda recaudación es beneficio neto.
- El proveedor **solo acepta efectivo** actualmente.
- Para conseguir efectivo, a veces se intercambia dinero de Brubank por dinero físico con otra persona.
- Hay aportes personales esporádicos para sumar mercadería, no necesariamente porque falte dinero, aunque también pueden ocurrir por escasez.
- El proveedor remite una **lista semanal de precios por WhatsApp**, de formato muy irregular.
- A partir de esa lista se preparan pedidos usualmente **un día antes** de la entrega del jueves o viernes; se manda el pedido por WhatsApp.
- El proveedor entrega jueves o viernes y cobra **en efectivo cuando descarga la mercadería**.
- Casi siempre entrega exactamente lo solicitado; rara vez falta un artículo. Los precios pactados no cambian al entregar.
- La compra llega en packs/fardos/cajas/cajones, pero el **inventario y las ventas se expresan en unidades individuales**.

### PREFERENCIAS/REQUISITOS EXPRESOS
- En el futuro se quiere pasar la lista mal redactada a Mora para **reconocer productos y registrar costos/precios de compra** con menos trabajo.
- La primera vez la persona puede especificar la presentación habitual (x4, x6, x8, etc.) y Mora la recuerda para reconocerla en futuras listas. La idea de «IA aprende» debe interpretarse como aprendizaje de equivalencias verificadas, con posible asistencia de IA, sin asumir un entrenamiento automático del modelo.

### PROPUESTAS
- Estados simples del pedido: preparando, pedido enviado/pendiente, recibido.
- Pedido pendiente **no** agrega stock ni descuenta dinero; la recepción confirmada actualiza las unidades efectivamente recibidas y registra el pago.
- Ante faltantes excepcionales, ajustar la cantidad recibida antes de confirmar.
- Manejar presentación de compra por proveedor/producto (alias, nombre, volumen, unidades por paquete), recordada pero siempre editable; no asumir estándares universales.
- Convertir paquetes a unidades: 2 fardos de 8 implican **16 unidades** recibidas.
- Procesar lista por texto pegado desde WhatsApp, con vista previa, coincidencias, advertencias de ambigüedad y revisión humana. Empezar por reglas y equivalencias persistentes; evaluar IA cuando agregue valor. Registrar el costo de compra **sin actualizar automáticamente el precio al público**.
- Las líneas dudosas o inconsistentes no se completan silenciosamente.
- Guardar y probar por separado transferencias de Brubank por efectivo y pagos reales al proveedor.

### PENDIENTES
- Confirmar estrategia de proveedores, costes unitarios, cambios de pack, compra por unidad, faltantes, devoluciones y corrección de pedido.
- Determinar si se crea la orden en Mora y se copia a WhatsApp, o primero se manda WhatsApp y luego se registra; no agregar trabajo innecesario.
- Resolver formato, disponibilidad offline y eventual costo de usar IA para importar.
- El archivo `docs/05_ejemplo_lista_proveedor.md` conserva un ejemplo **histórico no vigente** de la lista cruda.

## 5. Formación de precios de venta

### HECHO CONFIRMADO
- **Se intenta obtener un 50 %**, sujeto a ajustes a ojo y redondeos. No es un porcentaje rígido aplicado siempre.

### REGLA CONFIRMADA: cálculo del 50 % (aclaración del usuario)
- La expresión utilizada es: **precio de compra unitario × 50 ÷ 100**, luego **sumar ese resultado al costo unitario**.
- Equivale a **recargo sobre el costo de compra del 50 %**: `precioSugerido = costoUnitario * (1 + 50/100)`.
- Ejemplo: costo unitario $10.000 → recargo $5.000 → **venta sugerida $15.000**.
- No confundir con margen del 50 % sobre precio de venta (que daría $20.000). El margen bruto sobre venta, si se aplica el recargo exactamente, es ~33,33 %.
- Se redondea o ajusta **a ojo** y no es un porcentaje rígido; la sugerencia nunca debe cambiar automáticamente el precio público.
- **Criterio habitual de redondeo confirmado (9/10/2026):** una vez calculado el recargo, elevar el precio sugerido al siguiente múltiplo de $500. Ejemplos aportados: $5.250 → $5.500 y $5.700 → $6.000. Si ya es múltiplo exacto, no se agrega otro escalón. La fórmula de sugerencia queda `precioSugerido = ceil((costoUnitario * 1.5) / 500) * 500` para importes no negativos, como comportamiento predeterminado orientativo.
- **Validación humana:** el precio sugerido **nunca** se impone ni actualiza automáticamente en el catálogo; quien administra puede aceptarlo o cambiarlo. Los redondeos y ajustes a ojo siguen permitidos.
- **Pendiente:** evaluar excepciones de importes bajos, configuración del porcentaje por producto/categoría y qué costo usar de referencia (último, promedio u otro) al cambiar las listas.

### PROPUESTA
- Presentar sugerencia de venta como ayuda editable y mantener costo, precio sugerido y precio efectivo separados.
- Los precios semanales importados del proveedor se consideran **costos de compra** hasta revisión; no son precios de venta pública.

## 6. Sincronización y producto nuevo

### PREFERENCIAS/REQUISITOS EXPRESOS
- Reconstrucción total de V2 con archivo histórico en `legacy/v1-final`; `master` es nuevo punto de partida.
- Reexaminar **todas** las decisiones antiguas, incluso las que se conservaron en el pasado.
- **Supabase** será el servidor central. Cada dispositivo autorizado recuperará los últimos datos confirmados al estar conectado y enviará después las operaciones hechas sin red.
- Cuando no haya conexión, poder continuar comprando, vendiendo y registrando operaciones localmente, conciliando posteriormente.
- Realizar mockups, prototipos y salto gráfico cuando se llegue a la etapa visual; no asumir que la UI anterior será reutilizada.

### PROPUESTAS Y LIMITACIONES
- PWA mobile-first, IndexedDB/Dexie para datos locales y cola duradera, Supabase/Postgres para autoridad compartida, operaciones idempotentes y confirmaciones transaccionales.
- Realtime complementado con lectura incremental; datos y actualizaciones de la propia PWA son procesos diferentes.
- Preservar el trabajo local, distinguir pendiente de confirmado, no sobrescribir conflictos automáticamente.
- Con varios teléfonos desconectados no es posible garantizar a la vez aceptación ilimitada de ventas offline y ausencia absoluta de sobreventa sin acordar una política adicional.
- Backup JSON independiente de la sincronización; su compatibilidad y recuperación se deben validar.
- La V1 no se copia por inercia: jornadas, stock objetivo, umbrales, seguridad, fiados y reportes continúan pendientes de análisis.

## 7. Alta de productos con códigos de barras (propuesta del usuario)

- Se planteó incorporar el escaneo con cámara para acelerar la **primera carga** y recuperar información de productos desde una base de datos.
- El usuario **no decidió aún si vale la pena**, por lo que se registra como **hipótesis de utilidad a probar**, no como requisito obligatorio.
- Un código identifica un producto; no aporta automáticamente precio de compra/venta, stock ni unidades por fardo. Un catálogo externo podría devolver marca, nombre, presentación o foto, pero no garantiza cobertura correcta.
- Proponer alta asistida con confirmación y alternativa manual; probar primero una muestra de envases reales del negocio. Consultar [06_lector_de_codigos.md](06_lector_de_codigos.md).
- No vincular este lector al uso cotidiano de venta salvo que el test de experiencia lo justifique.

## 8. Pérdidas, reclamos y diferencias de stock (9 de octubre de 2026)

### HECHOS CONFIRMADOS POR EL NEGOCIO
- Si **se rompe una botella en el local**, se considera una **pérdida**.
- Si el proveedor **entrega un artículo roto, vencido o en mal estado**, se le reclama y **habitualmente lo repone la semana siguiente**.
- Los vencimientos en mercadería que ya estaba en venta **prácticamente no han sucedido** según la experiencia actual; no descartarlos del modelo, pero tampoco crear un flujo complejo sin necesidad.
- Si alguien consume productos del negocio, **el 99,9 % de las veces se pagan**. No asumir consumo personal gratuito como regla.
- Si un conteo revela **menos unidades de las esperadas**, no se encuentra el motivo y el negocio había invertido dinero en ellas, se **considera pérdida**. El usuario condicionó este criterio a «siempre y cuando se haya gastado en esa inversión»; hace falta precisar casos concretos de esa condición.

### PROPUESTAS POR VALIDAR
- Añadir una corrección simple de stock por motivo, para una o varias unidades, con fecha/hora real y usuario/dispositivo cuando corresponda, sin disfrazarla de venta.
- Motivos sugeridos: **rotura**, **faltante sin explicación**, **producto no apto** y **corrección de conteo**; evitar forzar todos los casos a la misma causa económica.
- Separar **baja física de unidades** de la **pérdida monetaria estimada**. Valorar la pérdida, cuando corresponda, por costo de compra de esas unidades y no por precio de venta al público. No descontar el costo de esas unidades de nuevo si ya se reflejó en otro cálculo.
- Distinguir **incidente propio** de **reclamo al proveedor**. Un artículo no apto que llega con una entrega no debe contarse como stock vendible; si se detecta después, debe retirarse de unidades vendibles. La reposición futura aumenta stock únicamente al recibirse.
- La sustitución sin cargo por el proveedor no debe registrarse automáticamente como una compra nueva ni duplicar gastos; si resulta útil, vincular el reclamo original con la reposición.
- El consumo de mercadería **pagado** sigue el recorrido normal de venta; los casos excepcionales no pagados quedan sin política definida.
- Mantener operaciones de ajuste y reclamo compatibles con funcionamiento offline, reintentos y sincronización sin duplicados.

### PENDIENTES
- ¿Se hacen conteos periódicos de mercadería o solo cuando aparece una duda o un faltante?
- ¿Qué significa exactamente que la pérdida se reconozca «si se gastó en esa inversión», especialmente si el proveedor compensa unidades?
- ¿Quién y cómo confirma que un reclamo quedó atendido?
- Definir si se necesita historial visible de ajustes, límites de corrección y valoración económica de pérdidas.

## 9. Seguimiento

Cada nueva sesión de descubrimiento debe:
1. Registrar el **hecho observado** o requisito declarado con fecha.
2. Distinguirlo de la **propuesta** de interacción o arquitectura.
3. Anotar decisiones abiertas y criterios de aceptación, evitando tomar suposiciones como reglas.
4. Actualizar este registro o documentos normativos antes de implementar.
5. Mantener vinculados casos de prueba reales, incluyendo la lista original del proveedor.

**Estado actual:** descubrimiento en curso; no se aprobaron pantallas, diseños definitivos ni esquema de datos. Sí se confirmó la regla habitual de recargo del 50 % sobre el costo unitario; los detalles de redondeo están abiertos.
