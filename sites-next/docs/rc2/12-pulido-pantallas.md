# RC2 · Pulido de pantallas secundarias

6 de noviembre de 2026. Rama `work/rc2-pulido-pantallas`. Fuente exclusiva: `sites-next/dist/`. Sin cambios de esquema, dependencias, reglas monetarias, FIFO, permisos ni infraestructura remota.

## Base y referencias comprobadas

- Base actual: `c4672754077bbd3fb2711feca1095d7eb2965cee`, master al comenzar. La PR #14 se fusionó el 2/11; su último head fue `9ea1072`. No sigue abierta.
- Pages publicó ese merge mediante Actions [41377742568](https://github.com/Yamil1701/mora-vineria/actions/runs/41377742568), aprobado. El SHA-256 del `sw.js` servido coincidió con master: `32fc87566fb7093c45d9977d2d9675be82ac02302e06e5be5cd39cfd9e911184`. El navegador mostró «Entrar a Mora».
- `SOURCE.json` identifica v26 como `bea955a` y v29 como `fdc349f`. El informe de Entregas 3/4 y sus diferencias sitúan allí inventario, fiados/abonos, pagos posteriores, correcciones y reportes. RC2 añadió acceso, vínculo y estado remoto. La frontera v26 es de procedencia; no acredita aprobación de todas sus pantallas.
- El estándar de esta misión procede del encargo actual y de los recorridos conservados: encabezado compacto, búsqueda/listas, cobro con importe protagonista, regreso uniforme y barra Inicio/Ventas/+/Caja/Más. Se inspeccionaron renderizados Inicio, catálogo, ventas, cobro, carrito y comprobante; se reutilizó su jerarquía sin reemplazar su composición.
- AGENTS y los contratos históricos se contrastaron con `docs/rc2/`, el contrato de operaciones, los informes visuales y el historial. Las menciones antiguas de PR #14 en borrador y ausencia de publicación son antecedentes, superados por el merge comprobado.

## Inventario de intervención

| Prioridad | Pantalla o estado | Problema y consecuencia | Patrón aplicable | Corrección ejecutada |
| --- | --- | --- | --- | --- |
| P1 | Conteo | El resumen desplazaba el campo principal; vacío podía equivaler a cero | Cobro: entrada principal primero | Unidades primero, comparación debajo, motivo agrupado; vacío requerido y cero explícito válido |
| P1 | Formularios tras recarga | Se conservaban campos, pero se perdía el camino de regreso | Volver contextual | Recuperación del recorrido válido de la misma pestaña; volver no confirma |
| P1 | Estado de conexión | Actualizaba nodos inexistentes; la vuelta de red dejaba el botón deshabilitado | Estado explícito, sin errores ocultos | Actualización segura de la vista y sus acciones al cambiar red |
| P1 | Guardado remoto y acceso revocado | Un error de lectura remota se silenciaba y podía persistir una etiqueta favorable | Pendiente distinto de confirmado | Estado transitorio de comprobación, último éxito, falta de conexión, 401 y 403; sin cambiar trabajos sellados |
| P1 | Acceso y vinculación | Acciones principales/secundarias equivalentes, espacio de error vacío y ausencia de espera | Una acción principal | Botón junto al formulario; espera deshabilitada; error enfocado, campos conservados sólo en memoria y copia bajo Recuperación |
| P2 | Inventario | Dos botones equivalentes antes de la búsqueda | Catálogo: buscar y elegir | Conteo como tarea principal; stock inicial/historia después de productos; vacío de búsqueda distinto de catálogo vacío |
| P2 | Abono | Saldo pendiente tratado como fila secundaria | Total protagonista del cobro | Saldo destacado, importe recibido y grupo de forma de pago; no nueva venta |
| P2 | Pago de mercadería | Totales históricos compiten con lo que falta pagar | Cobro y detalles posteriores | Pendiente protagonista, pago/cuenta/confirmación; historial desplegable |
| P2 | Corrección | Campos apilados y revisión poco jerarquizada | Carrito compacto y revisión antes de guardar | Cantidad/precio juntos, identidad completa visible, total corregido destacado y Seguir editando explícito |
| P2 | Reportes/meta/informe | Todos los detalles al mismo nivel; lectura muy larga | Resumen seguido de consulta | Vendido, cobrado, pendientes, ganancia/costos faltantes y dinero visibles; desgloses, productos y correcciones desplegables; informe imprimible los incluye abiertos |
| P2 | Movimientos/filtros | Sin restablecer filtros y rango inválido confundido con vacío | Filtros del catálogo | Número de filtros activos, Limpiar filtros, fechas agrupadas, error diferenciado y cantidad de resultados |
| P2 | Respaldo | Texto todavía sugería almacenamiento exclusivamente en navegador | Datos y respaldo existente | Copia separada del acceso; descripción breve de su contenido, sin cambiar exportación/restauración |

También se recorrieron stock inicial, diferencias y resolución, detalle de fiado, recepción, confirmaciones, meta, impresión, restauración protegida y estados de error. Se conservaron los efectos, confirmaciones necesarias y el mecanismo de IDs estables. No se añadieron tarjetas, imágenes ni dependencias.

## Decisiones para mantener coherencia

1. En una tarea de dinero, mostrar primero a quién corresponde y cuánto queda; después el importe que se registra. En conteos, el dato físico va antes de la comparación.
2. Una acción principal por formulario. La confirmación describe el efecto; volver o editar conserva el trabajo y nunca registra el hecho.
3. Agrupar datos por decisión; reservar desplegables para desglose y antecedentes. Pendientes, costos desconocidos y advertencias permanecen visibles.
4. «Guardado en el negocio» exige una lectura remota válida en la sesión actual. Un error, espera o permiso perdido se distingue sin modificar ni descartar la cola.
5. Campos de número con teclado numérico, etiquetas y unidades. Cero se introduce explícitamente. Errores visibles y enfocados. Controles y acciones de al menos 44 px en los recorridos medidos.
6. La barra de acción respeta el área segura y `visualViewport` cuando el teclado reduce el área visible. Las pruebas de altura reducida no certifican un teclado Android físico.
7. Las credenciales del formulario se conservan sólo durante su intento en memoria: no entran en borradores, documentación ni capturas legibles.

## Verificación y límites

Resultados: **78/78 Node, 21/21 grupos Chromium RC2**, más 3/3 regresiones tras el último ajuste de filtros; cero errores de aplicación capturados. Caché `mora-shell-3978f686a97c0ec888fa`. También pasaron 14 contratos de arquitectura, 155 pruebas Vitest, typecheck/build y 20 E2E Chromium de la raíz histórica, sin cambiarla. WebKit local no se ejecutó; su workflow se conserva. El PDF nativo de tres páginas A4 se renderizó e inspeccionó. [Resumen verificable](../../verificacion/pulido-rc2/resultados.json). Se corrigió además una carrera del harness de actualización: esperaba contenido todavía visible antes de que comenzara la recarga; ahora espera el evento load de la navegación nueva antes de capturar. El script `browser-qa.mjs` conserva los recorridos previos y añade pruebas a 360/390/430 de campos vacíos, errores, cancelar, recarga, formularios, filtros y acceso. `MORA_QA_ONLY` permite una regresión enfocada; una ejecución filtrada no se cuenta como suite completa.

Las pruebas de acceso, vínculo, rechazo 401/403 y recuperación de esta revisión usan un transporte local sintético interceptado. No son aceptación alojada contra Supabase. Las pruebas comerciales usan IndexedDB real sobre HTTPS local y datos descartables.

**Vista previa separada bloqueada:** el proyecto Mora está ACTIVE_HEALTHY y `mora-command` está en v6, pero las herramientas conectadas no exponen Auth Admin ni una clave de servidor para ejecutar la provisión sintética existente. `mora-qa-operator` v8 y `mora-mobile-access-bootstrap` v3 están retirados (este último se comprobó con respuesta constante 410 en su fuente). No se reactivaron ni se usaron permisos históricos. Sin una sesión sintética nueva no se puede verificar acceso/vínculo/aislamiento en un origen adicional como exige el encargo. No se publicó una URL meramente visual ni se amplió CORS sin poder probarla.

La candidata se entrega por PR. Pages sigue sirviendo la base anterior; no es una URL de esta candidata. El paso remoto pendiente requiere provisión mediante Auth Admin autorizado, negocio sintético nuevo, alojamiento separado del árbol exacto de `dist/`, origen permitido sólo en desarrollo y pruebas alojadas de acceso, CORS y aislamiento. No requiere rediseñar ni migrar datos reales.

## Recorrido móvil al disponer de la candidata

Acceso/vínculo → Inventario/conteo (volver y recargar) → Fiado/abono parcial → Pago de una recepción → Corrección/revisión/volver → Movimientos/filtros → Reportes/meta/PDF → Estado sin red y reconexión → Venta rápida de regresión y respaldo.

QA físico de Android, teclado real, instalación y comodidad con una mano: pendientes del usuario. No se declara aprobado.

Comparación representativa de conteo y abono (antes/después, datos sintéticos): [abrir imagen](https://chatgpt.com/library?file_id=libfile_f11531ef21888191a6b015014e1c0746&account_id=personal). Las capturas de cada ejecución permanecen fuera del código servido; el CI genera su propia evidencia.
