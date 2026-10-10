# AGENTS.md — Mora Vinería (nueva etapa)

> **Etapa local posterior a PR#6 (10/10/2026):** por nueva misión expresa del usuario, este checkout incluye núcleo Dexie/FIFO/efectivo en modo aislado `?mode=local`; ver [implementación, pruebas y límites](docs/arquitectura-v2/07_nucleo_local.md). La ruta normal conserva la demo en memoria. No hay Supabase ni sincronización, y el desarrollo sigue sujeto a PR sin merge/despliegue automático. Los estados históricos siguientes describen el traspaso original.

## Fuente de verdad

Antes de programar, **leer primero** `docs/HANDOFF_WORK_V2.md` (traspaso para ChatGPT Work y estado real de V2) y luego los documentos fuente:
1. `docs/README.md`
2. `docs/00_producto_y_experiencia.md`
3. `docs/01_revision_de_reglas.md`
4. `docs/02_sincronizacion_y_offline.md`
5. `docs/03_plan_de_trabajo.md`
6. `docs/04_descubrimiento_operativo.md`
7. `docs/05_ejemplo_lista_proveedor.md`
8. `docs/06_lector_de_codigos.md`
9. `docs/07_cierre_relevamiento_16_preguntas.md`
10. `docs/08_flujos_ux_y_navegacion.md`
11. `docs/09_investigacion_visual_y_direccion_ux02.md`
12. `docs/10_sistema_visual_v2.md`
13. `docs/11_contratos_pantallas_ui.md`

## Diseño visual aprobado (prioridad)

**Antes de crear cualquier interfaz**, consultar `docs/diseno/mockups-aprobados-v2/README.md` y las cinco imágenes `inicio.webp`, `ventas.webp`, `cobro.webp`, `productos.webp`, `reportes.webp`. El usuario **aprobó explícitamente estas referencias móviles** el 9/10/2026 y descartó totalmente las propuestas visuales previas de escritorio/UX 01/UX 02. Usar tema oscuro y acento **rosa fucsia** (referencia `#FF0A89`); adaptar el contenido a reglas reales, accesibilidad y estados verificados. No reproducir cifras ficticias, errores de consistencia o falsas etiquetas «Sincronizado» de las imágenes. No priorizar versiones de escritorio antes del diseño móvil. Además, `docs/diseno/prototipos-v2/caja-cuentas.webp` está **aprobada visualmente** para la pantalla contextual de Caja/Cuentas y `docs/diseno/prototipos-v2/carrito.webp` está aceptada **solo para prototipado**; ver el README de esa carpeta. Mantener la distinción frente a las cinco imágenes oficiales.

Las instrucciones explícitas del usuario prevalecen. La rama `legacy/v1-final` es referencia histórica y **no** es una base a copiar automáticamente.

## Fondo y UI Kit inicial (a validar en teléfonos)

- Fondo ambiental aceptado: `docs/diseno/fondo/fondo-nocturno-fucsia.webp`; copia de aplicación prevista en `public/assets/`.
- Los tokens visuales y componentes de presentación **están definidos por primera vez** en `src/ui/theme.css`, `src/ui/components.tsx`, `src/ui/format.ts`; consultar `docs/10_sistema_visual_v2.md` y `docs/11_contratos_pantallas_ui.md`.
- **Estado actualizado al 9/10/2026:** el scaffold Vite y la demo visual V2 **ya existen**, están en `master` y fueron publicados en GitHub Pages tras compilar/testear. El usuario revisó la segunda demo, la considera mejor pero **no aprobó el diseño final**. Los datos de negocio de la demo son ficticios y en memoria; **no hay persistencia real, Supabase V2, FIFO ni sincronización implementados**. Revisar `docs/HANDOFF_WORK_V2.md`; no usar la demo como producción operativa.
- La interfaz no puede inventar confirmación de transferencia, saldo real ni estado sincronizado. En offline el cálculo de ganancia FIFO puede estar pendiente. Las decisiones de negocio son superiores a los datos ficticios de los mockups.

## Primera misión autorizada para Work

Crear una rama nueva desde `master` y **diseñar documentadamente** contratos de negocio, dominio, Dexie/outbox, FIFO, idempotencia, permisos/RLS, recuperación y matriz de pruebas; abrir PR y detenerse antes de merge, despliegue o cualquier mutación remota. El usuario quiere dejar de generar mockups y desarrollar operaciones reales verticalmente. **No tocar Supabase ni datos anteriores sin aprobación específica.** Véase la sección «PRIMERA MISIÓN PARA WORK» del handoff.

## Propósito y experiencia

- Priorizar recorridos cotidianos, facilidad de uso, claridad, accesibilidad y diseño móvil.
- No construir una pantalla o funcionalidad solo por existir en V1.
- Antes de implementar, diseñar el recorrido principal y sus estados: vacío, error, sin red, pendiente y confirmado.
- Textos en español, comprensibles para personas sin conocimientos técnicos ni contables.
- Reducir pasos y decisiones en la venta sin sacrificar integridad.

## Arquitectura de partida (por validar en detalle)

- PWA React, Vite, TypeScript, Tailwind; instalación y publicación en GitHub Pages con base `/mora-vineria/`.
- IndexedDB como almacenamiento local y cola offline; Supabase como autoridad compartida remota.
- Cambios locales siempre durables antes de intentar enviarlos; servidor con operaciones idempotentes, validación transaccional y aislamiento por negocio/dispositivo.
- Sin exposición de claves privilegiadas en el navegador. RLS y control de dispositivos obligatorios.
- Backup/exportación recuperable independiente de la sincronización.

## Decisiones no cerradas

Ver decisiones de V2 ya confirmadas en `docs/07_cierre_relevamiento_16_preguntas.md`: jornada 08:00–07:59, fiados simples, ventas reales offline conservadas aunque requieran revisión, stock objetivo inicial manual, y 3–4 equipos con iguales funciones capaces de habilitar otros bajo acceso seguro. **Aprobado:** costeo FIFO por lotes de compra para asignar costos a ventas, costo promedio como indicador secundario, categorías simplificadas. **Abierto:** asignación FIFO en ventas offline/stock insuficiente, detalles de imágenes, auditoría, recuperación y otros conflictos técnicos. El precio sugerido utiliza recargo del 50 % sobre costo unitario y redondeo superior a $500, con decisión humana final. Ver `docs/01_revision_de_reglas.md`. No inventar criterios silenciosamente ni declarar decisiones abiertas como definitivas.

## Restricciones

- No borrar ni resetear el proyecto Supabase anterior, identidades, operaciones remotas o bases locales sin autorización expresa para ese procedimiento.
- No modificar datos de producción para pruebas. Usar entorno o dataset aislado.
- No desplegar automáticamente una reconstrucción incompleta.
- No agregar funciones de ERP, contabilidad fiscal o integraciones ajenas al objetivo sin aprobación.
- Si una operación offline entra en conflicto, no descartarla, duplicarla ni sobrescribir silenciosamente datos confirmados.

## Método de trabajo

1. Definir problema, caso de uso, criterio de aceptación y riesgos.
2. Usar los mockups aprobados como referencia y mejorar componentes reales al construir cada flujo; no iniciar otra serie de mockups sin necesidad.
3. Implementar verticalmente con tests de reglas, sincronización, datos y UI.
4. Reportar archivos cambiados, pruebas realizadas y riesgos pendientes.
