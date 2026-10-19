-- ============================================================================
-- MIGRACIÓN: cierre del acceso anónimo en tablas legacy
-- ============================================================================
-- Idempotente y segura (solo dropea/crea policies; no toca datos).
--
-- Contexto: `news`, `inventory_movements` y `product_categories` tenían una
-- policy abierta para el rol `public` (`using=true with check=true`), lo que
-- permitía a cualquiera con la anon key leer Y escribir esas tablas. Se
-- reemplazan por acceso restringido a `authenticated`, igual que el resto.
-- ============================================================================

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all news" ON public.news;
DROP POLICY IF EXISTS "Allow all inventory_movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "Allow all product_categories" ON public.product_categories;

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.news;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.inventory_movements;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.product_categories;

CREATE POLICY "Allow all for authenticated" ON public.news
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON public.inventory_movements
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON public.product_categories
  FOR ALL USING (auth.role() = 'authenticated');
