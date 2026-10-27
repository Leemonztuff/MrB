
-- MR. BLONDE - FULL SCHEMA RESET SCRIPT
-- DESTRUCTIVE: drops and recreates application tables and types.
-- Use only for a new/empty database or an explicitly approved reset.

-- 1. CLEANUP
DROP VIEW IF EXISTS public.agreements_with_counts CASCADE;
DROP VIEW IF EXISTS public.dashboard_stats CASCADE;
DROP FUNCTION IF EXISTS public.get_notification_counts() CASCADE;
DROP FUNCTION IF EXISTS public.get_client_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_dashboard_metrics() CASCADE;
DROP FUNCTION IF EXISTS public.get_order_status_counts() CASCADE;
DROP FUNCTION IF EXISTS public.increment_total_revenue(double precision) CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.operator_access_pins CASCADE;
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
-- Tablas legacy (no las usa la app; se mantienen para reflejar la DB productiva)
DROP TABLE IF EXISTS public.news_likes CASCADE;
DROP TABLE IF EXISTS public.news CASCADE;
DROP TABLE IF EXISTS public.price_list_item_promotions CASCADE;
DROP TABLE IF EXISTS public.price_list_product_promotions CASCADE;
DROP TABLE IF EXISTS public.inventory_movements CASCADE;
DROP TABLE IF EXISTS public.pending_changes CASCADE;
DROP TABLE IF EXISTS public.client_audit_log CASCADE;
DROP TABLE IF EXISTS public.product_categories CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.enforce_order_dispatch_prerequisites() CASCADE;
DROP FUNCTION IF EXISTS public.record_operator_pin_attempt(uuid, boolean) CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.client_status CASCADE;
DROP TYPE IF EXISTS public.client_type CASCADE;
DROP TYPE IF EXISTS public.payment_type CASCADE;
DROP TYPE IF EXISTS public.change_type CASCADE;
DROP TYPE IF EXISTS public.inventory_movement_type CASCADE;
DROP TYPE IF EXISTS public.movement_type CASCADE;
DROP TYPE IF EXISTS public.client_status_enum CASCADE;
DROP TYPE IF EXISTS public.client_type_enum CASCADE;
DROP TYPE IF EXISTS public.agreement_client_type_enum CASCADE;
DROP TYPE IF EXISTS public.order_status_enum CASCADE;

-- 2. TYPES
CREATE TYPE public.order_status AS ENUM ('armado', 'transito', 'entregado');
CREATE TYPE public.client_status AS ENUM ('pending_onboarding', 'pending_agreement', 'active', 'archived');
CREATE TYPE public.client_type AS ENUM ('barberia', 'distribuidor', 'especial', 'consumidor_final');
CREATE TYPE public.payment_type AS ENUM ('remito', 'proforma');

-- Tipos legacy
CREATE TYPE public.change_type AS ENUM ('contact_name', 'email', 'phone', 'cuit', 'address', 'delivery_window', 'instagram', 'contact_dni', 'fiscal_status');
CREATE TYPE public.inventory_movement_type AS ENUM ('in', 'out', 'adjustment', 'reserved');
CREATE TYPE public.movement_type AS ENUM ('in', 'out', 'adjustment', 'reserved');
-- Duplicados sin uso presentes en la DB productiva
CREATE TYPE public.client_status_enum AS ENUM ('pending_onboarding', 'pending_agreement', 'active', 'archived');
CREATE TYPE public.client_type_enum AS ENUM ('barberia', 'distribuidor', 'especial');
CREATE TYPE public.agreement_client_type_enum AS ENUM ('barberia', 'distribuidor', 'especial');
CREATE TYPE public.order_status_enum AS ENUM ('armado', 'transito', 'entregado');

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

CREATE INDEX IF NOT EXISTS idx_agreements_price_list_id ON public.agreements(price_list_id);

CREATE TABLE public.agreement_promotions (
    agreement_id uuid REFERENCES public.agreements(id) ON DELETE CASCADE,
    promotion_id uuid REFERENCES public.promotions(id) ON DELETE CASCADE,
    PRIMARY KEY (agreement_id, promotion_id)
);

CREATE INDEX IF NOT EXISTS idx_agreement_promotions_promotion_id ON public.agreement_promotions(promotion_id);

CREATE TABLE public.agreement_sales_conditions (
    agreement_id uuid REFERENCES public.agreements(id) ON DELETE CASCADE,
    sales_condition_id uuid REFERENCES public.sales_conditions(id) ON DELETE CASCADE,
    PRIMARY KEY (agreement_id, sales_condition_id)
);

CREATE INDEX IF NOT EXISTS idx_agreement_sales_conditions_sales_condition_id ON public.agreement_sales_conditions(sales_condition_id);

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
    order_token text NOT NULL DEFAULT replace(gen_random_uuid()::text, '-'::text, ''),
    agreement_id uuid REFERENCES public.agreements(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_order_token ON public.clients(order_token);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_agreement_id ON public.clients(agreement_id);
CREATE INDEX IF NOT EXISTS idx_clients_onboarding_token ON public.clients(onboarding_token);

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
    whatsapp_confirmed_at timestamp with time zone,
    prepared_at timestamp with time zone,
    delivered_at timestamp with time zone,
    customer_confirmed_at timestamp with time zone,
    payment_type public.payment_type,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_confirmation_token ON public.orders(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_orders_printed_at ON public.orders(printed_at);
CREATE INDEX IF NOT EXISTS idx_orders_whatsapp_pending
    ON public.orders(created_at DESC)
    WHERE status = 'armado' AND whatsapp_confirmed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_preparation_pending
    ON public.orders(created_at DESC)
    WHERE status = 'armado' AND whatsapp_confirmed_at IS NOT NULL AND prepared_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_label_pending
    ON public.orders(created_at DESC)
    WHERE status = 'armado' AND prepared_at IS NOT NULL AND printed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_agreement_id ON public.orders(agreement_id);

CREATE OR REPLACE FUNCTION public.enforce_order_dispatch_prerequisites()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    dispatch_transition boolean;
BEGIN
    dispatch_transition := TG_OP = 'INSERT';
    IF TG_OP = 'UPDATE' THEN
        dispatch_transition := OLD.status IS DISTINCT FROM NEW.status;
    END IF;

    IF NEW.status = 'transito' AND dispatch_transition THEN
        IF NEW.whatsapp_confirmed_at IS NULL THEN
            RAISE EXCEPTION 'Confirmá la recepción del pedido por WhatsApp antes de despachar.'
                USING ERRCODE = '23514';
        END IF;
        IF NEW.prepared_at IS NULL THEN
            RAISE EXCEPTION 'Marcá el pedido como preparado antes de despachar.'
                USING ERRCODE = '23514';
        END IF;
        IF NEW.printed_at IS NULL THEN
            RAISE EXCEPTION 'Confirmá la impresión del rótulo de envío antes de despachar.'
                USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER orders_dispatch_prerequisites
    BEFORE INSERT OR UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_order_dispatch_prerequisites();

CREATE TABLE public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    quantity integer NOT NULL DEFAULT 1,
    price_per_unit numeric NOT NULL DEFAULT 0,
    is_bonus boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

CREATE TABLE public.app_settings (
    key text PRIMARY KEY,
    value jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tablas legacy (no las usa la app). Las FK marcadas [inferida] no vienen del dump.
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

CREATE INDEX IF NOT EXISTS idx_product_categories_slug ON public.product_categories(slug);
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON public.product_categories(is_active) WHERE is_active = true;

CREATE TABLE public.news (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    content text NOT NULL,
    image_url text,
    is_active boolean NOT NULL DEFAULT true,
    display_order integer NOT NULL DEFAULT 0,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    promotion_id uuid REFERENCES public.promotions(id) ON DELETE SET NULL, -- [inferida]
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.news_likes (
    news_id uuid REFERENCES public.news(id) ON DELETE CASCADE, -- [inferida]
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE, -- [inferida]
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (news_id, client_id)
);

CREATE TABLE public.inventory_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL, -- [inferida]
    type public.inventory_movement_type NOT NULL,
    quantity integer NOT NULL DEFAULT 0,
    reason text,
    reference_id uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid
);

CREATE TABLE public.pending_changes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE, -- [inferida]
    change_type public.change_type NOT NULL,
    old_value text,
    new_value text,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at timestamp with time zone,
    resolved_by uuid
);

CREATE TABLE public.client_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE, -- [inferida]
    event_type text NOT NULL,
    description text NOT NULL,
    metadata jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_client_audit_log_client_id ON public.client_audit_log(client_id, created_at DESC);

CREATE TABLE public.operator_access_pins (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    pin_hash text NOT NULL,
    pin_salt text NOT NULL,
    failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
    locked_until timestamp with time zone,
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.record_operator_pin_attempt(
    p_user_id uuid,
    p_is_valid boolean
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    pin_record public.operator_access_pins%ROWTYPE;
    next_attempt integer;
BEGIN
    SELECT * INTO pin_record
    FROM public.operator_access_pins
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN 'missing';
    END IF;

    IF pin_record.locked_until > now() THEN
        RETURN 'locked';
    END IF;

    IF pin_record.locked_until IS NOT NULL THEN
        UPDATE public.operator_access_pins
        SET failed_attempts = 0, locked_until = NULL
        WHERE user_id = p_user_id;
        pin_record.failed_attempts := 0;
    END IF;

    IF p_is_valid THEN
        UPDATE public.operator_access_pins
        SET failed_attempts = 0, locked_until = NULL
        WHERE user_id = p_user_id;
        RETURN 'accepted';
    END IF;

    next_attempt := pin_record.failed_attempts + 1;
    IF next_attempt >= 5 THEN
        UPDATE public.operator_access_pins
        SET failed_attempts = 0, locked_until = now() + interval '15 minutes'
        WHERE user_id = p_user_id;
        RETURN 'locked';
    END IF;

    UPDATE public.operator_access_pins
    SET failed_attempts = next_attempt
    WHERE user_id = p_user_id;
    RETURN 'invalid';
END;
$$;

ALTER TABLE public.operator_access_pins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.operator_access_pins FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.operator_access_pins TO service_role;
REVOKE ALL ON FUNCTION public.record_operator_pin_attempt(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_operator_pin_attempt(uuid, boolean) TO service_role;

-- Legacy single-promotion mapping; the app uses price_list_item_promotions.
CREATE TABLE public.price_list_product_promotions (
    price_list_id uuid REFERENCES public.price_lists(id) ON DELETE CASCADE, -- [inferida]
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE, -- [inferida]
    promotion_id uuid REFERENCES public.promotions(id) ON DELETE SET NULL, -- [inferida]
    PRIMARY KEY (price_list_id, product_id)
);

CREATE TABLE public.price_list_item_promotions (
    price_list_id uuid NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
    PRIMARY KEY (price_list_id, product_id, promotion_id),
    FOREIGN KEY (price_list_id, product_id)
        REFERENCES public.price_list_items(price_list_id, product_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_price_list_item_promotions_promotion_id
    ON public.price_list_item_promotions(promotion_id);

-- 4. VIEWS
CREATE OR REPLACE VIEW public.agreements_with_counts AS
SELECT 
    a.*,
    (SELECT count(*) FROM public.agreement_promotions ap WHERE ap.agreement_id = a.id) as promotion_count,
    (SELECT count(*) FROM public.agreement_sales_conditions asc_t WHERE asc_t.agreement_id = a.id) as sales_condition_count
FROM public.agreements a;

CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT
    CASE WHEN (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
      THEN (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders) ELSE 0 END as total_revenue,
    CASE WHEN (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
      THEN (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE created_at >= date_trunc('month', now())) ELSE 0 END as month_revenue,
    CASE WHEN (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
      THEN (SELECT count(*) FROM public.clients WHERE status = 'active') ELSE 0 END as active_clients,
    CASE WHEN (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
      THEN (SELECT count(*) FROM public.orders WHERE status = 'armado' AND created_at < now() - interval '48 hours') ELSE 0 END as overdue_orders_count,
    CASE WHEN (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
      THEN (SELECT count(*) FROM public.clients) ELSE 0 END as total_clients,
    CASE WHEN (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
      THEN (SELECT count(*) FROM public.price_lists) ELSE 0 END as total_pricelists,
    CASE WHEN (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
      THEN (SELECT count(*) FROM public.promotions) ELSE 0 END as total_promotions,
    CASE WHEN (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
      THEN (SELECT count(*) FROM public.sales_conditions) ELSE 0 END as total_sales_conditions,
    CASE WHEN (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
      THEN (SELECT count(*) FROM public.orders WHERE status = 'armado') ELSE 0 END as pending_orders_count;

CREATE OR REPLACE FUNCTION public.get_dashboard_period_metrics(p_period_days integer)
RETURNS TABLE (
    current_order_amount numeric,
    previous_order_amount numeric,
    current_order_count bigint,
    previous_order_count bigint,
    current_client_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    period_end timestamptz := now();
    period_start timestamptz;
    previous_start timestamptz;
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'super_admin' THEN
        RAISE EXCEPTION 'No tienes permisos para consultar métricas comerciales.';
    END IF;
    IF p_period_days NOT IN (7, 30, 90) THEN
        RAISE EXCEPTION 'El período debe ser de 7, 30 o 90 días.';
    END IF;

    period_start := period_end - make_interval(days => p_period_days);
    previous_start := period_start - make_interval(days => p_period_days);

    RETURN QUERY
    SELECT
        COALESCE(SUM(o.total_amount) FILTER (
            WHERE o.created_at >= period_start AND o.created_at < period_end
        ), 0)::numeric,
        COALESCE(SUM(o.total_amount) FILTER (
            WHERE o.created_at >= previous_start AND o.created_at < period_start
        ), 0)::numeric,
        COUNT(*) FILTER (
            WHERE o.created_at >= period_start AND o.created_at < period_end
        ),
        COUNT(*) FILTER (
            WHERE o.created_at >= previous_start AND o.created_at < period_start
        ),
        COUNT(DISTINCT o.client_id) FILTER (
            WHERE o.created_at >= period_start
              AND o.created_at < period_end
              AND o.client_id IS NOT NULL
        )
    FROM public.orders o
    WHERE o.created_at >= previous_start
      AND o.created_at < period_end;
END;
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_period_metrics(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dashboard_period_metrics(integer) TO authenticated;

-- 5. FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_notification_counts()
RETURNS json AS $$
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'super_admin' THEN
        RAISE EXCEPTION 'No tienes permisos para consultar las notificaciones administrativas.';
    END IF;
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
    IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'super_admin' THEN
        RAISE EXCEPTION 'No tienes permisos para consultar estadísticas de clientes.';
    END IF;
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

-- Funciones legacy (no usadas por la app)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_order_status_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'super_admin' THEN
        RAISE EXCEPTION 'No tienes permisos para consultar estadísticas de pedidos.';
    END IF;
    result := jsonb_build_object(
        'armado', (SELECT COUNT(*)::int FROM orders WHERE status = 'armado'),
        'transito', (SELECT COUNT(*)::int FROM orders WHERE status = 'transito'),
        'entregado', (SELECT COUNT(*)::int FROM orders WHERE status = 'entregado')
    );
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    m_start_of_month TIMESTAMP;
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'super_admin' THEN
        RAISE EXCEPTION 'No tienes permisos para consultar métricas administrativas.';
    END IF;
    m_start_of_month := date_trunc('month', CURRENT_DATE);

    result := jsonb_build_object(
        'orders', jsonb_build_object(
            'pending', (SELECT COUNT(*)::int FROM orders WHERE status = 'armado'),
            'in_transit', (SELECT COUNT(*)::int FROM orders WHERE status = 'transito'),
            'delivered', (SELECT COUNT(*)::int FROM orders WHERE status = 'entregado'),
            'total_units', COALESCE((SELECT SUM(quantity)::int FROM order_items), 0),
            'average_order_value', COALESCE((SELECT ROUND(AVG(total_amount))::int FROM orders), 0)
        ),
        'clients', jsonb_build_object(
            'active', (SELECT COUNT(*)::int FROM clients WHERE status = 'active'),
            'pending', (SELECT COUNT(*)::int FROM clients WHERE status = 'pending_agreement'),
            'new_this_month', (SELECT COUNT(*)::int FROM clients WHERE created_at >= m_start_of_month)
        ),
        'top_products', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object('name', name, 'total_quantity', total_quantity)), '[]'::jsonb)
            FROM (
                SELECT p.name, SUM(oi.quantity)::int as total_quantity
                FROM order_items oi
                JOIN products p ON p.id = oi.product_id
                GROUP BY p.id, p.name
                ORDER BY total_quantity DESC
                LIMIT 5
            ) t
        )
    );

    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_total_revenue(amount_to_add double precision)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Stub sin efecto: las estadísticas se calculan en vivo con la vista dashboard_stats.
END;
$$;
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

CREATE POLICY "Super admins full access" ON public.products
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admins full access" ON public.price_lists
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admins full access" ON public.price_list_items
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admins full access" ON public.promotions
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admins full access" ON public.sales_conditions
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admins full access" ON public.agreements
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admins full access" ON public.agreement_promotions
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admins full access" ON public.agreement_sales_conditions
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admins full access" ON public.clients
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admins full access" ON public.orders
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admins full access" ON public.order_items
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admins full access" ON public.app_settings
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

-- RLS de tablas legacy. En la DB productiva news/inventory_movements/product_categories
-- tenían policy abierta (public, using=true) => corregido a solo authenticated.
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_list_product_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_list_item_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins full access" ON public.product_categories
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');
CREATE POLICY "Super admins full access" ON public.news
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');
CREATE POLICY "Super admins full access" ON public.inventory_movements
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');
CREATE POLICY "Super admins full access" ON public.client_audit_log
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admins full access" ON public.price_list_item_promotions
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_list_item_promotions TO authenticated;


-- 8. INITIAL SETTINGS
INSERT INTO public.app_settings (key, value) VALUES ('vat_percentage', '21'::jsonb) ON CONFLICT (key) DO NOTHING;
INSERT INTO public.app_settings (key, value) VALUES ('whatsapp_number', '"5491144276120"'::jsonb) ON CONFLICT (key) DO NOTHING;
INSERT INTO public.app_settings (key, value) VALUES ('volume_threshold', '150'::jsonb) ON CONFLICT (key) DO NOTHING;
