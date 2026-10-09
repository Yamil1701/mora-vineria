# Producto y experiencia

## Problema observado

La versión anterior era funcional, pero se percibía como una hoja de cálculo compleja: curva de aprendizaje incómoda, temor a equivocarse, fricción cotidiana, apariencia inconsistente y expansión excesiva de funcionalidades.

## Meta

Que una persona pueda vender, consultar existencias, registrar mercadería y entender lo que ocurre en el negocio sin estudiar la aplicación. No medir el éxito por número de pantallas o funciones.

## Aprobado

- Reconstruir desde cero, archivando la V1.
- Evaluar nuevamente **todas** las decisiones anteriores, incluso aquellas que parezcan correctas.
- Supabase como servidor central entre dispositivos; operación local disponible sin conexión y conciliación posterior.
- Experiencia mobile-first, rápida, simple, clara y orientada a trabajo real.

## Hipótesis iniciales a validar con el uso

- Vender es la tarea más frecuente y debe tener prioridad clara.
- Productos, stock, reposiciones y movimientos siguen siendo necesarios, pero sus recorridos pueden cambiar.
- Inicio debe responder qué ocurrió y qué necesita atención, no mostrar un exceso de indicadores.
- Reportes deben explicar resultados en lenguaje común.
- El diseño oscuro y la navegación inferior son **candidatos**, no decisiones intocables.

## Criterios de aceptación de experiencia

1. Registrar una venta típica sin instrucciones externas.
2. Entender antes de confirmar qué cambia: stock, cobro y total.
3. Detectar claramente si la operación está guardada localmente, pendiente de enviar, confirmada por el servidor o requiere atención.
4. Recuperarse de errores y cortes de red sin perder trabajo.
5. Evitar pasos, filtros y términos que no aporten al recorrido real.
6. Probar prototipos con tareas reales antes de construir cada módulo.

## Fuera de esta fase

No programar pantallas ni dependencias antes de validar flujos y reglas fundamentales.
