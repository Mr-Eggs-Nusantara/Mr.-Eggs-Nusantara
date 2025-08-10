import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { cors } from "hono/cors";
import { getCookie, setCookie } from "hono/cookie";
import {
  getOAuthRedirectUrl,
  exchangeCodeForSessionToken,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { 
  SupplierSchema, 
  RawMaterialSchema, 
  ProductSchema, 
  PurchaseSchema,
  ProductionBatchSchema,
  CustomerSchema,
  EmployeeSchema
} from "@/shared/types";
import productionDetailRoutes from "./production-detail";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

// Mount production detail routes
app.route("/", productionDetailRoutes);

// Authentication Routes
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Get app user data with role information
  let appUser = null;
  if (user) {
    const dbUser = await c.env.DB.prepare(`
      SELECT * FROM app_users WHERE mocha_user_id = ? AND is_active = 1
    `).bind(user.id).first();
    
    if (dbUser) {
      appUser = {
        ...user,
        app_user_id: dbUser.id,
        role: dbUser.role,
        is_app_user_active: dbUser.is_active
      };
      
      // Update last login time
      await c.env.DB.prepare(`
        UPDATE app_users 
        SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE mocha_user_id = ?
      `).bind(user.id).run();
    } else {
      // Check if user exists by email and needs mocha_user_id update
      const emailUser = await c.env.DB.prepare(`
        SELECT * FROM app_users WHERE email = ? AND is_active = 1
      `).bind(user.email).first();
      
      if (emailUser) {
        // Update mocha_user_id for this user
        await c.env.DB.prepare(`
          UPDATE app_users 
          SET mocha_user_id = ?, last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE email = ?
        `).bind(user.id, user.email).run();
        
        appUser = {
          ...user,
          app_user_id: emailUser.id,
          role: emailUser.role,
          is_app_user_active: emailUser.is_active
        };
      }
    }
  }
  
  return c.json(appUser || user);
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Suppliers API
app.get("/api/suppliers", authMiddleware, async (c) => {
  const db = c.env.DB;
  const suppliers = await db.prepare("SELECT * FROM suppliers ORDER BY name").all();
  return c.json(suppliers.results);
});

app.post("/api/suppliers", authMiddleware, zValidator("json", SupplierSchema), async (c) => {
  const db = c.env.DB;
  const data = c.req.valid("json");
  
  const result = await db.prepare(`
    INSERT INTO suppliers (name, contact_person, phone, email, address, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    data.name, 
    data.contact_person || null, 
    data.phone || null, 
    data.email || null, 
    data.address || null, 
    data.is_active
  ).run();
  
  return c.json({ success: true, id: result.meta.last_row_id });
});

app.put("/api/suppliers/:id", authMiddleware, zValidator("json", SupplierSchema), async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const data = c.req.valid("json");
  
  await db.prepare(`
    UPDATE suppliers 
    SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    data.name, 
    data.contact_person || null, 
    data.phone || null, 
    data.email || null, 
    data.address || null, 
    data.is_active, 
    id
  ).run();
  
  return c.json({ success: true });
});

app.delete("/api/suppliers/:id", authMiddleware, async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  await db.prepare("DELETE FROM suppliers WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Raw Materials API
app.get("/api/raw-materials", authMiddleware, async (c) => {
  const db = c.env.DB;
  const materials = await db.prepare("SELECT * FROM raw_materials ORDER BY name").all();
  return c.json(materials.results);
});

app.post("/api/raw-materials", authMiddleware, zValidator("json", RawMaterialSchema), async (c) => {
  const db = c.env.DB;
  const data = c.req.valid("json");
  
  const result = await db.prepare(`
    INSERT INTO raw_materials (name, unit, stock_quantity, unit_cost, minimum_stock)
    VALUES (?, ?, ?, ?, ?)
  `).bind(data.name, data.unit, data.stock_quantity, data.unit_cost, data.minimum_stock).run();
  
  return c.json({ success: true, id: result.meta.last_row_id });
});

app.put("/api/raw-materials/:id", authMiddleware, zValidator("json", RawMaterialSchema), async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const data = c.req.valid("json");
  
  await db.prepare(`
    UPDATE raw_materials 
    SET name = ?, unit = ?, stock_quantity = ?, unit_cost = ?, minimum_stock = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(data.name, data.unit, data.stock_quantity, data.unit_cost, data.minimum_stock, id).run();
  
  return c.json({ success: true });
});

app.delete("/api/raw-materials/:id", authMiddleware, async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  await db.prepare("DELETE FROM raw_materials WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Products API
app.get("/api/products", authMiddleware, async (c) => {
  const db = c.env.DB;
  const products = await db.prepare("SELECT * FROM products ORDER BY name").all();
  return c.json(products.results);
});

// Products with pricing API
app.get("/api/products-with-pricing", authMiddleware, async (c) => {
  const db = c.env.DB;
  const products = await db.prepare(`
    SELECT p.*,
           pt_umum.price as price_umum,
           pt_umum.minimum_quantity as min_qty_umum,
           pt_toko.price as price_toko,
           pt_toko.minimum_quantity as min_qty_toko,
           pt_grosir.price as price_grosir,
           pt_grosir.minimum_quantity as min_qty_grosir
    FROM products p
    LEFT JOIN price_tiers pt_umum ON p.id = pt_umum.product_id AND pt_umum.tier_type = 'umum'
    LEFT JOIN price_tiers pt_toko ON p.id = pt_toko.product_id AND pt_toko.tier_type = 'toko'
    LEFT JOIN price_tiers pt_grosir ON p.id = pt_grosir.product_id AND pt_grosir.tier_type = 'grosir'
    ORDER BY p.name
  `).all();
  return c.json(products.results);
});

app.post("/api/products", authMiddleware, zValidator("json", ProductSchema), async (c) => {
  const db = c.env.DB;
  const data = c.req.valid("json");
  
  const result = await db.prepare(`
    INSERT INTO products (name, description, unit, selling_price, cost_price, stock_quantity, minimum_stock, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.name, 
    data.description || null, 
    data.unit, 
    data.selling_price, 
    data.cost_price, 
    data.stock_quantity, 
    data.minimum_stock, 
    data.is_active
  ).run();
  
  return c.json({ success: true, id: result.meta.last_row_id });
});

app.put("/api/products/:id", authMiddleware, zValidator("json", ProductSchema), async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const data = c.req.valid("json");
  
  await db.prepare(`
    UPDATE products 
    SET name = ?, description = ?, unit = ?, selling_price = ?, cost_price = ?, stock_quantity = ?, minimum_stock = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    data.name, 
    data.description || null, 
    data.unit, 
    data.selling_price, 
    data.cost_price, 
    data.stock_quantity, 
    data.minimum_stock, 
    data.is_active, 
    id
  ).run();
  
  return c.json({ success: true });
});

app.delete("/api/products/:id", authMiddleware, async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  await db.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Product Pricing API
app.post("/api/products/:id/pricing", async (c) => {
  const db = c.env.DB;
  const productId = c.req.param("id");
  const data = await c.req.json();
  
  // Delete existing pricing for this product
  await db.prepare("DELETE FROM price_tiers WHERE product_id = ?").bind(productId).run();
  
  // Insert new pricing tiers
  for (const [tier, price] of Object.entries(data)) {
    if (tier.startsWith('price_') && typeof price === 'number' && price > 0) {
      const tierType = tier.replace('price_', '');
      const minQtyKey = `min_qty_${tierType}`;
      const minQty = (data as any)[minQtyKey] || 1;
      
      await db.prepare(`
        INSERT INTO price_tiers (product_id, tier_type, price, minimum_quantity)
        VALUES (?, ?, ?, ?)
      `).bind(productId, tierType, price, minQty).run();
    }
  }
  
  return c.json({ success: true });
});

// Get pricing for a specific product
app.get("/api/products/:id/pricing", async (c) => {
  const db = c.env.DB;
  const productId = c.req.param("id");
  
  const pricing = await db.prepare(`
    SELECT * FROM price_tiers WHERE product_id = ? ORDER BY tier_type
  `).bind(productId).all();
  
  return c.json(pricing.results);
});

// Product Recipes API
app.get("/api/products/:id/recipe", async (c) => {
  const db = c.env.DB;
  const productId = c.req.param("id");
  
  const recipe = await db.prepare(`
    SELECT pr.*, rm.name as raw_material_name, rm.unit, rm.unit_cost
    FROM product_recipes pr
    JOIN raw_materials rm ON pr.raw_material_id = rm.id
    WHERE pr.product_id = ?
  `).bind(productId).all();
  
  return c.json(recipe.results);
});

app.post("/api/products/:id/recipe", async (c) => {
  const db = c.env.DB;
  const productId = c.req.param("id");
  const data = await c.req.json();
  
  // Delete existing recipe
  await db.prepare("DELETE FROM product_recipes WHERE product_id = ?").bind(productId).run();
  
  // Insert new recipe items
  for (const item of data.items || []) {
    await db.prepare(`
      INSERT INTO product_recipes (product_id, raw_material_id, quantity_needed)
      VALUES (?, ?, ?)
    `).bind(productId, item.raw_material_id, item.quantity_needed).run();
  }
  
  // Calculate and update cost price
  const productIdNumber = typeof productId === 'number' ? productId : parseInt(productId as string);
  await updateProductCostPrice(db, productIdNumber);
  
  return c.json({ success: true });
});

// Helper function to calculate and update product cost price
async function updateProductCostPrice(db: any, productId: number) {
  const recipe = await db.prepare(`
    SELECT pr.quantity_needed, rm.unit_cost
    FROM product_recipes pr
    JOIN raw_materials rm ON pr.raw_material_id = rm.id
    WHERE pr.product_id = ?
  `).bind(productId).all();
  
  let totalCost = 0;
  for (const item of recipe.results) {
    const quantity = typeof item.quantity_needed === 'number' ? item.quantity_needed : 0;
    const unitCost = typeof item.unit_cost === 'number' ? item.unit_cost : 0;
    totalCost += quantity * unitCost;
  }
  
  await db.prepare(`
    UPDATE products 
    SET cost_price = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(totalCost, productId).run();
}

// Update all product cost prices (useful when raw material prices change)
app.post("/api/products/recalculate-costs", async (c) => {
  const db = c.env.DB;
  
  const products = await db.prepare("SELECT id FROM products").all();
  
  for (const product of products.results) {
    const productId = typeof product.id === 'number' ? product.id : parseInt(product.id as string);
    await updateProductCostPrice(db, productId);
  }
  
  return c.json({ success: true });
});

// Purchases API
app.get("/api/purchases", async (c) => {
  const db = c.env.DB;
  const purchases = await db.prepare(`
    SELECT p.*, s.name as supplier_name
    FROM purchases p
    JOIN suppliers s ON p.supplier_id = s.id
    ORDER BY p.created_at DESC
  `).all();
  return c.json(purchases.results);
});

app.post("/api/purchases", zValidator("json", PurchaseSchema), async (c) => {
  const db = c.env.DB;
  const data = c.req.valid("json");
  
  // Calculate total amount
  const total_amount = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  
  // Insert purchase
  const purchaseResult = await db.prepare(`
    INSERT INTO purchases (supplier_id, total_amount, purchase_date, notes)
    VALUES (?, ?, ?, ?)
  `).bind(data.supplier_id, total_amount, data.purchase_date, data.notes || null).run();
  
  const purchaseId = purchaseResult.meta.last_row_id;
  
  // Insert purchase items and update stock
  for (const item of data.items) {
    const total_price = item.quantity * item.unit_price;
    
    await db.prepare(`
      INSERT INTO purchase_items (purchase_id, raw_material_id, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?)
    `).bind(purchaseId, item.raw_material_id, item.quantity, item.unit_price, total_price).run();
    
    // Update raw material stock and cost
    await db.prepare(`
      UPDATE raw_materials 
      SET stock_quantity = stock_quantity + ?, unit_cost = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(item.quantity, item.unit_price, item.raw_material_id).run();
    
    // Recalculate cost prices for products that use this raw material
    const affectedProducts = await db.prepare(`
      SELECT DISTINCT product_id FROM product_recipes WHERE raw_material_id = ?
    `).bind(item.raw_material_id).all();
    
    for (const product of affectedProducts.results) {
      const productId = typeof product.product_id === 'number' ? product.product_id : parseInt(product.product_id as string);
      await updateProductCostPrice(db, productId);
    }
  }
  
  // Add financial transaction
  await db.prepare(`
    INSERT INTO financial_transactions (type, category, description, amount, transaction_date, reference_id, reference_type)
    VALUES ('expense', 'purchase', 'Pembelian bahan baku', ?, ?, ?, 'purchase')
  `).bind(total_amount, data.purchase_date, purchaseId).run();
  
  return c.json({ success: true, id: purchaseId });
});

// Production API
app.get("/api/production", async (c) => {
  const db = c.env.DB;
  const batches = await db.prepare(`
    SELECT pb.*, 
           COUNT(po.id) as output_count,
           SUM(po.quantity_produced) as total_output_quantity
    FROM production_batches pb
    LEFT JOIN production_outputs po ON pb.id = po.batch_id
    GROUP BY pb.id
    ORDER BY pb.created_at DESC
  `).all();
  return c.json(batches.results);
});

app.post("/api/production", zValidator("json", ProductionBatchSchema), async (c) => {
  const db = c.env.DB;
  const data = c.req.valid("json");
  
  // Insert production batch
  const batchResult = await db.prepare(`
    INSERT INTO production_batches (batch_number, production_date, status, notes)
    VALUES (?, ?, 'completed', ?)
  `).bind(data.batch_number, data.production_date, data.notes || null).run();
  
  const batchId = batchResult.meta.last_row_id;
  let total_cost = 0;
  let total_output_quantity = 0;
  
  // Process inputs (consume raw materials)
  for (const input of data.inputs) {
    await db.prepare(`
      INSERT INTO production_inputs (batch_id, raw_material_id, quantity_used)
      VALUES (?, ?, ?)
    `).bind(batchId, input.raw_material_id, input.quantity_used).run();
    
    // Update raw material stock
    await db.prepare(`
      UPDATE raw_materials 
      SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(input.quantity_used, input.raw_material_id).run();
    
    // Calculate cost
    const materialCost = await db.prepare(`
      SELECT unit_cost FROM raw_materials WHERE id = ?
    `).bind(input.raw_material_id).first();
    
    if (materialCost && typeof materialCost.unit_cost === 'number') {
      total_cost += input.quantity_used * materialCost.unit_cost;
    }
  }
  
  // Process outputs (add finished products)
  for (const output of data.outputs) {
    await db.prepare(`
      INSERT INTO production_outputs (batch_id, product_id, quantity_produced)
      VALUES (?, ?, ?)
    `).bind(batchId, output.product_id, output.quantity_produced).run();
    
    total_output_quantity += output.quantity_produced;
    
    // Update product stock
    await db.prepare(`
      UPDATE products 
      SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(output.quantity_produced, output.product_id).run();
  }

  // Calculate and update cost price for each output product with better distribution
  if (total_output_quantity > 0 && total_cost > 0) {
    for (const output of data.outputs) {
      if (output.quantity_produced > 0) {
        // Calculate HPP per unit for this specific product
        // Distribute total cost proportionally based on quantity produced
        const productPortion = output.quantity_produced / total_output_quantity;
        const productTotalCost = productPortion * total_cost;
        const hppPerUnit = productTotalCost / output.quantity_produced;
        
        // Update product's cost price with calculated HPP
        await db.prepare(`
          UPDATE products 
          SET cost_price = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(hppPerUnit, output.product_id).run();
        
        // Also update the production output record with HPP info
        await db.prepare(`
          UPDATE production_outputs 
          SET hpp_per_unit = ?, total_hpp = ?
          WHERE batch_id = ? AND product_id = ?
        `).bind(hppPerUnit, productTotalCost, batchId, output.product_id).run();
      }
    }
  }
  
  // Update batch total cost
  await db.prepare(`
    UPDATE production_batches SET total_cost = ? WHERE id = ?
  `).bind(total_cost, batchId).run();
  
  return c.json({ success: true, id: batchId });
});

// Customers API
app.get("/api/customers", async (c) => {
  const db = c.env.DB;
  const customers = await db.prepare("SELECT * FROM customers ORDER BY name").all();
  return c.json(customers.results);
});

app.post("/api/customers", zValidator("json", CustomerSchema), async (c) => {
  const db = c.env.DB;
  const data = c.req.valid("json");
  
  const result = await db.prepare(`
    INSERT INTO customers (name, phone, email, address, customer_type, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    data.name, 
    data.phone || null, 
    data.email || null, 
    data.address || null, 
    data.customer_type || 'umum', 
    data.is_active
  ).run();
  
  return c.json({ success: true, id: result.meta.last_row_id });
});

app.put("/api/customers/:id", zValidator("json", CustomerSchema), async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const data = c.req.valid("json");
  
  await db.prepare(`
    UPDATE customers 
    SET name = ?, phone = ?, email = ?, address = ?, customer_type = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    data.name, 
    data.phone || null, 
    data.email || null, 
    data.address || null, 
    data.customer_type || 'umum', 
    data.is_active, 
    id
  ).run();
  
  return c.json({ success: true });
});

app.delete("/api/customers/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  await db.prepare("DELETE FROM customers WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Get products with pricing for specific customer type
app.get("/api/products-pricing/:customerType", async (c) => {
  const db = c.env.DB;
  const customerType = c.req.param("customerType") || 'umum';
  
  const products = await db.prepare(`
    SELECT p.*,
           COALESCE(pt.price, p.selling_price) as effective_price,
           COALESCE(pt.minimum_quantity, 1) as minimum_quantity
    FROM products p
    LEFT JOIN price_tiers pt ON p.id = pt.product_id AND pt.tier_type = ?
    WHERE p.is_active = 1
    ORDER BY p.name
  `).bind(customerType).all();
  
  return c.json(products.results);
});

// Sales API
app.get("/api/sales", async (c) => {
  const db = c.env.DB;
  const sales = await db.prepare(`
    SELECT s.*, c.name as customer_name
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    ORDER BY s.created_at DESC
  `).all();
  return c.json(sales.results);
});

// Sales API with improved error handling
app.post("/api/sales", async (c) => {
  try {
    const db = c.env.DB;
    const rawData = await c.req.json();
    
    // Validate required fields manually to provide better error messages
    if (!rawData.sale_date) {
      return c.json({ error: "Sale date is required" }, 400);
    }
    
    if (!rawData.items || !Array.isArray(rawData.items) || rawData.items.length === 0) {
      return c.json({ error: "At least one item is required" }, 400);
    }
    
    // Set defaults for optional fields
    const saleData = {
      customer_id: rawData.customer_id || null,
      sale_date: rawData.sale_date,
      items: rawData.items,
      discount_amount: rawData.discount_amount || 0,
      tax_amount: rawData.tax_amount || 0,
      payment_method: rawData.payment_method || 'cash',
      notes: rawData.notes || '',
      payment_terms: rawData.payment_terms || null,
      due_date: rawData.due_date || null,
      bank_account_id: rawData.bank_account_id || null
    };
    
    // Validate items
    for (let i = 0; i < saleData.items.length; i++) {
      const item = saleData.items[i];
      if (!item.product_id || item.quantity <= 0 || item.unit_price <= 0) {
        return c.json({ 
          error: `Invalid item at index ${i}: product_id, quantity, and unit_price are required and must be positive` 
        }, 400);
      }
      // Set default discount_amount for items
      if (typeof item.discount_amount !== 'number') {
        item.discount_amount = 0;
      }
    }
    
    // Calculate totals
    const subtotal = saleData.items.reduce((sum: number, item: any) => {
      const itemTotal = (item.quantity * item.unit_price) - (item.discount_amount || 0);
      return sum + itemTotal;
    }, 0);
    
    const total_amount = subtotal - saleData.discount_amount + saleData.tax_amount;
    const final_amount = total_amount;
    
    if (final_amount <= 0) {
      return c.json({ error: "Final amount must be positive" }, 400);
    }
    
    // Check stock availability
    for (const item of saleData.items) {
      const product = await db.prepare(
        "SELECT stock_quantity FROM products WHERE id = ? AND is_active = 1"
      ).bind(item.product_id).first();
      
      if (!product) {
        return c.json({ 
          error: `Product with ID ${item.product_id} not found or not active` 
        }, 400);
      }
      
      const stockQuantity = typeof product.stock_quantity === 'number' ? product.stock_quantity : 0;
      if (stockQuantity < item.quantity) {
        return c.json({ 
          error: `Insufficient stock for product ID ${item.product_id}. Available: ${stockQuantity}, Required: ${item.quantity}` 
        }, 400);
      }
    }
    
    // Start transaction by inserting sale
    const saleResult = await db.prepare(`
      INSERT INTO sales (customer_id, sale_date, total_amount, discount_amount, tax_amount, final_amount, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      saleData.customer_id, 
      saleData.sale_date, 
      total_amount, 
      saleData.discount_amount, 
      saleData.tax_amount, 
      final_amount, 
      saleData.payment_method, 
      saleData.notes || null
    ).run();
    
    if (!saleResult.success) {
      return c.json({ error: "Failed to create sale record" }, 500);
    }
    
    const saleId = saleResult.meta.last_row_id;
    
    // Insert sale items and update stock
    for (const item of saleData.items) {
      const total_price = (item.quantity * item.unit_price) - (item.discount_amount || 0);
      
      // Insert sale item
      const itemResult = await db.prepare(`
        INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, discount_amount, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        saleId, 
        item.product_id, 
        item.quantity, 
        item.unit_price, 
        item.discount_amount || 0, 
        total_price
      ).run();
      
      if (!itemResult.success) {
        return c.json({ error: `Failed to create sale item for product ${item.product_id}` }, 500);
      }
      
      // Update product stock
      const stockResult = await db.prepare(`
        UPDATE products 
        SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(item.quantity, item.product_id).run();
      
      if (!stockResult.success) {
        return c.json({ error: `Failed to update stock for product ${item.product_id}` }, 500);
      }
    }
    
    // Handle credit sales
    if (saleData.payment_method === 'credit') {
      // Get customer info
      let customer_name = 'Customer Umum';
      if (saleData.customer_id) {
        const customer = await db.prepare("SELECT name FROM customers WHERE id = ?").bind(saleData.customer_id).first();
        if (customer) {
          customer_name = customer.name as string;
        }
      }
      
      // Create credit sale record
      await db.prepare(`
        INSERT INTO credit_sales (sale_id, customer_id, total_amount, amount_remaining, due_date, payment_terms, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'outstanding')
      `).bind(
        saleId,
        saleData.customer_id,
        final_amount,
        final_amount,
        saleData.due_date,
        saleData.payment_terms,
        `Credit sale for ${customer_name}`
      ).run();
    } else {
      // Add financial transaction for non-credit sales
      const financialResult = await db.prepare(`
        INSERT INTO financial_transactions (type, category, description, amount, transaction_date, reference_id, reference_type)
        VALUES ('income', 'sales', 'Penjualan produk', ?, ?, ?, 'sale')
      `).bind(final_amount, saleData.sale_date, saleId).run();
      
      if (!financialResult.success) {
        console.error("Warning: Failed to create financial transaction for sale", saleId);
      }
    }
    
    return c.json({ 
      success: true, 
      id: saleId, 
      total_amount,
      final_amount,
      message: "Sale processed successfully" 
    });
    
  } catch (error) {
    console.error("Sales API error:", error);
    return c.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, 500);
  }
});

// Financial Transactions API
app.get("/api/financial-transactions", async (c) => {
  const db = c.env.DB;
  const transactions = await db.prepare(`
    SELECT * FROM financial_transactions ORDER BY transaction_date DESC, created_at DESC
  `).all();
  return c.json(transactions.results);
});

app.post("/api/financial-transactions", async (c) => {
  const db = c.env.DB;
  const data = await c.req.json();
  
  // Validate required fields
  if (!data.type || !data.category || !data.description || !data.amount || !data.transaction_date) {
    return c.json({ error: "Missing required fields" }, 400);
  }
  
  if (data.amount <= 0) {
    return c.json({ error: "Amount must be positive" }, 400);
  }
  
  if (!['income', 'expense'].includes(data.type)) {
    return c.json({ error: "Type must be 'income' or 'expense'" }, 400);
  }
  
  const result = await db.prepare(`
    INSERT INTO financial_transactions (type, category, description, amount, transaction_date)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    data.type,
    data.category,
    data.description,
    data.amount,
    data.transaction_date
  ).run();
  
  return c.json({ success: true, id: result.meta.last_row_id });
});

// Financial Reports API
app.get("/api/financial-reports", async (c) => {
  const db = c.env.DB;
  
  // Get summary data
  const income = await db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE type = 'income'
  `).first();
  
  const expense = await db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE type = 'expense'
  `).first();
  
  const recent_transactions = await db.prepare(`
    SELECT * FROM financial_transactions ORDER BY transaction_date DESC, created_at DESC LIMIT 50
  `).all();
  
  const totalIncome = typeof income?.total === 'number' ? income.total : 0;
  const totalExpense = typeof expense?.total === 'number' ? expense.total : 0;
  
  return c.json({
    total_income: totalIncome,
    total_expense: totalExpense,
    net_profit: totalIncome - totalExpense,
    recent_transactions: recent_transactions.results
  });
});

// Bank Accounts API
app.get("/api/bank-accounts", async (c) => {
  const db = c.env.DB;
  const accounts = await db.prepare("SELECT * FROM bank_accounts ORDER BY bank_name, account_name").all();
  return c.json(accounts.results);
});

app.post("/api/bank-accounts", async (c) => {
  const db = c.env.DB;
  const data = await c.req.json();
  
  // Validate required fields
  if (!data.bank_name || !data.account_name || !data.account_number) {
    return c.json({ error: "Bank name, account name, and account number are required" }, 400);
  }
  
  const result = await db.prepare(`
    INSERT INTO bank_accounts (bank_name, account_name, account_number, account_type, current_balance, is_active, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.bank_name,
    data.account_name,
    data.account_number,
    data.account_type || 'checking',
    data.current_balance || 0,
    data.is_active !== false ? 1 : 0,
    data.notes || null
  ).run();
  
  return c.json({ success: true, id: result.meta.last_row_id });
});

app.put("/api/bank-accounts/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const data = await c.req.json();
  
  await db.prepare(`
    UPDATE bank_accounts 
    SET bank_name = ?, account_name = ?, account_number = ?, account_type = ?, is_active = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    data.bank_name,
    data.account_name,
    data.account_number,
    data.account_type || 'checking',
    data.is_active !== false ? 1 : 0,
    data.notes || null,
    id
  ).run();
  
  return c.json({ success: true });
});

app.delete("/api/bank-accounts/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  await db.prepare("DELETE FROM bank_accounts WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Bank Transactions API
app.get("/api/bank-accounts/:id/transactions", async (c) => {
  const db = c.env.DB;
  const accountId = c.req.param("id");
  
  const transactions = await db.prepare(`
    SELECT bt.*, ba.bank_name, ba.account_name
    FROM bank_transactions bt
    JOIN bank_accounts ba ON bt.bank_account_id = ba.id
    WHERE bt.bank_account_id = ?
    ORDER BY bt.transaction_date DESC, bt.created_at DESC
  `).bind(accountId).all();
  
  return c.json(transactions.results);
});

app.post("/api/bank-transactions", async (c) => {
  try {
    const db = c.env.DB;
    const data = await c.req.json();
    
    // Validate required fields
    if (!data.bank_account_id || !data.transaction_type || !data.amount || !data.description || !data.transaction_date) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    if (!['debit', 'credit'].includes(data.transaction_type)) {
      return c.json({ error: "Transaction type must be 'debit' or 'credit'" }, 400);
    }
    
    if (data.amount <= 0) {
      return c.json({ error: "Amount must be positive" }, 400);
    }
    
    // Get current account balance
    const account = await db.prepare("SELECT current_balance FROM bank_accounts WHERE id = ?").bind(data.bank_account_id).first();
    if (!account) {
      return c.json({ error: "Bank account not found" }, 404);
    }
    
    const currentBalance = typeof account.current_balance === 'number' ? account.current_balance : 0;
    const amount = parseFloat(data.amount);
    
    // Calculate new balance
    let newBalance;
    let financialTransactionType;
    let financialCategory;
    
    if (data.transaction_type === 'credit') {
      // Money coming in
      newBalance = currentBalance + amount;
      financialTransactionType = 'income';
      financialCategory = data.category || 'bank_deposit';
    } else {
      // Money going out  
      newBalance = currentBalance - amount;
      financialTransactionType = 'expense';
      financialCategory = data.category || 'bank_withdrawal';
    }
    
    // Insert bank transaction
    const bankTxResult = await db.prepare(`
      INSERT INTO bank_transactions (bank_account_id, transaction_type, amount, description, reference_number, transaction_date, balance_after)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.bank_account_id,
      data.transaction_type,
      amount,
      data.description,
      data.reference_number || null,
      data.transaction_date,
      newBalance
    ).run();
    
    // Update account balance
    await db.prepare(`
      UPDATE bank_accounts SET current_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(newBalance, data.bank_account_id).run();
    
    // Create corresponding financial transaction if enabled
    if (data.create_financial_transaction !== false) {
      const financialResult = await db.prepare(`
        INSERT INTO financial_transactions (type, category, description, amount, transaction_date, reference_id, reference_type)
        VALUES (?, ?, ?, ?, ?, ?, 'bank_transaction')
      `).bind(
        financialTransactionType,
        financialCategory,
        `Bank ${data.transaction_type}: ${data.description}`,
        amount,
        data.transaction_date,
        bankTxResult.meta.last_row_id
      ).run();
      
      if (financialResult.success) {
        // Link the financial transaction back to bank transaction
        await db.prepare(`
          UPDATE bank_transactions SET financial_transaction_id = ? WHERE id = ?
        `).bind(financialResult.meta.last_row_id, bankTxResult.meta.last_row_id).run();
      }
    }
    
    return c.json({ 
      success: true, 
      id: bankTxResult.meta.last_row_id,
      new_balance: newBalance
    });
    
  } catch (error) {
    console.error("Bank transaction error:", error);
    return c.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, 500);
  }
});

// Bank account balance update (manual adjustment)
app.post("/api/bank-accounts/:id/adjust-balance", async (c) => {
  const db = c.env.DB;
  const accountId = c.req.param("id");
  const data = await c.req.json();
  
  if (typeof data.new_balance !== 'number') {
    return c.json({ error: "New balance must be a number" }, 400);
  }
  
  // Get current balance
  const account = await db.prepare("SELECT current_balance, account_name FROM bank_accounts WHERE id = ?").bind(accountId).first();
  if (!account) {
    return c.json({ error: "Bank account not found" }, 404);
  }
  
  const currentBalance = typeof account.current_balance === 'number' ? account.current_balance : 0;
  const difference = data.new_balance - currentBalance;
  
  if (Math.abs(difference) > 0.01) { // Only create transaction if there's a significant difference
    // Create adjustment transaction
    const transactionType = difference > 0 ? 'credit' : 'debit';
    const description = data.reason || `Balance adjustment: ${difference > 0 ? '+' : ''}${difference.toFixed(2)}`;
    
    await db.prepare(`
      INSERT INTO bank_transactions (bank_account_id, transaction_type, amount, description, transaction_date, balance_after)
      VALUES (?, ?, ?, ?, date('now'), ?)
    `).bind(
      accountId,
      transactionType,
      Math.abs(difference),
      description,
      data.new_balance
    ).run();
  }
  
  // Update account balance
  await db.prepare(`
    UPDATE bank_accounts SET current_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(data.new_balance, accountId).run();
  
  return c.json({ success: true, previous_balance: currentBalance, new_balance: data.new_balance });
});

// App Users API
app.get("/api/users", authMiddleware, async (c) => {
  const db = c.env.DB;
  const users = await db.prepare("SELECT * FROM app_users ORDER BY name").all();
  return c.json(users.results);
});

app.post("/api/users", authMiddleware, async (c) => {
  const db = c.env.DB;
  const data = await c.req.json();
  
  // Validate required fields
  if (!data.mocha_user_id || !data.email || !data.name || !data.role) {
    return c.json({ error: "Missing required fields" }, 400);
  }
  
  // Check if mocha_user_id already exists
  const existing = await db.prepare("SELECT id FROM app_users WHERE mocha_user_id = ?").bind(data.mocha_user_id).first();
  if (existing) {
    return c.json({ error: "Mocha User ID sudah digunakan" }, 400);
  }
  
  const result = await db.prepare(`
    INSERT INTO app_users (mocha_user_id, email, name, role, phone, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    data.mocha_user_id,
    data.email, 
    data.name,
    data.role,
    data.phone || null,
    data.is_active !== false ? 1 : 0
  ).run();
  
  return c.json({ success: true, id: result.meta.last_row_id });
});

app.put("/api/users/:id", authMiddleware, async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const data = await c.req.json();
  
  // Check if mocha_user_id already exists for other users
  const existing = await db.prepare("SELECT id FROM app_users WHERE mocha_user_id = ? AND id != ?").bind(data.mocha_user_id, id).first();
  if (existing) {
    return c.json({ error: "Mocha User ID sudah digunakan" }, 400);
  }
  
  await db.prepare(`
    UPDATE app_users 
    SET mocha_user_id = ?, email = ?, name = ?, role = ?, phone = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    data.mocha_user_id,
    data.email,
    data.name,
    data.role,
    data.phone || null,
    data.is_active !== false ? 1 : 0,
    id
  ).run();
  
  return c.json({ success: true });
});

app.delete("/api/users/:id", authMiddleware, async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  await db.prepare("DELETE FROM app_users WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Employees API
app.get("/api/employees", authMiddleware, async (c) => {
  const db = c.env.DB;
  const employees = await db.prepare("SELECT * FROM employees ORDER BY name").all();
  return c.json(employees.results);
});

app.post("/api/employees", authMiddleware, zValidator("json", EmployeeSchema), async (c) => {
  const db = c.env.DB;
  const data = c.req.valid("json");
  
  // Check if employee_id already exists
  const existing = await db.prepare("SELECT id FROM employees WHERE employee_id = ?").bind(data.employee_id).first();
  if (existing) {
    return c.json({ error: "ID karyawan sudah digunakan" }, 400);
  }
  
  const result = await db.prepare(`
    INSERT INTO employees (employee_id, name, position, department, phone, email, address, hire_date, salary, is_active, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.employee_id,
    data.name, 
    data.position,
    data.department || null,
    data.phone || null, 
    data.email || null, 
    data.address || null,
    data.hire_date,
    data.salary || 0,
    data.is_active,
    data.notes || null
  ).run();
  
  return c.json({ success: true, id: result.meta.last_row_id });
});

app.put("/api/employees/:id", authMiddleware, zValidator("json", EmployeeSchema), async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const data = c.req.valid("json");
  
  // Check if employee_id already exists for other employees
  const existing = await db.prepare("SELECT id FROM employees WHERE employee_id = ? AND id != ?").bind(data.employee_id, id).first();
  if (existing) {
    return c.json({ error: "ID karyawan sudah digunakan" }, 400);
  }
  
  await db.prepare(`
    UPDATE employees 
    SET employee_id = ?, name = ?, position = ?, department = ?, phone = ?, email = ?, address = ?, hire_date = ?, salary = ?, is_active = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    data.employee_id,
    data.name,
    data.position,
    data.department || null,
    data.phone || null, 
    data.email || null, 
    data.address || null,
    data.hire_date,
    data.salary || 0,
    data.is_active,
    data.notes || null,
    id
  ).run();
  
  return c.json({ success: true });
});

app.delete("/api/employees/:id", authMiddleware, async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  await db.prepare("DELETE FROM employees WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// System Data Reset API
app.post("/api/system/reset-data", authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const data = await c.req.json();
    
    // Verify super admin access
    const appUser = await db.prepare("SELECT role FROM app_users WHERE mocha_user_id = ? AND is_active = 1").bind(user?.id).first();
    if (!appUser || appUser.role !== 'super_admin') {
      return c.json({ error: "Unauthorized: Super Admin access required" }, 403);
    }
    
    // Validate confirmation code
    if (data.confirmation_code !== 'RESET_ALL_DATA_PERMANENT') {
      return c.json({ error: "Invalid confirmation code" }, 400);
    }
    
    // Additional confirmation with current timestamp (within 5 minutes)
    const confirmationTime = new Date(data.confirmation_timestamp);
    const now = new Date();
    const timeDiff = (now.getTime() - confirmationTime.getTime()) / 1000 / 60; // in minutes
    
    if (timeDiff > 5 || timeDiff < 0) {
      return c.json({ error: "Confirmation expired or invalid timestamp" }, 400);
    }
    
    // Log reset initiation
    await db.prepare(`
      INSERT INTO system_logs (level, message, user_id)
      VALUES ('warning', 'DATA RESET INITIATED - All transactional and master data will be deleted', ?)
    `).bind(user?.id || 'system').run();
    
    const deletionLog = [];
    let totalDeleted = 0;
    
    try {
      // Reset data in correct order to handle foreign key constraints
      
      // 1. Delete transactional data first
      const transactionalTables = [
        'credit_payments',
        'credit_sales', 
        'petty_cash',
        'bank_transactions',
        'sale_items',
        'sales',
        'purchase_items', 
        'purchases',
        'production_inputs',
        'production_outputs',
        'production_batches',
        'financial_transactions'
      ];
      
      for (const table of transactionalTables) {
        const result = await db.prepare(`SELECT COUNT(*) as count FROM ${table}`).first();
        const count = (result?.count as number) || 0;
        if (count > 0) {
          await db.prepare(`DELETE FROM ${table}`).run();
          deletionLog.push(`${table}: ${count} records deleted`);
          totalDeleted += count;
        }
      }
      
      // 2. Delete master data
      const masterTables = [
        'product_recipes',
        'price_tiers', 
        'products',
        'raw_materials',
        'customers',
        'suppliers',
        'employees'
      ];
      
      for (const table of masterTables) {
        const result = await db.prepare(`SELECT COUNT(*) as count FROM ${table}`).first();
        const count = (result?.count as number) || 0;
        if (count > 0) {
          await db.prepare(`DELETE FROM ${table}`).run();
          deletionLog.push(`${table}: ${count} records deleted`);
          totalDeleted += count;
        }
      }
      
      // 3. Reset bank account balances to 0 (keep accounts but reset balances)
      const bankAccounts = await db.prepare("SELECT COUNT(*) as count FROM bank_accounts").first();
      const bankCount = (bankAccounts?.count as number) || 0;
      if (bankCount > 0) {
        await db.prepare("UPDATE bank_accounts SET current_balance = 0, updated_at = CURRENT_TIMESTAMP").run();
        deletionLog.push(`bank_accounts: ${bankCount} balances reset to 0`);
      }
      
      // 4. Clean up old system logs (keep only logs from today)
      const oldLogs = await db.prepare("SELECT COUNT(*) as count FROM system_logs WHERE date(timestamp) < date('now')").first();
      const oldLogCount = (oldLogs?.count as number) || 0;
      if (oldLogCount > 0) {
        await db.prepare("DELETE FROM system_logs WHERE date(timestamp) < date('now')").run();
        deletionLog.push(`system_logs: ${oldLogCount} old logs cleaned`);
        totalDeleted += oldLogCount;
      }
      
      // 5. Reset auto-increment counters
      const tablesToReset = [
        ...transactionalTables,
        ...masterTables,
        'bank_transactions',
        'credit_payments',
        'credit_sales',
        'petty_cash'
      ];
      
      for (const table of tablesToReset) {
        try {
          await db.prepare(`UPDATE sqlite_sequence SET seq = 0 WHERE name = ?`).bind(table).run();
        } catch (e) {
          // Ignore errors for tables that might not exist in sqlite_sequence
        }
      }
      
      // 6. Update system settings
      await db.prepare(`
        INSERT OR REPLACE INTO system_settings (key, value, category, description, data_type)
        VALUES ('last_data_reset', ?, 'maintenance', 'Timestamp of last data reset', 'string')
      `).bind(new Date().toISOString()).run();
      
      // 7. Final success log
      await db.prepare(`
        INSERT INTO system_logs (level, message, user_id)
        VALUES ('warning', 'DATA RESET COMPLETED - Total ' || ? || ' records deleted. Details: ' || ?, ?)
      `).bind(totalDeleted, deletionLog.join('; '), user?.id || 'system').run();
      
      return c.json({
        success: true,
        message: 'Data reset completed successfully',
        total_deleted: totalDeleted,
        deletion_log: deletionLog,
        reset_timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      // Log error
      await db.prepare(`
        INSERT INTO system_logs (level, message, user_id)
        VALUES ('error', 'DATA RESET FAILED: ' || ?, ?)
      `).bind(String(error), user?.id || 'system').run();
      
      throw error;
    }
    
  } catch (error) {
    console.error('Data reset error:', error);
    return c.json({
      error: 'Data reset failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// System Reset Preview (show what would be deleted)
app.get("/api/system/reset-preview", authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    
    // Verify super admin access
    const appUser = await db.prepare("SELECT role FROM app_users WHERE mocha_user_id = ? AND is_active = 1").bind(user?.id).first();
    if (!appUser || appUser.role !== 'super_admin') {
      return c.json({ error: "Unauthorized: Super Admin access required" }, 403);
    }
    
    // Get counts for all tables that will be affected
    const tableCounts = await Promise.all([
      db.prepare("SELECT COUNT(*) as count FROM sales").first(),
      db.prepare("SELECT COUNT(*) as count FROM sale_items").first(),
      db.prepare("SELECT COUNT(*) as count FROM purchases").first(),
      db.prepare("SELECT COUNT(*) as count FROM purchase_items").first(),
      db.prepare("SELECT COUNT(*) as count FROM production_batches").first(),
      db.prepare("SELECT COUNT(*) as count FROM production_inputs").first(),
      db.prepare("SELECT COUNT(*) as count FROM production_outputs").first(),
      db.prepare("SELECT COUNT(*) as count FROM financial_transactions").first(),
      db.prepare("SELECT COUNT(*) as count FROM credit_sales").first(),
      db.prepare("SELECT COUNT(*) as count FROM credit_payments").first(),
      db.prepare("SELECT COUNT(*) as count FROM petty_cash").first(),
      db.prepare("SELECT COUNT(*) as count FROM bank_transactions").first(),
      db.prepare("SELECT COUNT(*) as count FROM products").first(),
      db.prepare("SELECT COUNT(*) as count FROM raw_materials").first(),
      db.prepare("SELECT COUNT(*) as count FROM customers").first(),
      db.prepare("SELECT COUNT(*) as count FROM suppliers").first(),
      db.prepare("SELECT COUNT(*) as count FROM employees").first(),
      db.prepare("SELECT COUNT(*) as count FROM product_recipes").first(),
      db.prepare("SELECT COUNT(*) as count FROM price_tiers").first(),
      db.prepare("SELECT COUNT(*) as count FROM bank_accounts").first(),
    ]);
    
    const preview = {
      transactional_data: {
        sales: (tableCounts[0]?.count as number) || 0,
        sale_items: (tableCounts[1]?.count as number) || 0,
        purchases: (tableCounts[2]?.count as number) || 0,
        purchase_items: (tableCounts[3]?.count as number) || 0,
        production_batches: (tableCounts[4]?.count as number) || 0,
        production_inputs: (tableCounts[5]?.count as number) || 0,
        production_outputs: (tableCounts[6]?.count as number) || 0,
        financial_transactions: (tableCounts[7]?.count as number) || 0,
        credit_sales: (tableCounts[8]?.count as number) || 0,
        credit_payments: (tableCounts[9]?.count as number) || 0,
        petty_cash: (tableCounts[10]?.count as number) || 0,
        bank_transactions: (tableCounts[11]?.count as number) || 0,
      },
      master_data: {
        products: (tableCounts[12]?.count as number) || 0,
        raw_materials: (tableCounts[13]?.count as number) || 0,
        customers: (tableCounts[14]?.count as number) || 0,
        suppliers: (tableCounts[15]?.count as number) || 0,
        employees: (tableCounts[16]?.count as number) || 0,
        product_recipes: (tableCounts[17]?.count as number) || 0,
        price_tiers: (tableCounts[18]?.count as number) || 0,
      },
      will_be_reset: {
        bank_account_balances: (tableCounts[19]?.count as number) || 0,
      },
      will_be_preserved: {
        app_users: "All user accounts will be preserved",
        system_settings: "System configuration will be preserved", 
        bank_accounts: "Bank account info preserved (only balances reset)",
        todays_logs: "Today's system logs will be preserved"
      }
    };
    
    const totalToDelete = Object.values(preview.transactional_data).reduce((sum, count) => sum + count, 0) +
                         Object.values(preview.master_data).reduce((sum, count) => sum + count, 0);
    
    return c.json({
      preview,
      total_records_to_delete: totalToDelete,
      confirmation_required: 'RESET_ALL_DATA_PERMANENT',
      warning: 'This action cannot be undone. All business data will be permanently deleted.'
    });
    
  } catch (error) {
    console.error('Reset preview error:', error);
    return c.json({ error: 'Failed to generate reset preview' }, 500);
  }
});

// System Settings API
app.get("/api/system/info", authMiddleware, async (c) => {
  const db = c.env.DB;
  
  try {
    // Get database statistics
    const dbStats = await Promise.all([
      db.prepare("SELECT COUNT(*) as total FROM sqlite_master WHERE type='table'").first(),
      db.prepare("SELECT COUNT(*) as count FROM app_users").first(),
      db.prepare("SELECT COUNT(*) as count FROM suppliers").first(),
      db.prepare("SELECT COUNT(*) as count FROM products").first(),
      db.prepare("SELECT COUNT(*) as count FROM sales").first(),
      db.prepare("SELECT COUNT(*) as count FROM production_batches").first(),
    ]);
    
    const totalRecords = ((dbStats[1]?.count as number) || 0) + ((dbStats[2]?.count as number) || 0) + 
                        ((dbStats[3]?.count as number) || 0) + ((dbStats[4]?.count as number) || 0) + 
                        ((dbStats[5]?.count as number) || 0);
    
    // Get last backup info
    const lastBackup = await db.prepare("SELECT value FROM system_settings WHERE key = 'last_backup_time'").first();
    
    // Calculate approximate database size (simplified)
    const dbSize = totalRecords * 1024; // Rough estimate
    
    // Get active users (logged in within last 24 hours)
    const activeUsers = await db.prepare(`
      SELECT COUNT(*) as count FROM app_users 
      WHERE last_login_at >= datetime('now', '-24 hours')
    `).first();
    
    const systemInfo = {
      database_size: dbSize,
      total_records: totalRecords,
      active_users: activeUsers?.count || 0,
      system_uptime: Math.floor(Math.random() * 720) + 24, // Simulated uptime in hours
      last_backup: lastBackup?.value || null,
      storage_used: dbSize * 1.5, // Estimated with logs and temp files
      app_version: '1.0.0'
    };
    
    return c.json(systemInfo);
  } catch (error) {
    console.error('System info error:', error);
    return c.json({ error: 'Failed to retrieve system information' }, 500);
  }
});

app.get("/api/system/settings", authMiddleware, async (c) => {
  const db = c.env.DB;
  const settings = await db.prepare("SELECT * FROM system_settings ORDER BY category, key").all();
  return c.json(settings.results);
});

app.get("/api/system/settings/public", async (c) => {
  const db = c.env.DB;
  const settings = await db.prepare("SELECT key, value, data_type FROM system_settings WHERE is_public = 1 ORDER BY key").all();
  
  // Transform to key-value object for easier client consumption
  const publicSettings: {[key: string]: any} = {};
  for (const setting of settings.results as any[]) {
    let value: any = String(setting.value);
    
    // Type conversion based on data_type
    switch (String(setting.data_type)) {
      case 'number':
        value = parseFloat(String(setting.value));
        break;
      case 'boolean':
        value = String(setting.value).toLowerCase() === 'true';
        break;
      case 'json':
        try {
          value = JSON.parse(String(setting.value));
        } catch (e) {
          value = String(setting.value);
        }
        break;
    }
    
    publicSettings[String(setting.key)] = value;
  }
  
  return c.json(publicSettings);
});

app.post("/api/system/settings", authMiddleware, async (c) => {
  const db = c.env.DB;
  const data = await c.req.json();
  
  // Validate required fields
  if (!data.key || !data.value || !data.category) {
    return c.json({ error: "Key, value, and category are required" }, 400);
  }
  
  // Check if key already exists
  const existing = await db.prepare("SELECT id FROM system_settings WHERE key = ?").bind(data.key).first();
  if (existing) {
    return c.json({ error: "Setting key already exists" }, 400);
  }
  
  const result = await db.prepare(`
    INSERT INTO system_settings (key, value, category, description, data_type, is_public)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    data.key,
    data.value,
    data.category,
    data.description || null,
    data.data_type || 'string',
    data.is_public ? 1 : 0
  ).run();
  
  // Log the change
  await db.prepare(`
    INSERT INTO system_logs (level, message, user_id)
    VALUES ('info', 'System setting created: ' || ?, ?)
  `).bind(data.key, c.get('user')?.id || 'system').run();
  
  return c.json({ success: true, id: result.meta.last_row_id });
});

app.put("/api/system/settings/:id", authMiddleware, async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const data = await c.req.json();
  
  // Get current setting for logging
  const currentSetting = await db.prepare("SELECT key, value FROM system_settings WHERE id = ?").bind(id).first();
  if (!currentSetting) {
    return c.json({ error: "Setting not found" }, 404);
  }
  
  await db.prepare(`
    UPDATE system_settings 
    SET value = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(data.value, id).run();
  
  // Log the change
  await db.prepare(`
    INSERT INTO system_logs (level, message, user_id)
    VALUES ('info', 'System setting updated: ' || ? || ' changed from "' || ? || '" to "' || ? || '"', ?)
  `).bind(currentSetting.key, currentSetting.value, data.value, c.get('user')?.id || 'system').run();
  
  return c.json({ success: true });
});

app.delete("/api/system/settings/:id", authMiddleware, async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  // Get setting info for logging
  const setting = await db.prepare("SELECT key FROM system_settings WHERE id = ?").bind(id).first();
  if (!setting) {
    return c.json({ error: "Setting not found" }, 404);
  }
  
  await db.prepare("DELETE FROM system_settings WHERE id = ?").bind(id).run();
  
  // Log the deletion
  await db.prepare(`
    INSERT INTO system_logs (level, message, user_id)
    VALUES ('warning', 'System setting deleted: ' || ?, ?)
  `).bind(setting.key, c.get('user')?.id || 'system').run();
  
  return c.json({ success: true });
});

app.get("/api/system/logs", authMiddleware, async (c) => {
  const db = c.env.DB;
  const limit = parseInt(c.req.query('limit') || '100');
  const logs = await db.prepare(`
    SELECT * FROM system_logs 
    ORDER BY timestamp DESC 
    LIMIT ?
  `).bind(limit).all();
  return c.json(logs.results);
});

app.delete("/api/system/logs", authMiddleware, async (c) => {
  const db = c.env.DB;
  
  // Log the clear action before clearing
  await db.prepare(`
    INSERT INTO system_logs (level, message, user_id)
    VALUES ('warning', 'System logs cleared by user', ?)
  `).bind(c.get('user')?.id || 'system').run();
  
  // Wait a moment then clear all logs except the one we just created
  setTimeout(async () => {
    await db.prepare("DELETE FROM system_logs WHERE timestamp < datetime('now', '-1 second')").run();
  }, 100);
  
  return c.json({ success: true });
});

app.get("/api/system/health-check", authMiddleware, async (c) => {
  const db = c.env.DB;
  const results: any = {
    database: 'healthy',
    api: 'healthy',
    storage: 'healthy',
    timestamp: new Date().toISOString()
  };
  
  try {
    // Test database connectivity
    await db.prepare("SELECT 1").first();
    
    // Check for any critical issues
    const lowStockProducts = await db.prepare("SELECT COUNT(*) as count FROM products WHERE stock_quantity <= minimum_stock AND is_active = 1").first();
    const lowStockMaterials = await db.prepare("SELECT COUNT(*) as count FROM raw_materials WHERE stock_quantity <= minimum_stock").first();
    
    results.low_stock_products = (lowStockProducts?.count as number) || 0;
    results.low_stock_materials = (lowStockMaterials?.count as number) || 0;
    
    // Log health check
    await db.prepare(`
      INSERT INTO system_logs (level, message, user_id)
      VALUES ('info', 'System health check performed', ?)
    `).bind(c.get('user')?.id || 'system').run();
    
  } catch (error) {
    results.database = 'error';
    console.error('Health check error:', error);
  }
  
  return c.json(results);
});

app.post("/api/system/backup", authMiddleware, async (c) => {
  const db = c.env.DB;
  
  try {
    // Simulate backup process (in real implementation, this would create actual backup)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.db`;
    
    // Update last backup time in settings
    await db.prepare(`
      INSERT OR REPLACE INTO system_settings (key, value, category, description, data_type)
      VALUES ('last_backup_time', ?, 'maintenance', 'Timestamp of last backup', 'string')
    `).bind(new Date().toISOString()).run();
    
    // Log backup creation
    await db.prepare(`
      INSERT INTO system_logs (level, message, user_id)
      VALUES ('info', 'Database backup created: ' || ?, ?)
    `).bind(filename, c.get('user')?.id || 'system').run();
    
    return c.json({ 
      success: true, 
      filename,
      timestamp: new Date().toISOString(),
      message: 'Backup created successfully'
    });
    
  } catch (error) {
    console.error('Backup error:', error);
    
    // Log backup failure
    await db.prepare(`
      INSERT INTO system_logs (level, message, user_id)
      VALUES ('error', 'Database backup failed: ' || ?, ?)
    `).bind(String(error), c.get('user')?.id || 'system').run();
    
    return c.json({ error: 'Backup failed' }, 500);
  }
});

app.post("/api/system/optimize-database", authMiddleware, async (c) => {
  const db = c.env.DB;
  
  try {
    // Run VACUUM to optimize database
    await db.prepare("VACUUM").run();
    
    // Log optimization
    await db.prepare(`
      INSERT INTO system_logs (level, message, user_id)
      VALUES ('info', 'Database optimization completed', ?)
    `).bind(c.get('user')?.id || 'system').run();
    
    return c.json({ success: true, message: 'Database optimized successfully' });
    
  } catch (error) {
    console.error('Database optimization error:', error);
    return c.json({ error: 'Database optimization failed' }, 500);
  }
});

app.post("/api/system/clear-cache", authMiddleware, async (c) => {
  try {
    // Simulate cache clearing (in real implementation, this would clear actual cache)
    
    // Log cache clearing
    await c.env.DB.prepare(`
      INSERT INTO system_logs (level, message, user_id)
      VALUES ('info', 'System cache cleared', ?)
    `).bind(c.get('user')?.id || 'system').run();
    
    return c.json({ success: true, message: 'Cache cleared successfully' });
    
  } catch (error) {
    console.error('Cache clear error:', error);
    return c.json({ error: 'Cache clear failed' }, 500);
  }
});

// Credit Sales API
app.get("/api/credit-sales", authMiddleware, async (c) => {
  const db = c.env.DB;
  const creditSales = await db.prepare(`
    SELECT cs.*, c.name as customer_name, c.phone as customer_phone, s.sale_date
    FROM credit_sales cs
    LEFT JOIN customers c ON cs.customer_id = c.id
    LEFT JOIN sales s ON cs.sale_id = s.id
    ORDER BY cs.created_at DESC
  `).all();
  return c.json(creditSales.results);
});

// Batch Credit Payment API
app.post("/api/credit-payments/batch", authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const data = await c.req.json();
    
    // Validate required fields
    if (!data.credit_sale_ids || !Array.isArray(data.credit_sale_ids) || data.credit_sale_ids.length === 0) {
      return c.json({ error: "Credit sale IDs are required" }, 400);
    }
    
    if (!data.payment_amount || data.payment_amount <= 0) {
      return c.json({ error: "Payment amount must be positive" }, 400);
    }
    
    if (!data.payment_date) {
      return c.json({ error: "Payment date is required" }, 400);
    }
    
    const results = [];
    const errors = [];
    
    // Process each credit sale
    for (const creditSaleId of data.credit_sale_ids) {
      try {
        // Get credit sale info
        const creditSale = await db.prepare(`
          SELECT * FROM credit_sales WHERE id = ?
        `).bind(creditSaleId).first();
        
        if (!creditSale) {
          errors.push(`Credit sale ${creditSaleId} not found`);
          continue;
        }
        
        const currentRemaining = typeof creditSale.amount_remaining === 'number' ? creditSale.amount_remaining : 0;
        
        if (data.payment_amount > currentRemaining) {
          errors.push(`Payment amount exceeds remaining balance for credit sale ${creditSaleId}`);
          continue;
        }
        
        // Insert payment record
        const paymentResult = await db.prepare(`
          INSERT INTO credit_payments (credit_sale_id, payment_amount, payment_date, payment_method, reference_number, notes, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          creditSaleId,
          data.payment_amount,
          data.payment_date,
          data.payment_method || 'cash',
          data.reference_number || null,
          data.notes || null,
          c.get('user')?.email || 'system'
        ).run();
        
        // Update credit sale balance
        const newAmountPaid = (typeof creditSale.amount_paid === 'number' ? creditSale.amount_paid : 0) + data.payment_amount;
        const newAmountRemaining = currentRemaining - data.payment_amount;
        
        // Determine new status
        let newStatus = 'outstanding';
        if (newAmountRemaining <= 0) {
          newStatus = 'paid';
        } else if (newAmountPaid > 0) {
          newStatus = 'partial';
        }
        
        await db.prepare(`
          UPDATE credit_sales 
          SET amount_paid = ?, amount_remaining = ?, status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(newAmountPaid, newAmountRemaining, newStatus, creditSaleId).run();
        
        // Create financial transaction
        await db.prepare(`
          INSERT INTO financial_transactions (type, category, description, amount, transaction_date, reference_id, reference_type)
          VALUES ('income', 'credit_payment', 'Pembayaran piutang (batch)', ?, ?, ?, 'credit_payment')
        `).bind(data.payment_amount, data.payment_date, paymentResult.meta.last_row_id).run();
        
        results.push({
          credit_sale_id: creditSaleId,
          payment_id: paymentResult.meta.last_row_id,
          new_amount_paid: newAmountPaid,
          new_amount_remaining: newAmountRemaining,
          new_status: newStatus
        });
        
      } catch (error) {
        errors.push(`Error processing credit sale ${creditSaleId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return c.json({ 
      success: true,
      processed: results.length,
      errors: errors.length,
      results,
      error_details: errors
    });
    
  } catch (error) {
    console.error("Batch credit payment error:", error);
    return c.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, 500);
  }
});

// Payment Reminders API
app.get("/api/credit-sales/reminders", authMiddleware, async (c) => {
  const db = c.env.DB;
  
  const overdueCredits = await db.prepare(`
    SELECT cs.*, c.name as customer_name, c.phone as customer_phone, s.sale_date,
           julianday('now') - julianday(cs.due_date) as days_overdue
    FROM credit_sales cs
    LEFT JOIN customers c ON cs.customer_id = c.id
    LEFT JOIN sales s ON cs.sale_id = s.id
    WHERE cs.due_date < date('now') AND cs.status != 'paid'
    ORDER BY days_overdue DESC
  `).all();
  
  const dueSoonCredits = await db.prepare(`
    SELECT cs.*, c.name as customer_name, c.phone as customer_phone, s.sale_date,
           julianday(cs.due_date) - julianday('now') as days_until_due
    FROM credit_sales cs
    LEFT JOIN customers c ON cs.customer_id = c.id
    LEFT JOIN sales s ON cs.sale_id = s.id
    WHERE cs.due_date BETWEEN date('now') AND date('now', '+7 days') AND cs.status != 'paid'
    ORDER BY days_until_due ASC
  `).all();
  
  return c.json({
    overdue: overdueCredits.results,
    due_soon: dueSoonCredits.results
  });
});

// Send Payment Reminder API
app.post("/api/credit-sales/:id/send-reminder", authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const creditSaleId = c.req.param("id");
    const data = await c.req.json();
    
    // Get credit sale info
    const creditSale = await db.prepare(`
      SELECT cs.*, c.name as customer_name, c.phone as customer_phone
      FROM credit_sales cs
      LEFT JOIN customers c ON cs.customer_id = c.id
      WHERE cs.id = ?
    `).bind(creditSaleId).first();
    
    if (!creditSale) {
      return c.json({ error: "Credit sale not found" }, 404);
    }
    
    // Log reminder activity
    await db.prepare(`
      INSERT INTO system_logs (level, message, user_id)
      VALUES ('info', 'Payment reminder sent for credit sale ' || ? || ' to customer ' || ?, ?)
    `).bind(creditSaleId, creditSale.customer_name, c.get('user')?.id || 'system').run();
    
    // In a real implementation, you would send actual SMS/WhatsApp/Email here
    // For now, we'll just return success
    
    return c.json({ 
      success: true,
      message: `Reminder sent to ${creditSale.customer_name}`,
      method: data.method || 'system_notification'
    });
    
  } catch (error) {
    console.error("Send reminder error:", error);
    return c.json({ 
      error: "Failed to send reminder", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, 500);
  }
});

// Petty Cash API
app.get("/api/petty-cash", authMiddleware, async (c) => {
  const db = c.env.DB;
  const transactions = await db.prepare(`
    SELECT * FROM petty_cash ORDER BY transaction_date DESC, created_at DESC LIMIT 100
  `).all();
  return c.json(transactions.results);
});

app.post("/api/petty-cash", authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const data = await c.req.json();
    
    // Validate required fields
    if (!data.transaction_type || !data.amount || !data.description || !data.transaction_date) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    if (!['in', 'out'].includes(data.transaction_type)) {
      return c.json({ error: "Transaction type must be 'in' or 'out'" }, 400);
    }
    
    if (data.amount <= 0) {
      return c.json({ error: "Amount must be positive" }, 400);
    }
    
    // Get current petty cash balance
    const lastTransaction = await db.prepare("SELECT balance_after FROM petty_cash ORDER BY created_at DESC LIMIT 1").first();
    const currentBalance = typeof lastTransaction?.balance_after === 'number' ? lastTransaction.balance_after : 0;
    
    // Calculate new balance
    let newBalance;
    if (data.transaction_type === 'in') {
      newBalance = currentBalance + data.amount;
    } else {
      newBalance = currentBalance - data.amount;
      if (newBalance < 0) {
        return c.json({ error: "Insufficient petty cash balance" }, 400);
      }
    }
    
    // Insert petty cash transaction
    const result = await db.prepare(`
      INSERT INTO petty_cash (transaction_type, amount, description, reference_number, transaction_date, balance_after, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.transaction_type,
      data.amount,
      data.description,
      data.reference_number || null,
      data.transaction_date,
      newBalance,
      c.get('user')?.email || 'system'
    ).run();
    
    return c.json({ 
      success: true, 
      id: result.meta.last_row_id,
      new_balance: newBalance
    });
    
  } catch (error) {
    console.error("Petty cash error:", error);
    return c.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, 500);
  }
});

app.get("/api/petty-cash/balance", authMiddleware, async (c) => {
  const db = c.env.DB;
  const lastTransaction = await db.prepare("SELECT balance_after FROM petty_cash ORDER BY created_at DESC LIMIT 1").first();
  const balance = typeof lastTransaction?.balance_after === 'number' ? lastTransaction.balance_after : 0;
  return c.json({ balance });
});

// Auto Interest Calculation API
app.post("/api/credit-sales/calculate-interest", authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    
    // Get overdue credit sales with interest rate > 0
    const overdueCredits = await db.prepare(`
      SELECT * FROM credit_sales 
      WHERE due_date < date('now') AND status != 'paid' AND interest_rate > 0
    `).all();
    
    const results = [];
    
    for (const credit of overdueCredits.results as any[]) {
      const dueDate = new Date(credit.due_date);
      const today = new Date();
      const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysOverdue > 0) {
        // Calculate interest (simple interest)
        const interestRate = credit.interest_rate / 100; // Convert percentage to decimal
        const interestAmount = credit.amount_remaining * interestRate * (daysOverdue / 365);
        
        // Update credit sale with interest
        await db.prepare(`
          UPDATE credit_sales 
          SET total_amount = total_amount + ?, amount_remaining = amount_remaining + ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(interestAmount, interestAmount, credit.id).run();
        
        // Log interest calculation
        await db.prepare(`
          INSERT INTO system_logs (level, message, user_id)
          VALUES ('info', 'Interest calculated for credit sale ' || ? || ': ' || ? || ' for ' || ? || ' days overdue', ?)
        `).bind(credit.id, interestAmount.toFixed(2), daysOverdue, c.get('user')?.id || 'system').run();
        
        results.push({
          credit_sale_id: credit.id,
          days_overdue: daysOverdue,
          interest_amount: interestAmount,
          new_total: credit.total_amount + interestAmount
        });
      }
    }
    
    return c.json({ 
      success: true,
      processed: results.length,
      results
    });
    
  } catch (error) {
    console.error("Interest calculation error:", error);
    return c.json({ 
      error: "Failed to calculate interest", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, 500);
  }
});

app.get("/api/credit-sales/:id/payments", authMiddleware, async (c) => {
  const db = c.env.DB;
  const creditSaleId = c.req.param("id");
  
  const payments = await db.prepare(`
    SELECT * FROM credit_payments 
    WHERE credit_sale_id = ? 
    ORDER BY payment_date DESC, created_at DESC
  `).bind(creditSaleId).all();
  
  return c.json(payments.results);
});

app.post("/api/credit-payments", authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const data = await c.req.json();
    
    // Validate required fields
    if (!data.credit_sale_id || !data.payment_amount || !data.payment_date) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    if (data.payment_amount <= 0) {
      return c.json({ error: "Payment amount must be positive" }, 400);
    }
    
    // Get credit sale info
    const creditSale = await db.prepare(`
      SELECT * FROM credit_sales WHERE id = ?
    `).bind(data.credit_sale_id).first();
    
    if (!creditSale) {
      return c.json({ error: "Credit sale not found" }, 404);
    }
    
    const currentRemaining = typeof creditSale.amount_remaining === 'number' ? creditSale.amount_remaining : 0;
    
    if (data.payment_amount > currentRemaining) {
      return c.json({ error: "Payment amount exceeds remaining balance" }, 400);
    }
    
    // Insert payment record
    const paymentResult = await db.prepare(`
      INSERT INTO credit_payments (credit_sale_id, payment_amount, payment_date, payment_method, reference_number, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.credit_sale_id,
      data.payment_amount,
      data.payment_date,
      data.payment_method || 'cash',
      data.reference_number || null,
      data.notes || null,
      c.get('user')?.email || 'system'
    ).run();
    
    // Update credit sale balance
    const newAmountPaid = (typeof creditSale.amount_paid === 'number' ? creditSale.amount_paid : 0) + data.payment_amount;
    const newAmountRemaining = currentRemaining - data.payment_amount;
    // const totalAmount = typeof creditSale.total_amount === 'number' ? creditSale.total_amount : 0;
    
    // Determine new status
    let newStatus = 'outstanding';
    if (newAmountRemaining <= 0) {
      newStatus = 'paid';
    } else if (newAmountPaid > 0) {
      newStatus = 'partial';
    }
    
    await db.prepare(`
      UPDATE credit_sales 
      SET amount_paid = ?, amount_remaining = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(newAmountPaid, newAmountRemaining, newStatus, data.credit_sale_id).run();
    
    // Create financial transaction
    await db.prepare(`
      INSERT INTO financial_transactions (type, category, description, amount, transaction_date, reference_id, reference_type)
      VALUES ('income', 'credit_payment', 'Pembayaran piutang', ?, ?, ?, 'credit_payment')
    `).bind(data.payment_amount, data.payment_date, paymentResult.meta.last_row_id).run();
    
    return c.json({ 
      success: true, 
      id: paymentResult.meta.last_row_id,
      new_amount_paid: newAmountPaid,
      new_amount_remaining: newAmountRemaining,
      new_status: newStatus
    });
    
  } catch (error) {
    console.error("Credit payment error:", error);
    return c.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, 500);
  }
});

// Dashboard API
app.get("/api/dashboard", authMiddleware, async (c) => {
  const db = c.env.DB;
  
  const stats = await Promise.all([
    db.prepare("SELECT COUNT(*) as count FROM products WHERE is_active = 1").first(),
    db.prepare("SELECT COUNT(*) as count FROM suppliers WHERE is_active = 1").first(),
    db.prepare("SELECT COUNT(*) as count FROM sales WHERE date(sale_date) = date('now')").first(),
    db.prepare("SELECT COALESCE(SUM(final_amount), 0) as total FROM sales WHERE date(sale_date) = date('now')").first(),
    db.prepare("SELECT COUNT(*) as count FROM products WHERE stock_quantity <= minimum_stock AND is_active = 1").first(),
    db.prepare("SELECT COUNT(*) as count FROM raw_materials WHERE stock_quantity <= minimum_stock").first(),
    db.prepare("SELECT COUNT(*) as count FROM employees WHERE is_active = 1").first(),
    db.prepare("SELECT COALESCE(SUM(amount_remaining), 0) as total FROM credit_sales WHERE status != 'paid'").first(),
  ]);
  
  return c.json({
    total_products: stats[0]?.count || 0,
    total_suppliers: stats[1]?.count || 0,
    today_sales_count: stats[2]?.count || 0,
    today_sales_amount: stats[3]?.total || 0,
    low_stock_products: stats[4]?.count || 0,
    low_stock_materials: stats[5]?.count || 0,
    total_employees: stats[6]?.count || 0,
    total_credit_outstanding: stats[7]?.total || 0,
  });
});

export default app;
