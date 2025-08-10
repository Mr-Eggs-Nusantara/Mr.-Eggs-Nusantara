
-- Add customer_type to customers table to categorize them
ALTER TABLE customers ADD COLUMN customer_type TEXT DEFAULT 'umum';

-- Create price_tiers table for different pricing levels
CREATE TABLE price_tiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  tier_type TEXT NOT NULL, -- 'umum', 'toko', 'grosir'
  price REAL NOT NULL,
  minimum_quantity INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
