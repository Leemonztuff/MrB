-- MR. BLONDE - MASTER INIT SCRIPT
-- Fresh start with sample data for development
-- Run this script once to initialize the database

-- ============================================
-- 1. CLEANUP (Idempotent - safe to run multiple times)
-- ============================================
DROP VIEW IF EXISTS public.agreements_with_counts CASCADE;
DROP VIEW IF EXISTS public.dashboard_stats CASCADE;
DROP FUNCTION IF EXISTS public.get_notification_counts() CASCADE;
DROP FUNCTION IF EXISTS public.get_client_stats(uuid) CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.inventory_movements CASCADE;
DROP TABLE IF EXISTS public.agreement_sales_conditions CASCADE;
DROP TABLE IF EXISTS public.agreement_promotions CASCADE;
DROP TABLE IF EXISTS public.agreements CASCADE;
DROP TABLE IF EXISTS public.price_list_items CASCADE;
DROP TABLE IF EXISTS public.price_lists CASCADE;
DROP TABLE IF EXISTS public.price_list_product_promotions CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.sales_conditions CASCADE;
DROP TABLE IF EXISTS public.promotions CASCADE;
DROP TABLE IF EXISTS public.news CASCADE;
DROP TABLE IF EXISTS public.news_likes CASCADE;
DROP TABLE IF EXISTS public.app_settings CASCADE;
DROP TABLE IF EXISTS public.pending_changes CASCADE;
DROP TABLE IF EXISTS public.product_categories CASCADE;
DROP TYPE IF EXISTS public.inventory_movement_type CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.client_status CASCADE;
DROP TYPE IF EXISTS public.client_type CASCADE;
DROP TYPE IF EXISTS public.change_type CASCADE;

-- ============================================
-- 2. TYPES
-- ============================================
CREATE TYPE public.order_status AS ENUM ('armado', 'transito', 'entregado');
CREATE TYPE public.client_status AS ENUM ('pending_onboarding', 'pending_agreement', 'active', 'archived');
CREATE TYPE public.client_type AS ENUM ('barberia', 'distribuidor', 'especial');
CREATE TYPE public.change_type AS ENUM ('contact_name', 'email', 'phone', 'cuit', 'address', 'delivery_window', 'instagram', 'contact_dni', 'fiscal_status');
CREATE TYPE public.inventory_movement_type AS ENUM ('in', 'out', 'adjustment', 'reserved');

-- ============================================
-- 3. TABLES
-- ============================================

-- Product Categories (NEW!)
CREATE TABLE public.product_categories (
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

-- Products with FK to category
CREATE TABLE public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    category text,
    category_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
    image_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Price Lists
CREATE TABLE public.price_lists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    prices_include_vat boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.price_list_items (
    price_list_id uuid REFERENCES public.price_lists(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    price numeric NOT NULL DEFAULT 0,
    volume_price numeric,
    PRIMARY KEY (price_list_id, product_id)
);

-- Promotions (with application_scope - NEW!)
CREATE TABLE public.promotions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    rules jsonb NOT NULL DEFAULT '{}'::jsonb,
    application_scope jsonb DEFAULT '{"type":"all"}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sales Conditions
CREATE TABLE public.sales_conditions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    rules jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Agreements
CREATE TABLE public.agreements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_name text NOT NULL UNIQUE,
    client_type public.client_type NOT NULL DEFAULT 'barberia',
    price_list_id uuid REFERENCES public.price_lists(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.agreement_promotions (
    agreement_id uuid REFERENCES public.agreements(id) ON DELETE CASCADE,
    promotion_id uuid REFERENCES public.promotions(id) ON DELETE CASCADE,
    PRIMARY KEY (agreement_id, promotion_id)
);

CREATE TABLE public.price_list_product_promotions (
    price_list_id uuid REFERENCES public.price_lists(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    promotion_id uuid REFERENCES public.promotions(id) ON DELETE CASCADE,
    PRIMARY KEY (price_list_id, product_id)
);

CREATE TABLE public.agreement_sales_conditions (
    agreement_id uuid REFERENCES public.agreements(id) ON DELETE CASCADE,
    sales_condition_id uuid REFERENCES public.sales_conditions(id) ON DELETE CASCADE,
    PRIMARY KEY (agreement_id, sales_condition_id)
);

-- Clients
CREATE TABLE public.clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_name text,
    contact_dni text,
    email text UNIQUE,
    phone text,
    cuit text UNIQUE,
    fiscal_status text,
    address text,
    latitude float8,
    longitude float8,
    delivery_window text,
    instagram text,
    status public.client_status NOT NULL DEFAULT 'pending_onboarding',
    onboarding_token uuid,
    onboarding_expires_at timestamp with time zone,
    portal_token text,
    agreement_id uuid REFERENCES public.agreements(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Orders (with is_public - NEW!)
CREATE TABLE public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
    agreement_id uuid REFERENCES public.agreements(id) ON DELETE SET NULL,
    total_amount numeric NOT NULL DEFAULT 0,
    status public.order_status NOT NULL DEFAULT 'armado',
    client_name_cache text NOT NULL,
    notes text,
    is_public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    quantity integer NOT NULL DEFAULT 1,
    price_per_unit numeric NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inventory
CREATE TABLE public.inventory_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    type public.inventory_movement_type NOT NULL,
    quantity integer NOT NULL DEFAULT 0,
    reason text,
    reference_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid
);

-- Pending Changes
CREATE TABLE public.pending_changes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    change_type public.change_type NOT NULL,
    old_value text,
    new_value text,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at timestamp with time zone,
    resolved_by uuid
);

-- News
CREATE TABLE public.news (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    content text NOT NULL,
    image_url text,
    is_active boolean NOT NULL DEFAULT true,
    display_order integer NOT NULL DEFAULT 0,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    promotion_id uuid REFERENCES public.promotions(id) ON DELETE SET NULL,
    target_client_type public.client_type,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.news_likes (
    news_id uuid REFERENCES public.news(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (news_id, client_id)
);

-- App Settings
CREATE TABLE public.app_settings (
    key text PRIMARY KEY,
    value jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 4. VIEWS
-- ============================================
CREATE OR REPLACE VIEW public.agreements_with_counts AS
SELECT 
    a.*,
    (SELECT count(*) FROM public.agreement_promotions ap WHERE ap.agreement_id = a.id) as promotion_count,
    (SELECT count(*) FROM public.agreement_sales_conditions asc_t WHERE asc_t.agreement_id = a.id) as sales_condition_count
FROM public.agreements a;

CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders) as total_revenue,
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE created_at >= date_trunc('month', now())) as month_revenue,
    (SELECT count(*) FROM public.clients WHERE status = 'active') as active_clients,
    (SELECT count(*) FROM public.orders WHERE status = 'armado' AND created_at < now() - interval '48 hours') as overdue_orders_count,
    (SELECT count(*) FROM public.clients) as total_clients,
    (SELECT count(*) FROM public.price_lists) as total_pricelists,
    (SELECT count(*) FROM public.promotions) as total_promotions,
    (SELECT count(*) FROM public.sales_conditions) as total_sales_conditions,
    (SELECT count(*) FROM public.orders WHERE status = 'armado') as pending_orders_count;

-- ============================================
-- 5. FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION public.get_notification_counts()
RETURNS json AS $$
BEGIN
    RETURN (
        SELECT json_build_object(
            'pending_orders_count', (SELECT count(*) FROM public.orders WHERE status = 'armado'),
            'pending_clients_count', (SELECT count(*) FROM public.clients WHERE status = 'pending_agreement'),
            'overdue_orders_count', (SELECT count(*) FROM public.orders WHERE status = 'armado' AND created_at < now() - interval '48 hours')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_client_stats(p_client_id uuid)
RETURNS json AS $$
BEGIN
    RETURN (
        SELECT json_build_object(
            'total_spent', COALESCE(SUM(total_amount), 0),
            'total_orders', COUNT(*),
            'average_order_value', COALESCE(AVG(total_amount), 0)
        )
        FROM public.orders
        WHERE client_id = p_client_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. RLS POLICIES (simplified for dev)
-- ============================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Allow all for authenticated users
CREATE POLICY "Allow all products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all price_lists" ON public.price_lists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all promotions" ON public.promotions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all sales_conditions" ON public.sales_conditions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all agreements" ON public.agreements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all product_categories" ON public.product_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all news" ON public.news FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all inventory_movements" ON public.inventory_movements FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 7. SEED DATA
-- ============================================

-- Categories
INSERT INTO public.product_categories (slug, name, description, icon, color, sort_order) VALUES
    ('cabello', 'Cabello', 'Productos para el cuidado del cabello', '💇', '#8b5cf6', 1),
    ('barba', 'Barba', 'Productos para el cuidado de la barba', '🧔', '#f59e0b', 2),
    ('merch', 'Merch', 'Merchandising y accesorios', '🎁', '#10b981', 3)
ON CONFLICT (slug) DO NOTHING;

-- Products - Cabello
INSERT INTO public.products (name, description, category, category_id, image_url) VALUES
    ('Shampoo Barba Premium', 'Shampoo limpiador profundo para barba', 'cabello', (SELECT id FROM product_categories WHERE slug = 'cabello'), null),
    ('Acondicionador Barba', 'Acondicionador suavizante para barba', 'cabello', (SELECT id FROM product_categories WHERE slug = 'cabello'), null),
    ('Cera Modeladora', 'Cera para peinar y fijar', 'cabello', (SELECT id FROM product_categories WHERE slug = 'cabello'), null),
    ('Pomada Barba', 'Pomada nutritiva para barba', 'cabello', (SELECT id FROM product_categories WHERE slug = 'cabello'), null),
    ('Aceite Barba Premium', 'Aceite hidratante con aroma a menta', 'cabello', (SELECT id FROM product_categories WHERE slug = 'cabello'), null),
    ('Gel Fijo Extra', 'Gel fijador de larga duración', 'cabello', (SELECT id FROM product_categories WHERE slug = 'cabello'), null)
ON CONFLICT DO NOTHING;

-- Products - Barba
INSERT INTO public.products (name, description, category, category_id, image_url) VALUES
    ('Bálsamo After Shave', 'Bálsamo calmante pós afeitado', 'barba', (SELECT id FROM product_categories WHERE slug = 'barba'), null),
    ('Crema Barba', 'Crema de afeitar cremosa', 'barba', (SELECT id FROM product_categories WHERE slug = 'barba'), null),
    ('Jabón Barba', 'Jabón natural para barba', 'barba', (SELECT id FROM product_categories WHERE slug = 'barba'), null),
    ('Peine Barba', 'Peine de barba profesional', 'barba', (SELECT id FROM product_categories WHERE slug = 'barba'), null),
    ('Tijeras Barba', 'Tijeras de precisión', 'barba', (SELECT id FROM product_categories WHERE slug = 'barba'), null)
ON CONFLICT DO NOTHING;

-- Products - Merch
INSERT INTO public.products (name, description, category, category_id, image_url) VALUES
    ('Remera Mr Blonde', 'Remera negra logo Mr Blonde', 'merch', (SELECT id FROM product_categories WHERE slug = 'merch'), null),
    ('Gorra Mr Blonde', 'Gorra trucker logo Mr Blonde', 'merch', (SELECT id FROM product_categories WHERE slug = 'merch'), null),
    ('Delantal Barbero', 'Delantal de cuero sintético', 'merch', (SELECT id FROM product_categories WHERE slug = 'merch'), null),
    ('Cepillo Barba', 'Cepillo de badger natural', 'merch', (SELECT id FROM product_categories WHERE slug = 'merch'), null),
    ('Bolsa Barbero', 'Bolsa de transporte', 'merch', (SELECT id FROM product_categories WHERE slug = 'merch'), null)
ON CONFLICT DO NOTHING;

-- Price Lists
INSERT INTO public.price_lists (name, prices_include_vat) VALUES
    ('Lista Barbería', true),
    ('Lista Distribuidor', true),
    ('Lista Especial', false)
ON CONFLICT (name) DO NOTHING;

-- Price List Items (sample prices)
INSERT INTO public.price_list_items (price_list_id, product_id, price, volume_price)
SELECT 
    pl.id,
    p.id,
    CASE 
        WHEN pl.name = 'Lista Barbería' THEN 2500
        WHEN pl.name = 'Lista Distribuidor' THEN 1800
        ELSE 2200
    END,
    CASE 
        WHEN pl.name = 'Lista Barbería' THEN 2200
        WHEN pl.name = 'Lista Distribuidor' THEN 1500
        ELSE 1900
    END
FROM public.price_lists pl
CROSS JOIN public.products p
ON CONFLICT (price_list_id, product_id) DO NOTHING;

-- Promotions
INSERT INTO public.promotions (name, description, rules, application_scope) VALUES
    ('Descuento 10% Volumen', '10% descuento por compra mayor a 5 unidades', '{"type":"min_amount_discount","min_amount":5,"percentage":10}', '{"type":"all"}'),
    ('Envío Gratis', 'Envío gratis en pedidos mayores a $15000', '{"type":"free_shipping","min_units":15000}', '{"type":"all"}')
ON CONFLICT DO NOTHING;

-- Sales Conditions
INSERT INTO public.sales_conditions (name, description, rules) VALUES
    ('Contado', 'Pago al contado', '{"type":"cash_on_delivery"}'),
    ('7 Días', 'Net 7 días', '{"type":"net_days","net_days":7}'),
    ('Cuotas 3', 'Pago en 3 cuotas', '{"type":"installments","installments":{"installments":3}}')
ON CONFLICT DO NOTHING;

-- Agreements
INSERT INTO public.agreements (agreement_name, client_type, price_list_id) VALUES
    ('Convenio Barbería Standard', 'barberia', (SELECT id FROM price_lists WHERE name = 'Lista Barbería')),
    ('Convenio Distribuidor', 'distribuidor', (SELECT id FROM price_lists WHERE name = 'Lista Distribuidor')),
    ('Convenio Especial', 'especial', (SELECT id FROM price_lists WHERE name = 'Lista Especial'))
ON CONFLICT (agreement_name) DO NOTHING;

-- Sample Client
INSERT INTO public.clients (
    contact_name,
    email,
    phone,
    address,
    status,
    agreement_id
) VALUES
    ('Barbería Central',
    'central@barberia.com',
    '+5491134567890',
    'Av. Córdoba 1234, CABA',
    'active',
    (SELECT id FROM agreements WHERE agreement_name = 'Convenio Barbería Standard'))
ON CONFLICT (email) DO NOTHING;

-- Sample clients
INSERT INTO public.clients (contact_name, email, phone, address, status, agreement_id)
VALUES
    ('Juan Pérez', 'juan@barberia.com', '+5491112345678', 'Calle Falsa 123', 'active', (SELECT id FROM agreements WHERE agreement_name = 'Convenio Barbería Standard')),
    ('Pedro Gómez', 'pedro@distri.com', '+5491187654321', 'Av. Libertador 456', 'active', (SELECT id FROM agreements WHERE agreement_name = 'Convenio Distribuidor')),
    ('María López', 'maria@especial.com', '+5491199999999', 'Direcc 789', 'pending_agreement', null)
ON CONFLICT (email) DO NOTHING;

-- App Settings
INSERT INTO public.app_settings (key, value) VALUES
    ('whatsapp_number', '"+5491166666666"'),
    ('vat_percentage', '21'),
    ('enable_stock_management', 'true'),
    ('logo_url', null)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 8. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_client ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_product_categories_slug ON public.product_categories(slug);
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON public.product_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_promotions_application_scope ON public.promotions USING GIN (application_scope);

-- ============================================
-- 9. CONFIRMATION
-- ============================================
DO $$
DECLARE
    cat_count INTEGER;
    prod_count INTEGER;
    client_count INTEGER;
BEGIN
    SELECT count(*) INTO cat_count FROM product_categories;
    SELECT count(*) INTO prod_count FROM products;
    SELECT count(*) INTO client_count FROM clients;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Mr. Blonde DB initialized successfully!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Categories: %', cat_count;
    RAISE NOTICE 'Products: %', prod_count;
    RAISE NOTICE 'Clients: %', client_count;
    RAISE NOTICE '============================================';
END $$;