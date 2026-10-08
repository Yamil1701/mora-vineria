# Mora Vinería 1.0 — registro de trabajo

Rama: `feat/mora-v1-polish`. Base: `07a9dbd` (`master`). Encargo aprobado el 8/10/2026 UTC. Una única PR; no fusionar ni desplegar sin autorización final.

## Etapas

| Etapa | Objetivo | Estado |
| --- | --- | --- |
| 0 | Baseline, reglas y diagnóstico | Completa |
| 1 | Sistema visual, shell y navegación | Implementada |
| 2 | Inicio, venta y catálogo | Implementada |
| 3 | Operaciones, análisis y herramientas | Completa |
| 4 | QA, documentación y compatibilidad | Completa |
| 5 | Rama remota y PR | PR #4 preparada; sin merge ni deploy |

## Baseline comprobado

- Lectura de AGENTS, docs vigentes y decisiones 0001–0013.
- `npm ci`: correcto, 639 paquetes; avisos de deprecación de dependencias transitivas de desarrollo.
- `npm run verify`: correcto, 27 archivos / 153 pruebas, lint, 6 pruebas del auditor y build PWA.
- `npm run audit:production`: aprobado con excepción acotada GHSA-qwww-vcr4-c8h2 (React Router RSC); no se amplía la excepción.
- package.json 0.3.0; docs de estado nombran 0.2.0 como estable. Se distinguirá baseline histórico de candidato 1.0.
- No se lee ni modifica Supabase de producción. Desarrollo sin variables remotas, con fixtures ficticios y navegador aislado.

## Matriz de hallazgos

| Problema | Impacto | Prioridad | Solución prevista | Estado |
| --- | --- | --- | --- | --- |
| Nueva venta corta a 12 resultados | Productos inaccesibles | P0 | Carga explícita, cantidad y búsqueda completa | Resuelto y verificado |
| Bloqueo de venta depende de render React | Posible envío repetido durante confirmación | P0 | Exclusión síncrona, conservar validación transaccional | Resuelto y verificado |
| Inicio prioriza ganancia y omite cobrado | Confusión de actividad y dinero | P0 | Vendido, cobrado y fiado separados | Resuelto y verificado |
| Reportes oculto en Más | Fricción de consulta frecuente | P0 | Cuarto destino; Más en cabecera, operaciones directas desktop | Resuelto y verificado |
| Cards anidadas, brillos y radios homogéneos | Jerarquía y densidad | P0 | Tokens y familias de superficies/listas | Resuelto y verificado |
| Listas pierden filtros al regresar | Pérdida de contexto | P1 | Estado de consulta en sesión por pantalla | Resuelto y verificado |
| Tesorería tres importes en fila móvil | Lectura estrecha a 320 px | P1 | Disponible dominante, entradas/salidas secundarias | Resuelto y verificado |
| Gráfico dice mes aun en otros períodos | Etiqueta engañosa | P1 | Etiquetas del período activo | Resuelto y verificado |
| Detalle de origen de dinero con promesa sin vigencia | Respuesta vieja tras cambiar selección | P1 | Ignorar respuestas obsoletas y limpiar al cerrar | Resuelto y verificado |
| CI solo corre en ramas de publicación | PR sin verificación independiente | P0 | Workflow PR sin credenciales ni despliegue | Resuelto y verificado |

## Punto de control de implementación

- `npm run verify`: 27 archivos / 155 pruebas, auditor y build aprobados tras las etapas visuales y funcionales.
- Protección compartida de confirmación/escritura en cobros, anulaciones, reposiciones y cuatro formularios de Tesorería; prueba focalizada adicional aprobada. Formularios de Tesorería protegen salida con cambios y bloquean registro en consulta.
- Ningún cambio en db, domain, schemas, sync ni migraciones. Dexie v8 / respaldo v6 conservados; versión del candidato 1.0.0.
- QA reproducible: scripts/qa-browser.mjs, qa-fixtures.mjs y qa-interacciones.mjs. Contexto localhost nuevo, credenciales remotas vacías, red fuera de localhost bloqueada. Datos ficticios; nunca reutiliza perfil real.
- Primera inspección visual: 16 vistas principales pobladas a 375/1440, sin overflow ni errores. Corrección de foco de main y redundancia de Reportes tras inspeccionar capturas.
- Flujos reales aprobados: catálogo y borrador, cobro con viewport reducido, contado/combinado/fiado, cobro posterior, anulaciones, reposición, cuenta/retiro/transferencia/conteo, CSV, JSON/restauración, PDF, offline, actualización PWA conservando datos y Consulta.
- Axe: 24 pantallas/tema aprobadas después de corregir contraste y estructura dl.
- Primera matriz completa: 768 combinaciones; 6 casos con overflow (Movimientos 1024 y PDF poblado 320). Movimientos corregido; PDF corregido y 4 regresiones específicas aprobadas. Repetición completa final aprobada (768), con fixture de meta mensual corregida. PDF final: 24 casos aprobados; tema claro principal móvil: 8 casos adicionales.
- Fuente de QA: Chromium headless con fuentes del sistema configuradas; capturas anteriores a la configuración completa de fuentes no se usan como evidencia final. Baseline original recapturado con las mismas fuentes y fixtures.

## Cierre y continuidad

- PR única: https://github.com/Yamil1701/mora-vineria/pull/4, base master. Implementación y evidencia guardadas en la rama remota. El conector GitHub guarda el árbol exacto comprobado contra git local porque este runtime no tiene credenciales de push por CLI.
- Verify final: 28 archivos / 156 pruebas, 6 pruebas del auditor, lint y build PWA aprobados. Audit de producción conserva la excepción RSC preexistente. Build: 78 entradas de precache, ~2 MiB, ningún chunk supera 500 kB.
- 17 flujos y consola aprobados sobre build; actualización SW conserva datos. PDF A4 de dos páginas revisado y márgenes blancos comprobados tras corregir color-scheme bajo print.
- 768 combinaciones responsive, 24 casos axe, 24 regresiones finales PDF y 8 principales en tema claro móvil aprobados. Evidencia seleccionada en v1.0/evidencia y comandos/protocolo en QA.md.
- Verificación remota automática en checks de PR. No se fusiona ni publica. No se crean tags ni nuevas credenciales.
- Lo restante es el protocolo de dispositivos/entorno remoto aislado de QA.md, respaldo real comprobado en perfil separado y autorización explícita para despliegue. No quedan decisiones de UI delegadas pendientes.

Para continuar, partir de la PR y este punto de control. No repetir implementación, baseline o lecturas. Ejecutar el protocolo externo, comprobar el último CI y solo después de autorización seguir ENTREGA.md. Nunca borrar almacenamiento ni restaurar una copia antigua para recuperar una interfaz anterior.
