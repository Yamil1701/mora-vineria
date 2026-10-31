# Gate remoto todavía no ejecutado

Requiere un proyecto Mora dev vacío aprobado y dos usuarios/dispositivos sintéticos. No usar datos reales.

1. Aplicar la migración sin parámetro dev: debe rechazarla sin crear objetos. En una transacción explícita con el parámetro correcto, aplicar y revisar grants, exposición y RLS.
2. Usuario A sólo miembro de negocio A; B sólo de B. A no debe leer ni consultar resultados ni aplicar RPC de B. Un `user_metadata` editado no debe cambiar pertenencia. Dispositivo revocado debe fallar.
3. RPC monthly-goal: 100 llamadas concurrentes con mismo ID y contenido → una meta, un comando, una revisión, un resultado. Mismo ID y otro contenido → rechazo. Caída de respuesta tras commit → consulta del mismo ID recupera resultado.
4. Dos comandos con expectedRevision igual → sólo uno confirma; otro recibe 40001 sin efectos. Un error antes del resultado debe revertir meta, comando y revisión.
5. Venta/recepción/abono enviados al candidato actual → 0A000 sin efectos. No habilitarlos hasta implementar transacciones equivalentes a las reglas locales y sus pruebas de paridad.
6. Con las transacciones de negocio futuras: lotes/stock/costo/venta/cobros/resultado indivisibles, abonos concurrentes no mayores a la deuda, recepción/pago una sola vez, devolución con lotes nuevos, versiones de precio y correcciones con motivo.
7. Importación: namespace y digest únicos; confirmar manifest/facts antes y después; repetir misma importación sin recrear hechos. Conservar preparados y revisiones. No borrar origen.
8. Conectar el adaptador sólo después del gate anterior. Cortar red y cerrar/reabrir: estados device-saved / awaiting-server / outcome-unknown / remote-confirmed / needs-attention distinguibles. Conservar evidencia física ante conflicto; nunca regenerar ID para un resultado desconocido.

Estado: pendientes todas las pruebas contra un servidor real. `tests/remote-queue.test.mjs` cubre sólo el protocolo del cliente con un simulador; no acredita concurrencia de Postgres ni aislamiento RLS.
