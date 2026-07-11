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

## Navegación y arquitectura de información

La barra inferior contiene Inicio, Ventas, una acción central de Nueva venta, Productos y Más. En modo consulta distribuye los cuatro destinos sin una acción inutilizable. “Más” agrupa Operación, Análisis y Sistema con iconos y texto.

Nueva venta es una acción global thumb-friendly en el dispositivo principal. Los listados son la entrada de cada módulo. Los detalles abiertos desde un listado usan sheets vinculadas a su ruta y preservan el contexto visual; una URL directa sigue funcionando como vista enfocada. Bottom sheets se reservan para carrito y tareas contextuales. La barra general se oculta durante tareas secundarias.

La navegación y los CTA respetan áreas seguras, teclado virtual y objetivos táctiles de al menos 48 px. Las acciones principales se ubican en la mitad inferior cuando sea posible y las destructivas no se colocan junto a acciones frecuentes.

Filtros, período, preferencia de vista y posición de lectura deben conservarse razonablemente al entrar a un detalle y volver.

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

La búsqueda concentra la selección y oculta productos ya agregados. El carrito vive en un bottom sheet accesible desde una barra inferior; permite quitar explícitamente, cambiar cantidades, editar precio y vaciar. La revisión y el cobro continúan dentro del sheet. El aviso de recuperación aparece solo cuando existían productos antes de abrir la tarea. Efectivo ofrece cálculo transitorio de vuelto y Transferencia exige elegir destino. Al guardar se vuelve al historial: la venta destaca una sola vez, su fondo se desvanece y los productos tienen más jerarquía que la fecha.

### Productos

Vista compacta por defecto con filas y divisores, y cards realmente diferenciadas y preparadas visualmente para imágenes futuras; búsqueda y filtros accesibles, inactivos ocultos y cantidad visible. Listado, detalle, formulario y categorías no se muestran simultáneamente. Editar stock manualmente advierte que no genera movimiento.

### Movimientos

El historial compacto es la entrada. Registrar abre una vista dedicada donde reposición, aporte y gasto se eligen explícitamente. El detalle concentra trazabilidad, anulación y eventual eliminación definitiva.

### Reportes

Primero se elige hoy, semana, mes u otro rango; después se elige Resumen, Productos o Cobros. Solo una combinación se muestra por vez. Los desgloses estimados permanecen bajo demanda y los gráficos complementan el contenido textual.

### Inicio y configuración

Inicio muestra hoy, stock que requiere atención y pocos accesos útiles. No duplica el reporte completo. Configuración funciona como menú y separa modo del dispositivo, respaldos/restauración y CSV.

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
- Objetivos táctiles importantes de al menos 48 px.
- El foco no queda tapado por barras fijas.
- El cambio de ruta lleva el foco a la región principal.

## Criterio final

La venta debe ser el flujo más rápido. Los reportes deben ayudar a entender. Las proyecciones deben orientar. El feedback debe dar confianza sin interrumpir de más.
