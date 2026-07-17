# Diseño y experiencia

## Estado del diseño

El documento de diseño es vigente. Parte del sistema visual ya está aplicada —paleta oscura, navegación inferior, cards, jerarquía mobile y lenguaje— y otras decisiones siguen pendientes. La matriz exacta está en `06_estado_implementacion.md`.

## Contexto y personalidad

La app se usa principalmente desde el celular, muchas veces de noche y durante atención rápida. Debe sentirse cálida, joven, moderna, simple y confiable; nunca como un ERP ni como una interfaz de lujo recargada.

## Identidad

El símbolo combina una `M` fluida, una gota de vino y una copa. Usa fondo principal `#D7268F` y marca suave `#F2C6D8`. El SVG es la fuente maestra; los iconos PWA se exportan desde él en variantes normal y maskable.

La identidad aparece con moderación en el arranque, Inicio, Configuración y PDF. No se repite como decoración en cada pantalla. El arranque web continúa visualmente el splash estático de la PWA con una presentación breve de marca; si los datos todavía no están listos, pasa a un spinner ambiental sin repetir el logo. La preparación de datos comienza en paralelo, no tiene espera artificial y `prefers-reduced-motion` omite la presentación prolongada.

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

Los sheets y bottom sheets se arrastran hacia abajo y también se cierran tocando el fondo exterior. No muestran una X ni una flecha propia. El botón Atrás del sistema conserva la navegación cuando la vista corresponde a una ruta. Las barras de desplazamiento visuales se ocultan sin impedir el scroll.

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
- sincronización: distinguir en lenguaje humano entre guardado local, pendiente, sincronizando, sincronizado y conflicto;

Cambiar el modo del dispositivo exige confirmación y actualiza inmediatamente toda la interfaz abierta.

No usar toast para decisiones destructivas ni para información que el usuario deba leer antes de continuar.

Los toast, diálogos y cambios de pantalla tienen entrada y salida suaves. Los skeletons aparecen con demora para evitar destellos en operaciones rápidas y deben aproximar la estructura que reemplazan. Una espera inicial mayor a 250 ms puede mostrar identidad y progreso indeterminado, sin forzar una duración mínima.

El spinner comunica operaciones sin estructura visual —arranque, respaldo o exportación—. Los listados y paneles conservan skeletons porque anticipan la forma del contenido.

Ante un fallo de render inesperado, la interfaz protege el contexto: informa que los datos locales siguen guardados y ofrece reintentar. Los formularios con cambios reales piden confirmación al salir; los formularios intactos nunca interrumpen.

Los errores recuperables ofrecen “Reintentar”. Los estados iniciales indican la próxima acción útil en lugar de limitarse a informar que todavía no hay datos.

El estado normal sincronizado no necesita ocupar espacio permanente. Sin conexión o con cambios pendientes se muestra una señal discreta y accesible. Un conflicto que requiere una decisión permanece visible hasta resolverse y nunca se comunica únicamente mediante toast.

Si la aplicación comienza sin conexión, explica una sola vez mediante un diálogo que se puede seguir trabajando con la copia local. Después de “Entendido” no vuelve a interrumpir esa instalación; las desconexiones posteriores se comunican únicamente mediante el indicador global.

La sincronización usa una luz global flotante en la esquina superior derecha, alineada con el ancho de la app y el safe area. Permanece visible en pantallas principales y tareas enfocadas, pero queda debajo de sheets, confirmaciones y toast. Es verde al día, azul mientras procesa, ámbar ante pendientes o revisión, roja ante error y de contorno apagado sin conexión o configuración. En estados excepcionales se expande hacia la izquierda con texto breve y al tocarla abre Sincronización. Nunca depende solo del color y no se emite un toast por cada ciclo exitoso. La pantalla de detalle reúne primero identidad y salud de datos, después conflictos y finalmente celulares autorizados.

Emparejar dispositivos es una tarea guiada: el principal genera un QR temporal, detecta su uso y confirma visualmente el vínculo antes de volver a Sincronización. Al escanear o validar el código, el nuevo celular pide su nombre en un diálogo y vuelve a la pantalla de estado al terminar. El código de recuperación se presenta una sola vez con acciones para copiar y descargar, acompañado por una advertencia clara.

La auditoría remota conserva también los revocados, pero la lista de uso cotidiano muestra solo celulares activos. Cada fila muestra acceso, actividad reciente y fecha de última conexión conocida; no presenta esa actividad como presencia en tiempo real. Cuando un celular aprende que fue revocado, conserva su copia y la posibilidad de respaldarla, pero bloquea la operación local hasta volver a vincularse.

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

- Duración habitual: 220–320 ms según el tamaño del cambio. Las variables de movimiento viven en `src/styles/index.css`.
- Usar transiciones suaves en apertura, selección, feedback y cambios de lista.
- Evitar rebotes intensos, parallax, destellos y movimientos largos.
- No demorar la carga de venta ni bloquear interacción por una animación.
- Respetar `prefers-reduced-motion`; sin movimiento, la información debe seguir siendo clara.
- Los elementos que aparecen o desaparecen no deben provocar saltos confusos de layout.
- La navegación usa una transición breve y consistente; no intenta imitar un cambio nativo de dirección cuando no existe información confiable sobre avance o regreso.

## Pantallas clave

### Nueva venta

La búsqueda concentra la selección y oculta productos ya agregados. El carrito vive en un bottom sheet accesible desde una barra inferior; permite quitar explícitamente, cambiar cantidades, editar precio y vaciar. La revisión y el cobro continúan dentro del sheet. El aviso de recuperación aparece solo cuando existían productos antes de abrir la tarea. Efectivo ofrece cálculo transitorio de vuelto y Transferencia exige elegir destino. Al guardar se vuelve al historial: la venta destaca una sola vez, su fondo se desvanece y los productos tienen más jerarquía que la fecha.

### Productos

Vista compacta por defecto con filas y divisores, y cards realmente diferenciadas y preparadas visualmente para imágenes futuras; búsqueda y filtros accesibles, inactivos ocultos y cantidad visible. Listado, detalle, formulario y categorías no se muestran simultáneamente. Editar stock manualmente advierte que no genera movimiento.

### Movimientos

El historial compacto es la entrada. Registrar abre una vista dedicada donde reposición, aporte y gasto se eligen explícitamente. El detalle concentra trazabilidad, anulación y eventual eliminación definitiva.

### Tesorería

Tesorería vive en Más → Operación. La portada prioriza el total disponible, lo que entró y salió en la jornada, los saldos por cuenta y la actividad reciente. Caja se distingue de las cuentas digitales y avisa si queda por debajo del fondo de cambio objetivo.

La configuración inicial explica que los importes son saldos preexistentes. Cobrar, reponer, gastar o aportar pregunta la cuenta dentro de su tarea habitual; el usuario no debe duplicar la carga en Tesorería. Las acciones propias del módulo son retiro, transferencia entre cuentas, alta de cuenta y conteo de caja. Un movimiento interno se muestra con sus dos lados, pero el total no cambia.

El conteo usa cantidades por denominación, muestra el esperado y anticipa la diferencia antes de confirmar. Los ajustes y reversiones permanecen visibles: la interfaz no ofrece editar ni borrar el libro.

### Reportes

Primero se elige hoy, semana, mes u otro rango; después se elige Resumen, Productos o Cobros. Solo una combinación se muestra por vez. Los desgloses estimados permanecen bajo demanda y los gráficos complementan el contenido textual.

### Inicio y configuración

Inicio muestra hoy, stock que requiere atención y pocos accesos útiles. No duplica el reporte completo. Configuración funciona como menú con iconografía y separa dispositivo, protección de datos y salidas auxiliares. El recordatorio completo de respaldo vive dentro de Respaldos y restauración; su acceso en Configuración muestra solo un punto ámbar accesible cuando necesita atención. Configuración permite además comprobar explícitamente si existe una versión nueva de la PWA sin modificar los datos locales.

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
