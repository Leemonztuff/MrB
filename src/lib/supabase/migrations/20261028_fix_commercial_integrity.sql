-- ============================================================================
-- MIGRACIÓN: integridad comercial de pedidos y convenios
-- ============================================================================
-- Aplicar sobre una base existente antes de desplegar este cambio de código.
-- No elimina datos.
--
-- Cambios:
-- 1) create_order_with_items usa el umbral de volumen configurado en
--    app_settings en lugar de 150 fijo.
-- 2) Rechaza totales inválidos (nulos, NaN, negativos o con más de 2 decimales).
-- 3) Restringe la ejecución del RPC a service_role.
-- 4) Impide eliminar convenios que todavía tienen clientes asignados.
--
-- Riesgo operativo: los convenios con clientes ya no se podrán borrar hasta
-- reasignar esos clientes. Es intencional para evitar clientes activos sin
-- convenio y pedidos sin lista de precios.
-- ============================================================================

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
    v_volume_threshold integer := 150;
BEGIN
    IF p_total_amount IS NULL
       OR p_total_amount::text = 'NaN'
       OR p_total_amount < 0
       OR p_total_amount <> round(p_total_amount, 2) THEN
        RAISE EXCEPTION 'Total del pedido inválido.';
    END IF;

    SELECT CASE
        WHEN value #>> '{}' ~ '^[0-9]+$' THEN (value #>> '{}')::integer
        ELSE 150
    END
    INTO v_volume_threshold
    FROM public.app_settings
    WHERE key = 'volume_threshold';

    IF v_volume_threshold IS NULL OR v_volume_threshold <= 0 THEN
        v_volume_threshold := 150;
    END IF;

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

        IF v_unit_price IS NULL OR v_unit_price::text = 'NaN' THEN
            RAISE EXCEPTION 'Precio inválido en el pedido.';
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
            IF v_unit_price < 0 THEN
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
    v_volume_active := v_total_items >= v_volume_threshold;

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

REVOKE ALL ON FUNCTION public.create_order_with_items(uuid, uuid, public.payment_type, text, text, numeric, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(uuid, uuid, public.payment_type, text, text, numeric, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.prevent_agreement_delete_with_clients()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.clients WHERE agreement_id = OLD.id
    ) THEN
        RAISE EXCEPTION 'No se puede eliminar un convenio con clientes asignados.';
    END IF;

    RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_agreement_delete_with_clients() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS prevent_agreement_delete_with_clients ON public.agreements;
CREATE TRIGGER prevent_agreement_delete_with_clients
BEFORE DELETE ON public.agreements
FOR EACH ROW EXECUTE FUNCTION public.prevent_agreement_delete_with_clients();
