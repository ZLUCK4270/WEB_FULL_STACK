const { getPool } = require('../config/db');

async function openCashRegister(req, res) {
  try {
    const { initialFund, shift } = req.body;
    const cashierId = req.user.id;

    const pool = await getPool();
    const result = await pool.request()
      .input('cashierId', cashierId)
      .input('initialFund', initialFund)
      .input('shift', shift)
      .query(`
        INSERT INTO movimientos_stock (producto_id, usuario_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, referencia_id)
        OUTPUT INSERTED.id
        VALUES (NULL, @cashierId, 'ENTRADA_COMPRA', 0, 0, 0, 'Apertura de caja fondo inicial', NULL)
      `);

    res.status(201).json({
      success: true,
      cashRegister: {
        id: result.recordset[0].id,
        cashierId,
        initialFund,
        currentCash: initialFund,
        shift,
        isOpen: true,
        openedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function closeCashRegister(req, res) {
  try {
    const { countedCash } = req.body;
    res.json({ success: true, countedCash, message: 'Caja cerrada (implementar arqueo completo)' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { openCashRegister, closeCashRegister };
