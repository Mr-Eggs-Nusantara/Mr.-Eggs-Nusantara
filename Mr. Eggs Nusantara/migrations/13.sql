
CREATE TABLE credit_sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  total_amount REAL NOT NULL,
  amount_paid REAL DEFAULT 0,
  amount_remaining REAL NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'outstanding',
  interest_rate REAL DEFAULT 0,
  payment_terms TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE credit_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credit_sale_id INTEGER NOT NULL,
  payment_amount REAL NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  reference_number TEXT,
  notes TEXT,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
