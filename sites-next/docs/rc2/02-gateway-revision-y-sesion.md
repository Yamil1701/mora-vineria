# Servicio de desarrollo: revisión y sesión

Verificado el 1 de noviembre de 2026. Proyecto exclusivo `dedcvvgiuxpwdzqqdifn`.

Migración incremental aplicada: `20261101032050_rc2_reviewed_commands_and_session_validation.sql`. No reinstala RC1 ni toca el archivo histórico. Agrega un camino de confirmación revisada que conserva el sobre original y compara una revisión actual separada. El mismo ID con otro contenido continúa rechazado. Los casos que el dominio no puede resolver permanecen rechazados para atención; revisar no permite exceder una deuda.

El servicio verifica el JWT mediante Supabase Auth y comprueba que su sesión siga existiendo. La función de sesión sólo recibe dos UUID y devuelve un booleano; sólo el servidor puede invocarla. Se concedió a `service_role` lectura de tres columnas de `auth.sessions`, sin cambios en filas ni exposición a navegadores. La RLS continúa comprobando membresía y dispositivos vigentes.

Edge `mora-command` v2 desplegada; SHA del bundle `571532e7139750d8ff3ab92d8f23151ddfd5f6a81f0c54e97fc684fc8f75d118`. Orígenes exclusivamente HTTPS locales 8443/8444; no habilita Sites ni publica la aplicación. La autenticación se implementa dentro del handler y por eso `verify_jwt=false` no significa acceso anónimo.

Pruebas locales PostgreSQL: 3/3 en `reviewed-gateway.case.mjs`: revisión sellada, sesión caducada/eliminada y FIFO de venta tardía. Las pruebas alojadas se registran por separado en el informe final; este documento no las da por concluidas.
