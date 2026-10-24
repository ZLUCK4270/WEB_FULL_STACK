const { processFEFOTransaction } = require('../services/fefoService');
const { getPool } = require('../config/db');

async function createSale(req, res) {
  try {
    const { items, paymentMethod = 'efectivo', amountPaid, customerId, receiptType = 'boleta' } = req.body;
    const cashierId = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El carrito no puede estar vacío' });
    }

    const result = await processFEFOTransaction(items, cashierId);

    // Registrar auditoría
    const pool = await getPool();
    await pool.request()
      .input('usuarioId', cashierId)
      .input('accion', 'CREATE_SALE')
      .input('modulo', 'pos_sales')
      .input('tablaAfectada', 'ventas')
      .input('registroId', result.sale.id.toString())
      .input('datosNuevos', JSON.stringify(result.sale))
      .query(`
        INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
        VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, @registroId, @datosNuevos)
      `);

    res.status(201).json({ success: true, sale: result.sale });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
}

async function listSales(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT v.id, v.codigo_venta, v.fecha_creacion, v.monto_total, v.metodo_pago, v.estado,
             u.nombre + ' ' + u.apellido AS cajero
      FROM ventas v
      LEFT JOIN perfiles_usuario u ON v.cajero_id = u.id
      ORDER BY v.fecha_creacion DESC
    `);
    res.json({ sales: result.recordset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { createSale, listSales };
