-- Token opaco por cliente para la página pública /pedido/<token>.
-- Reemplaza el uso del id (UUID) del cliente en la URL de pedidos.
-- Idempotente: se puede correr varias veces sin efectos secundarios.

ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS order_token text;

UPDATE public.clients
SET order_token = replace(gen_random_uuid()::text, '-', '')
WHERE order_token IS NULL;

ALTER TABLE public.clients
    ALTER COLUMN order_token SET DEFAULT replace(gen_random_uuid()::text, '-', '');

ALTER TABLE public.clients
    ALTER COLUMN order_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_order_token
    ON public.clients(order_token);
