# Migración, respaldo y recuperación

No se migraron datos reales. Se utilizaron exclusivamente los datasets sintéticos del repositorio y los negocios de QA identificados por su metadata de ejecución.

## Persistencia del mismo origen

Al abrir con Web Locks, se crea un espacio IndexedDB `mora.workspace.rc2`, versión 1. Lee una sola vez la clave `mora.local.rc1` o la anterior `mora.local.v1`, valida el dominio v5 y conserva la fuente. Guarda una referencia de esa lectura, incluso si estaba vacío, para impedir adoptar luego escrituras antiguas sin revisión. Esas claves no reciben nuevas escrituras comerciales. Una falla al guardar no publica estado parcial.

El guardado de negocio tiene dos pasos durables: preparación sellada y efecto local con estado pendiente. Si se cierra después del primero, la apertura retoma el mismo registro. La confirmación local nunca se presenta como Supabase confirmado.

## JSON independiente

Se mantienen lectores v3, v4 y v5. La nueva envoltura de espacio v1 incluye el backup v5, trabajos pendientes, evidencia, base remota y registro de importaciones; agrega checksum SHA-256. No es una firma contra un atacante con control del archivo: comprueba cambios accidentales y además se valida el dominio completo.

Se omiten sesiones, refresh tokens y prueba secreta del dispositivo. Un archivo con trabajos de otro dispositivo se conserva para atención, sin enviarlo automáticamente. La migración completa de esos pendientes exige el origen/dispositivo original o una recuperación asistida aún no implementada. No disimular ese límite como sincronización perfecta.

Límites actuales: lector del backup de negocio anterior 10 MB, envoltura nueva 30 MB, importación Edge 11 MB de cuerpo completo, comando normal 300 kB de cuerpo / 200 kB de payload; fotos 90 kB cada una y 2,5 MB total según el dominio existente. Un archivo puede servir como respaldo local y exceder el transporte de importación: se conserva, no se divide ni recorta silenciosamente.

## Entre dominios

1. Congelar escritura en el origen y descargar una copia externa; conservar también la copia anterior.
2. Validar archivo y resumen: productos, ventas, stock, recepciones, movimientos, fiados, abonos, correcciones, metas y preparaciones.
3. Abrir destino vacío autorizado. Revisar el resumen antes de confirmar; el destino ocupado bloquea reemplazo/fusión.
4. Restaurar en IndexedDB, reabrir y recuperar preparaciones con la misma identidad.
5. Comparar cantidades, relaciones, FIFO, costos conocidos/desconocidos, saldos, deudas y resultados. El navegador real de QA probó dos orígenes HTTPS y comparación exacta del negocio.
6. Conectar sólo un negocio remoto vacío. Entrar a Estado y guardado y enviar explícitamente esa copia; se valida digest, namespace y revisión cero.
7. Comprobar lectura remota y segundo dispositivo; una repetición consulta el mismo comando. El servidor rechaza una segunda historia sobre un negocio ya iniciado.
8. Guardar copia posterior y mantener el origen sin nuevas escrituras hasta autorización de retiro.

No se transporta localStorage automáticamente de Sites a Pages. Tampoco cambiar GitHub actualiza Sites. No se retiró el origen ni se importó el archivo histórico alojado.

## Reversión

El origen y los JSON externos son las referencias anteriores. IndexedDB conserva copia del estado anterior a una restauración; esa copia se puede descargar. La restauración sólo sobre destino vacío evita sobrescribir la historia del negocio. Si ya se confirmaron comandos remotos, no existe un botón que borre esa historia: detener nuevas escrituras y revisar la recuperación con evidencia, sin deshacer hechos mediante SQL arbitrario. Un seed sintético se puede archivar revocando sus dispositivos/membresías; no es una estrategia aplicable a datos reales.

Se probaron cuota/error inyectados, cierre, reapertura, copias con pendientes, duplicados, corrupción/checksum y fotos. No se certificó agotamiento físico de disco ni recuperación después de borrar el perfil completo del navegador.

Si el espacio IndexedDB no valida, la pantalla de datos evita mostrar un falso resumen en cero y permite guardar un archivo de recuperación de sólo lectura. No contiene identidad/sesión y no es importable como backup normal; necesita revisión asistida. Se probó en Node y en Chromium con versión incompatible, verificando la conservación exacta de la fuente.
