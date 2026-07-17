# 0007 — Tesorería operativa local-first

- Estado: aceptada para `v0.3.0`
- Fecha: 2026-07-16

## Contexto

Ventas y Reportes explicaban la actividad, pero no cuánto dinero real del negocio existía ni dónde estaba. Antes de habilitar el uso real hay `$52.400` de fondo de cambio, `$104.200` en efectivo reservado para una reposición y `$87.900` en Brubank. También pueden usarse Mercado Pago, Naranja X u otras cuentas propias.

Registrar esos importes como ventas o aportes nuevos falsearía el período. Deducir saldos desde ventas históricas tampoco alcanza: existen saldos previos, retiros, transferencias internas y diferencias físicas de caja.

## Decisión

Agregar una tesorería operativa separada de los cálculos de ganancia:

- cuentas de efectivo o digitales;
- saldo derivado de un libro de entradas y salidas;
- saldo inicial explícito, que no cuenta como venta ni ganancia;
- fondo de cambio objetivo opcional;
- cobros, reposiciones, gastos y aportes vinculados automáticamente a su cuenta;
- transferencias internas con dos movimientos y efecto total cero;
- retiros con responsable y destino;
- conteos de caja con ajuste trazable;
- reversiones por contrapartida, sin edición o borrado del libro.

Dexie v5 incorpora `cuentasTesoreria`, `movimientosTesoreria` y `conteosCaja`. Backup v3 incluye las tres entidades y migra copias v1/v2 con tesorería vacía. Supabase replica la misma información mediante RPC autenticada, RLS, operaciones idempotentes y orden incremental existente.

Las salidas ordinarias no pueden superar el saldo. El servidor bloquea la cuenta mientras valida una salida para evitar doble gasto concurrente. Reversiones y ajustes pueden exponer una diferencia real y no se rechazan solo para ocultarla.

La regla de stock se actualiza a crítico hasta 10 %, bajo hasta 30 % y disponible por encima, con límites enteros redondeados hacia abajo.

## Consecuencias

- El dinero disponible deja de inferirse de ganancias.
- Una cuenta no equivale a una integración bancaria: sus movimientos se cargan desde las operaciones de Mora.
- Los retiros no reducen la ganancia estimada y las transferencias internas no cambian el total.
- Las copias anteriores requieren configurar saldos reales una vez; no se inventa una migración financiera.
- La tesorería sigue siendo control interno simple y no un sistema contable.
