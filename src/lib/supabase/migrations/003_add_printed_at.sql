-- Migration: Add printed_at column to orders table
-- Run this in Supabase SQL Editor

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS printed_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_orders_printed_at ON public.orders(printed_at);
