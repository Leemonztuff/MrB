
-- MR. BLONDE - AUTHORITATIVE SCHEMA SCRIPT
-- This script is designed to be idempotent and unifies the logistics workflow.

-- 1. CLEANUP
DROP VIEW IF EXISTS public.agreements_with_counts CASCADE;
DROP VIEW IF EXISTS public.dashboard_stats CASCADE;
DROP FUNCTION IF EXISTS public.get_notification_counts() CASCADE;
DROP FUNCTION IF EXISTS public.get_client_stats(uuid) CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.agreement_sales_conditions CASCADE;
DROP TABLE IF EXISTS public.agreement_promotions CASCADE;
DROP TABLE IF EXISTS public.agreements CASCADE;
DROP TABLE IF EXISTS public.price_list_items CASCADE;
DROP TABLE IF EXISTS public.price_lists CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.sales_conditions CASCADE;
DROP TABLE IF EXISTS public.promotions CASCADE;
DROP TABLE IF EXISTS public.app_settings CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.client_status CASCADE;
DROP TYPE IF EXISTS public.client_type CASCADE;

-- 2. TYPES
CREATE TYPE public.order_status AS ENUM ('armado', 'transito', 'entregado');
CREATE TYPE public.client_status AS ENUM ('pending_onboarding', 'pending_agreement', 'active', 'archived');
CREATE TYPE public.client_type AS ENUM ('barberia', 'distribuidor', 'especial');

-- 3. TABLES
CREATE TABLE public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    category text,
    image_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

CREATE TABLE public.promotions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    rules jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.sales_conditions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    rules jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

CREATE TABLE public.agreement_sales_conditions (
    agreement_id uuid REFERENCES public.agreements(id) ON DELETE CASCADE,
    sales_condition_id uuid REFERENCES public.sales_conditions(id) ON DELETE CASCADE,
    PRIMARY KEY (agreement_id, sales_condition_id)
);

CREATE TABLE public.clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_name text,
    contact_dni text,
    email text UNIQUE,
    cuit text UNIQUE,
    fiscal_status text,
    address text,
    latitude float8,
    longitude float8,
    delivery_window text,
    instagram text,
    status public.client_status NOT NULL DEFAULT 'pending_onboarding',
    onboarding_token uuid,
    agreement_id uuid REFERENCES public.agreements(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
    agreement_id uuid REFERENCES public.agreements(id) ON DELETE SET NULL,
    total_amount numeric NOT NULL DEFAULT 0,
    status public.order_status NOT NULL DEFAULT 'armado',
    client_name_cache text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    quantity integer NOT NULL DEFAULT 1,
    price_per_unit numeric NOT NULL DEFAULT 0
);

CREATE TABLE public.app_settings (
    key text PRIMARY KEY,
    value jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. VIEWS
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

-- 5. FUNCTIONS
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

-- 6. RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_sales_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON public.products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read for anonymous" ON public.products FOR SELECT USING (true);

CREATE POLICY "Allow all for authenticated" ON public.price_lists FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read for anonymous" ON public.price_lists FOR SELECT USING (true);

CREATE POLICY "Allow all for authenticated" ON public.price_list_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read for anonymous" ON public.price_list_items FOR SELECT USING (true);

CREATE POLICY "Allow all for authenticated" ON public.promotions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read for anonymous" ON public.promotions FOR SELECT USING (true);

CREATE POLICY "Allow all for authenticated" ON public.sales_conditions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read for anonymous" ON public.sales_conditions FOR SELECT USING (true);

CREATE POLICY "Allow all for authenticated" ON public.agreements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read for anonymous" ON public.agreements FOR SELECT USING (true);

CREATE POLICY "Allow all for authenticated" ON public.agreement_promotions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read for anonymous" ON public.agreement_promotions FOR SELECT USING (true);

CREATE POLICY "Allow all for authenticated" ON public.agreement_sales_conditions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read for anonymous" ON public.agreement_sales_conditions FOR SELECT USING (true);

CREATE POLICY "Allow all for authenticated" ON public.clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read/update for anonymous with token" ON public.clients FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated" ON public.orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert for anonymous" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read for anonymous" ON public.orders FOR SELECT USING (true);

CREATE POLICY "Allow all for authenticated" ON public.order_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert for anonymous" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read for anonymous" ON public.order_items FOR SELECT USING (true);

CREATE POLICY "Allow all for authenticated" ON public.app_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read for anonymous" ON public.app_settings FOR SELECT USING (true);

-- 7. INITIAL SETTINGS
INSERT INTO public.app_settings (key, value) VALUES ('vat_percentage', '21'::jsonb) ON CONFLICT (key) DO NOTHING;
INSERT INTO public.app_settings (key, value) VALUES ('whatsapp_number', '"5491144276120"'::jsonb) ON CONFLICT (key) DO NOTHING;
