# AGENTS.md - Developer Guidelines

## Overview

This is a Next.js 15 application (App Router) called "Blonde Orders" - an order management system with admin panel, client portal, and AI integration (Genkit).

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui + Radix UI
- **Database/Auth**: Supabase
- **State Management**: Zustand (client-side)
- **Form Validation**: React Hook Form + Zod
- **AI**: Genkit (Google AI)
- **Testing**: Jest (configured but no tests currently exist)

---

## Build / Lint / Test Commands

### Development
```bash
npm run dev          # Start dev server on port 9003
npm run build        # Production build
npm run start        # Start production server
```

### Linting & Type Checking
```bash
npm run lint         # Run ESLint
npx tsc --noEmit      # TypeScript type check
```

### Testing
```bash
npm test             # Run all tests
npm test -- --watch  # Watch mode
```

**Note**: The ARCHITECTURE.md mentions Jest config at `jest.config.js` but it doesn't exist in the repository. If you add tests, create the config first.

---

## Project Structure

```
src/
├── ai/               # Genkit AI flows
├── app/              # Next.js App Router pages
│   ├── (admin)/      # Protected admin routes
│   ├── (auth)/       # Login/signup routes
│   ├── actions/      # Server Actions (user actions)
│   ├── admin/        # Admin panel with entity-specific actions
│   └── pedido/[id]/  # Public order page
├── components/        # UI components
│   ├── shared/       # Shared components (PageHeader, EmptyState)
│   └── ui/           # shadcn/ui components
├── hooks/            # Custom hooks (useCartStore with Zustand)
├── lib/              # Utilities and Supabase clients
│   ├── logic/        # Business logic (cart calculations)
│   ├── supabase/     # DB clients (server, client, admin, middleware)
│   └── validations/  # Zod schemas
└── types/            # TypeScript definitions
```

---

## Code Style Guidelines

### Imports

- Use path aliases (`@/` prefix) for absolute imports
- Order imports: external → internal → relative
- Group by: React imports → other imports → types → utils

```typescript
// Good
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types';
import { useCartStore } from '@/hooks/use-cart-store';
```

### Types

- Use explicit return types for Server Actions and public functions
- Prefer type aliases over interfaces for simple types
- Use the `ActionResponse<T>` type for Server Action returns:

```typescript
// src/types/index.ts defines:
export type ActionResponse<T = any> = {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: string;
    };
};
```

### Naming Conventions

- **Components**: PascalCase (`PageHeader`, `OrderSummary`)
- **Hooks**: camelCase with `use` prefix (`useCartStore`)
- **Server Actions**: camelCase, descriptive (`signupSuperAdmin`, `getOrderPageData`)
- **Types**: PascalCase (`Product`, `Client`)
- **Files**: kebab-case for utils, PascalCase for components

### Error Handling

- Server Actions use `handleAction` wrapper (see `src/app/admin/actions/_helpers.ts`)
- Always return `ActionResponse` for async actions
- Use meaningful error messages in Spanish

```typescript
export async function myAction(data: Input): Promise<ActionResponse<Output>> {
    return handleAction(async () => {
        // Logic here
        if (!valid) throw new Error('Mensaje de error descriptivo');
        return result;
    }, ['/admin/entities']);
}
```

### Component Patterns

- Use `"use client"` directive for client components
- shadcn/ui components follow Radix UI patterns
- Use the `cn()` utility for conditional classes (from `tailwind-merge`)

```typescript
import { cn } from '@/lib/utils';

// Usage
<div className={cn(
    "base-classes",
    condition && "conditional-class",
    className  // allow overrides
)} />
```

### Zustand Store Pattern

See `src/hooks/use-cart-store.ts` for the cart store - uses persist middleware:

```typescript
export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // state & actions
    }),
    { name: 'storage-key' }
  )
);
```

### Server Actions

- Place in `src/app/actions/` for general actions
- Place in `src/app/admin/actions/` for admin-specific actions
- Always add `"use server"` at the top
- Use `handleAction` helper for consistent error handling
- Authenticate with `getSupabaseClientWithAuth()` helper

---

## Form Validation

Uses Zod schemas with React Hook Form. Example from `src/lib/validations/client.schema.ts`:

```typescript
export const onboardingSchema = z.object({
    contact_name: z.string().min(1, 'Requerido'),
    email: z.string().email('Email inválido'),
    // ...
});
```

---

## Database Patterns

- Use Supabase service role client (`supabaseAdmin`) only in secure server contexts
- Regular operations use `createServerClient()` or `createClient()`
- RLS (Row Level Security) policies are set in Supabase
- See `src/lib/supabase/` for client configurations

---

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## CI/CD

GitHub Actions workflow in `.github/workflows/ci-cd.yml`:

1. **Lint & Type Check** - ESLint + TypeScript
2. **Unit Tests** - Jest (if configured)
3. **Build** - Next.js production build
4. **Deploy** - Vercel (staging on `develop`, production on `main`)

---

## Useful Patterns

### Page Data Fetching
Server Components call Server Actions to fetch data:

```typescript
// In a page.tsx
const data = await getData(id);
if (!data.success) notFound();
```

### Client-State Sync
After mutations, call `revalidatePath()` in Server Actions to refresh server data.

### Middleware
The `middleware.ts` handles:
- Security headers
- JWT validation
- Rate limiting (see `src/lib/rate-limiter.ts`)
- Route protection

---

## Architecture Reference

See `ARCHITECTURE.md` for detailed system documentation including:
- Directory structure
- Authentication flows
- Order placement flow
- Security implementations
- Database schema

---

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in Supabase credentials
2. Run `npm install`
3. Run `npm run dev` - app runs on `http://localhost:9003`
4. First visit redirects to `/signup` to create admin user
