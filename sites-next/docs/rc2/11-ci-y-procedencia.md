# CI y procedencia de la candidata

La correspondencia local/GitHub de los commits de implementación está en commits.json. Se comprobaron los SHA de sus árboles exactos; la diferencia de SHA de commit proviene del guardado autenticado conservando padres. El commit final y árbol exacto de ESTA entrega están en estado-final.json del ZIP, junto al resultado de CI capturado en sus evidencias.

El workflow de candidata ejecuta instalación limpia, verificación estática/caché, Node y navegador HTTPS. No se introdujo `|| true`, no se eliminaron suites anteriores y los fallos críticos conservan salida distinta de cero. El job alojado sólo se habilita manualmente con un fixture privado nuevo y no se ejecutó en GitHub durante esta misión. Las pruebas alojadas descritas se ejecutaron desde Work.

El run intermedio 41273181669 pasó instalación, verificación, Node y navegador, y falló al empaquetar: el workflow se había guardado antes del archivo de cierre INSTRUCCIONES.md. Su aserción se conservó y se entregaron los documentos faltantes. No se lo considera un CI final aprobado. El estado de la corrida del cierre se conserva por separado en ci-final.json; consultar ese SHA y las etapas reales.

El ZIP se valida y contiene inventario SHA-256. El ZIP histórico completo v26-v29 se incorpora cuando su binario está disponible en Work; una ejecución de Actions sin él conserva el enlace canónico y marca esa ausencia. No atribuir al artefacto de CI un archivo que no contiene.

Master no se movió, PR #14 sigue borrador y Sites no recibió escrituras. No hay despliegue en este workflow. Los artefactos Actions tienen 90 días de retención; el código y la documentación quedan versionados. El paquete entregado al usuario conserva además las evidencias fuera de esa retención temporal.

Verificado: https://github.com/Yamil1701/mora-vineria/actions/runs/41318273066 corresponde a `7611d300ae2756de9789e382498ebde121e5ab65`. Instalación, verificación, 77 Node, 15 recorridos, empaquetado y artefacto aprobaron. El ZIP de CI validó integridad con 149 archivos y SHA-256 `2b4839b1d657a4e1038d2deed476a860961dd7261a0e126618691ce3beaa8ada`; no contiene el binario histórico que sólo estaba disponible en Work. El job hosted-development fue omitido y permanece expresamente separado de las pruebas alojadas de Work. La corrida del último commit documental se registra en el estado del paquete.

En la validación independiente del artefacto descargado se comprobó CRC e inventario, y el árbol coincidió exactamente con la candidata. El campo de commit usaba GITHUB_SHA, que en una PR identifica el merge temporal. Se corrigió checkout para probar explícitamente el HEAD de la rama y el empaquetador registra por separado HEAD comprobado y SHA del evento. Esta diferencia de metadatos no invalidó las pruebas funcionales del mismo árbol; el paquete final debe usar la procedencia corregida.
