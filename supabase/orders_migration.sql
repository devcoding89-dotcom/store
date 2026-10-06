-- Run this migration in Supabase SQL Editor before deploying the updated server.
-- These operational fields let checkout, admin, delivery, and tracking share one durable order record.
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_id TEXT,
ADD COLUMN IF NOT EXISTS product_id TEXT,
ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS vendor_name TEXT,
ADD COLUMN IF NOT EXISTS vendor_phone TEXT,
ADD COLUMN IF NOT EXISTS delivery_signature TEXT,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_by TEXT;
