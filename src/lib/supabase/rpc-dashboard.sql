-- Dashboard Metrics RPC Function
-- Optimiza las métricas del dashboard en una sola consulta

-- Drop existing functions first (required for return type changes)
DROP FUNCTION IF EXISTS get_dashboard_metrics();
DROP FUNCTION IF EXISTS get_order_status_counts();
DROP FUNCTION IF EXISTS get_notification_counts();

-- Function 1: Get all dashboard metrics in one query
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    m_start_of_month TIMESTAMP;
BEGIN
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

-- Function 2: Get order status counts
CREATE OR REPLACE FUNCTION get_order_status_counts()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    result := jsonb_build_object(
        'armado', (SELECT COUNT(*)::int FROM orders WHERE status = 'armado'),
        'transito', (SELECT COUNT(*)::int FROM orders WHERE status = 'transito'),
        'entregado', (SELECT COUNT(*)::int FROM orders WHERE status = 'entregado')
    );
    RETURN result;
END;
$$;

-- Function 3: Get notification counts
CREATE OR REPLACE FUNCTION get_notification_counts()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    m_two_days_ago TIMESTAMP;
    m_start_of_month TIMESTAMP;
BEGIN
    m_two_days_ago := NOW() - INTERVAL '2 days';
    m_start_of_month := date_trunc('month', CURRENT_DATE);

    result := jsonb_build_object(
        'pending_orders_count', (SELECT COUNT(*)::int FROM orders WHERE status = 'armado'),
        'pending_clients_count', (SELECT COUNT(*)::int FROM clients WHERE status = 'pending_agreement'),
        'overdue_orders_count', (SELECT COUNT(*)::int FROM orders WHERE status = 'armado' AND created_at < m_two_days_ago),
        'new_clients_this_month', (SELECT COUNT(*)::int FROM clients WHERE created_at >= m_start_of_month)
    );
    RETURN result;
END;
$$;