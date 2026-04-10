-- Normalize product categories to standard values: cabello, barba, merch
-- Run this migration to update existing product categories to the new standard

-- First, let's see what categories exist (for reference)
-- SELECT DISTINCT category FROM products WHERE category IS NOT NULL;

-- Drop existing constraint if it exists
ALTER TABLE products 
    DROP CONSTRAINT IF EXISTS products_category_check;

-- Update categories to standardized values
UPDATE products SET 
    category = LOWER(TRIM(category))
WHERE category IS NOT NULL;

-- Map old categories to new standard
UPDATE products SET category = 'cabello'
WHERE LOWER(TRIM(category)) IN (
    'cabello', 'hair', 'capilar', 'shampoo', 'acondicionador', 
    'tratamiento', 'mascarilla', 'aceite', 'serum', 'peinado',
    'styling', 'fijacion', 'brillo', 'reparador', 'nutritivo',
    'hairstyle', 'cuidado capilar', 'products for hair'
);

UPDATE products SET category = 'barba'
WHERE LOWER(TRIM(category)) IN (
    'barba', 'beard', 'afeitado', 'after shave', 'bálsamo', 
    'aceite de barba', 'peine', 'tijeras', 'barber', 'shaving',
    'beardstyle', 'cuidado de barba', 'products for beard'
);

UPDATE products SET category = 'merch'
WHERE LOWER(TRIM(category)) IN (
    'merch', 'merchandising', 'accesorios', 'accessories', 
    'herramientas', 'tools', 'cepillo', 'peineta', 'bolsa',
    'taza', 'remera', 'gorra', 'delantal', 'combos', 'kits',
    'gift', 'regalo', 'packs'
);

-- Set null for any categories that don't match the new standards
UPDATE products SET category = NULL
WHERE category IS NOT NULL 
  AND category NOT IN ('cabello', 'barba', 'merch');

-- Create CHECK constraint for valid categories
ALTER TABLE products 
    ADD CONSTRAINT products_category_check 
    CHECK (category IN ('cabello', 'barba', 'merch') OR category IS NULL);

-- Add index for faster category queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Log the changes
DO $$
DECLARE
    cabello_count INTEGER;
    barba_count INTEGER;
    merch_count INTEGER;
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO cabello_count FROM products WHERE category = 'cabello';
    SELECT COUNT(*) INTO barba_count FROM products WHERE category = 'barba';
    SELECT COUNT(*) INTO merch_count FROM products WHERE category = 'merch';
    SELECT COUNT(*) INTO null_count FROM products WHERE category IS NULL;
    
    RAISE NOTICE 'Category migration complete: cabello=%, barba=%, merch=%, null=%', 
        cabello_count, barba_count, merch_count, null_count;
END $$;