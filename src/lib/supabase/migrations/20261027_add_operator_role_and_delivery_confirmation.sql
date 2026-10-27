-- Registra si la entrega la confirmó el equipo o el cliente, sin perder la
-- confirmación por QR cuando el operario marca primero el pedido como entregado.
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone,
    ADD COLUMN IF NOT EXISTS customer_confirmed_at timestamp with time zone;

-- Reemplaza el acceso genérico a usuarios autenticados por permisos por rol.
DO $$
DECLARE
    table_name text;
    policy_record record;
    protected_tables text[] := ARRAY[
        'products',
        'price_lists',
        'price_list_items',
        'promotions',
        'sales_conditions',
        'agreements',
        'agreement_promotions',
        'agreement_sales_conditions',
        'clients',
        'orders',
        'order_items',
        'app_settings',
        'product_categories',
        'news',
        'news_likes',
        'inventory_movements',
        'client_audit_log',
        'pending_changes'
    ];
BEGIN
    FOREACH table_name IN ARRAY protected_tables LOOP
        IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
            FOR policy_record IN
                SELECT policyname
                FROM pg_policies
                WHERE schemaname = 'public' AND tablename = table_name
            LOOP
                EXECUTE format('DROP POLICY %I ON public.%I', policy_record.policyname, table_name);
            END LOOP;
            EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR ALL USING ((auth.jwt() -> ''app_metadata'' ->> ''role'') = ''super_admin'') WITH CHECK ((auth.jwt() -> ''app_metadata'' ->> ''role'') = ''super_admin'')',
                'Super admins full access',
                table_name
            );
        END IF;
    END LOOP;
END;
$$;

DO $$
DECLARE
    policy_record record;
BEGIN
    IF to_regclass('public.price_list_item_promotions') IS NOT NULL THEN
        ALTER TABLE public.price_list_item_promotions ENABLE ROW LEVEL SECURITY;
        FOR policy_record IN
            SELECT policyname
            FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'price_list_item_promotions'
        LOOP
            EXECUTE format('DROP POLICY %I ON public.price_list_item_promotions', policy_record.policyname);
        END LOOP;
        CREATE POLICY "Super admins full access" ON public.price_list_item_promotions
            FOR ALL
            USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
            WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');
    END IF;
    IF to_regclass('public.price_list_product_promotions') IS NOT NULL THEN
        ALTER TABLE public.price_list_product_promotions ENABLE ROW LEVEL SECURITY;
        FOR policy_record IN
            SELECT policyname
            FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'price_list_product_promotions'
        LOOP
            EXECUTE format('DROP POLICY %I ON public.price_list_product_promotions', policy_record.policyname);
        END LOOP;
        CREATE POLICY "Super admins full access" ON public.price_list_product_promotions
            FOR ALL
            USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
            WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');
    END IF;
END;
$$;

DROP POLICY IF EXISTS "Operators read orders" ON public.orders;
DROP POLICY IF EXISTS "Operators read order items" ON public.order_items;
DROP POLICY IF EXISTS "Operators read assigned products" ON public.products;
DROP POLICY IF EXISTS "Operators read delivery clients" ON public.clients;

-- Los operarios consultan datos operativos únicamente mediante acciones de
-- servidor autorizadas; el acceso directo a tablas queda reservado al admin.
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

CREATE OR REPLACE FUNCTION public.get_notification_counts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

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

CREATE OR REPLACE FUNCTION public.get_client_stats(p_client_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.get_order_status_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'super_admin' THEN
        RAISE EXCEPTION 'No tienes permisos para consultar estadísticas de pedidos.';
    END IF;
    RETURN jsonb_build_object(
        'armado', (SELECT COUNT(*)::int FROM public.orders WHERE status = 'armado'),
        'transito', (SELECT COUNT(*)::int FROM public.orders WHERE status = 'transito'),
        'entregado', (SELECT COUNT(*)::int FROM public.orders WHERE status = 'entregado')
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
    month_start timestamp;
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'super_admin' THEN
        RAISE EXCEPTION 'No tienes permisos para consultar métricas administrativas.';
    END IF;
    month_start := date_trunc('month', CURRENT_DATE);

    result := jsonb_build_object(
        'orders', jsonb_build_object(
            'pending', (SELECT COUNT(*)::int FROM public.orders WHERE status = 'armado'),
            'in_transit', (SELECT COUNT(*)::int FROM public.orders WHERE status = 'transito'),
            'delivered', (SELECT COUNT(*)::int FROM public.orders WHERE status = 'entregado'),
            'total_units', COALESCE((SELECT SUM(quantity)::int FROM public.order_items), 0),
            'average_order_value', COALESCE((SELECT ROUND(AVG(total_amount))::int FROM public.orders), 0)
        ),
        'clients', jsonb_build_object(
            'active', (SELECT COUNT(*)::int FROM public.clients WHERE status = 'active'),
            'pending', (SELECT COUNT(*)::int FROM public.clients WHERE status = 'pending_agreement'),
            'new_this_month', (SELECT COUNT(*)::int FROM public.clients WHERE created_at >= month_start)
        ),
        'top_products', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object('name', name, 'total_quantity', total_quantity)), '[]'::jsonb)
            FROM (
                SELECT p.name, SUM(oi.quantity)::int as total_quantity
                FROM public.order_items oi
                JOIN public.products p ON p.id = oi.product_id
                GROUP BY p.id, p.name
                ORDER BY total_quantity DESC
                LIMIT 5
            ) ranked_products
        )
    );
    RETURN result;
END;
$$;
