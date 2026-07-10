# Mapa de documentación

Esta carpeta contiene la documentación vigente de Mora Vinería. Cada decisión debe tener una sola fuente principal para evitar contradicciones.

| Documento | Responsabilidad |
| --- | --- |
| `01_producto_y_alcance.md` | Objetivo, usuario, alcance y límites del MVP |
| `02_requerimientos_funcionales.md` | Comportamiento esperado por módulo |
| `03_reglas_de_negocio_y_datos.md` | Jornada, stock, cálculos, anulaciones, backup y compatibilidad |
| `04_diseno_y_experiencia.md` | Navegación, interfaz, feedback, animaciones y accesibilidad |
| `05_arquitectura_tecnica.md` | Stack, estructura, persistencia, PWA, testing y deploy |
| `06_estado_implementacion.md` | Qué está implementado, parcial, pendiente o descartado |
| `07_plan_mvp.md` | Orden de trabajo desde el baseline actual |
| `decisiones/` | Decisiones críticas que no deben cambiarse silenciosamente |
| `archivo/` | Documentos históricos sin autoridad vigente |

## Jerarquía

1. Instrucción explícita actual del usuario.
2. Decisiones registradas.
3. Reglas de negocio y datos.
4. Requerimientos funcionales.
5. Diseño y experiencia.
6. Arquitectura técnica.
7. Estado de implementación y plan.

Ante una diferencia que pueda afectar datos, backups, stock, jornada, cálculos o alcance, se debe pedir validación antes de implementar.

## Estados utilizados

- **Implementado:** existe, está conectado a la interfaz y tiene verificación proporcional al riesgo.
- **Parcial:** existe una parte útil, pero no cumple todavía todo el requisito vigente.
- **Pendiente:** sigue dentro del MVP, pero aún no fue implementado.
- **Planificado:** tecnología o mejora aprobada para adopción gradual.
- **Descartado del MVP:** no debe implementarse sin una nueva decisión.

## Histórico

`archivo/documentacion_inicial/` conserva los cinco documentos iniciales completos. Sirven para comprender el origen del proyecto, pero la documentación vigente de esta carpeta los reemplaza.
