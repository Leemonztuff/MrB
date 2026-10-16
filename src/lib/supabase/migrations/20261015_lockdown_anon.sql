-- ============================================================================
-- MIGRACIÓN: cierre del acceso anónimo a las tablas + rol de admin
-- ============================================================================
-- NO re-ejecutar `schema.sql` en una base con datos: ese script hace DROP TABLE.
-- Esta migración es idempotente y segura (solo borra policies y ajusta metadata).
--
-- Contexto: los flujos públicos (/pedido, /onboarding, /pedido/confirmar) ahora
-- corren del lado del servidor con el cliente service_role, que bypassa RLS.
-- Por eso el rol `anon` ya no necesita (ni debe tener) acceso a ninguna tabla.
--
-- ORDEN DE APLICACIÓN:
--   1. Ejecutar esta migración (sección A y B).
--   2. Deploy del código nuevo (server actions con service_role + guard admin).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- A. BACKFILL del rol de admin en app_metadata
-- ----------------------------------------------------------------------------
-- El código nuevo exige `app_metadata.role = 'super_admin'`.
-- En el signup viejo el rol se guardaba en `user_metadata`, así que hay que
-- copiarlo. Como la app es de un solo admin (el signup se bloquea después del
-- primero), promovemos a todos los usuarios existentes.
--
-- Si por algún motivo tenés usuarios que NO deben ser admin, reemplazá esta
-- sentencia por la variante filtrada por email (al final del archivo).

UPDATE auth.users
SET raw_app_meta_data =
    COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "super_admin"}'::jsonb
WHERE COALESCE(raw_app_meta_data->>'role', '') <> 'super_admin';

-- ----------------------------------------------------------------------------
-- B. CIERRE del acceso anónimo (drop de todas las policies para `anon`)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Allow read for anonymous" ON public.products;
DROP POLICY IF EXISTS "Allow read for anonymous" ON public.price_lists;
DROP POLICY IF EXISTS "Allow read for anonymous" ON public.price_list_items;
DROP POLICY IF EXISTS "Allow read for anonymous" ON public.promotions;
DROP POLICY IF EXISTS "Allow read for anonymous" ON public.sales_conditions;
DROP POLICY IF EXISTS "Allow read for anonymous" ON public.agreements;
DROP POLICY IF EXISTS "Allow read for anonymous" ON public.agreement_promotions;
DROP POLICY IF EXISTS "Allow read for anonymous" ON public.agreement_sales_conditions;

DROP POLICY IF EXISTS "Allow read/update for anonymous with token" ON public.clients;

DROP POLICY IF EXISTS "Allow insert for anonymous" ON public.orders;
DROP POLICY IF EXISTS "Allow read for anonymous" ON public.orders;
DROP POLICY IF EXISTS "Allow insert for anonymous" ON public.order_items;
DROP POLICY IF EXISTS "Allow read for anonymous" ON public.order_items;

DROP POLICY IF EXISTS "Allow read for anonymous" ON public.app_settings;

-- ----------------------------------------------------------------------------
-- VERIFICACIÓN (opcional): no debería devolver filas.
-- ----------------------------------------------------------------------------
-- SELECT tablename, policyname, roles
-- FROM pg_policies
-- WHERE schemaname = 'public' AND roles @> ARRAY['anon'];
--
-- Variante filtrada por email (en vez del bloque A):
-- UPDATE auth.users
-- SET raw_app_meta_data =
--     COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "super_admin"}'::jsonb
-- WHERE email = 'TU_EMAIL_ADMIN';
