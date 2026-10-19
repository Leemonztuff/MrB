-- Índices para las consultas más frecuentes de la app.
-- Postgres no indexa las foreign keys automáticamente, y las columnas de filtro
-- (status, created_at) se usan en dashboards, listados y notificaciones.
-- Idempotente: se puede correr varias veces.

-- orders
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_agreement_id ON public.orders(agreement_id);

-- order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- clients
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_agreement_id ON public.clients(agreement_id);
CREATE INDEX IF NOT EXISTS idx_clients_onboarding_token ON public.clients(onboarding_token);

-- agreements
CREATE INDEX IF NOT EXISTS idx_agreements_price_list_id ON public.agreements(price_list_id);

-- tablas de unión: aceleran los borrados en cascada
CREATE INDEX IF NOT EXISTS idx_agreement_promotions_promotion_id ON public.agreement_promotions(promotion_id);
CREATE INDEX IF NOT EXISTS idx_agreement_sales_conditions_sales_condition_id ON public.agreement_sales_conditions(sales_condition_id);
