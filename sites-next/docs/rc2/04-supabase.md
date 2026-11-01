# Supabase real de desarrollo

Cuenta: Yamil, Mora Vinería. Único proyecto utilizado: `dedcvvgiuxpwdzqqdifn`, São Paulo, PostgreSQL 17.6.1.141. No se utilizó Chofer Utilities.

La migración RC1 ya existía y se comparó antes de cambiar el esquema. No se ejecutó de nuevo. Su versión alojada es `20261031135415 secure_command_gateway_rc1_20261031`; el contrato original versionado se conserva como `20261031101555_secure_command_gateway.sql` para tests locales. Esos nombres no autorizan a duplicar la instalación.

Incrementales aplicadas y versionadas:

1. `20261101014012_rc2_device_enrollment_and_auth_hardening.sql`: códigos de vínculo de un uso, prueba de dispositivo y políticas que excluyen Auth anónimo.
2. `20261101032050_rc2_reviewed_commands_and_session_validation.sql`: commit revisado conservando el comando original y comprobación server-only de sesión. Sólo lectura de tres columnas de `auth.sessions`; no cambios en sus filas ni exposición al navegador.

3. `20261101043103_rc2_enrollment_foreign_key_indexes.sql`: índices compuestos sobre las dos relaciones de enrolamientos señaladas por el asesor. Se verificó sintaxis y columnas en PostgreSQL local y existencia real; sin cambios en filas, permisos ni RLS.

Tablas: businesses, memberships, devices, commands, facts y enrollments, todas con RLS. No se normalizó por inercia el snapshot JSONB. Cada commit reemplaza la proyección completa `facts`: costo lineal con la historia; queda pendiente un ensayo alojado de carga prolongada y dimensionamiento antes de producción. Las pruebas actuales no certifican capacidad ilimitada.

Edge `mora-command` v5 activa, bundle SHA-256 `ec2d86ba6ecf667209dbde731a4a1b631cd2b1f1ae5b16a24622f2e5b5b5d31f`. Verifica Auth en el cuerpo del servicio: `verify_jwt=false` evita la antigua verificación de gateway, no habilita acceso anónimo. Rechaza otro proyecto mediante la URL exacta; el ambiente efectivo es `mora-isolated-dev` desde configuración compilada, con override de entorno aceptado sólo si coincide. No se afirma haber cargado un secreto MORA_ENVIRONMENT mediante una API de secretos inexistente.

Orígenes permitidos: HTTPS 127.0.0.1/localhost en 8443/8444. No se habilitó un origen público de candidata. CORS no reemplaza autenticación; una petición sin Origin sigue requiriendo Auth y prueba del dispositivo.

El operador temporal `mora-qa-operator` se usó exclusivamente para identidades sintéticas prefijadas y enlaces Auth sin enviar correo. Quedó retirado en v8 (v6 era el estado inicial recuperado): devuelve 410 y no realiza acciones privilegiadas. No proporciona un endpoint abierto de alta ni claves de servidor. Las sesiones y códigos de pruebas están fuera del repositorio, ZIP y capturas.

Pruebas Auth: usuarios sintéticos no anónimos, sesiones auténticas, renovación, acceso ajeno, JWT inválido/vencido y vínculo desde la interfaz. El login por contraseña encontró CAPTCHA y no se deshabilitó para eludirlo. Se eligió enlace privado de acceso. El acceso inicial y el vínculo requieren red; el trabajo posterior puede prepararse localmente.

Para repetir desde cero, `scripts/provision-hosted-qa.mjs` prepara identidades nuevas con Auth Admin y genera SQL privado de seed. Un operador debe aplicar ese DML al RC verificado, después enrolar. Se ensayó la preparación con API simulada; la provisión de esta misión se realizó de verdad por el operador Edge temporal/MCP. No se atribuyen sus resultados a una ejecución real del CLI nuevo.

Avisos: protección de contraseñas filtradas desactivada; no se pudo configurar desde el conector y el panel requiere sesión. Revisar https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . Los avisos de archivo histórico y cron se distinguen de RC2; consultar https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins . No modificar esquemas administrados para silenciarlos.

Incidencia externa PGRST303 observada y mitigada sin debilitar JWT; referencia primaria https://github.com/supabase/supabase/issues/50651 . Los fallos persistentes se conservan como resultado desconocido.

## Comprobación final y archivo sintético

Se comprobaron en la base los 25 tipos de comando confirmados, con 50 comandos entre los dos negocios sintéticos. Sobre Edge v5 se repitieron sobres confirmados de 24 tipos y el estado final quedó exactamente igual; la importación inicial está comprobada por la UI y no se delegó la identidad de su dispositivo original. El archivo histórico conserva 17 tablas, 33 funciones, 281 ventas, 280 cobros y 775 operaciones; su cron sigue inactivo y su esquema no tiene USAGE para los roles de la app.

Al terminar se archivó exclusivamente la ejecución sintética: dispositivos y membresías de esos dos negocios revocados y códigos vencidos. Se conservaron sus 50 comandos y resultados para auditoría. No se eliminaron usuarios Auth ni filas históricas. Para un nuevo QA hay que provisionar un fixture nuevo; no entregar las credenciales privadas de esta corrida al usuario ni reutilizar estos negocios como producción.

Verificación adicional alojada tras recuperar el cierre: se emitió y verificó una sesión nueva de un usuario exclusivamente sintético, se comprobó su fila y `mora_rc_session_valid=true`, se cerró sólo esa sesión mediante Auth (204), se confirmó la eliminación real de la fila y el mismo JWT recibió 401 en `mora-command`. Antes del logout la autenticación era válida y el acceso devolvía 403 por el archivo deliberado de sus membresías/dispositivos. No se alteraron usuarios históricos. El operador temporal se habilitó sólo para emitir ese enlace fijo y quedó nuevamente retirado en v8, con fuente constante 410 sin capacidad administrativa. Esta prueba tiene evidencia propia y no se cuenta como ejecución del job alojado omitido en Actions.
