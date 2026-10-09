# AGENTS.md — Mora Vinería (nueva etapa)

## Fuente de verdad

Antes de programar, leer:
1. `docs/README.md`
2. `docs/00_producto_y_experiencia.md`
3. `docs/01_revision_de_reglas.md`
4. `docs/02_sincronizacion_y_offline.md`
5. `docs/03_plan_de_trabajo.md`
6. `docs/04_descubrimiento_operativo.md`
7. `docs/05_ejemplo_lista_proveedor.md`
8. `docs/06_lector_de_codigos.md`
9. `docs/07_cierre_relevamiento_16_preguntas.md`

Las instrucciones explícitas del usuario prevalecen. La rama `legacy/v1-final` es referencia histórica y **no** es una base a copiar automáticamente.

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

La jornada 08:00–07:59, umbrales de stock, ventas, anulaciones, fiados, movimientos, tesorería, detalles de costos/redondeo, permisos, conflicto offline, navegación y módulos anteriores **deben revisarse**. Se confirmó la práctica de **recargo del 50 % sobre costo unitario** como sugerencia de venta, no como cambio automático de precios. Ver `docs/01_revision_de_reglas.md`. No inventar criterios silenciosamente ni declarar decisiones abiertas como definitivas.

## Restricciones

- No borrar ni resetear el proyecto Supabase anterior, identidades, operaciones remotas o bases locales sin autorización expresa para ese procedimiento.
- No modificar datos de producción para pruebas. Usar entorno o dataset aislado.
- No desplegar automáticamente una reconstrucción incompleta.
- No agregar funciones de ERP, contabilidad fiscal o integraciones ajenas al objetivo sin aprobación.
- Si una operación offline entra en conflicto, no descartarla, duplicarla ni sobrescribir silenciosamente datos confirmados.

## Método de trabajo

1. Definir problema, caso de uso, criterio de aceptación y riesgos.
2. Prototipar y validar experiencia antes de conectar datos.
3. Implementar verticalmente con tests de reglas, sincronización, datos y UI.
4. Reportar archivos cambiados, pruebas realizadas y riesgos pendientes.
