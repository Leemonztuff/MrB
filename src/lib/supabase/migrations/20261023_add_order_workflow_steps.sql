-- Agrega hitos operativos sin modificar ni eliminar pedidos existentes.
-- Los pedidos pendientes previos quedan sin confirmar y requieren validación manual.
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS whatsapp_confirmed_at timestamp with time zone,
    ADD COLUMN IF NOT EXISTS prepared_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_orders_whatsapp_pending
    ON public.orders(created_at DESC)
    WHERE status = 'armado' AND whatsapp_confirmed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_preparation_pending
    ON public.orders(created_at DESC)
    WHERE status = 'armado' AND whatsapp_confirmed_at IS NOT NULL AND prepared_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_label_pending
    ON public.orders(created_at DESC)
    WHERE status = 'armado' AND prepared_at IS NOT NULL AND printed_at IS NULL;

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

DROP TRIGGER IF EXISTS orders_dispatch_prerequisites ON public.orders;
CREATE TRIGGER orders_dispatch_prerequisites
    BEFORE INSERT OR UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_order_dispatch_prerequisites();
