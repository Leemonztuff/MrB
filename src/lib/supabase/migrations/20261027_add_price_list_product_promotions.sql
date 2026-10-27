-- Asigna promociones de compra X y lleva Y a productos dentro de cada lista.
-- Conserva las promociones ya vigentes distribuyéndolas entre los productos
-- incluidos en listas usadas por convenios que ya tenían esas promociones.

CREATE TABLE IF NOT EXISTS public.price_list_item_promotions (
    price_list_id uuid NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
    PRIMARY KEY (price_list_id, product_id, promotion_id),
    FOREIGN KEY (price_list_id, product_id)
        REFERENCES public.price_list_items(price_list_id, product_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_price_list_item_promotions_promotion_id
    ON public.price_list_item_promotions(promotion_id);

ALTER TABLE public.price_list_item_promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated"
    ON public.price_list_item_promotions;
DROP POLICY IF EXISTS "Super admins full access"
    ON public.price_list_item_promotions;
CREATE POLICY "Super admins full access"
    ON public.price_list_item_promotions
    FOR ALL
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

REVOKE ALL ON TABLE public.price_list_item_promotions FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.price_list_item_promotions TO authenticated;

-- Conserva asignaciones existentes registradas en la tabla legacy.
DO $$
BEGIN
    IF to_regclass('public.price_list_product_promotions') IS NOT NULL THEN
        EXECUTE $backfill$
            INSERT INTO public.price_list_item_promotions (price_list_id, product_id, promotion_id)
            SELECT price_list_id, product_id, promotion_id
            FROM public.price_list_product_promotions
            WHERE price_list_id IS NOT NULL
              AND product_id IS NOT NULL
              AND promotion_id IS NOT NULL
            ON CONFLICT DO NOTHING
        $backfill$;
    END IF;
END;
$$;

-- Las promociones ya asignadas a convenios mantienen su alcance actual:
-- productos/categorías configurados, o todos los productos si no tenían alcance.
INSERT INTO public.price_list_item_promotions (price_list_id, product_id, promotion_id)
SELECT DISTINCT
    a.price_list_id,
    pli.product_id,
    p.id
FROM public.agreements a
JOIN public.agreement_promotions ap ON ap.agreement_id = a.id
JOIN public.promotions p ON p.id = ap.promotion_id
JOIN public.price_list_items pli ON pli.price_list_id = a.price_list_id
JOIN public.products product ON product.id = pli.product_id
WHERE a.price_list_id IS NOT NULL
  AND p.rules->>'type' = 'buy_x_get_y_free'
  AND (
      (
          jsonb_typeof(p.rules->'product_ids') IS DISTINCT FROM 'array'
          AND jsonb_typeof(p.rules->'category_names') IS DISTINCT FROM 'array'
      )
      OR (
          jsonb_typeof(p.rules->'product_ids') = 'array'
          AND (p.rules->'product_ids') ? pli.product_id::text
      )
      OR (
          jsonb_typeof(p.rules->'category_names') = 'array'
          AND EXISTS (
              SELECT 1
              FROM jsonb_array_elements_text(p.rules->'category_names') AS scoped(category_name)
              WHERE scoped.category_name = product.category
          )
      )
  )
ON CONFLICT DO NOTHING;
