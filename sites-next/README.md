# Mora Vinería · candidata técnica RC1

La fuente de desarrollo es `sites-next/`, basada en Sites v29. Conserva la interfaz oscura/fucsia y los cuatro bloques aprobados. No usa la PWA histórica del repositorio ni agrega proyecciones.

**No publicar ni fusionar.** La app activa guarda en este navegador; Supabase no está conectado. Servicio remoto, SQL e IndexedDB son candidatos con pruebas locales, pendientes de infraestructura e integración. PR #14 continúa en borrador. Sites v25 sigue pública y v29 congelada como referencia.

- [Instrucciones para continuar](docs/rc1/INSTRUCCIONES.md)
- [Resumen y bloqueos](docs/rc1/00-resumen-ejecutivo.md)
- [Implementación](docs/rc1/01-implementacion.md)
- [Matriz funcional](docs/rc1/02-matriz-funcional.md)
- [Seguridad](docs/rc1/03-seguridad-integridad.md)
- [Supabase](docs/rc1/04-supabase.md)
- [Migración](docs/rc1/05-migracion-recuperacion.md)
- [PWA y PDF](docs/rc1/06-pwa-pdf.md)
- [Pruebas](docs/rc1/07-resultados-pruebas.md)
- [Evidencias](docs/rc1/08-evidencias.md)
- [Guion móvil: 45 casos pendientes](docs/rc1/09-guion-qa-movil.md)

Los documentos de `docs/entregas-3-4/`, `docs/recuperacion-json-v29.md` y capturas anteriores son antecedentes. Su estado histórico no reemplaza esta evaluación RC1.

## Reproducir sin publicar

Node >=22 en Linux para el navegador automatizado. Desde `sites-next/`:

```sh
npm ci --no-audit --no-fund
npm run verify
npm test
npm run test:browser
```

El navegador usa Chromium 153 fijado por dependencia de desarrollo y dos orígenes HTTPS locales con certificado descartable. No requiere sesión, datos reales ni claves. Genera `artifacts/` con JSON, capturas y PDF. Si se usa otro ejecutable, definir `MORA_CHROMIUM` y registrar su versión; no comparar evidencia como si fuera el mismo entorno.

La app estática está en `dist/`; no hay build que importe la app vieja. Para Web Locks/PWA se necesita un contexto seguro. El workflow tiene sólo `contents: read` y sube evidencia sintética; no publica Pages. `npm test` descubre `.case.mjs` para evitar que Vitest histórico ejecute estas pruebas con otro runner.
