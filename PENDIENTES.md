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

## 2. SEGURIDAD — pendiente (requiere SQL en Supabase)

### 2.1 RLS de `clients` permite leer/editar todo sin token — CRÍTICO
`schema.sql:269`
```sql
CREATE POLICY "Allow read/update for anonymous with token" ON public.clients FOR ALL USING (true);
```
El nombre dice "with token" pero la condición es `true`. Con la `anon key` (pública) cualquiera
puede leer y **modificar** todos los clientes (nombre, CUIT, email, status, `agreement_id`…).
El onboarding necesita acceso anónimo, pero debe filtrarse por `onboarding_token`.

Sugerencia:
- Separar en políticas: `SELECT`/`UPDATE` anónimo limitado por token, o mover el onboarding
  a un Server Action con `service_role` y cerrar el acceso anónimo a `clients`.
- Ejemplo orientativo (revisar antes de aplicar):
```sql
DROP POLICY "Allow read/update for anonymous with token" ON public.clients;
CREATE POLICY "anon select by token" ON public.clients FOR SELECT TO anon USING (true);
CREATE POLICY "anon update by token" ON public.clients FOR UPDATE TO anon USING (onboarding_token IS NOT NULL);
```
(Ajustar: `UPDATE` con `USING` por token concreto no es directo en RLS; evaluar usar
`service_role` desde el server action `submitOnboardingForm` y bloquear `anon` por completo.)

### 2.2 `orders` / `order_items` legibles por cualquiera — ALTO
`schema.sql:273,277`: `FOR SELECT USING (true)` para `anon` → cualquiera con la anon key lee
todos los pedidos del negocio. `insert` anónimo con `WITH CHECK (true)` sin límites (spam).

Sugerencia: restringir `SELECT` anónimo a lo necesario para la página pública `/pedido/[id]`
y `/pedido/confirmar/[id]` (por id/token), y/o usar `service_role` en los server actions.

### 2.3 `getSupabaseClientWithAuth` no valida admin — ALTO
`src/app/admin/actions/_helpers.ts:20`
```ts
if (!user || (user.app_metadata?.role !== 'super_admin' && user.role !== 'authenticated')) {
    throw new Error("No tienes permisos de administrador para realizar esta acción.");
}
```
`user.role` es `'authenticated'` para **cualquier** usuario logueado, así que el chequeo siempre
pasa. Además el signup guarda el rol en `user_metadata` (`user.actions.ts:46`), no en
`app_metadata`, por lo que ni siquiera coincidiría.

Sugerencia: chequear `user.app_metadata?.role === 'super_admin'` (y setearlo con
`supabaseAdmin.auth.admin.updateUserById(..., { app_metadata })`, no `user_metadata`).

### 2.4 `app_settings` legible por anon — BAJO/MEDIO
`schema.sql:280`: hoy expone `whatsapp_number`, `vat_percentage`, `logo_url` (aceptable), pero
si se agregan secretos a esa tabla quedarían expuestos vía anon key.

---

## 3. CALIDAD / ROBUSTEZ — pendiente (solo código)

### 3.1 Validación de build apagada
`next.config.ts`: `typescript.ignoreBuildErrors: true` y `eslint.ignoreDuringBuilds: true`.
Oculta errores reales (varios de los bugs de `ActionResponse` eran detectables por tipos).
Pendientes detectados por `tsc`:
- `src/app/admin/pricelists/[id]/_components/assign-product-dialog.tsx:114,116` — schema Zod con
  tupla `[string, ...string[]]` vs `string[]` en `setValue('product_ids', ...)`.
- `src/app/admin/actions/dashboard.actions.ts:45` — `getNotificationData` infiere
  `ActionResponse<unknown>` por `.rpc(...).single()`.
- Varios errores de tipos en `ActionResponse` en `agreements.actions`/`dashboard.actions`
  (`ActionResponse<X>` vs forma real).
Sugerencia: apagar `ignoreBuildErrors` en una rama, medir y arreglar por tandas.

### 3.2 `quantity` sin validar en `submitOrder` — `src/app/actions/user.actions.ts`
La cantidad viene del cliente y no se valida (>0, entero, máximo). Los precios sí se
sobreescriben desde la DB, pero no la cantidad. Validar con Zod antes de calcular/insertar.
Considerar: si `finalClientId` es null (`'generic'`) se confían precios del cliente.

### 3.3 `volume_threshold` configurable pero ignorado
`schema.sql` guarda `app_settings.volume_threshold = 150`, pero el código usa la constante
`DEFAULT_VOLUME_THRESHOLD = 150` hardcodeada en cliente y server. Cambiar la config no tiene
efecto. Leer `volume_threshold` de `app_settings` y pasarlo al store (`setVolumeThreshold`) y a
`calculateCartTotals` en el server.

### 3.4 Código muerto / duplicado
- `src/app/admin/agreements/[id]/_components/assign-product-dialog.tsx` — no se importa desde
  ningún lado (revisar antes de borrar).
- `getOrderPageData` (en `user.actions.ts`) duplica la lógica de carga de catálogo/agreement que
  ya usa la página `/pedido/[id]`.

### 3.5 Detalles menores
- `src/lib/logic/cart-calculations.ts:105` — comentario con carácter chino "赠品" (cosmético).
- `src/app/pedido/[id]/page.tsx` — ya se corrigió `params` a `Promise` (Next 15).
- `getOrderPageData` matchea tipos de error por substring en español (frágil ante cambios de
  texto).

---

## 4. Notas de entorno
- Deploy en Vercel; requiere `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`. Si falta algo ahora se muestra `/setup`.
- Los cambios hasta `f3bd075` no requieren re-ejecutar SQL (solo código).
- Las correcciones de la sección 2 SÍ requieren aplicar SQL nuevo en Supabase.
