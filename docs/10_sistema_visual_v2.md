# Mora Vinería 2.0 — Sistema visual implementable (v0.1)

> **Nota de estado (10/10/2026):** los cierres históricos de este documento no describen el código actual. Existe demo V2 en master; FIFO y categorías simples están aprobados, pero persistencia/servidor aún no implementados. El [handoff](HANDOFF_WORK_V2.md) rige el estado y la [arquitectura propuesta](arquitectura-v2/README.md) separa decisiones confirmadas de propuestas técnicas. No generar más mockups.

**Estado:** primera traducción técnica de referencias aprobadas; todavía debe validarse en teléfonos reales. **No es un nuevo mockup, no es la PWA completa.**

## Precedencia de fuentes

1. Reglas operativas confirmadas: `docs/07_cierre_relevamiento_16_preguntas.md`, `docs/04_descubrimiento_operativo.md` y posteriores cambios aprobados.
2. Identidad visual principal: las cinco imágenes en `docs/diseno/mockups-aprobados-v2/`.
3. Complementos: `docs/diseno/prototipos-v2/caja-cuentas.webp` (aprobada visualmente), `carrito.webp` (aceptado solo para prototipo).
4. Fondo: `docs/diseno/fondo/fondo-nocturno-fucsia.webp` (aceptado para el kit).
5. UX y arquitectura: `docs/08_flujos_ux_y_navegacion.md` y `docs/02_sincronizacion_y_offline.md` (distinguir propuesta de decisión aprobada).

Si una imagen introduce una métrica o regla incorrecta, **prevalece el dominio**. Por ejemplo: fiados pendientes no son cobros de caja, 3 unidades físicas vendidas no se pueden descartar por conflicto offline, y la ganancia FIFO aún sin conciliar no se presenta como confirmada.

## Identidad y tokens

**Implementación inicial:** `src/ui/theme.css` contiene variables CSS públicas `--mv-*` y estilos reutilizables. Este archivo es la **fuente de verdad de los tokens ejecutables**; las cifras de este documento son explicativas.

| Rol | Valor inicial | Criterio |
| --- | --- | --- |
| Acento | `#FF0A89` | CTA, tab seleccionado, navegación activa; jamás todos los importes a la vez |
| Texto sobre CTA fucsia | `#111013` | Relación de contraste ~5,1:1 |
| Fondo sólido | `#101013` | Fallback cuando la imagen o blur no estén disponibles |
| Superficie | `#19191E` | Tarjetas y paneles; no aplicar overlays opacos a todo |
| Superficie secundaria | `#222228` | Campos y controles secundarios |
| Texto principal | `#F4F3F5` | Títulos, números, controles principales |
| Texto secundario | `#B8B8C3` | Texto legible sobre tarjeta oscura |
| Texto auxiliar | `#9A9AA5` | Etiquetas, información no crítica |
| Positivo | `#32D68A` | Confirmaciones reales o diferencia cero |
| Precaución | `#FFBC6A` | Sin conexión, stock bajo o revisión pendiente |
| Pérdida/error | `#FF6488` | Diferencias no conciliadas, fallos o stock crítico |
| Divisor | `#35353E` | Separación sobria, sin tarjetas anidadas indefinidamente |

**Contraste comprobado para pares propuestos:** oscuro sobre rosa ≈5,1:1; blanco sobre rosa ≈3,36:1, por eso los CTA rosa usan **texto oscuro**. Texto principal sobre superficie ≈15,8:1; secundario ≈8,9:1. Validar también estados disabled, foco y overlays reales con dispositivos.

### Tipografía

- Interfaz: fuente del sistema, sin dependencia de Google Fonts. Números tabulares, separador de miles `es-AR`, pesos diferenciados sin exageración.
- Editorial: serif discreta en títulos seleccionados (marca o encabezados principales) cuando aporta identidad; listas, botones, montos y labels **siempre sans legible**. Evitar alternar estilos sin criterio en una misma pantalla.
- Escala de referencia: 12px (metadata), 14–16px (lectura y botones), 17–23px (subtítulos), 29–37px (titulares), 34–48px (métrica central). Evitar texto inferior a 12px.

### Espaciado, forma y estructura

- Unidad de ritmo: **4px**, pasos habituales 8/12/16/20/24/32.
- Pantallas 360–430px como prioridad; contenido a 20px de borde, reducido a 14px si el ancho disponible es demasiado estrecho.
- Controles táctiles **mínimo 44×44px** y botones principales 48px o más.
- Radios 10 / 16 / 22px. Las listas utilizan divisores finos; las métricas o diálogos justifican tarjetas. Reducir bordes dentro de bordes.
- Barra inferior **siempre cuatro destinos**: Inicio, Ventas, Productos, Reportes. Caja, fiados, reposición y dispositivos se abren por navegación contextual; no agregar «Más» como quinta pestaña.
- Respetar área segura (`env(safe-area-inset-bottom)`) y teclado en iOS/Android. El total del carrito permanece accesible sin tapar ítems o teclado.

## Fondo y efectos

- Fondo WebP oficial: `docs/diseno/fondo/fondo-nocturno-fucsia.webp` (21 KB). Copia destinada a la futura app: `public/assets/fondo-nocturno-fucsia.webp`.
- Una instancia por `AppShell` con superposición oscura sobre la imagen; no insertar la imagen en todas las tarjetas.
- Tarjetas principales: superficie rgba con opacidad inicial ~88 %, blur máximo orientativo de 12px y borde 1px tenue. Usar sombra suave solo cuando indica elevación.
- **Fallback obligatorio:** sin `backdrop-filter`, el contenido debe permanecer legible. Apoyar `prefers-reduced-transparency` si existe, `prefers-reduced-motion` y teléfonos lentos; no animar luces del fondo.
- El fondo no debe competir con texto, números ni fotos de productos. Ajustar overlay cuando se pruebe con contenido real.

## Comportamiento visual real

- Los botones tienen estado `idle / pressed / disabled / busy / focus`. Focus visible no puede depender solo de rosa.
- Los filtros tienen estado activo y contenido; estados no determinados se expresan con texto claro, no solo color.
- Estados de sincronización: **Al día** (solo servidor confirmó), **Pendiente** (operación local durable), **Sin conexión** (guardado local), **Revisar diferencia** (requiere acción). Reintentos no se muestran como ventas nuevas.
- Inventario: distinguir stock registrado, stock comprobado, objetivo, sugerencia de compra y diferencia pendiente. La insignia de stock recibe una clasificación desde lógica de negocio, **no** fija un umbral por CSS.
- Dinero: **ventas**, **cobros**, **ganancia bruta FIFO estimada** y **saldo disponible** tienen etiquetas independientes. No crear confianza falsa en saldos reales que no se contaron.
- Fotos: producto identificado con variante/volumen verificados, carga diferida, dimensiones limitadas; fallback claro sin foto equivocada. Las fotos de las imágenes generadas **no** alimentan el catálogo.

## Código inicial de componentes

Los **componentes de presentación** en `src/ui/components.tsx` y `src/ui/format.ts` están diseñados para React + TypeScript, sin acoplamiento a Dexie/Supabase. Su CSS está en `src/ui/theme.css`.

- `AppShell`: contenedor + fondo + área segura + barra inferior opcional.
- `BottomNav`: navegación de cuatro destinos; destino activo en prop explícita.
- `GlassPanel`: superficie, variante suave y variante con acento.
- `MoraButton`: variantes primary/secondary/quiet/danger y estados busy/disabled.
- `SegmentedTabs`: grupo accesible de opciones con `aria-pressed`, sin simular tabs ARIA sin flechas.
- `Money`, `MetricCard`: formateo ARS y métrica sin cálculos ocultos.
- `ProductRow`, `StockBadge`, `QuantityStepper`: lectura, stock comunicado por dominio, edición explícita de unidades.
- `SyncStatus`: comunica un estado **recibido** del servicio de sincronización.
- `CashBalance`: esperado, conteo real con fecha y diferencia solo si ambos existen.
- `CartFooter`: subtotal efectivo recibido desde carrito, botón deshabilitado si está vacío.
- `EmptyState`: estados vacíos legibles y contextualizados.

Son piezas de UI reutilizables, **no** una implementación de venta, cobranzas, FIFO, autenticación o conflictos. La app raíz Vite todavía no está configurada: deben integrarse, probarse, ajustarse al sistema de datos y verificarse en dispositivo antes de afirmar que la app funciona.

## Validación requerida antes de considerarlo sistema visual definitivo

1. Testear 360×780, 390×844, 430×932; teclado abierto, safe area, scroll largo y zoom 200 %.
2. Medir contrastes realmente renderizados sobre el fondo y alternativas sin blur.
3. Confirmar en pantalla de venta: selección rápida de uno/varios productos, ajuste de cantidad y precio, cobro por efectivo/transferencia, regreso.
4. Revisar fiados, cash real versus esperado, estado offline y alertas de reconciliación con textos inequívocos.
5. Verificar que todas las cifras del prototipo provengan de un único dataset de prueba, no de texto hardcodeado.
6. Compilar Vite+TypeScript/React una vez se cree el scaffold; ejecutar tests unitarios y pruebas funcionales. La comprobación actual es de **sintaxis de TSX/CSS**, no build final ni QA funcional.

**Siguiente documento:** `docs/11_contratos_pantallas_ui.md` especifica cómo ensamblar estas piezas respetando las decisiones operativas.
