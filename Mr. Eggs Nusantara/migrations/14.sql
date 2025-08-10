
-- Create petty cash table for small cash transactions
CREATE TABLE petty_cash (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_type TEXT NOT NULL, -- 'in' or 'out'
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  reference_number TEXT,
  transaction_date DATE NOT NULL,
  balance_after REAL NOT NULL,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create petty cash settings
INSERT INTO petty_cash (transaction_type, amount, description, transaction_date, balance_after, created_by) 
VALUES ('in', 0, 'Initial petty cash setup', date('now'), 0, 'system');
