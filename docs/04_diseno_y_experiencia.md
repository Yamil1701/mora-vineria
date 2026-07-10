# Diseño y experiencia

## Estado del diseño

El documento de diseño es vigente. Parte del sistema visual ya está aplicada —paleta oscura, navegación inferior, cards, jerarquía mobile y lenguaje— y otras decisiones siguen pendientes. La matriz exacta está en `06_estado_implementacion.md`.

## Contexto y personalidad

La app se usa principalmente desde el celular, muchas veces de noche y durante atención rápida. Debe sentirse cálida, joven, moderna, simple y confiable; nunca como un ERP ni como una interfaz de lujo recargada.

## Paleta

| Token | Color | Uso |
| --- | --- | --- |
| Principal | `#D7268F` | CTA y acentos importantes |
| Fondo | `#121014` | Base oscura |
| Suave | `#F2C6D8` | Detalles y texto destacado |
| Éxito | `#28D970` | Confirmaciones |
| Verde oscuro | `#0D3927` | Contraste secundario |
| Advertencia | `#F5B82E` | Atención no destructiva |
| Error | `#E5484D` | Errores y acciones peligrosas |
| Información | `#3BA7FF` | Ayuda y estados neutrales |

El rosa se reserva para acciones importantes. Los brillos deben ser suaves para no molestar en ambientes oscuros. Evitar negro puro dominante, dorados fuertes y exceso de color.

## Navegación

La barra inferior contiene siempre Inicio, Ventas, Productos y Reportes. Movimientos, Proyecciones y Configuración se acceden desde las pantallas relacionadas y accesos rápidos.

La navegación y los CTA deben considerar áreas seguras del teléfono y mantener objetivos táctiles cómodos.

## Componentes

- Cards para agrupación y lectura rápida.
- Botón principal rosa; secundarios oscuros o neutros.
- Badges semánticos suaves.
- Campos grandes, con label visible y errores cercanos.
- Toast para resultado de acciones no bloqueantes.
- Alert Dialog para confirmaciones sensibles.
- Estados de carga, vacío, error y solo consulta coherentes.

Radix UI está aprobado para toast y confirmaciones. Los toast aparecen arriba, no incluyen una `x` visible y desaparecen automáticamente; una acción necesaria debe ofrecerse como botón con texto.

## Feedback

Toda acción debe responder de manera visible:

- éxito: confirmar qué quedó guardado o actualizado;
- advertencia: explicar qué revisar sin sonar agresivo;
- error: decir qué ocurrió y cómo continuar;
- procesamiento: deshabilitar doble envío y mostrar texto de progreso;
- modo consulta: explicar por qué la acción no está disponible y dónde realizarla.

No usar toast para decisiones destructivas ni para información que el usuario deba leer antes de continuar.

## Confirmaciones

Requieren diálogo:

- guardar venta;
- registrar reposición, aporte o gasto;
- anular ventas o movimientos;
- eliminar o desactivar datos;
- ajustar stock manualmente;
- restaurar un backup.

El diálogo debe describir el efecto concreto. Las anulaciones exigen motivo. La acción segura se presenta primero; la destructiva usa color de peligro cuando corresponde.

## Movimiento y animaciones

Las animaciones deben ayudar a comprender cambios de estado, no decorar.

- Duración habitual: 150–250 ms.
- Usar transiciones suaves en apertura, selección, feedback y cambios de lista.
- Evitar rebotes intensos, parallax, destellos y movimientos largos.
- No demorar la carga de venta ni bloquear interacción por una animación.
- Respetar `prefers-reduced-motion`; sin movimiento, la información debe seguir siendo clara.
- Los elementos que aparecen o desaparecen no deben provocar saltos confusos de layout.

## Pantallas clave

### Nueva venta

Buscador visible, selección rápida, carrito compacto, cantidades claras, precio editable en “Más opciones” y confirmación con productos, cantidades, medio de pago y total.

### Productos

Cards por defecto, vista compacta opcional, inactivos ocultos, stock visible y costo fuera del resumen principal. Editar stock manualmente debe advertir que no genera movimiento.

### Movimientos

Reposición, aporte y gasto se muestran como acciones distintas. Reposición y aporte tienen más protagonismo que gasto puntual. El historial diferencia estados y anulaciones.

### Reportes

Métricas escaneables, filtros claros, rankings y gráficos simples cuando se incorporen. No sobrecargar ni usar lenguaje contable pesado.

### PDF

Vista clara, fondo blanco, A4, buena jerarquía y elementos que eviten cortes internos al imprimir.

## Lenguaje

Usar español simple, cercano y directo. Decir “ganancia estimada”, “respaldo”, “copia de datos”, “modo del dispositivo” y “celular principal/de consulta”.

Evitar “día operativo”, “sincronización”, “rol de usuario”, tecnicismos y mensajes desmotivadores.

## Accesibilidad

- Mantener contraste suficiente.
- No depender solo del color.
- Labels asociados a campos.
- Foco visible y orden lógico de teclado.
- Diálogos con gestión de foco y escape.
- Mensajes dinámicos anunciados cuando corresponda.
- Botones con texto o nombre accesible.

## Criterio final

La venta debe ser el flujo más rápido. Los reportes deben ayudar a entender. Las proyecciones deben orientar. El feedback debe dar confianza sin interrumpir de más.
