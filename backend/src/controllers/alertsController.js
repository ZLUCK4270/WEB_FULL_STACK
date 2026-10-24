const { getPool } = require('../config/db');

async function listAlerts(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT a.id, a.tipo_alerta, a.estado, a.mensaje, a.fecha_creacion,
             p.nombre AS producto
      FROM alertas_stock a
      LEFT JOIN productos p ON a.producto_id = p.id
      ORDER BY a.fecha_creacion DESC
    `);
    res.json({ alerts: result.recordset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { listAlerts };
