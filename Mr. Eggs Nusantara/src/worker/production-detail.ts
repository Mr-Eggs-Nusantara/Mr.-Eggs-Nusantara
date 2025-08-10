import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

// Get production batch detail with inputs and outputs
app.get("/api/production/:id", async (c) => {
  const db = c.env.DB;
  const batchId = c.req.param("id");
  
  // Get batch info
  const batch = await db.prepare(`
    SELECT * FROM production_batches WHERE id = ?
  `).bind(batchId).first();
  
  if (!batch) {
    return c.json({ error: "Batch not found" }, 404);
  }
  
  // Get inputs with raw material details
  const inputs = await db.prepare(`
    SELECT pi.*, rm.name as raw_material_name, rm.unit as raw_material_unit, rm.unit_cost,
           (pi.quantity_used * rm.unit_cost) as total_cost
    FROM production_inputs pi
    JOIN raw_materials rm ON pi.raw_material_id = rm.id
    WHERE pi.batch_id = ?
  `).bind(batchId).all();
  
  // Get outputs with product details
  const outputs = await db.prepare(`
    SELECT po.*, p.name as product_name, p.unit as product_unit, p.cost_price as hpp_per_unit,
           (po.quantity_produced * p.cost_price) as total_hpp
    FROM production_outputs po
    JOIN products p ON po.product_id = p.id
    WHERE po.batch_id = ?
  `).bind(batchId).all();
  
  return c.json({
    ...batch,
    inputs: inputs.results,
    outputs: outputs.results
  });
});

export default app;
