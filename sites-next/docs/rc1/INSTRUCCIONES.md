# Instrucciones para continuar Mora en otra conversación

Leé primero `00-resumen-ejecutivo.md`, la matriz, seguridad, Supabase, migración y resultados. Revisá el guion de 45 casos físicos: **todos pendientes de usuario**. El ZIP final incluye la auditoría original y el paquete histórico v26–v29. No tomes sus planes antiguos como resultados actuales.

## Fuente y restricciones

Repositorio: https://github.com/Yamil1701/mora-vineria · PR borrador #14: https://github.com/Yamil1701/mora-vineria/pull/14 · Rama: `work/sites-v27-entregas-3-4` · Código vigente: `sites-next/`.

La lista exacta de commits está en `commits.txt` y el estado remoto/CI al cierre en `estado-final.json`. No adivinar el HEAD: verificar antes de editar. Baseline GitHub `37085976c97ec2a3ab0e77613b7a3f059fbdb2d7`, árbol `42f5e6ed1e45dae9ac0ce4fd0039453ff9d70eb1`. Master preservado `296c2aa1a95273ccd86af784c14595af33573602`. Sites v29 referencia visual `fdc349fcfbafa76883602a49106e98b1f29777a8`; v25 es la publicada en https://mora-vineria-nueva.yamil-17.chatgpt.site/.

No publicar Sites, desplegar Pages productivo, fusionar PR, reemplazar master, migrar datos reales ni eliminar copias. El usuario pospuso validación física; eso permite continuar implementación/pruebas y no concede aceptación productiva. No rediseñar ni importar la PWA anterior. Sin proyecciones ni nuevas funciones comerciales.

## Reproducir

```sh
git clone https://github.com/Yamil1701/mora-vineria.git
git switch work/sites-v27-entregas-3-4
cd sites-next
npm ci --no-audit --no-fund
npm run verify
npm test
npm run test:browser
```

Node >=22. La evidencia local usó Node 24.22.1; CI usa 22. Chromium fijado 153.0.8010.0 extraído de dependencia NPM, sin descarga CDN. El código está preservado en GitHub y los commits recuperables figuran en el paquete; el ZIP reúne documentación y evidencia. No instalar código de fuentes ajenas ni reutilizar credenciales. Revisar primero SHA de inventario.

`verify-source` comprueba imports activos, caché, iconos y que adaptadores experimentales sigan inactivos. `npm test` incluye pruebas SQL reales en PGlite, una sesión local; no llamarlas Supabase alojado. `test:browser` levanta dos HTTPS locales, sesiones vacías y datasets sintéticos, y produce PDF nativo. Capturas de emulación no acreditan QA físico.

## Arquitectura activa y preparada

`dist/index.html` → `app.js` → módulos ES existentes. Controlador síncrono con localStorage **mora.local.rc1** y Web Locks obligatorio. La clave antigua **mora.local.v1** queda intacta; no hay traslado automático. Copias JSON esquema 5, lectura compatible con 1–4.

Servicio nuevo en `backend/command-service.js` deriva cambios del dominio compartido. SQL versionado en `backend/supabase/migrations/20261031101555_secure_command_gateway.sql`, esquema `mora_rc`, sólo ambiente dedicado/vacío. No aplicar el SQL histórico `backend/migrations/001_dev_foundation.sql` como si fuera el nuevo procedimiento.

Adaptadores `remote-queue.js` e `idb-store.js` están probados por separado, **no importados por app.js**. No basta agregar un import para activar: faltan Auth/bootstrap/lectura, cobertura de escrituras directas, respaldo de pendientes e integración asíncrona. El servicio usa snapshot JSONB + proyecciones, con validación de relaciones por dominio; evaluar escala/normalización. No inventar FKs o garantías que no existen.

Sólo fue visible Supabase Chofer Utilities: no tocarlo. No existe Mora dev configurado. El CLI intentó analítica externa y la revisión automática la bloqueó; no reintentar ese acceso. Se siguió con pruebas locales. Deno/Edge y JWT reales siguen sin ensayar.

## Próxima secuencia

1. Verificar estado final de rama/CI/evidencia; reproducir pruebas sin tocar datos del usuario.
2. Conseguir/provisionar únicamente Mora dev autorizado y repetir gates del informe Supabase.
3. Completar integración de lectura/comandos/persistencia y recuperación de preparaciones remotas; mantener mensajes locales honestos.
4. Integrar almacenamiento definitivo sin romper v3/v4/v5; ensayar fallos, dos conexiones, corte real y actualización entre versiones.
5. Preparar entorno candidato seguro para teléfono con artefacto SHA verificado. GitHub no actualiza Sites; no crear dos implementaciones divergentes.
6. Ejecutar QA móvil con el usuario cuando esté disponible; registrar observado, capturas y decisión. Publicación requiere autorización posterior.
