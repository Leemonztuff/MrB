-- Migration: Add consumidor_final to client_type enum
-- Run this in Supabase SQL Editor

ALTER TYPE public.client_type ADD VALUE IF NOT EXISTS 'consumidor_final';
