# 0003 — Backup y modo del dispositivo

- Estado: aceptada
- Fecha: 2026-07-10

## Decisión

JSON es el formato central de respaldo, restauración y copia semiautomática. El dispositivo puede funcionar en modo principal o consulta.

El modo pertenece al dispositivo; no es un rol de usuario. Al restaurar se conservan identificador y modo del receptor.

## Consecuencias

El modo consulta no escribe datos operativos por defecto. CSV no restaura y la copia por archivo no se presenta como sincronización.
