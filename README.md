# Mora Vinería

PWA local-first y mobile-first para registrar productos, ventas, movimientos y consultar reportes simples de una vinería pequeña.

El MVP funciona sin backend. Los datos se guardan en IndexedDB mediante Dexie y se pueden respaldar y restaurar con archivos JSON.

## Estado

Versión estable actual: **v0.1.1**. La sincronización offline de `v0.2.0` está en desarrollo y no altera todavía la operación estable.

La base funcional incluye:

- productos, categorías y stock simple;
- ventas, anulaciones y reversión de stock;
- reposiciones, aportes externos y gastos puntuales;
- dashboard, reportes, proyecciones y meta mensual;
- backup/restauración JSON y exportaciones CSV;
- PDF mensual mediante vista imprimible;
- modo de dispositivo principal o de consulta;
- PWA instalable con funcionamiento offline.

El estado detallado y los pendientes están en [`docs/06_estado_implementacion.md`](docs/06_estado_implementacion.md).

## Tecnologías

React, Vite, TypeScript, Tailwind CSS, IndexedDB con Dexie, React Router, Zod, date-fns, Vitest y vite-plugin-pwa.

Zustand conserva preferencias temporales y Recharts muestra gráficos de reportes. React Hook Form permanece planificado para formularios que realmente necesiten esa complejidad. Radix UI se usa para toast y confirmaciones. La evolución `v0.2.0` incorpora Supabase JS, QR SVG y lectura diferida con ZXing para autorizar dispositivos.

## Desarrollo local

Requiere Node.js 22 y npm.

```bash
npm ci
npm run dev
```

Para probar desde otro dispositivo de la red local:

```bash
npm run dev:host
```

Para verificar una versión de producción:

```bash
npm run verify
npm run preview:host
```

## Publicación

La aplicación se publica en GitHub Pages con:

```text
https://Yamil1701.github.io/mora-vineria/
```

Vite usa `base: "/mora-vineria/"`. El workflow de GitHub Actions instala dependencias, ejecuta controles de calidad, compila y publica `dist`.

## Documentación

El mapa, la jerarquía y la responsabilidad de cada documento están en [`docs/README.md`](docs/README.md).

Antes de modificar el proyecto, leer también [`AGENTS.md`](AGENTS.md).
