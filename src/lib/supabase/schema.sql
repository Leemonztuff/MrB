
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
DROP TYPE IF EXISTS public.payment_type CASCADE;

-- 2. TYPES
CREATE TYPE public.order_status AS ENUM ('armado', 'transito', 'entregado');
CREATE TYPE public.client_status AS ENUM ('pending_onboarding', 'pending_agreement', 'active', 'archived');
CREATE TYPE public.client_type AS ENUM ('barberia', 'distribuidor', 'especial', 'consumidor_final');
CREATE TYPE public.payment_type AS ENUM ('remito', 'proforma');

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
    payment_type public.payment_type NOT NULL DEFAULT 'remito',
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
    confirmation_token uuid DEFAULT gen_random_uuid(),
    printed_at timestamp with time zone,
    payment_type public.payment_type,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_confirmation_token ON public.orders(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_orders_printed_at ON public.orders(printed_at);

CREATE TABLE public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    quantity integer NOT NULL DEFAULT 1,
    price_per_unit numeric NOT NULL DEFAULT 0,
    is_bonus boolean NOT NULL DEFAULT false
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

-- 6. ATOMIC ORDER CREATION
-- IMPORTANTE: esta definición es la que existe en la base productiva. Si se cambia,
-- hay que aplicarla con una migración y mantenerla sincronizada con el código
-- (server action submitOrder firma exactamente estos parámetros, incluido p_payment_type).
CREATE OR REPLACE FUNCTION public.create_order_with_items(
    p_client_id uuid,
    p_agreement_id uuid,
    p_payment_type public.payment_type,
    p_client_name_cache text,
    p_notes text,
    p_total_amount numeric,
    p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_price_list_id uuid;
    v_total_items numeric := 0;
    v_volume_active boolean;
    v_order_id uuid;
    v_item jsonb;
    v_product_id uuid;
    v_quantity integer;
    v_unit_price numeric;
    v_is_bonus boolean;
    v_db_price numeric;
    v_db_volume numeric;
    v_order jsonb;
BEGIN
    -- 1) Cliente + convenio deben existir y coincidir entre sí.
    SELECT a.price_list_id INTO v_price_list_id
    FROM public.clients c
    JOIN public.agreements a ON a.id = c.agreement_id
    WHERE c.id = p_client_id AND c.agreement_id = p_agreement_id
    LIMIT 1;

    IF v_price_list_id IS NULL THEN
        RAISE EXCEPTION 'Cliente o convenio inválido.';
    END IF;

    -- 2) Validar estructura de items y acumular unidades pagas.
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_quantity := (v_item->>'quantity')::integer;
        v_is_bonus := COALESCE((v_item->>'is_bonus')::boolean, false);
        v_unit_price := (v_item->>'price_per_unit')::numeric;

        IF v_product_id IS NULL OR v_quantity IS NULL OR v_quantity <= 0 THEN
            RAISE EXCEPTION 'Producto o cantidad inválida en el pedido.';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM public.price_list_items
            WHERE price_list_id = v_price_list_id AND product_id = v_product_id
        ) THEN
            RAISE EXCEPTION 'Producto no disponible en la lista del convenio.';
        END IF;

        IF v_is_bonus THEN
            IF v_unit_price <> 0 THEN
                RAISE EXCEPTION 'Las líneas de bonificación deben tener precio 0.';
            END IF;
        ELSE
            IF v_unit_price IS NULL OR v_unit_price < 0 THEN
                RAISE EXCEPTION 'Precio inválido en el pedido.';
            END IF;
            v_total_items := v_total_items + v_quantity;
        END IF;
    END LOOP;

    IF v_total_items <= 0 THEN
        RAISE EXCEPTION 'El pedido no tiene unidades pagas.';
    END IF;

    -- 3) Re-computar el precio efectivo de cada línea paga contra la lista
    --    (mismo criterio que el cliente: umbral de volumen por unidades totales).
    v_volume_active := v_total_items >= 150;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        IF COALESCE((v_item->>'is_bonus')::boolean, false) THEN
            CONTINUE;
        END IF;

        v_product_id := (v_item->>'product_id')::uuid;
        v_unit_price := (v_item->>'price_per_unit')::numeric;

        SELECT price, volume_price INTO v_db_price, v_db_volume
        FROM public.price_list_items
        WHERE price_list_id = v_price_list_id AND product_id = v_product_id;

        IF v_db_volume IS NOT NULL AND v_db_volume > 0
           AND v_db_volume < v_db_price AND v_volume_active THEN
            v_db_price := v_db_volume;
        END IF;

        IF abs(COALESCE(v_unit_price, -1) - v_db_price) > 0.01 THEN
            RAISE EXCEPTION 'El precio del pedido no coincide con la lista del convenio.';
        END IF;
    END LOOP;

    -- 4) Insertar orden + items de forma atómica.
    INSERT INTO public.orders (
        client_id, agreement_id, payment_type, total_amount, status,
        client_name_cache, notes
    ) VALUES (
        p_client_id, p_agreement_id, p_payment_type, p_total_amount, 'armado',
        p_client_name_cache, NULLIF(p_notes, '')
    )
    RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_per_unit, is_bonus)
        VALUES (
            v_order_id,
            (v_item->>'product_id')::uuid,
            (v_item->>'quantity')::integer,
            (v_item->>'price_per_unit')::numeric,
            COALESCE((v_item->>'is_bonus')::boolean, false)
        );
    END LOOP;

    SELECT to_jsonb(o.*) INTO v_order FROM public.orders o WHERE o.id = v_order_id;
    RETURN v_order;
END;
$$;

-- 7. RLS (Row Level Security)
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

-- NOTE: no hay policies para `anon`. Los flujos públicos (/pedido, /onboarding,
-- /pedido/confirmar) corren del lado del servidor con el cliente service_role,
-- que bypassa RLS. El rol `anon` no tiene acceso a ninguna tabla.

CREATE POLICY "Allow all for authenticated" ON public.products FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated" ON public.price_lists FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated" ON public.price_list_items FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated" ON public.promotions FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated" ON public.sales_conditions FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated" ON public.agreements FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated" ON public.agreement_promotions FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated" ON public.agreement_sales_conditions FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated" ON public.clients FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated" ON public.orders FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated" ON public.order_items FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated" ON public.app_settings FOR ALL USING (auth.role() = 'authenticated');


-- 8. INITIAL SETTINGS
INSERT INTO public.app_settings (key, value) VALUES ('vat_percentage', '21'::jsonb) ON CONFLICT (key) DO NOTHING;
INSERT INTO public.app_settings (key, value) VALUES ('whatsapp_number', '"5491144276120"'::jsonb) ON CONFLICT (key) DO NOTHING;
INSERT INTO public.app_settings (key, value) VALUES ('volume_threshold', '150'::jsonb) ON CONFLICT (key) DO NOTHING;
