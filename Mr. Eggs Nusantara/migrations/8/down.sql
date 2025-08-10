
-- Remove sample data
DELETE FROM price_tiers WHERE product_id IN (1, 2, 3, 4, 5);
DELETE FROM customers WHERE id IN (1, 2, 3, 4, 5);
DELETE FROM products WHERE id IN (1, 2, 3, 4, 5);
