# Auditoría de reglas de negocio — decisiones pendientes

**Este documento no aprueba reglas heredadas.** Todas se replantean con ejemplos reales y pruebas; registrar para cada punto decisión, motivo, riesgos y criterios de aceptación.

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

## Preguntas cruzadas prioritarias

- ¿Se puede confirmar una venta sin conexión? Si sí, ¿cómo se resuelve cuando otro teléfono ya vendió el mismo stock?
- ¿Qué operaciones exigen confirmación del servidor para ser definitivas y cuáles admiten estado provisional?
- ¿Puede una reposición offline compensar ventas offline de otros equipos?
- ¿Qué ocurre si se modifica el mismo producto desde dos dispositivos?
- ¿Qué pasa si un dispositivo se revoca mientras tiene operaciones pendientes?
- ¿Qué información actual debe sobrevivir al reinicio del Supabase anterior?
- ¿Conviene iniciar un negocio/dataset remoto limpio en el mismo proyecto o en uno nuevo?

**Regla:** ninguna operación de venta, stock o dinero debe depender de un último-escritor-gana silencioso.
