# Instrucciones del proyecto MrB

Este es el punto de entrada canónico para agentes de código. Las instrucciones específicas de Copilot, Claude, Gemini y Cursor solo remiten a este archivo; no mantengas reglas duplicadas en esos adaptadores.

## Reglas generales

- Antes de cambiar código, inspecciona la implementación actual y lee la documentación aplicable en [`docs/engineering/`](./docs/engineering/). El código y las pruebas vigentes prevalecen sobre documentos históricos.
- MrB es una aplicación B2B de pedidos, construida con Next.js 15 App Router, TypeScript, Supabase, Tailwind/shadcn, Zustand, React Hook Form, Zod y Vitest.
- La interfaz y los comentarios nuevos van en español. Sigue los patrones existentes y evita cambios no relacionados.
- Reutiliza la lógica compartida para reglas de negocio. No dupliques cálculos de carrito ni reglas del flujo de despacho en componentes.
- Las Server Actions administrativas deben autenticar con `getSupabaseClientWithAuth` y devolver el formato `ActionResponse` mediante `handleAction` cuando sigan ese patrón. Los consumidores deben comprobar `success` y desempaquetar `data`/`error`; no envuelvas una respuesta `ActionResponse` dentro de otra.
- Nunca expongas credenciales `service_role` al cliente. Los flujos públicos que requieran privilegios elevados deben permanecer exclusivamente del lado servidor y validar los datos de entrada.
- **Base de datos:** `src/lib/supabase/schema.sql` elimina tablas y tipos con `DROP ... CASCADE`. Solo sirve para una base nueva o un reinicio intencional; no lo ejecutes sobre una base existente ni de producción. Para cambios de una base existente, crea una migración incremental y documenta su aplicación y riesgos.
- No afirmes que una operación externa (por ejemplo, el envío de WhatsApp) ocurrió si la aplicación solo prepara un enlace o requiere confirmación manual.

## Verificación

Ejecuta los chequeos afectados y, como mínimo, los siguientes para cambios de lógica o componentes:

```bash
npm run lint
npm run typecheck
npm test
```

`npm run build` no reemplaza esos chequeos. No agregues dependencias para tareas que puedan cubrirse con las herramientas existentes.

## Documentación vigente

- [Arquitectura y mapa](./ARCHITECTURE.md)
- [Reglas de negocio e invariantes](./docs/engineering/business-rules.md)
- [Biblia de diseño y UI (Design System)](./docs/engineering/design-system.md)
- [Base de datos y seguridad](./docs/engineering/database.md)
- [Configuración local](./INSTRUCCIONES.md)

`PLAN_LOGICA_NEGOCIO.md` y `PENDIENTES.md` son registros históricos, no fuentes del estado actual. Verifica siempre los archivos y pruebas actuales antes de usar sus ejemplos.
