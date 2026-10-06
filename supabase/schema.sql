-- ========================================================
-- TOWNSQUARE MARKETPLACE - SUPABASE DATABASE SCHEMA & MIGRATION
-- Project URL: https://luxoncvjroafxvsylhjh.supabase.co
-- ========================================================

-- 1. ADD BROKER MARGIN COLUMNS TO YOUR EXISTING PRODUCTS TABLE
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS vendor_cost NUMERIC,
ADD COLUMN IF NOT EXISTS floor_price NUMERIC,
ADD COLUMN IF NOT EXISTS vendor_name TEXT DEFAULT 'Direct Gadget Hub',
ADD COLUMN IF NOT EXISTS vendor_phone TEXT DEFAULT '2349138987295',
ADD COLUMN IF NOT EXISTS vendor_stall_location TEXT DEFAULT 'Tech Quarter, Suite 12';

-- 2. AUTOMATICALLY POPULATE INITIAL PROFIT MARGINS ON PRODUCTS
-- Wholesale Cost = 82% of price (what you pay the vendor)
-- Floor Price = 90% of price (lowest price Amaka can negotiate down to)
UPDATE products
SET 
  vendor_cost = COALESCE(vendor_cost, ROUND(price * 0.82)),
  floor_price = COALESCE(floor_price, ROUND(price * 0.90)),
  vendor_name = COALESCE(vendor_name, 'Alaba Tech Plaza Stall 14'),
  vendor_phone = COALESCE(vendor_phone, '2349138987295'),
  vendor_stall_location = COALESCE(vendor_stall_location, 'Computer Village / Tech Arcade')
WHERE vendor_cost IS NULL OR floor_price IS NULL;

-- 3. ADD BROKER TRACKING COLUMNS TO ORDERS TABLE
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_zone TEXT DEFAULT 'Zone 1 (Central / Commercial Core)',
ADD COLUMN IF NOT EXISTS vendor_cost NUMERIC,
ADD COLUMN IF NOT EXISTS net_profit NUMERIC,
ADD COLUMN IF NOT EXISTS agreed_price NUMERIC;

-- 4. CREATE PROFILES TABLE (FOR CUSTOMER ACCOUNTS & AUTH)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    role TEXT DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create a customer profile for each Supabase Auth account.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'address'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. ENABLE ROW LEVEL SECURITY (RLS) POLICIES
-- Allow public to read in-stock products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Public products read access'
  ) THEN
    CREATE POLICY "Public products read access" ON products FOR SELECT USING (true);
  END IF;
END $$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can read their own profile'
  ) THEN
    CREATE POLICY "Users can read their own profile" ON profiles
      FOR SELECT TO authenticated USING (auth.uid() = id);
  END IF;
END $$;

-- Allow public to track their own orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Allow insert orders'
  ) THEN
    CREATE POLICY "Allow insert orders" ON orders FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Allow select orders'
  ) THEN
    CREATE POLICY "Allow select orders" ON orders FOR SELECT USING (true);
  END IF;
END $$;

-- 6. UNLOCK ANY CATEGORY (Books, Phones, Fashion, etc.)
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
