-- Run this in Supabase → SQL Editor

-- 1. Create sellers table
CREATE TABLE IF NOT EXISTS sellers (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name   TEXT NOT NULL,
  phone       TEXT,
  description TEXT,
  logo_url    TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Add seller_id column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES sellers(id);

-- 3. Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
