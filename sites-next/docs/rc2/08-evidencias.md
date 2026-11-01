# Evidencias y lectura correcta

El ZIP y los artefactos de Actions contienen capturas, JSON de resultados, PDF nativo y su render. El inventario SHA-256 identifica cada archivo del paquete. No se incluyen credenciales de prueba ni estados de navegador autenticado.

- `browser/results.json`: 15 recorridos locales HTTPS; los nombres declaran simulaciones cuando corresponden.
- Capturas `360-*`, `390-*`, `430-*`: recorridos del fixture sintético. `offline-reopened-draft.png`, `second-tab-blocked.png`, `native-quota-write-blocked.png`: circunstancias específicas; el nombre histórico del archivo de cuota no cambia su naturaleza inyectada.
- `hosted-results.json`: casos API reales de Supabase, con comprobaciones del snapshot leído. El informe de seguridad añade aserciones SQL y revocación.
- `hosted-browser/initial-login-and-import-results.json`: primera ejecución, acceso/vínculo/importación aprobados; un paso posterior del harness falló por navegación desde un comprobante.
- `hosted-browser/results.json`: continuación de esos escenarios con preparación sintética autenticada y dispositivo conocido; pasó offline/cierre, dos dispositivos, revisión y respuesta perdida. No afirmar que el segundo arranque volvió a comprobar el enlace consumido.
- `preserved-work-*.json`: copias de evidencia sin sesiones ni credenciales, capturadas antes de cerrar el contexto de pruebas. No son datos reales.
- `pdf-page-1.png` a `pdf-page-3.png`: render del PDF nativo, inspeccionado junto al texto.
- `*-failure.png` y logs intermedios: intentos fallidos conservados como diagnóstico, no aprobaciones. Las entradas en un log viejo no prevalecen sobre el resultado final sin explicar la corrección.

Las capturas solicitadas pertenecen a datos descartables. No se fotografiaron ni exportaron datos personales, movimientos reales o claves privilegiadas. La interfaz de acceso oculta el enlace en el campo; sus credenciales quedan fuera del paquete.
