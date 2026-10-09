# Auditoría de reglas de negocio — decisiones pendientes

**Las decisiones heredadas se revisan, pero varios temas quedaron resueltos explícitamente en el cuestionario del 9/10/2026.** Consultar [07_cierre_relevamiento_16_preguntas.md](07_cierre_relevamiento_16_preguntas.md): esas respuestas prevalecen sobre las preguntas abiertas más antiguas de este documento. No presentar reglas ya confirmadas como pendientes.

| Tema | Comportamiento previo o supuesto | Qué revisar |
| --- | --- | --- |
| Jornada de venta | 08:00 a 07:59; guardar hora real y fecha atribuida | ¿Sigue reflejando turnos reales, reportes y madrugadas? Zona horaria y horario de verano |
| Catálogo | Productos, categorías, presentación, precio y costo | Campos esenciales y flujo de altas/edición; fotos; simplicidad |
| Stock | No negativo, objetivo por producto, umbrales porcentuales | Cómo registrar conteos, ajustes, ventas simultáneas y reposiciones |
| Umbrales | Históricamente 10 % crítico y 30 % bajo (en documentos antiguos hay propuestas distintas) | Elegir porcentajes y redondeos; posibilidad de no definir objetivo |
| Ventas | Carrito, cobro, precio histórico, anulaciones | Menor cantidad de pasos sin perder exactitud; ventas offline |
| Pagos y fiados | Efectivo, transferencia, cobro combinado y deuda | Necesidad real, devoluciones, cobros parciales y casos límite |
| Reposición | Pendiente, confirmación, unidades/bultos, costos | Complejidad necesaria, cuándo aumentar stock, múltiples dispositivos |
| Gastos y aportes | Movimientos independientes de las ventas | Categorías mínimas y registros necesarios |
| Dinero | Caja/cuentas digitales, transferencias y retiros | Alcance real del MVP y efectos de cobros offline |
| Costos y ganancias | Promedio ponderado y fotos históricas | Definiciones comprensibles y resultados verificables |
| Reportes y proyecciones | Jornada, semanas, mes, proyección | Qué decisiones permiten tomar y cuáles sobran |
| Bajas/anulaciones | Trazabilidad; desactivación con historial | Qué se puede corregir y cómo revertir sin duplicar efectos |
| Acceso | Dispositivo principal, operación y consulta | Autorizar, revocar y recuperar un celular sin cuentas personales complejas |
| Backups | JSON restaurable y exportaciones | Compatibilidad, recuperación probada, cifrado o resguardo del archivo |
| Navegación | Barra inferior y pantallas secundarias | Arquitectura de tareas según pruebas con usuarios |
| Identidad visual | Tema oscuro y marca Mora | Diseño y legibilidad nocturna, estados, feedback |

## Descubrimiento del negocio — compras por presentación (9 de octubre de 2026)

**Confirmado por la operación real:**
- Las ventas al público se hacen por unidad; pedir varias botellas equivale a vender varias unidades individuales, no un fardo.
- Las compras al proveedor pueden venir en fardos, cajas o cajones; el inventario siempre incrementa unidades vendibles.
- La lista semanal suele llegar como texto irregular por WhatsApp; el pedido se realiza antes de la entrega, se paga en efectivo al recibirlo y normalmente llega tal como se pidió.
- A veces el texto omite la marca, volumen o cantidad del paquete, o mezcla importes por paquete y por unidad.

**Propuesta a validar:** al vincular por primera vez un producto y una presentación con ese proveedor, la persona define cantidad de unidades por bulto (por ejemplo x4, x6, x8, x12), nombre y volumen. Mora recuerda el vínculo *producto + presentación + proveedor* para futuras listas y propone la interpretación conocida. Es un valor por defecto editable, nunca una restricción ni un estándar global asumido. La compra concreta guarda la cantidad, costo y presentación realmente utilizados, incluso si difieren de lo habitual.

**Reconocimiento asistido:** empezar por coincidencias y reglas deterministas con un diccionario persistente de alias/correcciones; evaluar asistencia mediante IA para listas ambiguas solo si ofrece valor adicional. «Aprender» significa recordar las correcciones verificadas; no supone reentrenar un modelo. La vista previa debe mostrar confianza, advertir precios incompletos/inconsistentes y exigir confirmación humana antes de guardar costos. La lectura de la lista no altera automáticamente precios de venta ni stock, y requiere un plan para uso sin conexión.

**Ejemplo de conversión:** un pedido de dos fardos de 8 suma 16 unidades al stock únicamente al confirmar la recepción. Si no consta cuántas trae un fardo y no existe una presentación verificada, pedir el dato; no inferirlo como hecho.

**Pendiente:** modelar variantes de volumen/tamaño, qué hacer con cambios de presentación, alias compartidos entre proveedores y separación explícita de costos de compra versus precios de venta.

## Política de precio de venta — descubrimiento (9 de octubre de 2026)

**Confirmado y aclarado por el usuario:** el precio de venta de referencia se calcula con **recargo del 50 % sobre el costo unitario**, es decir, costo × 50 ÷ 100 y ese recargo se suma al costo. Ejemplo: $10.000 → $15.000. El precio puede redondearse y ajustarse a criterio del negocio; no es un límite ni una regla automática de actualización. **Redondeo habitual confirmado:** después del recargo, se sugiere subir al siguiente múltiplo de **$500** (por ejemplo $5.250 → $5.500 y $5.700 → $6.000), sin aumento adicional si el resultado ya es múltiplo exacto; **el usuario valida y puede cambiar el precio final**. **Pendiente:** base de costos y porcentajes configurables, y excepciones a este redondeo. Los costos de la lista del proveedor no deben modificar automáticamente precios al público.

La descripción completa de la operación y la trazabilidad entre **hechos, preferencias, propuestas y puntos abiertos** están en [04_descubrimiento_operativo.md](04_descubrimiento_operativo.md); la lista de WhatsApp conservada como ejemplo de prueba está en [05_ejemplo_lista_proveedor.md](05_ejemplo_lista_proveedor.md).

## Lector de códigos en alta inicial — hipótesis por validar

El usuario propuso usar la cámara para identificar el producto y facilitar su carga inicial, pero aún no determinó si el beneficio justifica su incorporación. Se investigará como **opción asistida, nunca obligatoria**, probando lectura real de códigos, cobertura de catálogos de productos en Argentina, ingreso manual alternativo y disponibilidad offline. No se supone que el código contenga precio/stock ni que siempre exista información pública confiable. Detalle y criterios de prueba: [06_lector_de_codigos.md](06_lector_de_codigos.md).

## Pérdidas y diferencias de stock — descubrimiento

**Confirmado:** roturas propias se consideran pérdidas; mercadería rota/vencida/defectuosa entregada por el proveedor se reclama y suele ser repuesta la semana siguiente. Vencimientos internos casi nunca ocurrieron. El consumo personal casi siempre se paga como venta. Los faltantes sin causa conocida se consideran pérdidas cuando representan unidades adquiridas con dinero invertido por el negocio.

**Propuesta no aprobada:** registrar bajas de stock con motivo y trazabilidad, diferenciar faltante o rotura propia de devolución/reclamo con reposición sin cargo, y evitar computar dos veces costos o ingresos. Hay que distinguir unidades físicas de pérdida económica.

**Recuento observado:** se cuentan físicamente productos cuando quedan pocos y se compara con el stock que informa la app; para preparar una reposición también se inspecciona/recuerda el stock físico, frecuentemente sin usar la app. **No se confirmó que realicen conteos generales periódicos.** Proponer comprobación de stock puntual y ayuda opcional para planear compra, sin imponer inventario completo.

**Criterio de reposición confirmado:** mantener una cantidad habitual por producto que alcance para las ventas previstas hasta la próxima entrega semanal, con algo de margen ante aumentos de demanda. Combina experiencia y estimación de ventas; no equivale a reponer siempre un fardo completo ni usar un mínimo global.

**Propuesta por validar:** stock objetivo orientativo por producto y cantidad a comprar sugerida a partir del faltante, ajustable por la persona; eventualmente aprovechar ventas históricas cuando los datos sean suficientes y confiables. **Pendiente:** cuantificar margen de seguridad, método de cálculo de demanda, reposiciones pendientes, confirmación de reclamos, definición económica precisa de «inversión» y comportamiento offline para ajustes concurrentes. Detalle: [04_descubrimiento_operativo.md](04_descubrimiento_operativo.md).

**Compra de urgencia confirmada:** normalmente se espera la próxima entrega si algún producto se agota. **Excepción:** cerveza cerca del fin de semana, cuando aumenta la demanda, que a veces se consigue por fuera de la reposición habitual. **Propuesta:** permitir reposición extraordinaria simple y alertas contextualizadas, sin tratar todos los productos agotados como urgencias. **Pendiente:** origen, costo y condiciones de esas compras. Detalle: [04_descubrimiento_operativo.md](04_descubrimiento_operativo.md).

## Preguntas cruzadas prioritarias

- ¿Se puede confirmar una venta sin conexión? Si sí, ¿cómo se resuelve cuando otro teléfono ya vendió el mismo stock?
- ¿Qué operaciones exigen confirmación del servidor para ser definitivas y cuáles admiten estado provisional?
- ¿Puede una reposición offline compensar ventas offline de otros equipos?
- ¿Qué ocurre si se modifica el mismo producto desde dos dispositivos?
- ¿Qué pasa si un dispositivo se revoca mientras tiene operaciones pendientes?
- ¿Qué información actual debe sobrevivir al reinicio del Supabase anterior?
- ¿Conviene iniciar un negocio/dataset remoto limpio en el mismo proyecto o en uno nuevo?

**Regla:** ninguna operación de venta, stock o dinero debe depender de un último-escritor-gana silencioso.
