# Agent Instructions: MrB (Blonde Orders)

## What This Is

B2B order management app for beauty product suppliers. Single Next.js 15 package (not a monorepo). UI text and code comments are in **Spanish**.

## Quick Commands

```bash
npm install          # install deps
npm run dev          # dev server on http://localhost:9003
npm run build        # production build
npm run lint         # next lint
```

No test framework is configured. No CI workflows exist.

## Build Quirks

- `next.config.ts` sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` — builds will succeed even with type/lint errors. Do not rely on `npm run build` to catch issues; run `npm run lint` manually.
- Server Actions body limit is 5 MB (`experimental.serverActions.bodySizeLimit`).

## Environment Setup

Create `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

After setting env vars, run `src/lib/supabase/schema.sql` in Supabase SQL Editor (idempotent). Optionally run `src/lib/supabase/seed.sql` for sample data.

## Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).

## Architecture

- **Framework**: Next.js 15 App Router
- **DB & Auth**: Supabase (4 clients: `client.ts`, `server.ts`, `admin.ts`, `middleware.ts` in `src/lib/supabase/`)
- **UI**: Tailwind CSS + shadcn/ui (components in `src/components/ui/`), dark-mode only (class-based, always applied)
- **State**: Zustand (`src/hooks/use-cart-store.ts` — shopping cart)
- **Forms**: React Hook Form + Zod
- **PDF**: `@react-pdf/renderer` for shipping labels

### Route Structure

| Route | Access | Purpose |
|---|---|---|
| `/login`, `/signup` | Public | Auth (signup blocked after first admin created) |
| `/pedido/[id]` | Public | Customer order page |
| `/onboarding/[token]` | Public | Customer onboarding |
| `/admin/*` | Protected | Admin dashboard |

### Middleware Logic (`middleware.ts`)

- On first run (no users in DB), all routes redirect to `/signup`.
- After first admin exists, `/signup` redirects to `/login`.
- `/pedido/*` and `/onboarding/*` are always public.
- Authenticated users on public routes redirect to `/admin`.

### Key Directories

- `src/app/(admin)/admin/` — Admin pages, sub-routes for clients, products, agreements, orders, promotions, price lists
- `src/app/actions/` — Server Actions (user auth, settings)
- `src/app/admin/actions/` — Admin-specific Server Actions (per entity)
- `src/components/shared/` — Reusable UI components
- `src/types/index.ts` — Main TypeScript type definitions

## Conventions

- shadcn/ui components: use `npx shadcn@latest add <component>` to add new ones
- Custom font: Century Gothic (loaded via `next/font/local` in root layout)
