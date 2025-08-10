
-- Tabel Penjualan (Transaksi Kasir)
CREATE TABLE sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  sale_date DATE NOT NULL,
  total_amount REAL NOT NULL,
  discount_amount REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  final_amount REAL NOT NULL,
  payment_method TEXT DEFAULT 'cash', -- cash, transfer, credit
  status TEXT DEFAULT 'completed', -- pending, completed, cancelled, refunded
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Detail Item Penjualan
CREATE TABLE sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  discount_amount REAL DEFAULT 0,
  total_price REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Transaksi Keuangan
CREATE TABLE financial_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL, -- income, expense
  category TEXT NOT NULL, -- sales, purchase, operational, etc
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  transaction_date DATE NOT NULL,
  reference_id INTEGER, -- ID dari sales atau purchase
  reference_type TEXT, -- 'sale', 'purchase', 'expense', etc
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
