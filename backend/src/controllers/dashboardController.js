const { getPool } = require('../config/db');

async function getStats(req, res) {
  try {
    const pool = await getPool();

    // Ventas del día (fecha servidor)
    const todayResult = await pool.request().query(`
      SELECT COUNT(*) AS cantidad, ISNULL(SUM(monto_total), 0) AS total
      FROM ventas
      WHERE CAST(fecha_creacion AS DATE) = CAST(SYSDATETIME() AS DATE)
        AND estado = 'COMPLETADA'
    `);
    const salesToday = {
      count: parseInt(todayResult.recordset[0].cantidad, 10) || 0,
      total: parseFloat(todayResult.recordset[0].total) || 0
    };

    // Productos con bajo stock (stock total vigente <= stock_minimo)
    const lowStockResult = await pool.request().query(`
      SELECT TOP 10 p.id, p.codigo_barras, p.nombre, p.stock_minimo,
             ISNULL((SELECT SUM(l.stock_actual) FROM lotes l WHERE l.producto_id = p.id AND l.estado = 'VIGENTE'), 0) AS total_stock
      FROM productos p
      WHERE p.esta_activo = 1
        AND ISNULL((SELECT SUM(l.stock_actual) FROM lotes l WHERE l.producto_id = p.id AND l.estado = 'VIGENTE'), 0) <= p.stock_minimo
      ORDER BY total_stock ASC, p.nombre
    `);
    const lowStock = lowStockResult.recordset.map(p => ({
      id: p.id,
      codigo: p.codigo_barras,
      nombre: p.nombre,
      stock_minimo: parseInt(p.stock_minimo, 10),
      total_stock: parseInt(p.total_stock, 10) || 0,
      critical: (parseInt(p.total_stock, 10) || 0) === 0
    }));

    // Productos próximos a vencer (lotes vigentes con stock, vencen en <= 30 días)
    const expiringResult = await pool.request().query(`
      SELECT TOP 10 l.id AS lote_id, l.codigo_lote, l.fecha_vencimiento, l.stock_actual,
             p.id AS producto_id, p.nombre AS producto,
             DATEDIFF(DAY, CAST(SYSDATETIME() AS DATE), l.fecha_vencimiento) AS dias_restantes
      FROM lotes l
      JOIN productos p ON p.id = l.producto_id
      WHERE l.estado = 'VIGENTE'
        AND l.stock_actual > 0
        AND p.esta_activo = 1
        AND l.fecha_vencimiento >= CAST(SYSDATETIME() AS DATE)
        AND l.fecha_vencimiento <= DATEADD(DAY, 30, CAST(SYSDATETIME() AS DATE))
      ORDER BY l.fecha_vencimiento ASC
    `);
    const expiringSoon = expiringResult.recordset.map(l => ({
      loteId: l.lote_id,
      codigoLote: l.codigo_lote,
      productoId: l.producto_id,
      producto: l.producto,
      fechaVencimiento: l.fecha_vencimiento,
      stock: parseInt(l.stock_actual, 10) || 0,
      diasRestantes: parseInt(l.dias_restantes, 10) || 0
    }));

    // Productos más vendidos (últimos 30 días, por cantidad)
    const topResult = await pool.request().query(`
      SELECT TOP 10 p.id, p.nombre, p.codigo_barras,
             SUM(iv.cantidad) AS cantidad_vendida,
             ISNULL(SUM(iv.subtotal), 0) AS ingreso_total
      FROM items_venta iv
      JOIN ventas v ON v.id = iv.venta_id
      JOIN productos p ON p.id = iv.producto_id
      WHERE v.fecha_creacion >= DATEADD(DAY, -30, SYSDATETIME())
        AND v.estado = 'COMPLETADA'
      GROUP BY p.id, p.nombre, p.codigo_barras
      ORDER BY cantidad_vendida DESC
    `);
    const topProducts = topResult.recordset.map(p => ({
      id: p.id,
      nombre: p.nombre,
      codigo: p.codigo_barras,
      cantidadVendida: parseInt(p.cantidad_vendida, 10) || 0,
      ingresoTotal: parseFloat(p.ingreso_total) || 0
    }));

    // Alertas pendientes (contador rápido para el dashboard)
    const alertCountResult = await pool.request().query(`SELECT COUNT(*) AS c FROM alertas_stock WHERE estado = 'PENDIENTE'`);
    const pendingAlertsCount = parseInt(alertCountResult.recordset[0]?.c ?? alertCountResult.recordset[0]?.pendingCount ?? 0, 10) || 0;

    const payload = {
      salesToday,
      lowStockCount: lowStock.length,
      lowStock,
      expiringSoonCount: expiringSoon.length,
      expiringSoon,
      topProducts,
      pendingAlerts: pendingAlertsCount
    };

    res.json({
      stats: payload,
      ...payload
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { getStats };
