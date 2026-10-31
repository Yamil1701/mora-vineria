# Mora Vinería · nueva fuente de Sites

Trabajo basado en v26 `bea955a878433b1f94cbb27af6d9388751d9537f`, sin publicar. Se conserva la identidad de la nueva Mora y su implementación HTML/CSS/módulos ES. La PWA antigua no es base ni dependencia de esta app.

Disponible localmente: ventas/cobros, fiado parcial/abonos, inventario/conteos, resolución con evidencia, correcciones trazables, pagos posteriores de recepción, reportes/metas, informe imprimible y JSON v5 compatible con 1–4.

Límites: correcciones físicas ambiguas quedan para revisión; Supabase no integrado; falta QA de instalación/offline, dos pestañas HTTPS, archivos PDF/JSON y teléfonos reales. La app conserva sus datos en el navegador y no los envía automáticamente.

- [Informe de ejecución](docs/entregas-3-4/informe-ejecucion.md)
- [Contrato técnico](docs/entregas-3-4/contrato-operaciones.md)
- [Estado y pendientes](docs/entregas-3-4/plan-maestro-actualizado.md)
- [Matriz de pruebas](docs/entregas-3-4/matriz-qa.md)
- [Capturas/comparación](design/entregas-3-4/README.md)
- [Preparación remota no aplicada](backend/README.md)

## Reproducir

Node 22 o posterior: `npm test`. No requiere instalar dependencias. El sitio es estático: servir `dist/` por HTTP para inspección local; para PWA/Web Locks se necesita un origen compatible con esas APIs. No hay compilación ni secretos de ejecución.

En la exportación de GitHub todo este proyecto vive en `sites-next/`, separado de la app histórica del repositorio. No importa nada de su `src/`. El workflow específico sólo ejecuta esta suite y no tiene permisos de Pages. No fusionar ni desplegar esta rama como parte del trabajo actual.
