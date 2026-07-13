# AGENTS.md

## Proyecto

Mora Vinería es una PWA local-first y mobile-first para una vinería pequeña. No es un ERP ni un sistema contable.

## Lectura obligatoria

Antes de proponer arquitectura, modificar código, datos o comportamiento, leer:

1. `docs/README.md`
2. `docs/01_producto_y_alcance.md`
3. `docs/02_requerimientos_funcionales.md`
4. `docs/03_reglas_de_negocio_y_datos.md`
5. `docs/04_diseno_y_experiencia.md`
6. `docs/05_arquitectura_tecnica.md`
7. `docs/06_estado_implementacion.md`
8. `docs/07_plan_mvp.md`

Los documentos de `docs/archivo/` son históricos y no son normativos.

## Jerarquía de autoridad

Si dos fuentes difieren, aplicar este orden:

1. Instrucción explícita del usuario en la conversación actual.
2. Decisiones registradas en `docs/decisiones/`.
3. Reglas de negocio y datos.
4. Requerimientos funcionales.
5. Diseño y experiencia.
6. Arquitectura técnica.
7. Estado y plan.

No resolver por jerarquía una contradicción que pueda afectar datos existentes, backups, stock, jornada de venta, cálculos históricos o alcance. En esos casos, detenerse y pedir validación.

## Arquitectura y límites

La arquitectura estable de `v0.2.0` es React + Vite + TypeScript + Tailwind CSS, PWA, IndexedDB + Dexie, sincronización local-first con Supabase, GitHub Pages, backup/restauración JSON y PDF local, según la decisión 0006.

No agregar sin aprobación:

- otro backend, base remota o proveedor distinto de Supabase;
- cuentas visibles de empleados o roles de usuario; las identidades anónimas de dispositivo no son personas;
- facturación fiscal, ERP, stock avanzado o múltiples sucursales;
- Docker obligatorio, app nativa o integraciones externas.

El modo principal/consulta es un modo del dispositivo, no un rol de usuario.

## Reglas críticas

- La jornada de venta es 08:00–07:59. Antes de las 08:00 corresponde al día anterior.
- Ventas y movimientos guardan fecha/hora real y fecha de jornada.
- No permitir stock negativo.
- Un producto con historial se desactiva; no se elimina definitivamente.
- Las anulaciones conservan trazabilidad y revierten su impacto cuando corresponde.
- Backup JSON es obligatorio y central. No llamarlo sincronización.
- Cambios de esquema requieren migración Dexie y revisión de compatibilidad del backup.
- Operaciones offline deben ser idempotentes y no se eliminan de la cola hasta recibir confirmación remota.
- Nunca exponer claves `secret` o `service_role`; el navegador usa únicamente la publishable key con RLS.

## Forma de trabajo

Antes de cambios relevantes, explicar un plan breve. Dividir en capas especialmente cuando se modifiquen datos, backup, restore, stock, jornada, anulaciones, cálculos o arquitectura.

Usar `npm` y conservar `package-lock.json`. Justificar dependencias nuevas.

Después de modificar, indicar:

- qué cambió;
- archivos tocados;
- cómo probarlo;
- riesgos o pendientes.

La verificación base es:

```bash
npm run verify
npm audit --omit=dev
```

No afirmar que una capa está cerrada si fallan tests, lint, build o quedan cambios no revisados.
