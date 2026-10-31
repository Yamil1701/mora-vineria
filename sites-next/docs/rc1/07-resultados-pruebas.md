# Resultados de pruebas · RC1

## Resultado local final

| Nivel | Resultado verificado | Límite |
|---|---|---|
| Línea base v29 | 20 entradas de archivo aprobadas antes de editar | No acreditaba remoto/PDF/teléfono |
| Node: dominio, controladores, recuperación y PostgreSQL | **49 entradas aprobadas, 0 fallos, 24 archivos** | 20 entradas heredadas son scripts con varias aserciones; el total no cuenta cada aserción como caso |
| PostgreSQL local/servicio | **15 pruebas nombradas** incluidas en las 49 | PGlite real, una sesión; identidades sintéticas, sin Supabase alojado |
| Navegador HTTPS | **14 recorridos aprobados**, 0 errores no capturados de app | Chromium 153.0.8010.0; emulación 360/390/430, sin teléfono físico |
| Fuente estática | 31 módulos activos, 47 rutas de caché, 50 archivos de artefacto | Adaptadores experimentales inactivos comprobados |
| Dependencias | npm audit: 0 vulnerabilidades reportadas | Consulta de ese momento; paquetes de desarrollo, no una certificación de seguridad |
| PDF | A4 real de **3 páginas**, márgenes de texto ≥15 mm, renderizado completo | Impresora y visor del teléfono pendientes |
| Supabase remoto | **Bloqueado** | No existe proyecto Mora dev autorizado/configurado |
| QA de usuario | **45 casos físicos pendientes** | Ninguno aprobado por el usuario |

Se utilizó Playwright estándar porque el skill de Browser estaba disponible pero su herramienta de ejecución no estaba expuesta en este entorno. Las sesiones son descartables; no se automatizó una sesión personal ni se operó el Site público.

## Comandos ejecutados

```sh
npm ci --no-audit --no-fund
npm test
npm run verify
npm audit --json
MORA_CHROMIUM=/ruta/al/chromium153 MORA_QA_OUTPUT=/ruta/evidencia npm run test:browser
pdfinfo Mora-informe-mensual-QA-A4.pdf
pdftotext -layout Mora-informe-mensual-QA-A4.pdf pdf-text.txt
pdftoppm -scale-to 1100 -png Mora-informe-mensual-QA-A4.pdf pdf-final-page
```

Node local 24.22.1; proyecto exige >=22. Las dependencias están fijadas en package-lock. El navegador se extrajo del paquete fijado @sparticuz/chromium 153.0.0; no se pudo usar la descarga CDN de Playwright en este contenedor. No se deshabilitó la seguridad web: la confianza HTTPS se limitó a la clave pública del certificado local sintético.

## Cobertura financiera y de recuperación

- Suites existentes conservadas: ventas, FIFO racional, medios de cobro, diferencias, stock inicial, inventario/rotura, compra/presentaciones, pedidos, recepciones, abonos, correcciones, reportes, metas, cutoff de madrugada/mes/año y backup.
- Resiliencia local: cuota/escritura fallida, snapshot anterior, preparación interrumpida, 100 repeticiones con un efecto, pérdida posterior a escritura, escritor viejo, checkpoint fallido, historial 600 movimientos y foto 88 KB, límites/archivo alterado, fechas naturales y efecto monetario posterior.
- SQL: permisos negativos, negocio ajeno, Auth sintética, FIFO, costo desconocido, deuda, 100 solicitudes con misma identidad y un resultado, dos dispositivos simulados con revisión obsoleta/sobreabono, resultado recuperable, inventario, recepción y pagos parciales/finales, transferencia verificada, correcciones y metas, actor/dispositivo falsos, revocación antes y después del cálculo, rollback tardío, límite HTTP por lectura progresiva, FIFO de dos lotes y pedido recibido parcialmente.
- Adaptador remoto: fecha/identidad estables, corte después de confirmar, consulta con mismo ID, evidencia física conservada, error de almacenamiento antes de enviar, resultado de otro dispositivo rechazado, claves privilegiadas rechazadas, sesión faltante y clasificación 401/403/409/422/503. **Transporte simulado**, sin red Supabase.
- v3 y v4 auténtica: mismo estado común al migrar; nueva exportación v5 idéntica. v5 complejo recorre además selector, descarga, restore ocupado y origen separado.

## Recorridos de navegador

Tres recorridos de restauración/pantallas (uno por ancho): Inicio, Ventas, Caja, Productos, Inventario, Reposición, Reportes, Configuración y Datos. Sin desborde horizontal; restore hasta CTA, bloqueo ocupado, descarga exacta y preparación recuperada una sola vez tras dos recargas.

Tres recorridos comerciales (uno por ancho): nueva venta/carrito/cobro/comprobante, doble activación, transferencia pendiente, parte fiada, dos abonos que suman el saldo, cuenta corregida sin nuevo cobro, motivo de conteo conservado, pérdida de stock sin dinero, pago posterior de recepción sin nuevo stock, meta actual y exportación exacta. Cada uno suma 3 ventas, consume 3 unidades por venta más 1 por pérdida, agrega dos abonos, una corrección de cuenta y un pago de recepción; se comparan registros reales del almacenamiento sintético.

Los otros ocho: dos pestañas HTTPS/bloqueo/liberación y escritor antiguo simulado; ausencia de Web Locks sin escribir; traslado real entre dos orígenes; shell offline/worker nuevo/borrador; cuota real agotada con snapshot conservado; altura reducida/campo enfocado/manifiesto; IndexedDB con dos conexiones y 100 confirmaciones/reapertura; PDF nativo.

El cambio de altura simula espacio disponible para teclado: **no prueba el teclado del sistema operativo**. Dos pestañas son reales; dos dispositivos SQL son clientes simulados sobre una sesión local. Cierre/reapertura del adaptador no es una prueba de corte de energía.

## Fallos observados y cierre

Se corrigieron defectos del producto reproducidos: arranque sin locks; fechas/textos; comparación de fracciones sensible al orden JSONB; aviso de primera instalación confundida con actualización; bloqueo global de navegación tras guardar; pérdida de foco/entrada al reconstruir conteo; fondo oscuro del PDF. Las evidencias de incidencias corregidas se separan de las capturas finales.

También se corrigieron supuestos del guion automático, sin tocar el producto: una pantalla de detalle exige volver por su contexto antes de abrir Más; las metas conservan historia y debe consultarse la última; las confirmaciones tienen una breve protección temporal. No se presentaron esos errores del guion como defectos de negocio.

Intentos de infraestructura/herramientas no aprobados como resultado: descarga CDN de navegador, instalación de paquetes del sistema, CLI de Supabase bloqueado por analítica externa. La alternativa final de navegador NPM y PostgreSQL local sí se ejecutó. Ninguna prueba remota alojada se sustituyó con un resultado ficticio.

## CI

El workflow específico ahora hace npm ci, verifica fuente, ejecuta las 49 entradas y los 14 recorridos, y guarda artefactos 14 días; sólo tiene `contents: read`. El workflow histórico permanece sin cambios y no es evidencia directa de Mora nueva. Los SHA y conclusiones de los runs están en `estado-final.json`; no extrapolar un verde de otro commit.
