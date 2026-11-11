# Seguridad e integridad

## Garantías verificadas

El navegador utiliza una clave publicable, sesión personal y secreto propio del dispositivo. La clave privilegiada sólo existe en Edge. El handler consulta Auth, rechaza anónimos y comprueba `session_id` contra sesiones vigentes. La identidad del cuerpo no decide el actor.

El commit SQL vuelve a comprobar membresía y dispositivo bajo bloqueos y serializa el negocio por fila. Una revisión obsoleta no pisa estado. Estado, proyecciones `facts`, resultado y revisión se confirman juntos; se provocó un error después de actualizar el negocio y se comprobó rollback de todo. Se probó revocación después de leer y antes de escribir, con HTTP 403 posterior y ausencia del comando rechazado.

Cinco tablas originales RC1 con RLS y una tabla privada de enrolamientos. `anon` y `authenticated` no escriben el historial ni ejecutan los RPC privilegiados. Los accesos ajenos se comprobaron mediante JWT auténticos y las políticas se comprobaron adicionalmente con roles PostgreSQL reales y claims sintéticos. Esa segunda prueba no se presenta como un JWT anónimo auténtico.

El mismo ID, identidad, contenido y fecha recupera el resultado durable. Contenido distinto se rechaza. La prueba alojada de 100 envíos encontró y corrigió un conflicto falso en la ventana lookup/lectura. Un resultado desconocido se consulta antes de volver a enviar. Ante infraestructura fallida se conserva el trabajo; no se cambia su ID para evitar una prueba difícil.

Web Locks se conserva como requisito antes de abrir el almacenamiento activo: una segunda pestaña queda bloqueada y un navegador sin soporte no escribe. Las transacciones IndexedDB aportan atomicidad adicional. La clave anterior se lee sólo durante la migración inicial; no se vuelve a adoptar un escritor antiguo después de empezar.

## Límites

La sesión se comprueba al entrar al servicio; una operación ya en curso puede terminar antes de que cierre sesión otro cliente. La revocación de dispositivo/membresía sí se vuelve a comprobar dentro del commit. No se promete una garantía adicional no implementada para la carrera de logout a mitad de una petición.

Los conflictos físicos conservan evidencia. Una revisión explícita ejecuta el dominio actual sin reescribir el sobre; puede rechazar un sobreabono o dejar una corrección ambigua pendiente. No existe fusión automática ni cancelación silenciosa de hechos físicos. Un pendiente que bloquea la secuencia exige atención; no se prometen reintentos offline ilimitados.

El catálogo revalida automáticamente una creación con ID todavía ausente, o una edición cuyo producto original coincide con la huella SHA-256 guardada al preparar el registro. Usa el mismo sobre y el commit revisado, que comprueba atómicamente la versión recién leída y vuelve a ejecutar las validaciones del dominio. Las ediciones anteriores sin huella, los cambios concurrentes del mismo producto y los hechos físicos conservan la revisión explícita. Al confirmar una revisión se continúa con los siguientes registros independientes de la cola.

El backup deliberadamente omite sesiones y la prueba secreta del dispositivo. Restaurarlo en otro dispositivo no le concede permiso para reenviar comandos ajenos. La recuperación asistida de esos pendientes sigue abierta.

El archivo `mora_legacy_archive` conserva sus datos y carece de USAGE para clientes y service_role. Su cron antiguo sigue inactivo. Los avisos de políticas anónimas del archivo/cron no se «corrigieron» alterando componentes administrados. En RC2 no apareció un aviso equivalente sobre las tablas compartidas activas; enrolamientos sin política es un cierre deliberado de acceso, no una apertura.

La advertencia global sobre contraseñas filtradas permanece. La app usa enlaces privados, pero eso no certifica todas las opciones globales de Auth. Detalle y enlaces oficiales en 04-supabase.md. No se declara seguridad productiva aprobada.

Dependencias de la candidata: `npm audit` completó con cero avisos de vulnerabilidades en la fecha de la ejecución. Se retiró Acorn, utilizado sólo durante una refactorización temporal y no necesario por la aplicación ni sus verificaciones finales. Esto no equivale a certificar ausencia futura de vulnerabilidades o a auditar la PWA histórica fuera del alcance.

Verificación adicional alojada tras recuperar el cierre: se emitió y verificó una sesión nueva de un usuario exclusivamente sintético, se comprobó su fila y `mora_rc_session_valid=true`, se cerró sólo esa sesión mediante Auth (204), se confirmó la eliminación real de la fila y el mismo JWT recibió 401 en `mora-command`. Antes del logout la autenticación era válida y el acceso devolvía 403 por el archivo deliberado de sus membresías/dispositivos. No se alteraron usuarios históricos. El operador temporal se habilitó sólo para emitir ese enlace fijo y quedó nuevamente retirado en v8, con fuente constante 410 sin capacidad administrativa. Esta prueba tiene evidencia propia y no se cuenta como ejecución del job alojado omitido en Actions.
