# Evidencias y lectura del paquete

Todo el contenido de pruebas corresponde a datos sintéticos. El ZIP final conserva los antecedentes v26–v29 y la auditoría crítica, además de los informes actuales. Las capturas finales están separadas de los defectos corregidos.

| Ruta dentro del ZIP | Contenido |
|---|---|
| `INSTRUCCIONES.md` | Traspaso y restricciones de la misión |
| `documentacion/00-resumen-ejecutivo.md` a `09-guion-qa-movil.md` | Informes y 45 casos físicos pendientes |
| `documentacion/commits.txt`, `commits-transferidos.json` | SHA originales locales, SHA GitHub y árboles idénticos |
| `documentacion/estado-final.json` | PR, master, HEAD probado y resultado de CI al cierre |
| `evidencias/integrated-tests.txt` | Última suite completa aprobada, 49/49 |
| `evidencias/static-verify.txt`, `dist-manifest.json` | Imports activos y hashes transferibles del artefacto estático |
| `evidencias/dependency-audit.json` | Resultado npm audit de esta ejecución |
| `evidencias/browser/results.json`, `browser-qa.txt` | 14 recorridos, detalles y 0 errores no capturados |
| `evidencias/browser/360-*.png`, `390-*.png`, `430-*.png` | Pantallas principales, checkout, comprobante, abono, corrección, conteo y restore |
| `evidencias/browser/second-tab-blocked.png`, `unavailable-writer-blocked.png` | Exclusión real y bloqueo seguro |
| `evidencias/browser/native-quota-write-blocked.png` | Agotamiento real de cuota del contexto de prueba |
| `evidencias/browser/offline-reopened-draft.png`, `after-controlled-update.png` | Borrador offline y actualización |
| `evidencias/browser/reduced-height-checkout.png` | Campo enfocado y CTA en altura reducida; teclado físico pendiente |
| `evidencias/browser/Mora-informe-mensual-QA-A4.pdf` | PDF nativo, 3 páginas A4 |
| `evidencias/browser/pdf-final-page-*.png` | Render de las tres páginas finales, inspeccionadas |
| `evidencias/browser/pdfinfo.txt`, `pdf-text.txt`, `pdf-verification.json` | Formato, texto/cifras, márgenes y ausencia de navegación |
| `evidencias/browser/before-*.json`, `after-*.json`, `migration-*.json`, `commerce-*.json` | Descargas reales para comparar datos/resultados |
| `evidencias/incidencias-corregidas/` | Capturas de fallos anteriores corregidos; no son el estado final |
| `antecedentes/` | ZIP v26–v29 original, auditoría crítica y manifiesto de entrada |
| `INVENTARIO-SHA256.json` | Rutas, tamaños y SHA-256 de cada archivo del paquete, excepto el propio inventario |

En el repositorio se conservan el código, las pruebas, los informes y un resumen de evidencia. El paquete descargable concentra capturas y antecedentes completos. Los artefactos del workflow son evidencia adicional, con vencimiento a los 14 días. No publicar el ZIP como una nueva versión de Sites.

La inspección visual conservó la identidad vigente. Se revisaron las referencias del paquete y capturas actuales; no se certificó una equivalencia píxel a píxel ni la comodidad en hardware real. La pantalla de recuperación no necesitó una corrección de diseño: el botón y el scroll se reprodujeron accesibles.
