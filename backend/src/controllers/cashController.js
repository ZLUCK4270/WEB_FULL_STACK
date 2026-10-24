const { getPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function openCashRegister(req, res) {
  try {
    const { initialFund, shift = 'MAÑANA' } = req.body;
    const cashierId = req.user.id;
    const registerId = uuidv4();

    const pool = await getPool();
    await pool.request()
      .input('usuarioId', cashierId)
      .input('accion', 'OPEN_CASH_REGISTER')
      .input('modulo', 'cash_register')
      .input('tablaAfectada', 'registros_auditoria_sistema')
      .input('registroId', registerId)
      .input('datosNuevos', JSON.stringify({ initialFund: parseFloat(initialFund) || 0, shift }))
      .query(`
        INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
        VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, @registroId, @datosNuevos)
      `);

    res.status(201).json({
      success: true,
      cashRegister: {
        id: registerId,
        cashierId,
        initialFund: parseFloat(initialFund) || 0,
        currentCash: parseFloat(initialFund) || 0,
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
    const cashierId = req.user.id;
    const pool = await getPool();

    await pool.request()
      .input('usuarioId', cashierId)
      .input('accion', 'CLOSE_CASH_REGISTER')
      .input('modulo', 'cash_register')
      .input('tablaAfectada', 'registros_auditoria_sistema')
      .input('datosNuevos', JSON.stringify({ countedCash: parseFloat(countedCash) || 0 }))
      .query(`
        INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
        VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, NULL, @datosNuevos)
      `);

    res.json({ success: true, countedCash, message: 'Caja cerrada y arqueo registrado en auditoría' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { openCashRegister, closeCashRegister };
