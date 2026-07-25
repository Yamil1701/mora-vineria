# 0012 — Información operativa y responsable de ventas

## Decisión

La información de la capa final se deriva de hechos existentes en lugar de duplicar acumulados mutables:

- unidades vendidas: detalles de ventas activas;
- unidades repuestas: detalles de reposiciones confirmadas activas;
- valor de venta del inventario: stock actual por precio actual;
- valor de compra del inventario: stock actual por costo promedio ponderado confirmado, con costo inicial como alternativa;
- saldos y totales de cuenta: libro inmutable de Tesorería.

Productos recuerda localmente si se ordena por más vendidos, stock urgente o nombre. Nueva venta ordena por unidades vendidas y Reposición por unidades repuestas. Las preferencias de presentación no forman parte del backup ni de la sincronización.

Cada venta nueva conserva `dispositivoResponsableId` y `dispositivoResponsableNombre`. El cliente los registra para respuesta inmediata, pero Supabase los reemplaza al insertar con el dispositivo autenticado y el nombre vigente en ese instante. El nombre queda congelado aunque luego se renombre el celular. Las ventas anteriores permanecen sin responsable porque no puede inferirse con seguridad.

La auditoría identifica dispositivos, no personas. Login de empleados o responsables humanos continúa fuera de alcance.

## Compatibilidad

Dexie avanza a v8 sin reescribir ventas anteriores y el backup a v6. Los campos del responsable son opcionales. La migración remota agrega únicamente una función privada y un trigger sobre `ventas_operativas`; no amplía permisos de tablas ni RPC.
