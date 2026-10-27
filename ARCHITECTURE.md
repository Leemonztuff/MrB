# Arquitectura y mapa del proyecto

Referencia breve de la estructura vigente. Las rutas y reglas se deben confirmar en el código antes de cualquier cambio.

## Stack

- Next.js 15 App Router y TypeScript.
- Supabase para base de datos y autenticación.
- Tailwind CSS y componentes shadcn/ui.
- Zustand para el carrito; React Hook Form y Zod para formularios y validación.
- Vitest para pruebas unitarias.

## Directorios principales

| Ruta | Responsabilidad |
|---|---|
| `src/app/(admin)/admin/` | Pantallas del panel administrativo |
| `src/app/actions/` | Server Actions generales, autenticación y flujos públicos |
| `src/app/admin/actions/` | Server Actions y helpers administrativos |
| `src/app/pedido/[id]/` | Portal público para realizar pedidos |
| `src/app/onboarding/[token]/` | Alta pública de clientes |
| `src/lib/supabase/` | Clientes Supabase, esquema y migraciones |
| `src/lib/logic/` | Cálculos compartidos de negocio |
| `src/components/shared/` | Componentes reutilizables |
| `src/components/ui/` | Componentes de interfaz |
| `src/types/index.ts` | Tipos principales |

El alias `@/*` apunta a `src/*`.

## Patrones importantes

- Usa `src/lib/logic/cart-calculations.ts` para cálculos de carrito y promociones.
- Usa `src/lib/order-workflow.ts` para determinar el próximo bloqueo de despacho.
- Las acciones administrativas usan el helper de autorización de `src/app/admin/actions/_helpers.ts`. Mantén el formato `ActionResponse` de extremo a extremo.
- La base de datos es la autoridad para permisos y persistencia; valida en servidor toda entrada pública. Consulta [reglas de negocio](./docs/engineering/business-rules.md) y [base de datos y seguridad](./docs/engineering/database.md).

## Acceso a rutas

- Autenticación: `/login` y `/signup`.
- Pedidos y onboarding por token: rutas públicas.
- Panel `/admin/*`: acceso administrativo protegido.

El middleware y las páginas pueden completar o redirigir los flujos de autenticación; revisa su implementación antes de cambiar el comportamiento. No dependas de descripciones antiguas de middleware.
