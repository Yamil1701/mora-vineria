# Arquitectura técnica

## Decisión principal

`v0.1.1` es una PWA local. `v0.2.0` conserva la PWA local-first e incorpora Supabase como fuente remota compartida.

```text
React + Vite + TypeScript + Tailwind CSS
React Router
IndexedDB + Dexie
PWA con vite-plugin-pwa
GitHub Pages
Backup/restauración JSON
PDF con vista imprimible y window.print()
Supabase PostgreSQL + Auth anónimo + Realtime
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
- Supabase JS para sesión de dispositivo, RPC transaccional, RLS y avisos Realtime.
- qrcode.react para el QR SVG y ZXing Browser para lectura por cámara cargada de forma diferida.
- Cloudflare Turnstile mediante `@marsidev/react-turnstile` para proteger únicamente las altas anónimas nuevas.

## Tecnologías planificadas

Estas dependencias fueron aprobadas al crear la base y se conservan para adopción gradual:

### React Hook Form

Para formularios que ya resulten difíciles de mantener con estado local: productos, ventas, movimientos, configuración, meta y restauración. No se migrará un formulario estable solo para uniformar tecnología.

Cada adopción debe justificar el problema concreto que resuelve y agregar pruebas proporcionales.

## Datos

Dexie v1 contiene la base operativa original. Dexie v2 agrega vínculo de dispositivo, cola de salida, cursor remoto y conflictos; Dexie v3 agrega la versión remota conocida por entidad; Dexie v4 agrega `cobrosVentas` y `diferenciasStock`. El backup operativo sube a v2 y migra copias v1 al leerlas.

Los datos operativos permanentes no deben guardarse en Zustand ni depender de memoria React. Zustand persiste únicamente preferencias y el borrador temporal de venta en `localStorage`; puede incluir destino de transferencia, pero no “Pagan con” ni vuelto. El borrador no forma parte del backup ni evita la validación transaccional al vender.

Las operaciones que afectan varias tablas se ejecutan en transacciones.

La cola local es durable e idempotente. Supabase ordena operaciones aceptadas mediante una secuencia propia. Realtime solo solicita una nueva lectura incremental; perder un mensaje Realtime no puede perder datos.

Categorías y productos usan versión optimista. Ventas, cobros y movimientos son operaciones inmutables o anulables: cada escritura actualiza Dexie y su outbox dentro de una transacción. El servidor recibe lotes idempotentes mediante RPC, valida dispositivo y modo, aplica stock y trazabilidad transaccionalmente y devuelve snapshots canónicos. El pull consume `operaciones_sincronizacion.secuencia`; el cursor local se confirma únicamente después de aplicar el lote.

El ciclo automático separa lotes de catálogo y operativos, pero conserva `pull → push → pull`. Antes de aplicar stock remoto, Dexie incorpora el efecto de operaciones locales todavía pendientes para evitar saltos visuales. Al confirmar una operación propia se elimina primero de la cola y recién después se aplica la respuesta canónica, evitando contar dos veces su impacto.

Las tablas operativas remotas tienen RLS y no conceden acceso directo al cliente. Las RPC públicas son `security definer`, revocadas para `anon`/`PUBLIC`, concedidas a `authenticated` y validan internamente `auth.uid()`, dispositivo activo, negocio, modo y tipo principal cuando corresponde.

Realtime escucha inserciones de operaciones como señal para ejecutar pull. No transporta el estado canónico ni reemplaza el intervalo de recuperación de 45 segundos, los eventos de conectividad, foco o visibilidad.

## Validación

Zod valida formularios críticos y el contrato completo de backup. La base de datos vuelve a validar antes de escribir; la interfaz no es la única barrera.

## PWA y rutas

Vite utiliza:

```ts
base: "/mora-vineria/"
```

React Router usa el mismo `basename`. GitHub Pages dispone de fallback `404.html` y el Service Worker navega a `/mora-vineria/index.html`.

La raíz usa un data router para bloquear de forma consistente la navegación con formularios modificados, incluida la navegación POP disparada por Atrás o gestos del sistema.

El manifest debe tener una única fuente de configuración para evitar divergencias.

Las pantallas se cargan por ruta mediante `React.lazy`. Recharts permanece en un chunk separado y solo se descarga al abrir una perspectiva gráfica de Reportes.

`Suspense` usa fallbacks diferidos para evitar parpadeos en navegaciones rápidas. La inicialización local dispone de un estado visual propio después de un umbral breve y la raíz React está protegida por un error boundary con recuperación. Estas capacidades se implementan con React y CSS existentes, sin sumar una dependencia de animación.

Durante el arranque se inicializa Dexie y se precargan configuración, resumen de Inicio, productos y categorías. Una caché exclusivamente transitoria entrega ese primer snapshot a los hooks y vence a los 2,5 segundos; Dexie continúa siendo la única fuente persistente y las cargas posteriores vuelven a consultarla normalmente.

La identidad PWA conserva SVG maestros en `public/brand/` y PNG derivados en `public/icons/`. El manifest declara por separado iconos `any` y `maskable`; Apple Touch Icon y favicon usan la misma fuente visual.

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

## Supabase y seguridad

La PWA recibe `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. Ambas son públicas por diseño. Ninguna clave elevada se incluye en código, GitHub Pages, variables `VITE_`, backups o almacenamiento local.

En desarrollo se leen desde `.env.local`. GitHub Actions las recibe como variables del repositorio con los mismos nombres; si están ausentes, el build sigue funcionando pero la interfaz informa que la sincronización no está configurada.

Cada dispositivo obtiene una sesión anónima de Supabase Auth. El acceso a datos depende de que `auth.uid()` esté asociado a un dispositivo activo mediante RLS. Las funciones `security definer` validan internamente negocio, dispositivo, estado, modo y principal antes de escribir.

El primer dispositivo se activa con un secreto de un solo uso almacenado únicamente como hash. Los emparejamientos vencen, se usan una vez y tampoco se almacenan en claro. Recuperar el principal revoca el anterior y rota el código de recuperación.

El QR transporta únicamente el código efímero con un prefijo de formato; no contiene URL de Supabase, publishable key, identificadores ni datos del negocio. La lectura por cámara se carga de forma diferida y siempre conserva el ingreso manual como alternativa.

Antes de exponer el alta anónima en producción se incorpora Cloudflare Turnstile. La limpieza de identidades anónimas solo puede afectar sesiones antiguas que nunca se vincularon a `dispositivos`.

Turnstile no interviene cuando el dispositivo ya conserva una sesión. Si hace falta crearla, el cliente obtiene un token efímero y lo entrega a `signInAnonymously`; la secret key permanece exclusivamente en Supabase. Un trabajo diario de `pg_cron`, ejecutado como `postgres`, elimina identidades anónimas con más de siete días solo si nunca tuvieron una fila en `dispositivos`. La función y el esquema de Cron no son accesibles desde `anon` ni `authenticated`.

## Seguridad y límites

No hay autenticación ni protección criptográfica local. Quien accede al dispositivo/navegador puede acceder a los datos. El backup frecuente es parte de la seguridad operativa.

Los metadatos locales permiten distinguir respaldo inexistente, vigente y atrasado. El umbral operativo vigente es mayor a siete días; el recordatorio no reemplaza ni automatiza la descarga o el uso compartido del archivo.

No incorporar otro backend, Firebase, claves administrativas en el cliente, Docker obligatorio ni app nativa. Supabase es la única excepción aprobada para `v0.2.0`.

## Evolución

Cambios de esquema, backup, cálculos o protocolo de sincronización requieren migración explícita y pruebas. Las migraciones remotas se versionan en `supabase/migrations/` y se revisan con asesores de seguridad después de aplicarse.
