# Arquitectura técnica

## Decisión principal

Mora Vinería es una única aplicación frontend PWA, local-first y sin backend en el MVP.

```text
React + Vite + TypeScript + Tailwind CSS
React Router
IndexedDB + Dexie
PWA con vite-plugin-pwa
GitHub Pages
Backup/restauración JSON
PDF con vista imprimible y window.print()
```

La aplicación vive directamente en la raíz del repositorio. No existe una carpeta `frontend/`.

## Estructura

```text
mora-vineria/
├── .github/workflows/
├── docs/
├── public/
├── src/
│   ├── components/
│   ├── db/
│   ├── domain/
│   ├── features/
│   ├── hooks/
│   ├── routes/
│   ├── schemas/
│   ├── styles/
│   ├── tests/
│   └── utils/
├── package.json
└── vite.config.ts
```

## Tecnologías activas

- React y TypeScript para interfaz y dominio.
- Vite para desarrollo y build.
- Tailwind CSS para estilos.
- React Router para navegación.
- Dexie para IndexedDB y transacciones.
- Zod para validaciones críticas y archivos importados.
- date-fns para rangos y fechas.
- vite-plugin-pwa para manifest, Service Worker y actualización.
- Vitest y jsdom para pruebas.
- Radix Toast, Alert Dialog y Dialog para feedback, confirmaciones y sheets accesibles.
- Zustand para preferencias temporales de interfaz.
- Recharts para gráficos de reportes cargados de forma diferida.

## Tecnologías planificadas

Estas dependencias fueron aprobadas al crear la base y se conservan para adopción gradual:

### React Hook Form

Para formularios que ya resulten difíciles de mantener con estado local: productos, ventas, movimientos, configuración, meta y restauración. No se migrará un formulario estable solo para uniformar tecnología.

Cada adopción debe justificar el problema concreto que resuelve y agregar pruebas proporcionales.

## Datos

Dexie usa el esquema versión 1 con tablas para categorías, productos, ventas, detalles, movimientos, reposiciones, configuración, metas y metadatos de backup.

Los datos operativos permanentes no deben guardarse en Zustand ni depender de memoria React. Zustand persiste únicamente preferencias y el borrador temporal de venta en `localStorage`; puede incluir destino de transferencia, pero no “Pagan con” ni vuelto. El borrador no forma parte del backup ni evita la validación transaccional al vender.

Las operaciones que afectan varias tablas se ejecutan en transacciones.

## Validación

Zod valida formularios críticos y el contrato completo de backup. La base de datos vuelve a validar antes de escribir; la interfaz no es la única barrera.

## PWA y rutas

Vite utiliza:

```ts
base: "/mora-vineria/"
```

React Router usa el mismo `basename`. GitHub Pages dispone de fallback `404.html` y el Service Worker navega a `/mora-vineria/index.html`.

El manifest debe tener una única fuente de configuración para evitar divergencias.

Las pantallas se cargan por ruta mediante `React.lazy`. Recharts permanece en un chunk separado y solo se descarga al abrir una perspectiva gráfica de Reportes.

## PDF y CSV

El PDF mensual se obtiene con HTML/CSS de impresión y `window.print()`. No se agrega una librería pesada mientras esta solución alcance.

CSV es una salida de consulta para planillas; JSON es el único formato de respaldo/restauración.

## Calidad

El entorno de referencia es Node.js 22 y npm con lockfile.

```bash
npm run lint
npm test -- --maxWorkers=1
npm run build
npm audit --omit=dev
```

`npm run verify` agrupa lint, tests y build.

El workflow de Pages debe verificar antes de publicar. El deploy histórico desde una rama `gh-pages` fue una solución temporal durante un bloqueo de billing; GitHub Actions es nuevamente el mecanismo vigente.

## Seguridad y límites

No hay autenticación ni protección criptográfica local. Quien accede al dispositivo/navegador puede acceder a los datos. El backup frecuente es parte de la seguridad operativa.

No incorporar backend, Firebase, Supabase, PostgreSQL, JWT, WebSockets, Docker obligatorio, app nativa ni sincronización automática durante el MVP.

## Evolución

Cambios de esquema, backup o cálculos requieren capa pequeña, migración explícita y pruebas. Una arquitectura con servidor solo se evaluará si aparecen necesidades reales de sincronización, cuentas o múltiples dispositivos editables.
