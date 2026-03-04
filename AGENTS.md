# AGENTS.md - Developer Guidelines

## Overview
Next.js 15 (App Router) order management system with admin panel, client portal, and AI (Genkit).

## Tech Stack
- **Framework**: Next.js 15 (App Router) | **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui + Radix UI
- **Database/Auth**: Supabase | **State**: Zustand
- **Forms**: React Hook Form + Zod | **AI**: Genkit (Google AI)

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
npm run lint         # Run Next.js ESLint
npx tsc --noEmit     # TypeScript type check
```

### Testing
```bash
npm test             # Run all tests (Jest)
npm test -- --watch  # Watch mode
npm test -- <file>   # Run single test file
npm test -- -t "<name>"  # Run tests matching name pattern
```
**Note**: Tests require Jest configuration (`jest.config.js`). Currently no tests exist.

---

## Project Structure
```
src/
├── ai/               # Genkit AI flows
├── app/              # Next.js App Router
│   ├── (admin)/      # Protected admin routes
│   ├── (auth)/       # Login/signup routes
│   ├── actions/      # Server Actions
│   └── pedido/[id]/  # Public order page
├── components/       # UI components (ui/, shared/)
├── hooks/            # Zustand stores (useCartStore)
├── lib/              # Utils, Supabase clients, Zod schemas
└── types/            # TypeScript definitions
```

---

## Code Style Guidelines

### Imports
Use `@/` path aliases. Order: React → external → internal → types → utils.
```typescript
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types';
import { useCartStore } from '@/hooks/use-cart-store';
```

### Types
- Explicit return types for Server Actions and public functions
- Prefer type aliases over interfaces for simple types
- Use `ActionResponse<T>` for Server Action returns

### Naming Conventions
- **Components**: PascalCase (`PageHeader`)
- **Hooks**: camelCase with `use` prefix (`useCartStore`)
- **Server Actions**: descriptive camelCase (`signupSuperAdmin`)
- **Types**: PascalCase (`Product`)
- **Files**: kebab-case (utils), PascalCase (components)

### Error Handling
Use `handleAction` wrapper in Server Actions. Always return `ActionResponse`. Error messages in Spanish.
```typescript
export async function myAction(data: Input): Promise<ActionResponse<Output>> {
    return handleAction(async () => {
        if (!valid) throw new Error('Mensaje de error descriptivo');
        return result;
    }, ['/admin/entities']);
}
```

### Components
- Use `"use client"` for client components
- Use `cn()` utility for conditional classes:
```typescript
<div className={cn("base", condition && "conditional", className)} />
```

### Zustand Store Pattern
```typescript
export const useStore = create<StoreState>()(
  persist((set, get) => ({ /* state & actions */ }), { name: 'storage-key' })
);
```

### Server Actions
- Place in `src/app/actions/` or `src/app/admin/actions/`
- Add `"use server"` at the top
- Use `handleAction` helper for error handling
- Authenticate with `getSupabaseClientWithAuth()` helper

---

## Form Validation
Zod schemas with React Hook Form:
```typescript
export const onboardingSchema = z.object({
    contact_name: z.string().min(1, 'Requerido'),
    email: z.string().email('Email inválido'),
});
```

---

## Database Patterns
- `supabaseAdmin` only in secure server contexts
- Regular ops use `createServerClient()` or `createClient()`
- RLS policies in Supabase

---

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## Useful Patterns

### Page Data Fetching
```typescript
const data = await getData(id);
if (!data.success) notFound();
```

### Client-State Sync
After mutations, call `revalidatePath()` in Server Actions.

---

## Getting Started
1. Copy `.env.example` → `.env.local` and fill Supabase credentials
2. Run `npm install`
3. Run `npm run dev` → http://localhost:9003
4. First visit redirects to `/signup` to create admin user
