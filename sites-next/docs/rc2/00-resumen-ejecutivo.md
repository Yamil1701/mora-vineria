# Mora RC2 · integración de desarrollo

Estado al 1 de noviembre de 2026: la aplicación nueva utiliza IndexedDB y el servicio alojado de Mora. Se preservó la interfaz v29; no hubo rediseño, publicación, fusión ni traslado de datos reales. RC2 es una candidata con límites explícitos, no una aprobación productiva ni una certificación física.

La interfaz ya registra comandos durables para todas las familias de negocio existentes. El servidor deriva sus efectos con el mismo dominio, verifica identidad/dispositivo, compara la revisión y confirma estado, registros derivados y resultado en una operación SQL. Un reintento conserva ID, contenido y fecha. IndexedDB conserva preparaciones, resultados desconocidos y evidencia; «Guardado» requiere resultado remoto y lectura comprobada.

Se ejecutaron 77 entradas Node, 15 recorridos locales HTTPS y pruebas reales de Supabase. Los resultados individuales y los fallos intermedios están en 07-resultados-pruebas.md y los JSON de evidencia; no se suman pruebas simuladas como alojadas. La prueba móvil alojada confirmó acceso, vínculo, importación sintética, dos dispositivos, cierre offline, revisión explícita y recuperación de una respuesta realmente descartada después del commit. El PDF A4 nativo tiene 3 páginas revisadas visualmente.

Límites que siguen abiertos:

- No se desplegó una vista previa accesible desde el teléfono del usuario. Los orígenes Edge habilitados son HTTPS locales de QA. Se preparó el procedimiento; no se usó Pages como supuesto sitio privado.
- Una copia con pendientes pertenecientes a otro dispositivo se conserva para atención y no se envía automáticamente. Su recuperación completa requiere el dispositivo original o un procedimiento de recuperación asistida todavía pendiente; no se fusionan historias divergentes.
- La protección global de contraseñas filtradas sigue advertida por Supabase. La interfaz usa enlaces privados, pero no se pudo cambiar esa configuración del panel mediante las herramientas disponibles. No se certificó la configuración global de Auth ni se tocaron sus esquemas internos para ocultar avisos.
- La incidencia externa PGRST303 se mitigó con reintentos acotados del mismo RPC y resultado desconocido ante fallo persistente. No se certifica resuelta por el proveedor.
- Las pruebas alojadas nuevas en Actions requieren un fixture sintético privado recién provisionado. El job está preparado; su configuración de secretos no se realizó ni se declara activa.
- Cuota e interrupciones se verifican mediante errores inyectados y recuperación real de IndexedDB. El intento de agotar cuota nativa mediante CDP no reprodujo un disco lleno. El teclado es emulado por altura, no un teclado físico.
- Android/iOS, instalación real, cámara, impresión física, comodidad y aceptación: 58 casos pendientes del usuario.

Mientras esos puntos no estén resueltos, no presentar la misión como una RC completamente cerrada. El código de desarrollo está integrado y las garantías comprobadas se limitan a las rutas y escenarios registrados.

Empezar por INSTRUCCIONES.md. Los documentos RC1 y v26-v29 permanecen como antecedentes; sus afirmaciones de «Supabase no conectado» quedaron superadas por las pruebas RC2.
