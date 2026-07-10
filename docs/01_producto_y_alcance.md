# Producto y alcance

## Objetivo

Mora Vinería ayuda a ordenar la operación diaria de una vinería pequeña: productos, ventas, movimientos, stock y lectura simple del negocio.

Debe ser rápida desde el celular, cómoda durante la noche y comprensible sin conocimientos técnicos o contables. Su finalidad es control interno; no reemplaza contabilidad formal ni facturación fiscal.

## Usuario y contexto

La usuaria principal es la dueña de la vinería. Puede haber ayudantes casuales, pero el MVP no administra personas, cuentas, permisos ni responsables de carga.

La operación se concentra en la noche y madrugada. Por eso la app agrupa internamente la actividad en jornadas de 08:00 a 07:59 del día siguiente.

## Alcance del MVP

- productos y categorías;
- stock simple y referencia de stock objetivo;
- ventas y anulaciones;
- reposición de mercadería;
- aportes externos y gastos puntuales;
- dashboard y reportes simples;
- proyecciones y meta mensual;
- PDF mensual local;
- backup y restauración JSON;
- copia semiautomática de datos mediante archivo;
- exportaciones CSV auxiliares;
- modo del dispositivo principal o consulta;
- PWA instalable y funcionamiento offline.

## Principios

- Mobile-first.
- Local-first.
- Simple antes que completo.
- Rápida para cargar ventas.
- Clara y cálida, sin estética empresarial pesada.
- Segura con los datos existentes.
- Trazabilidad antes que borrado destructivo.
- Pocas dependencias y mantenimiento razonable.

## Fuera de alcance

- backend o base de datos remota;
- login, usuarios o roles de usuario;
- sincronización automática real;
- múltiples dispositivos editando en tiempo real;
- facturación fiscal o contabilidad avanzada;
- múltiples sucursales;
- lotes, vencimientos, depósitos o inventario avanzado;
- proveedores y órdenes de compra complejas;
- combos;
- integraciones con Mercado Pago u otros servicios externos;
- ERP, microservicios, WebSockets o app nativa.

## Criterio de éxito de la primera versión entregable

La versión es útil cuando desde el celular se pueden cargar y anular ventas y movimientos con seguridad, mantener productos y stock simple, consultar resultados por período, generar una copia recuperable de los datos y trabajar offline sin confundir estimaciones internas con contabilidad formal.
