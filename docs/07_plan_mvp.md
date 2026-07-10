# Plan del MVP

## Punto de partida

La base funcional existe y es utilizable. Antes de nuevas mejoras se debe alinear documentación, código, pruebas y CI.

## Capa A — Reorganización documental

Estado local: completada, pendiente de publicación y verificación del workflow.

- Conservar documentación inicial en `docs/archivo/`.
- Establecer mapa, jerarquía y decisiones.
- Reemplazar README de Vite.
- Registrar estado real y pendientes.

**Cierre:** no hay referencias normativas a archivos obsoletos ni decisiones duplicadas sin fuente principal.

## Capa B — Higiene y UX base

Estado local: completada para confirmaciones, terminología y residuos; animaciones siguen en la capa D.

- Completar Radix Alert Dialog en confirmaciones.
- Uniformar feedback y nombre “modo del dispositivo”.
- Retirar residuos de template y fuentes duplicadas del manifest.
- Mantener React Hook Form como planificado e incorporar Zustand/Recharts solo en usos concretos.

**Cierre:** no quedan confirmaciones nativas y el build conserva comportamiento.

## Capa C — Integridad y calidad

Estado local: completada, pendiente de verificación del workflow en GitHub.

- Corregir `lastDataChangeAt`.
- Agregar prueba de regresión para la fecha real del último cambio.
- Incorporar lint y `npm run verify`.
- Ejecutar tests y build en GitHub Actions antes del deploy.

**Cierre:** instalación limpia, lint, tests, build y auditoría correctos.

## Capa D — Requisitos funcionales pendientes

Progreso: selector de semana, vista compacta, movimientos del mes, eliminación segura y gráficos completados.

Orden recomendado:

1. Feedback y animaciones con reduced motion.

React Hook Form se incorporará dentro de una capa funcional solo si reduce complejidad real. Zustand puede ampliarse únicamente para estado temporal compartido.

## Capa E — Validación entregable

- Pruebas en celular principal y de consulta.
- Instalación y actualización de PWA.
- Uso offline.
- Venta y anulación.
- Reposición y anulación.
- Backup, restauración y copia entre celulares.
- PDF mensual.
- Revisión nocturna visual y de accesibilidad.

## Baseline sellable

Cuando las capas A–C estén verificadas:

1. registrar SHA;
2. confirmar workflow exitoso;
3. crear tag `baseline-mvp-2026-07`;
4. continuar las mejoras de la capa D desde ese punto.

No crear el tag si existen cambios sin verificar o si el deploy vigente no corresponde al mismo commit.
