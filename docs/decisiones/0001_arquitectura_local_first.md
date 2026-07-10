# 0001 — Arquitectura local-first

- Estado: aceptada
- Fecha: 2026-07-10

## Decisión

El MVP es una PWA React + Vite + TypeScript + Tailwind, alojada en GitHub Pages, con IndexedDB + Dexie y sin backend.

La aplicación vive en la raíz del repositorio y usa `base: "/mora-vineria/"`.

## Consecuencias

Los datos pertenecen al dispositivo y el backup JSON es obligatorio. No hay cuentas, nube ni sincronización automática. Un backend futuro requiere una decisión nueva.
