-- Add application_scope column to promotions table
-- This allows promotions to have a default scope (all, category, products)

ALTER TABLE public.promotions 
ADD COLUMN IF NOT EXISTS application_scope jsonb DEFAULT '{"type":"all"}'::jsonb;

-- Create index for faster queries on application_scope
CREATE INDEX IF NOT EXISTS idx_promotions_application_scope ON public.promotions USING GIN (application_scope);

-- Grant necessary permissions (adjust as needed for your setup)
GRANT SELECT, INSERT, UPDATE ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;

-- Log success
DO $$
BEGIN
    RAISE NOTICE 'Migration complete: application_scope column added to promotions table';
END $$;