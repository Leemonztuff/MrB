CREATE TABLE IF NOT EXISTS public.operator_access_pins (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    pin_hash text NOT NULL,
    pin_salt text NOT NULL,
    failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
    locked_until timestamp with time zone,
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.operator_access_pins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.operator_access_pins FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.operator_access_pins TO service_role;

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

REVOKE ALL ON FUNCTION public.record_operator_pin_attempt(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_operator_pin_attempt(uuid, boolean) TO service_role;
