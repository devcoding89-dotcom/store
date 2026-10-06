-- Run this migration in Supabase SQL Editor before deploying the updated server.
-- These operational fields let checkout, admin, delivery, and tracking share one durable order record.
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_id TEXT,
ADD COLUMN IF NOT EXISTS product_id TEXT,
ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fulfillment_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS vendor_name TEXT,
ADD COLUMN IF NOT EXISTS vendor_phone TEXT,
ADD COLUMN IF NOT EXISTS delivery_signature TEXT,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_by TEXT;

UPDATE public.orders
SET fulfillment_status = CASE LOWER(status)
  WHEN 'processing' THEN 'confirmed'
  WHEN 'shipped' THEN 'dispatched'
  WHEN 'delivered' THEN 'delivered'
  WHEN 'cancelled' THEN 'cancelled'
  ELSE 'pending'
END
WHERE fulfillment_status = 'pending'
  AND LOWER(status) <> 'pending';

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    UPDATE public.orders AS orders
    SET customer_id = profiles.id::TEXT
    FROM public.profiles AS profiles
    WHERE orders.customer_id IS NULL
      AND orders.customer_email IS NOT NULL
      AND LOWER(orders.customer_email) = LOWER(profiles.email);
  END IF;
END;
$$;
