-- SQL Migration: Inventory Movements Table
-- Run this in your Supabase SQL Editor

CREATE TYPE movement_type AS ENUM ('in', 'out', 'adjustment', 'reserved');

CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type movement_type NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    reason TEXT,
    reference_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(type);

-- Enable RLS
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users (admin) can do everything
CREATE POLICY "Admins can manage movements" ON inventory_movements
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Enable real-time (optional but recommended for stock updates)
-- ALTER PUBLICATION supabase_realtime ADD TABLE inventory_movements;
