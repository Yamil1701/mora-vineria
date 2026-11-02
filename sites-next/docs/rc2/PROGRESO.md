# Checkpoint de cierre RC2

Fecha: 1 de noviembre de 2026. No reiniciar desde RC1.

- GitHub inicial verificado: ba811b6, PR #14 abierta/borrador, master 296c2aa sin cambios.
- Recuperados avances locales posteriores, con árboles comparados contra los commits creados en GitHub.
- Migración 20261101043103 recuperada literalmente de supabase_migrations.schema_migrations; índices reales cotejados, sin reaplicarla.
- Node: 77 entradas aprobadas. Chromium: 15 recorridos aprobados. API alojada: 7 grupos aprobados; 25 tipos confirmados y 50 comandos conservados.
- UI alojada: acceso/vínculo, importación/segundo dispositivo, cierre offline/conflicto y respuesta perdida comprobados.
- Datos de prueba archivados de forma controlada; archivo histórico intacto.
- INSTRUCCIONES, 58 casos móviles e informes completos preparados. El ZIP local se valida y contiene los antecedentes históricos cuando su binario está disponible.
- CI 41318273066 del código 7611d300 aprobado: instalación limpia, verificación, 77 Node, 15 Chromium y ZIP. Hosted de Actions omitido; pruebas reales de Work separadas.
- Comprobación adicional alojada: sesión Auth fresca existente, logout local 204, fila eliminada y mismo JWT rechazado por Edge con 401. Operador nuevamente retirado, ahora v8.
- El commit exacto, la corrida del último ajuste de cierre y el archivo entregado se identifican en el estado runtime del paquete y su evidencia de CI. Los detalles pendientes de acceso/QA físico no autorizan publicación.

Consultar estado-final.json, commits.json y 07-resultados-pruebas.md; no interpretar un job omitido como aprobado.

## Comprobación conectada final desde las pantallas

Sobre gateway alojado v5 y dos contextos HTTPS independientes se ejecutó el alta de producto, edición de precio de $3.500 a $4.000, stock inicial de 4 unidades con costo total $8.000, venta en efectivo, cierre/reapertura y vinculación del segundo dispositivo desde la interfaz. Cuatro comandos nuevos confirmados: revisión 5 → 9; stock final 3, venta $4.000, costo FIFO $2.000, lote restante 3 y ventas anteriores intactas. La lectura SQL independiente confirmó estos valores.

Evidencia: `verificacion/rc2/hosted-core-browser/results.json` y `database-proof.json`; capturas en el paquete `evidencias/hosted-core-browser/`. Script reproducible: `scripts/hosted-core-browser-qa.mjs`. Requiere fixture sintético privado con sesión vigente, dispositivo autorizado y un código de un solo uso nuevo en `coreCode`; no reutilizar credenciales archivadas. Sesión del primer dispositivo se prepara como fixture; la autenticación por enlace real está probada separadamente en el recorrido alojado inicial.

Resultado acumulado: 7 grupos API y 5 recorridos funcionales de navegador alojado; 54 comandos, 144 hechos, 9 dispositivos y 11 vinculaciones registradas. Al terminar se revocaron nuevamente todos los permisos sintéticos y se vencieron códigos pendientes: 0 membresías activas, 0 dispositivos activos, 0 códigos nuevos utilizables. Los datos de prueba quedan conservados para auditoría. No se modificaron datos reales.
