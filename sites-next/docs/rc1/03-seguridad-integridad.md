# Seguridad, integridad y recuperación

## Activo local

Un único escritor cooperante mediante Web Locks. Si no existe el mecanismo, la candidata bloquea el inicio editable y conserva los datos. No se ofrece una garantía simulada mediante marcas de tiempo. Dos pestañas HTTPS reales comprobaron bloqueo antes de arrancar y liberación al cerrar la primera.

La RC escribe en `mora.local.rc1`; v25–v29 escribían en `mora.local.v1`. Una pestaña antigua que ignore locks no puede sobrescribir la clave RC. Se comprobó con un escritor antiguo **simulado**, no operando la app pública. Esto aísla versiones, pero no sincroniza dos historias: no cargar ventas reales en ambas.

La capa local valida estructura, relaciones, sellos de operaciones y costos; una preparación durable puede retomarse. El rechazo de una escritura conserva el snapshot previo. Cuota agotada, interrupción y respuesta perdida se ensayaron. localStorage no ofrece una transacción entre varias claves ni garantiza supervivencia al borrado del navegador. Las copias JSON externas siguen siendo necesarias.

## Servicio candidato

Auth verifica el bearer contra `/auth/v1/user`; no utiliza identidad proporcionada en el cuerpo, decodificación de JWT sin verificar ni user_metadata para permisos. Negocio y dispositivo se comparan con membresías vigentes. Sólo una clave privilegiada **del servidor**, inyectada por entorno, puede invocar las funciones SQL. No hay claves en `dist/`.

El cliente envía un comando con ID, contenido, versión y fecha física sellada. El servidor deriva el estado usando los módulos existentes, valida el resultado y solicita un commit SQL. No admite un snapshot del navegador. La fila del negocio se bloquea y su revisión se compara otra vez; estado, proyecciones, resultado e identidad se guardan juntos o se revierten juntos. Los reintentos del mismo contenido devuelven el resultado anterior; mismo ID con otro contenido/actor/dispositivo se rechaza.

Membresías y dispositivos se verifican otra vez dentro del commit, incluso después del cálculo. Las funciones usan `security invoker` y `search_path` vacío. Las cinco tablas tienen RLS; anon no tiene lectura/escritura y authenticated no tiene escritura directa ni permiso de RPC sensible. El rol de servidor tiene UPDATE limitado a `revoked_at` en identidades porque PostgreSQL exige un permiso UPDATE para tomar el bloqueo compartido de esas filas. No se expone un endpoint de provisión/revocación al navegador.

La prueba SQL de error tardío comprobó que no quedó snapshot, revisión, resultado ni proyección parcial. Las pruebas negativas cubren otro negocio, otro usuario/dispositivo, dispositivo revocado antes y después del cálculo, importe negativo, ID alterado, versión vieja, llamada directa y HTTP sin acceso/origen permitido. Un cuerpo HTTP que supera 300.000 bytes se cancela durante su lectura.

## Límites que impiden certificar producción

- PostgreSQL se ejecutó con PGlite local. Roles/auth.uid de prueba, una sesión y solicitudes concurrentes simuladas. No se probó el emisor JWT de Supabase ni una carrera entre conexiones alojadas independientes.
- El estado autoritativo es un snapshot JSONB con proyecciones `facts`. Tiene claves/relaciones de negocio y permisos SQL, pero las relaciones internas se validan en el dominio del servidor, **no todas mediante FKs por cada entidad**. El costo de reescribir la proyección crece con el historial. Requiere evaluación de escala/normalización antes de operación compartida definitiva.
- El rol privilegiado sigue siendo frontera de confianza. Un robo de su clave invalida la protección. No se crearon claves ni usuarios reales en esta misión.
- Transporte remoto y almacenamiento IndexedDB no están integrados a pantallas. La preparación remota está en una clave experimental aparte y aún no viaja en el backup v5 activo; no debe habilitarse hasta cubrir esa recuperación.
- La revocación impide siguientes escrituras comprobadas en servidor; no borra datos ya descargados ni puede retirar una venta física realizada sin conexión. Ese hecho requiere revisión sin perder su evidencia.
- No hay promesa de tiempo offline ilimitado, certificación de cuotas/disco de teléfonos ni recuperación ante daño físico.
