# AGENTS.md

## Proyecto

Este proyecto se llama **Mora Vinería**.

Es una PWA local-first para una vinería pequeña. Su objetivo es ordenar ventas, productos, movimientos, reportes y proyecciones simples sin convertir la app en un ERP ni en un sistema contable complejo.

---

## Lectura obligatoria

Antes de modificar código, diseñar funcionalidades, cambiar arquitectura o proponer implementaciones, leer la documentación del proyecto en `/docs`.

Documentos obligatorios:

- `docs/00_objetivo_proyecto.md`
- `docs/01_requerimientos.md`
- `docs/02_diseno_app.md`
- `docs/03_tecnologias.md`
- `docs/04_reglas_ia.md`

Si existe contradicción entre documentos, detenerse y pedir aclaración antes de avanzar.

---

## Arquitectura aprobada

La arquitectura del MVP es:

```txt
React + Vite + TypeScript + Tailwind CSS
PWA instalable
IndexedDB + Dexie
GitHub Pages
Backup/restore JSON obligatorio
PDF local
Sin backend en MVP
```

No cambiar esta arquitectura sin validación previa.

---

## Alcance del MVP

El MVP debe enfocarse en:

- Productos.
- Categorías.
- Stock simple.
- Ventas.
- Movimientos.
- Reposición de mercadería.
- Aportes externos.
- Gastos puntuales.
- Dashboard.
- Reportes simples.
- Proyecciones básicas.
- PDF mensual local.
- Backup y restauración JSON.
- Migración semiautomática por JSON.
- Dispositivo principal y dispositivo de consulta.
- Funcionamiento offline como PWA.

---

## Fuera de alcance

No agregar al MVP:

- Backend.
- PostgreSQL.
- Base de datos remota.
- Login.
- Roles.
- JWT.
- Combos.
- Facturación fiscal.
- ERP.
- Contabilidad avanzada.
- Múltiples sucursales.
- Sincronización automática real.
- Multi-dispositivo editable en tiempo real.
- Integraciones externas no solicitadas.
- Docker obligatorio.
- App nativa Android/iOS.
- Dependencias innecesarias.

Estas funciones pueden sugerirse como mejoras futuras, pero no deben implementarse sin validación previa.

---

## Diseño e interfaz

La app debe ser:

- Mobile-first.
- Oscura.
- Cómoda para uso nocturno.
- Simple.
- Cálida.
- Moderna.
- Clara.
- No empresarial pesada.

La interfaz debe usar lenguaje humano, simple y directo.

No usar lenguaje técnico, contable o agresivo en textos visibles para la usuaria.

Usar “Resumen de hoy” en la interfaz. No usar “día operativo”.

---

## Jornada de venta

La app usa internamente una jornada de venta.

Regla:

- La jornada inicia a las 08:00.
- La jornada termina a las 07:59 del día siguiente.
- Las ventas o movimientos antes de las 08:00 pertenecen a la jornada del día anterior.

Cada venta y movimiento debe guardar:

- Fecha y hora real.
- Fecha de jornada calculada.

No modificar esta regla sin validación previa.

---

## Datos locales y backup

Los datos viven localmente en IndexedDB mediante Dexie.

El backup JSON es obligatorio y central para el MVP.

La app debe permitir:

- Exportar backup JSON.
- Restaurar backup JSON.
- Ver resumen antes de restaurar.
- Copiar datos a otro celular mediante migración semiautomática.
- Diferenciar celular principal y celular de consulta.

No presentar esta función como sincronización automática.

Términos permitidos:

- Copia de datos.
- Respaldo.
- Restaurar copia.
- Copiar datos a otro celular.
- Celular principal.
- Celular de consulta.

Evitar:

- Sincronización automática.
- Nube.
- Datos siempre actualizados.
- Multi-dispositivo en tiempo real.

---

## Reglas de trabajo

Antes de cambios relevantes, explicar brevemente el plan.

Avanzar por capas verificables.

Las capas pueden ser amplias si siguen siendo razonables, revisables y comprobables.

Usar capas pequeñas cuando el cambio afecte:

- Persistencia local.
- Backup.
- Restore.
- Migración.
- Stock.
- Anulación de ventas.
- Jornada de venta.
- Cálculos de ganancia.
- Estructura de datos.
- Arquitectura.
- Tecnologías.

Después de modificar, entregar un resumen breve con:

- Qué cambió.
- Archivos tocados.
- Cómo probarlo.
- Riesgos o pendientes.

---

## Dependencias

No agregar dependencias nuevas sin justificar.

Antes de sumar una dependencia, explicar brevemente:

- Para qué se necesita.
- Qué problema resuelve.
- Si existe una alternativa más simple.
- Si agrega complejidad o riesgo.

Mantener el proyecto liviano.

Usar `npm` y conservar `package-lock.json`.

---

## Idioma y nombres

La interfaz debe estar en español.

El dominio del negocio debe usar nombres en español cuando sea razonable.

Ejemplos:

- producto
- categoria
- venta
- movimiento
- reposicion
- aporteExterno
- gastoPuntual
- jornadaVenta
- medioPago
- gananciaBruta
- gananciaNeta
- stockActual

El código estrictamente técnico puede usar nombres estándar del ecosistema cuando convenga.

Ejemplos:

- components
- hooks
- services
- stores
- utils
- routes
- schemas

Priorizar consistencia.

---

## Recordatorio final

**Mora Vinería no es un ERP ni un sistema contable.**

Es una PWA local-first simple, mobile-first y offline, pensada para ayudar a una vinería pequeña a ordenar ventas, productos, movimientos, reportes y proyecciones sin agregar complejidad innecesaria.
