
-- Remove customer_type column from customers
ALTER TABLE customers DROP COLUMN customer_type;

-- Drop price_tiers table
DROP TABLE price_tiers;
