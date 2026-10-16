# Pendientes y hallazgos — MrB (Blonde Orders)

Fecha de la auditoría: 2026-10-15

Documento para retomar el trabajo. Incluye lo ya corregido y lo que queda pendiente,
ordenado por gravedad.

---

## 1. Trabajo ya realizado (deployado en `main`)

| Commit | Qué se arregló |
|---|---|
| `fa97016` | Bucle `ERR_TOO_MANY_REDIRECTS`: el middleware forzaba `/signup` en toda ruta sin sesión, mientras `signup/page.tsx` redirigía a `/login` si ya había admin → loop. Se quitó el bloque y se dejó decidir a las páginas con `hasUsers()`. |
| `fa97016` | Fallback de configuración: `src/lib/env.ts` + `src/app/setup/page.tsx`. El middleware redirige a `/setup` si faltan env vars. `admin.ts` ya no lanza error en dev. |
| `17a0a81` | Errores del patrón `ActionResponse` (ver sección 3). Dashboard `Cannot read properties of undefined (reading 'map')` por doble envoltura en `getDashboardData`. |
| `f3bd075` | Cálculo del total del pedido en el server con la misma lógica del cliente (`calculateCartTotals`), incluyendo IVA/`prices_include_vat`, umbral de volumen y promociones. También se corrigió el embed inválido `clients → price_lists` (no hay FK directa; se navega vía `agreements`). |

Bugs de `ActionResponse` ya corregidos (para no repetir el patrón):
- Doble envoltura: `agreements.actions.ts` `getUnassignedProducts` devolvía `{ data: [], error: null }` dentro de `handleAction`.
- Consumidores que no desempaquetaban: `login/page.tsx`, `signup/page.tsx`, `onboarding/[token]/page.tsx`, `admin/imprimir/rotulos/page.tsx`, `pedido/[id]/_components/order-summary.tsx` (whatsapp), `admin/clients/[id]/page.tsx` (orders).
- `pricelists.actions.ts`: `upsertPriceList` sin `success` en caso 23505; `assignProductsToPriceList` sin `handleAction` (devolvía `null`).
- `api/pedido/confirmar/[id]/route.ts`: `try/catch` muerto, siempre redirigía a éxito; ahora chequea `result.success`/`result.error.message`.
- `admin/layout.tsx`: mismo desempaquetado incorrecto que `admin/page.tsx`.

Regla general a respetar:
- `handleAction` ya devuelve `{ success, data?, error? }`. Nunca hacer `return { data: ... }` dentro del callback.
- Consumidores deben usar `const { data, error } = await action()`.
- Acciones que NO usan `handleAction` y devuelven plano: `getSettings(): AppSettings`, `lookupCuit(): { data, error }`, `exportBackup/exportImages` (`{ data, filename }`).

---

## 2. SEGURIDAD — RESUELTO (código + migración SQL)

Se cerró el acceso anónimo y se arregló la autorización de admin:

- **Flujos públicos server-side con `service_role`**: `getOrderPageData`, `submitOrder`,
  `getOnboardingClient`, `submitOnboardingForm` (`user.actions.ts`), `getPublicOrderDetails`,
  `publicConfirmOrder` (`orders.actions.ts`), `getPublicLogoUrl`, `getPublicWhatsappNumber`
  (`settings.actions.ts`). El `service_role` nunca se expone al navegador.
- **Guard de admin** (`_helpers.ts`): ahora exige `user.app_metadata.role === 'super_admin'`
  (antes pasaba cualquier logueado, porque `user.role` es `'authenticated'` para todos).
- **Signup** (`signupSuperAdmin`): el rol se guarda en `app_metadata` (antes `user_metadata`,
  que el propio usuario puede editar).
- **RLS** (`schema.sql`): eliminadas TODAS las policies para `anon` (products, price_lists,
  price_list_items, promotions, sales_conditions, agreements, agreement_promotions,
  agreement_sales_conditions, clients, orders, order_items, app_settings). Quedan solo las de
  `authenticated`.
- **Migración para bases existentes**: `src/lib/supabase/migrations/20261015_lockdown_anon.sql`
  (idempotente: borra las policies de `anon` + backfill del rol de admin en `app_metadata`).

Orden de aplicación: **(1) correr la migración → (2) deploy del código.**

> OJO: NO re-ejecutar `schema.sql` en una base con datos: arranca con `DROP TABLE ... CASCADE`.
> Es un script de reset, no idempotente (contrario a lo que dice el `AGENTS.md`).

Mejora futura: RLS `authenticated` sigue dando acceso total a cualquier usuario logueado;
endurecer por rol (por ejemplo `auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin'`).

---

## 3. CALIDAD / ROBUSTEZ — RESUELTO (commit `e6c9106`)

- `next.config.ts`: `typescript.ignoreBuildErrors` apagado (`npx tsc --noEmit` en 0 errores,
  `npm run build` pasa con type-check). Quedó solo `eslint.ignoreDuringBuilds`.
- `submitOrder`: valida carrito/cantidades con Zod (`cartQuantitySchema`, entero 1–10000).
- `volume_threshold` se lee de `app_settings` y se aplica en cliente (`setVolumeThreshold`) y
  server (`calculateCartTotals`).
- Borrado código muerto `assign-product-dialog.tsx`; corregido comentario con carácter chino.

---

## 4. Notas de entorno
- Deploy en Vercel; requiere `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`. Si falta algo ahora se muestra `/setup`.
- Los cambios de la sección 3 no requieren SQL. Los de la sección 2 SÍ: hay que correr
  `src/lib/supabase/migrations/20261015_lockdown_anon.sql` antes del deploy.
