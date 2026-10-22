# 16 — Dependencias y orden constructivo (del plano a PR seguras)

**Borrador técnico, sin autorización de implementar.** **Decisiones posteriores del usuario (21/10/2026):** Reposición como área propia fuera de Productos, enlace desde ficha posible y tres familias de registro en Caja. La numeración PR-A/B/C es una secuencia tentativa, no autorización de implementación. El objeto es que cada PR futura se limite a **construir una parte del plano ya validado**, sin resolver estructura improvisadamente. No hay fechas ni promesas de capacidades inexistentes.

## 1. Mapa de dependencias

~~~mermaid
flowchart TD
  A["Validar árbol de áreas y nombres"] --> B["Aprobar rutas, Back y contexto de sesión"]
  C["Comparar mockups y sistema de componentes"] --> D["Aprobar contratos de pantallas"]
  B --> E["Shell y navegación modular"]
  D --> E
  E --> F["Mercadería: Productos / Inventario / Reposición como entradas diferenciadas"]
  E --> G["Caja / Configuración y Datos"]
  E --> H["Ventas / Reportes"]
  F --> I["Reubicación de conteo y recepción"]
  G --> J["Reubicación de gasto, aporte y backup"]
  H --> K["Historial canónico de ventas y enlaces"]
  I --> L["QA de regresión completo"]
  J --> L
  K --> L
  L --> M["Cierre de reconstrucción de UX"]
  M --> N["Nuevas funciones por vertical, independientes"]
~~~

La investigación sobre transferencia, fiados y caja real puede avanzar en paralelo como diseño, **pero el código de esas funcionalidades no debe mezclarse** con PR que mueven navegación y componentes. El plano contempla su destino sin anunciar que operan hoy.

## 2. Qué se reutiliza y qué se sustituye

| Capa | Estado actual | Política recomendada |
| --- | --- | --- |
| `src/domain/*` | Jornada, FIFO, stock, invariantes y tipos | **Conservar** hasta que cambie un requisito funcional legítimo |
| `src/local/service.ts` | Comandos y transacciones, borradores durables | **Conservar**; adaptar sólo API de presentación si evidencia lo exige |
| `src/local/database.ts` | Dexie esquema 4 y datos locales | **Conservar**; NO cambiar stores por mover pantallas |
| `src/local/backup.ts` | Formato 2 compatible con anterior y restauración controlada | **Conservar**, probar equivalencia después de cada PR |
| `src/app/projections.ts` | Totales, informes, objetivos e inventario | **Reutilizar**, extraer solo si nace nueva proyección del negocio |
| `src/ui/components.tsx` | Shell, botones, navegación, badges, varios componentes | **Auditar y normalizar**, no sustituir con nuevo kit por moda |
| `src/ui/theme.css` | Tokens oficiales y CSS base | **Consolidar** como fuente de tokens, revisar valores renderizados |
| `src/app/app.css` | Estilos específicos acumulados | **Extraer por área gradualmente**, test visual por pantalla |
| `src/App.tsx` | Compose raíz, todos los destinos y operaciones | **Reducir a composición y rutas**; extraer pantallas y lógica propia del área |
| `src/app/Movements.tsx` | Caja+stock mezclados | **Descomponer** vistas de dinero e inventario sin tocar journal |
| `src/app/BackupPanel.tsx` | UI backup/restauración | **Mover interfaz a Configuración > Datos** conservando lógica |
| `tests/` | Cobertura real de dominio y E2E | **Expandir y adaptar rutas**, nunca quitar assertions por cambio visual |

## 3. Propuesta de PR de reestructuración, cada una con alcance estricto

### PR-A — Estado de navegación y Shell

- Extraer `NavigationState` con tipo de destino+contexto, retorno explícito y pruebas.
- Mantener **Ventas como historial/gestión** y **+ Nueva venta** como acción central. **Antes de implementar:** resolver [21](21_hipotesis_shell_mas_header.md): nuevo dock candidato con **tres destinos de acceso directo + «Más» + acción +**, comparar prioridad de Caja y Productos, y definir header sticky y navegación del directorio. No fijar el orden antiguo como contrato final.
- Conservar `Draft` y `writeIntent` de Dexie. No cambiar la semántica ni reintentos.
- Pruebas: NAV+-01 a NAV+-12, + con borrador/prepared/writeIntent, Ventas abre historial, filtros de Nueva venta/Productos independientes, tab ida/vuelta, retorno, teclado/seguridad y cuatro destinos.
- No tocar: FIFO, validación monetaria, backups, esquemas Dexie.
- **Entrega:** arquitectura navegación ejecutable, sin nuevo medio de pago.

### PR-B — Mercadería: Productos / Inventario / Reposición como entradas separadas

- Crear tres entradas directas en **Más → Mercadería**, sin añadir pestañas globales: **Productos, Inventario y Reposición**. **Reposición es área propia**, no subpantalla de Productos. Dar acceso contextual desde ficha de producto hacia el mismo destino.
- Mover `Contar y ajustar stock` del actual Movimientos a Inventario; mover accesos a stock inicial/recepción a sus subáreas naturales. **No** duplicar `ReceivePurchase`, stock/FIFO ni el egreso reflejado en Caja.
- Reutilizar `RecordStockCount`, `RecordOpeningStock`, `ReceivePurchase` y componentes existentes.
- **No** inventar «pedido enviado» como un tipo persistente si aún no existe modelo; sólo entrada de Reposición para visualizar faltantes y recibir real.
- Pruebas: conteo sin venta/gasto, sobreventa y costo desconocido, recepción y FIFO, ID intacto y backup.
- No tocar: guardado efectivo/gastos/aportes, URL de producción.

**Ampliación aprobada para PR-B — recepción de compra multisproducto (22/10/2026):** el usuario quiere **una sola compra con carrito de Reposición** parecido a Ventas, pero con presentaciones, conversión a unidades y costos. Antes de programar, validar formulario, totales y salidas. El núcleo `ReceivePurchase` y su `PurchaseLine[]` **ya admite múltiples líneas** con transacción Dexie y una salida monetaria (ver `src/local/service.ts`). **Cambios de UI identificados:** `src/App.tsx` construye una sola línea al recibir y `reopenWrite` solo recupera `lines[0]`; ambos deben adaptarse para que una compra agrupada se edite y recupere íntegra. Conservar `writeIntent` sellado, commandId, costo FIFO, atomicidad y un único egreso; no duplicar escritura por línea. Definir si el carrito editable debe persistir localmente y recuperar correctamente sin inventar un segundo `Draft` de Ventas. Añadir pruebas de import/export JSON y recepción multicategoría, reintento, fallas y recibo completo. **No implica permiso de código ni cambio de esquema automático.**

### PR-C — Caja y Configuración/Datos

- Crear Caja visible en el dock candidato, con historial monetario y **un CTA «Registrar» → tres opciones aprobadas**: Gasto / Aporte / **Mover dinero**, y esta última → **Entre cuentas / Retirar del negocio** (copy y estructura confirmados el 22/10/2026; retiros y traspasos siguen pendientes de implementación). Mantener Gasto/Aporte con sus comandos durables actuales y **no** mostrar «saldo real» si no existe conteo; no habilitar retiros/traspasos ficticios.
- Controles y ficha de Caja aprobada visualmente, pero mostrar únicamente datos verificables (movimientos y variación, no saldos bancarios).
- Crear acceso estable a Configuración > Datos para exportación/restauración; Inicio puede mostrar aviso proporcional y enlace, no formulario duplicado.
- Pruebas: gasto/aporte con impacto correcto en informes, cashEntries sin doble compra, export/restore JSON, estado sin red, pantalla vacía.
- No tocar: nueva entidad de retiros, saldos bancarios, cuenta Brubank real ni migraciones.

### PR-D — Ventas / Reportes y cierre visual

- Construir **Ventas como área de historial/gestión**; selector/carrito/cobro/confirmación pertenecen al flujo **+ Nueva venta**. Separar pantallas/componentes testables sin duplicar borrador ni operaciones.
- Retirar historial completo duplicado de Reportes y enlazar al canónico en Ventas con período contextual.
- El gráfico cambia **sólo tras** definición y prueba de buckets de período; nunca por imitación de curva de mockup.
- Consolidar CSS por composición y roles, sin otro lenguaje visual ni fotos inventadas.
- Pruebas: venta simple y múltiple, precio del borrador, efectivo/vuelto, reintento, producto inactivo, periodos, números no calculables, uso móvil.
- No tocar: transferencia/mixto/fiado ni corrección de venta (siguiente etapa funcional).

### PR-E — QA integrado y deuda documental

- Auditar screenshots a 360, 390 y 430 CSS px con datos sintéticos, estados vacíos/fallo/pendiente, iOS/Android cuando se pueda.
- Validar accesibilidad (foco, contraste renderizado, teclas, voz lectora).
- Actualizar `README.md`, `AGENTS.md` y `docs/HANDOFF_WORK_V2.md` con **un único estado vigente y precedencia**; no borrar documentación histórica.
- Probar backup desde origen nuevo vacío, importación formato anterior, offline/reload y no doble venta/gasto.
- Revisión de usuario antes de fusionar/publicar cualquier PR con cambio funcional.

**Nombres PR-A a PR-E son placeholders**, no numeración GitHub comprometida.

## 4. Regla de tamaño y aceptación

Una PR es demasiado amplia si combina, sin necesidad técnica explícita, tres de estas tareas: navegación global, nueva entidad/tabla, nueva forma de pago, migración de backup, rediseño de cinco pantallas, nueva dependencia externa. Dividir por responsabilidad y mantener branch desde `master` actualizado. El diagrama de dependencia define orden técnico, no la prioridad comercial de funciones posteriores.

### Checklist obligatorio por PR

- [ ] Pantalla(s) ID del contrato 11 + dueño único del mapa 01.
- [ ] Decisión arquitectónica aprobada en matriz 09; reabrir sólo con evidencia.
- [ ] Afecta sólo ubicaciones/UI o indica explícitamente cambio de dominio y backup.
- [ ] Contrato Volver, estado de sesión y continuidad del borrador probado.
- [ ] Sin ingreso duplicado, salida doble, costo ficticio ni borrado de historia.
- [ ] Typecheck/build, tests de negocio, arquitectura y E2E pertinentes.
- [ ] QA móvil visual con referencias oficiales, teclado y foco.
- [ ] Resumen de cambios, archivos, pruebas, riesgos y rollback.
- [ ] Si hay datos del usuario, respaldo previo externo y restauración verificada.
- [ ] No publicar automáticamente si el usuario no aprobó esta entrega.

## 5. Riesgos de «simplificar» destructivamente

- Cambiar rutas puede desmontar formularios con texto no guardado; **resolver guardado o confirmación antes de navegar**.
- Mover la tarjeta de confirmación puede ocultar un `writeIntent` después de reiniciar; mantener guardia global mientras sea necesario.
- Eliminar botón de backup en Inicio antes de habilitar Configuración empeora la recuperabilidad.
- Retirar acciones de ficha de producto sin ruta alternativa operativa vuelve más largo el flujo real.
- Unificar estilos puede anular el contraste que se había ajustado para fondo oscuro.
- Agregar historial «unificado» puede mezclar pagos y conteos sin distinción de dominio.
- Reportes de nuevas transferencias/fiados deben interpretarse por venta vs cobro, no adaptar ventas de efectivo a todo.

**Estado de encontrabilidad actualizado (21/10/2026):** se registraron **respuestas del usuario a dos tareas** en [20 — Observaciones](20_observaciones_prueba_usuario.md), **no un test ciego completo**. La primera descartó el acceso directo a «Contar» como elección espontánea (prefirió Stock por producto) y la segunda no encontró Caja en el dock. El nuevo [21 — Shell/Más/Header](21_hipotesis_shell_mas_header.md) reabre el orden de destinos y requiere prueba comparada. Los contratos y PR-A de navegación aún no deben implementarse.

## 6. Definición de cierre del proyecto de planos (Gate definitivo)

Antes de cerrar la PR #12 como norma:
1. **Revisión de coherencia:** que no haya función con dos dueños y que todos los enlaces del índice se resuelvan.
2. **Validación de encontrabilidad:** tree test con al menos el operador principal, y revisión de hallazgos con fecha; no inventar participantes.
3. **Fidelidad visual:** matriz 14 completada con screenshots reales de app renderizada y criterios de diseño aprobados.
4. **Protocolo de seguridad:** rutas y componentes no alteran dominio/local/backup al reconstruir.
5. **Aprobación explícita:** usuario decide qué propuestas D01–D12 se convierten en requisitos vigentes y qué queda abierto.
6. **Actualización documental:** una sola portada de estado vigente, y documentos históricos claramente identificados.

No significa que el sistema se «congele» para siempre; significa que futuras propuestas requieren modificar conscientemente el plano antes que el código.
