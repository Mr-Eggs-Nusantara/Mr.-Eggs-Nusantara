
-- Create table to store product recipes (which raw materials are used for each product)
CREATE TABLE product_recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  raw_material_id INTEGER NOT NULL,
  quantity_needed REAL NOT NULL, -- quantity of raw material needed per unit of product
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
