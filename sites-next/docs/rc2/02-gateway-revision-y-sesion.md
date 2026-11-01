# Servicio de desarrollo: revisión y sesión

Registro de la etapa del primer despliegue RC2. El estado final es Edge v5 y tres incrementales; prevalece 04-supabase.md.

Verificado el 1 de noviembre de 2026. Proyecto exclusivo `dedcvvgiuxpwdzqqdifn`.

Migración incremental aplicada: `20261101032050_rc2_reviewed_commands_and_session_validation.sql`. No reinstala RC1 ni toca el archivo histórico. Agrega un camino de confirmación revisada que conserva el sobre original y compara una revisión actual separada. El mismo ID con otro contenido continúa rechazado. Los casos que el dominio no puede resolver permanecen rechazados para atención; revisar no permite exceder una deuda.

El servicio verifica el JWT mediante Supabase Auth y comprueba que su sesión siga existiendo. La función de sesión sólo recibe dos UUID y devuelve un booleano; sólo el servidor puede invocarla. Se concedió a `service_role` lectura de tres columnas de `auth.sessions`, sin cambios en filas ni exposición a navegadores. La RLS continúa comprobando membresía y dispositivos vigentes.

Edge `mora-command` v2 desplegada; SHA del bundle `571532e7139750d8ff3ab92d8f23151ddfd5f6a81f0c54e97fc684fc8f75d118`. Orígenes exclusivamente HTTPS locales 8443/8444; no habilita Sites ni publica la aplicación. La autenticación se implementa dentro del handler y por eso `verify_jwt=false` no significa acceso anónimo.

Pruebas locales PostgreSQL: 3/3 en `reviewed-gateway.case.mjs`: revisión sellada, sesión caducada/eliminada y FIFO de venta tardía. Las pruebas alojadas se registran por separado en el informe final; este documento no las da por concluidas.

## Regresión encontrada en Supabase

La prueba simultánea real reveló una carrera entre lookup y lectura: el mismo comando podía confirmarse en ese intervalo y recibía después un conflicto falso. Se agregó otra consulta del mismo resultado antes de rechazar por revisión; la prueba específica usa esa intercalación y verifica que no se vuelva a escribir. La repetición alojada de 100 solicitudes luego aprobó.

También apareció `PGRST303: JWT issued at future` en llamadas internas con la clave moderna. No se debilitó JWT ni se cambió el reloj del usuario. El transporte interno reintenta exactamente el mismo RPC hasta tres veces ante ese error concreto y clasifica los fallos persistentes de infraestructura como resultado desconocido, nunca como un rechazo definitivo del hecho físico. Se verificó el comportamiento con inyección de transporte y se repitieron las llamadas alojadas. Referencia primaria del proveedor: https://github.com/supabase/supabase/issues/50651 . La mitigación no certifica que el proveedor haya corregido su incidencia.
