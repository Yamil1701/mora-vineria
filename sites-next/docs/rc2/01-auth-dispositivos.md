# Autenticación y dispositivos · resultado intermedio

Proyecto exclusivo Mora `dedcvvgiuxpwdzqqdifn`. Se crearon tres usuarios sintéticos con Auth Admin, email confirmado y sin anonimato; no se reutilizaron identidades históricas. Auth exigió CAPTCHA para ingreso por contraseña. No se desactivó la protección ni se enviaron correos. Se emitieron enlaces de acceso de prueba desde Auth Admin y se verificaron mediante el endpoint Auth: tres sesiones reales. Las credenciales y tokens se conservan fuera del repositorio, capturas y paquetes.

Migración incremental aplicada: `20261101014012_rc2_device_enrollment_and_auth_hardening`. Agrega credencial de dispositivo, etiqueta, tabla privada de vinculaciones e índices de FKs; endurece las políticas contra la claim anónima. No reejecuta RC1, no borra ni resetea tablas. Dos negocios sintéticos, tres membresías y cinco códigos de un solo uso, con vencimiento. Las cinco vinculaciones y lecturas de negocio devolvieron HTTP 200 y revisión 0 por la función alojada.

`mora-command` versión 1 despliega el dominio compartido y verifica JWT contra Auth, membresía, credencial y revocación. El origen se limita a cuatro direcciones HTTPS locales para pruebas; no habilita el Site público. El build sólo acepta el project ref dev autorizado y ambiente `mora-isolated-dev`. Claves privilegiadas provienen exclusivamente de variables de Edge. `verify_jwt=false` delega verificación a Auth dentro de la función; no permite solicitudes sin autenticar.

La función temporal `mora-qa-operator` tuvo una capacidad de operador aleatoria y un conjunto fijo de usuarios sintéticos, sin parámetros de usuarios arbitrarios. Sirvió para provisión Auth Admin y emisión de enlaces sin correos. Se retiró su lógica de privilegios y la versión 4 responde 410; no es un endpoint de administración de la aplicación.

Pruebas locales: 52 entradas aprobadas; las tres nuevas ejercitan SQL real PGlite para vinculación recuperable, rechazo de reutilización/usuario ajeno, prueba de dispositivo, revocación y claim anónima. Las pruebas de operación comercial remota y carreras siguen en ejecución; no se consideran aprobadas por estas lecturas iniciales.

Configurar la protección contra contraseñas filtradas y revisar los ajustes globales Auth requiere acceso al panel/Management API no expuesto por el conector. No se modifican esquemas internos para silenciar avisos. El flujo seleccionado para pruebas es acceso sin contraseña. El archivo histórico permanece aislado y sin importación.
