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

## Preguntas cruzadas prioritarias

- ¿Se puede confirmar una venta sin conexión? Si sí, ¿cómo se resuelve cuando otro teléfono ya vendió el mismo stock?
- ¿Qué operaciones exigen confirmación del servidor para ser definitivas y cuáles admiten estado provisional?
- ¿Puede una reposición offline compensar ventas offline de otros equipos?
- ¿Qué ocurre si se modifica el mismo producto desde dos dispositivos?
- ¿Qué pasa si un dispositivo se revoca mientras tiene operaciones pendientes?
- ¿Qué información actual debe sobrevivir al reinicio del Supabase anterior?
- ¿Conviene iniciar un negocio/dataset remoto limpio en el mismo proyecto o en uno nuevo?

**Regla:** ninguna operación de venta, stock o dinero debe depender de un último-escritor-gana silencioso.
