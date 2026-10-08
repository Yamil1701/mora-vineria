# Verificación de la candidata 1.0

PR: https://github.com/Yamil1701/mora-vineria/pull/4. Rama: `feat/mora-v1-polish`. Sin merge, release ni despliegue. Todos los ensayos de escritura usan datos ficticios en localhost, en un contexto de navegador nuevo que bloquea red externa. Nunca un perfil o base real.

## Resultados

| Control | Resultado ejecutado |
| --- | --- |
| Baseline | verify: 27 archivos / 153 pruebas, 6 pruebas del auditor, build PWA |
| Candidata | verify: 28 archivos / 156 pruebas; lint, auditor y build aprobados |
| Auditoría producción | Aprobada; excepción preexistente GHSA-qwww-vcr4-c8h2, React Router RSC no utilizado |
| Regresiones nuevas | Catálogo >24, búsqueda completa, doble confirmación, error/reintento y exclusión síncrona entre acciones |
| Flujos Chromium sobre build | 17 aprobados; detalle en evidencia/interacciones.json |
| Responsive completo | Aprobado: 32 rutas × 6 anchos × 2 temas × 2 estados = 768 combinaciones, sin overflow ni errores de consola; más 8 principales claras a 375 px |
| PDF final responsive | 24 combinaciones aprobadas; evidencia/pdf-responsive.json |
| Accesibilidad automática | 24 casos sobre vistas principales y cuatro formularios, ambos temas; WCAG 2A/2AA/2.1AA, sin violaciones en la repetición final después de correcciones |
| PDF A4 | Dos páginas revisadas con Poppler; margen blanco, tablas legibles, window.print invocado desde botón; sin librería PDF nueva |
| CI | Workflow de PR con verify/audit; ejecución y resultado del último commit disponibles en los checks de la PR |

La primera matriz completa detectó seis casos con desborde: Movimientos a 1024 px en ambos temas/estados y PDF poblado a 320 px en ambos temas. Se corrigieron mínimos de flex/grid, columnas móviles y contención de tablas. El ensayo específico del PDF a 320 pasó los cuatro casos. La revisión de impresión detectó un fondo oscuro en los márgenes, corregido mediante color-scheme light y fondos blancos bajo print; se renderizaron ambas páginas y se comprobaron sus márgenes.

Axe detectó contraste insuficiente en textos secundarios y dos estructuras dl con contenido inválido; se corrigieron y sus 24 casos pasaron. Axe no sustituye una revisión con lector de pantalla ni acredita por sí solo conformidad completa WCAG.

La inspección visual cubre las 32 vistas enfocadas/principales móviles mediante capturas y hojas de contacto, principales desktop, temas y estados vacíos/poblados. También se inspeccionan el cierre de sheets, carrito con viewport 375×480 y salida impresa. Los filtros son preferencias de consulta; el borrador de venta conserva su almacenamiento previo. La fecha del fixture es 7/10/2026 local y todos sus nombres/importes son ficticios.

## Flujos comprobados en UI y datos

- Catálogo de 32 productos, carga de más filas, búsqueda fuera de las primeras 24 y recuperación tras reload.
- Venta al contado, doble toque, un cobro y descuento exacto de stock.
- Dos medios distintos en pago combinado; fiado parcial y nuevo cobro sin duplicación.
- Anulación de venta con motivo, historial conservado y reversión de stock/cobro.
- Reposición pendiente, confirmación única y anulación con reversión exacta de stock/dinero.
- Transferencia entre cuentas con total constante; cuenta nueva, retiro separado de gastos y conteo ajustado una sola vez.
- Cancelación de salida sin perder formulario; selector de reportes, Escape y recorrido de teclado.
- CSV descargado completo; JSON v6 restaurado sin diferencias operativas, preservando identidad y modo. La comparación normaliza propiedades undefined que JSON omite por definición.
- Invocación de window.print y PDF A4; service worker activo, catálogo offline y actualización con confirmación manteniendo productos, ventas, cobros y libro.
- Consulta: navegación sin acción de venta, cobros/anulación ocultos y registro de Tesorería deshabilitado aun por URL directa.

No se prueba restaurando datos reales ni modificando RLS, RPC o identidades. Las pruebas unitarias existentes cubren jornada, compatibilidad de respaldos históricos, stock, costos, reposiciones, fiados, Tesorería e idempotencia de sincronización.

## Reproducir sin producción

```bash
npm ci
npm run verify
npm run audit:production
```

Para QA visual se necesita Playwright y su Chromium en un entorno de prueba (no se agregan como dependencia del producto):

```bash
MORA_QA_MODE=build node scripts/qa-browser.mjs
MORA_QA_MODE=build MORA_QA_INTERACTIONS=true node scripts/qa-browser.mjs
```

El runner crea su propio Vite/preview y navegador en el mismo proceso, protege localhost y genera resultados en un directorio temporal. Variables opcionales: MORA_QA_OUTPUT, MORA_CHROME_PATH, MORA_PLAYWRIGHT_MODULE, MORA_QA_QUICK, MORA_QA_ROUTES, MORA_QA_WIDTHS, MORA_QA_THEMES, MORA_QA_PRINT y MORA_AXE_SOURCE. Rutas/anchos/temas reciben arrays JSON. Para axe-core se provee el archivo local axe.min.js, sin instalarlo en el producto.

En este runtime el navegador integrado no pudo alcanzar localhost y la descarga estándar de Chromium se truncó. Se usó Playwright preinstalado con un ejecutable temporal de @sparticuz/chromium y fuentes del sistema configuradas. No se rebajaron permisos del navegador ni se habilitó red remota para superar fallos. El bloqueo de red impide ensayar Turnstile y Supabase: sus pantallas muestran el estado de servicio no configurado.

## Evidencia comparativa

Mismo baseline `07a9dbd`, mismos fixtures y fuentes; recortes del primer viewport de 375×900, sin retocar la interfaz. No son mockups.

- [Inicio antes/después](evidencia/inicio-comparativa.png)
- [Ventas antes/después](evidencia/ventas-comparativa.png)
- [Catálogo antes/después](evidencia/productos-comparativa.png)
- [Reportes antes/después](evidencia/reportes-comparativa.png)
- [Cobro con viewport reducido](evidencia/cobro-viewport-reducido.png)
- [Inicio claro](evidencia/inicio-claro.png) y [Tesorería escritorio](evidencia/tesoreria-escritorio.png)
- [PDF ficticio A4](evidencia/reporte-ficticio.pdf), [resumen QA](evidencia/resumen-qa.json) y matriz completa comprimida en evidencia/responsive.json.gz

Las capturas y cifras no corresponden al negocio real. El baseline visual también presentaba desborde en Proyecciones a 375 px con meta mensual; la candidata reduce la cifra de la meta y permite envolver importes sin truncarlos.

## Validación que requiere dispositivos/entorno externo

Antes de autorizar el despliegue:

1. En un origen HTTPS de prueba y negocio remoto aislado, instalar la candidata en dos celulares físicos. Revisar safe areas, teclado real, scroll y gesto de cierre; probar compartir JSON y cámara/QR. No usar identidades ni registros productivos.
2. Vincular un celular Operación y otro Consulta; comprobar que Consulta no escribe, y que una venta/reposición ficticia cargada offline aparece una sola vez al recuperar red, con stock, cobros y cuentas correctos. Revisar conflicto de stock/cobro usando datos de prueba; no revocar ni recuperar el principal real.
3. En ese entorno, actualizar una PWA ya instalada, conservando su identidad/datos y confirmación de actualización. Revisar impresión nativa y un recorrido corto con TalkBack/VoiceOver. La emulación de viewport y Chromium headless no sustituye estas capacidades físicas.
4. Antes de publicar, verificar un JSON reciente del negocio y su lectura/restauración en un perfil separado con sincronización deshabilitada. Conservar una copia externa; no restaurarlo en el celular que sigue registrando operaciones.

No hay decisiones visuales pendientes. Estas comprobaciones externas y la autorización final de despliegue son las únicas intervenciones previstas. Publicación y recuperación: [ENTREGA.md](ENTREGA.md).
