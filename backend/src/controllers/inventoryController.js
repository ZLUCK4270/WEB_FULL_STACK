const { getPool } = require('../config/db');
const { getValidBatchesForProduct } = require('../services/fefoService');

async function listProducts(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT p.id, p.codigo_barras, p.nombre, p.nombre_generico, p.precio_venta, p.costo,
             p.stock_minimo, p.requiere_receta, p.es_controlado, p.esta_activo,
             c.nombre AS categoria, l.nombre AS laboratorio
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN laboratorios l ON p.laboratorio_id = l.id
      WHERE p.esta_activo = 1
      ORDER BY p.nombre
    `);
    res.json({ products: result.recordset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function listBatches(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT l.id, l.codigo_lote, l.fecha_vencimiento, l.stock_actual, l.estado,
             p.nombre AS producto
      FROM lotes l
      LEFT JOIN productos p ON l.producto_id = p.id
      ORDER BY l.fecha_vencimiento ASC
    `);
    res.json({ batches: result.recordset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getProductStock(req, res) {
  try {
    const { productId } = req.params;
    const stock = await getValidBatchesForProduct(productId);
    const total = stock.reduce((sum, b) => sum + b.stock_actual, 0);
    res.json({ productId, totalStock: total, batches: stock });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { listProducts, listBatches, getProductStock };
