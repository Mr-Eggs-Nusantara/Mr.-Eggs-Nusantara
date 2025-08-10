
-- Add sample products for testing transactions
INSERT OR IGNORE INTO products (id, name, description, unit, selling_price, cost_price, stock_quantity, minimum_stock, is_active) VALUES
(1, 'Telur Ayam Grade A (30 butir)', 'Telur ayam segar grade A dalam kemasan dus 30 butir', 'dus', 45000, 38000, 50, 10, 1),
(2, 'Telur Ayam Grade B (30 butir)', 'Telur ayam segar grade B dalam kemasan dus 30 butir', 'dus', 42000, 35000, 75, 15, 1),
(3, 'Telur Ayam Pack 6 butir', 'Telur ayam segar dalam kemasan pack 6 butir', 'pack', 9000, 7500, 100, 20, 1),
(4, 'Telur Ayam Pack 12 butir', 'Telur ayam segar dalam kemasan pack 12 butir', 'pack', 18000, 15000, 80, 15, 1),
(5, 'Telur Ayam Tray 30 butir', 'Telur ayam segar dalam tray plastik 30 butir', 'tray', 43000, 36000, 60, 10, 1);

-- Add sample customers
INSERT OR IGNORE INTO customers (id, name, phone, email, address, customer_type, is_active) VALUES
(1, 'Customer Umum', '', '', '', 'umum', 1),
(2, 'Toko Berkah Jaya', '08123456789', 'berkah@gmail.com', 'Jl. Merdeka No. 15', 'toko', 1),
(3, 'Warung Bu Sari', '08234567890', '', 'Jl. Kenangan No. 8', 'toko', 1),
(4, 'CV. Sumber Rejeki', '08345678901', 'rejeki@gmail.com', 'Jl. Industri No. 12', 'grosir', 1),
(5, 'Pasar Modern', '08456789012', 'modern@yahoo.com', 'Jl. Raya Utama No. 88', 'grosir', 1);

-- Add tiered pricing for better transaction testing
INSERT OR IGNORE INTO price_tiers (product_id, tier_type, price, minimum_quantity) VALUES
-- Telur Grade A
(1, 'umum', 45000, 1),
(1, 'toko', 43000, 2),
(1, 'grosir', 41000, 5),
-- Telur Grade B
(2, 'umum', 42000, 1),
(2, 'toko', 40000, 2),
(2, 'grosir', 38000, 5),
-- Pack 6 butir
(3, 'umum', 9000, 1),
(3, 'toko', 8500, 3),
(3, 'grosir', 8000, 10),
-- Pack 12 butir
(4, 'umum', 18000, 1),
(4, 'toko', 17000, 2),
(4, 'grosir', 16000, 5),
-- Tray 30 butir
(5, 'umum', 43000, 1),
(5, 'toko', 41000, 2),
(5, 'grosir', 39000, 3);
