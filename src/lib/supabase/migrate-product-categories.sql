-- Create product_categories table for dynamic category management

CREATE TABLE IF NOT EXISTS public.product_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    icon text,
    color text DEFAULT '#6366f1',
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed default categories
INSERT INTO public.product_categories (slug, name, description, icon, color, sort_order) VALUES
    ('cabello', 'Cabello', 'Productos para el cuidado del cabello', '💇', '#8b5cf6', 1),
    ('barba', 'Barba', 'Productos para el cuidado de la barba', '🧔', '#f59e0b', 2),
    ('merch', 'Merch', 'Merchandising y accesorios', '🎁', '#10b981', 3)
ON CONFLICT (slug) DO NOTHING;

-- Update products table to reference category (FK)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.product_categories(id);

-- Migrate existing category values to new references
UPDATE products p SET category_id = c.id
FROM product_categories c
WHERE LOWER(TRIM(p.category)) = c.slug;

-- Drop old category column (optional - keeps data)
-- ALTER TABLE public.products DROP COLUMN IF EXISTS category;

-- Rename FK column for clarity
ALTER TABLE public.products RENAME COLUMN category TO legacy_category;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_categories_slug ON product_categories(slug);
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active) WHERE is_active = true;

-- RLS policies
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to product_categories" ON public.product_categories
    FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories TO authenticated;
GRANT ALL ON public.product_categories TO service_role;

DO $$
BEGIN
    RAISE NOTICE 'Product categories table created and seeded successfully';
END $$;