# Componentes de presentación — Mora Vinería V2

Primera base reutilizable para React + TypeScript. **No existe aún una app Vite ejecutable en `master`**. La compilación y QA se harán al configurar la raíz del proyecto. La sintaxis de TypeScript/TSX y el parseo CSS se verificaron en el entorno de preparación, pero no hubo pruebas visuales de componentes montados ni tests de negocio.

## Archivos
- `theme.css`: tokens CSS `--mv-*`, fondo, superficies, navegación, botones, tablas de datos legibles y fallback de blur.
- `components.tsx`: componentes presentacionales accesibles con props explícitas.
- `format.ts`: ARS sin centavos y unidades; devuelve «—» si falta el dato.
- `index.ts`: exportaciones públicas.

## Uso después de configurar Vite

```tsx
import { AppShell, BottomNav, MetricCard, MoraButton, SyncStatus } from './ui';
import type { MoraDestination } from './ui';

function Inicio({ destino, navegar, ventas, alVender }: {
  destino: MoraDestination;
  navegar: (to: MoraDestination) => void;
  ventas: number | null;
  alVender: () => void;
}) {
  return (
    <AppShell navigation={<BottomNav value={destino} onNavigate={navegar} />}>
      <h1 className="mv-display-heading">Mora Vinería</h1>
      <MetricCard label="Ventas de hoy" value={ventas} hero />
      <MoraButton block onClick={alVender}>Nueva venta</MoraButton>
      {/* Estado SOLO si fue determinado de forma confiable por la capa de sincronización */}
    </AppShell>
  );
}
```

## Responsabilidades

- El dominio decide totales, stock, costo FIFO, jornada, permisos y confirmación bancaria.
- El adaptador de datos decide si una operación está **guardada localmente**, **pendiente**, **confirmada** o **en revisión**.
- La UI **solo muestra estados recibidos** y emite intenciones a callbacks. Nunca ejecuta operaciones de Supabase directamente.
- Las cuentas bancarias personales no se tratan como saldo total del negocio. Los fiados no se computan como cobro hasta que se abonan.
- La navegación sigue siendo de cuatro destinos; Caja y cuentas es contextual.

## Limitaciones conocidas

- Falta construir pantallas completas, adaptaciones de datos, validaciones de formularios, controles del lector, testeos de teclado y accesibilidad con usuarios.
- Las ilustraciones del catálogo aprobadas no son assets de productos reales.
- El fondo usa una ruta coherente con la publicación prevista en GitHub Pages (`/mora-vineria/`); comprobar su resolución en dev y producción cuando configuremos `vite.config.ts`.
- Las variables son una **primera calibración**, no aprobación de contraste visual final en todos los contextos. Ajustar con pruebas en celular.

Consultar [sistema visual](../../docs/10_sistema_visual_v2.md) y [contratos de pantallas](../../docs/11_contratos_pantallas_ui.md).
