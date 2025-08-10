import z from "zod";

// Supplier schemas
export const SupplierSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Nama supplier harus diisi"),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  address: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type Supplier = z.infer<typeof SupplierSchema>;

// Raw Material schemas
export const RawMaterialSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Nama bahan baku harus diisi"),
  unit: z.string().min(1, "Satuan harus diisi"),
  stock_quantity: z.number().default(0),
  unit_cost: z.number().default(0),
  minimum_stock: z.number().default(0),
});

export type RawMaterial = z.infer<typeof RawMaterialSchema>;

// Product schemas
export const ProductSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Nama produk harus diisi"),
  description: z.string().optional(),
  unit: z.string().min(1, "Satuan harus diisi"),
  selling_price: z.number().positive("Harga jual harus lebih dari 0"),
  cost_price: z.number().default(0),
  stock_quantity: z.number().default(0),
  minimum_stock: z.number().default(0),
  is_active: z.boolean().default(true),
});

export type Product = z.infer<typeof ProductSchema>;

// Purchase schemas
export const PurchaseItemSchema = z.object({
  raw_material_id: z.number(),
  quantity: z.number().positive("Jumlah harus lebih dari 0"),
  unit_price: z.number().positive("Harga satuan harus lebih dari 0"),
});

export const PurchaseSchema = z.object({
  id: z.number().optional(),
  supplier_id: z.number().positive("Supplier harus dipilih"),
  purchase_date: z.string(),
  items: z.array(PurchaseItemSchema).min(1, "Minimal harus ada 1 item"),
  notes: z.string().optional(),
});

export type Purchase = z.infer<typeof PurchaseSchema>;
export type PurchaseItem = z.infer<typeof PurchaseItemSchema>;

// Production schemas
export const ProductionInputSchema = z.object({
  raw_material_id: z.number(),
  quantity_used: z.number().positive(),
});

export const ProductionOutputSchema = z.object({
  product_id: z.number(),
  quantity_produced: z.number().positive(),
});

export const ProductionBatchSchema = z.object({
  id: z.number().optional(),
  batch_number: z.string().min(1, "Nomor batch harus diisi"),
  production_date: z.string(),
  inputs: z.array(ProductionInputSchema),
  outputs: z.array(ProductionOutputSchema),
  notes: z.string().optional(),
});

export type ProductionBatch = z.infer<typeof ProductionBatchSchema>;

// Customer schemas
export const CustomerSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Nama pelanggan harus diisi"),
  phone: z.string().optional(),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  address: z.string().optional(),
  customer_type: z.enum(["umum", "toko", "grosir"]).default("umum"),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Customer = z.infer<typeof CustomerSchema>;

// Sale schemas
export const SaleItemSchema = z.object({
  product_id: z.number(),
  quantity: z.number().positive("Jumlah harus lebih dari 0"),
  unit_price: z.number().positive("Harga satuan harus lebih dari 0"),
  discount_amount: z.number().default(0),
});

export const SaleSchema = z.object({
  id: z.number().optional(),
  customer_id: z.number().optional(),
  sale_date: z.string(),
  items: z.array(SaleItemSchema).min(1, "Minimal harus ada 1 item"),
  discount_amount: z.number().default(0),
  tax_amount: z.number().default(0),
  payment_method: z.enum(["cash", "transfer", "credit"]).default("cash"),
  notes: z.string().optional(),
  total_amount: z.number().optional(),
  final_amount: z.number().optional(),
  created_at: z.string().optional(),
});

export type Sale = z.infer<typeof SaleSchema>;
export type SaleItem = z.infer<typeof SaleItemSchema>;

// Financial Transaction schemas
export const FinancialTransactionSchema = z.object({
  id: z.number().optional(),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Kategori harus diisi"),
  description: z.string().min(1, "Deskripsi harus diisi"),
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  transaction_date: z.string(),
  reference_id: z.number().optional(),
  reference_type: z.string().optional(),
});

export type FinancialTransaction = z.infer<typeof FinancialTransactionSchema>;

// Product Recipe schemas
export const ProductRecipeItemSchema = z.object({
  raw_material_id: z.number(),
  quantity_needed: z.number().positive("Jumlah bahan baku harus lebih dari 0"),
});

export const ProductRecipeSchema = z.object({
  id: z.number().optional(),
  product_id: z.number(),
  raw_material_id: z.number(),
  quantity_needed: z.number().positive("Jumlah bahan baku harus lebih dari 0"),
});

export type ProductRecipe = z.infer<typeof ProductRecipeSchema>;
export type ProductRecipeItem = z.infer<typeof ProductRecipeItemSchema>;

// Price Tier schemas
export const PriceTierSchema = z.object({
  id: z.number().optional(),
  product_id: z.number(),
  tier_type: z.enum(["umum", "toko", "grosir"]),
  price: z.number().positive("Harga harus lebih dari 0"),
  minimum_quantity: z.number().positive("Minimum quantity harus lebih dari 0").default(1),
});

export type PriceTier = z.infer<typeof PriceTierSchema>;

// Employee schemas
export const EmployeeSchema = z.object({
  id: z.number().optional(),
  employee_id: z.string().min(1, "ID karyawan harus diisi"),
  name: z.string().min(1, "Nama karyawan harus diisi"),
  position: z.string().min(1, "Jabatan harus diisi"),
  department: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  address: z.string().optional(),
  hire_date: z.string().min(1, "Tanggal masuk harus diisi"),
  salary: z.number().default(0),
  is_active: z.boolean().default(true),
  notes: z.string().optional(),
});

export type Employee = z.infer<typeof EmployeeSchema>;
