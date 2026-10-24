const { getPool } = require('../config/db');

async function listCustomers(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT id, tipo_documento, numero_documento, nombre_completo, telefono, correo, direccion,
             fecha_creacion, fecha_actualizacion
      FROM clientes
      ORDER BY nombre_completo
    `);
    res.json({ customers: result.recordset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createCustomer(req, res) {
  try {
    const { docType, docNumber, fullName, phone, email, address, allergies, chronicConditions } = req.body;

    if (!docNumber || !fullName) {
      return res.status(400).json({ error: 'Número de documento y nombre completo requeridos' });
    }

    const pool = await getPool();

    // Verificar duplicado
    const existing = await pool.request()
      .input('docNumber', docNumber)
      .query('SELECT id FROM clientes WHERE numero_documento = @docNumber');

    if (existing.recordset.length > 0) {
      return res.status(409).json({ error: 'Ya existe un cliente con ese documento' });
    }

    const result = await pool.request()
      .input('docType', docType || 'DNI')
      .input('docNumber', docNumber)
      .input('fullName', fullName)
      .input('phone', phone || null)
      .input('email', email || null)
      .input('address', address || null)
      .query(`
        INSERT INTO clientes (tipo_documento, numero_documento, nombre_completo, telefono, correo, direccion)
        OUTPUT INSERTED.id
        VALUES (@docType, @docNumber, @fullName, @phone, @email, @address)
      `);

    const customerId = result.recordset[0].id;

    // Registrar auditoría
    await pool.request()
      .input('usuarioId', req.user.id)
      .input('accion', 'CREATE_CUSTOMER')
      .input('modulo', 'customers')
      .input('tablaAfectada', 'clientes')
      .input('registroId', customerId.toString())
      .input('datosNuevos', JSON.stringify({ fullName, docNumber }))
      .query(`
        INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
        VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, @registroId, @datosNuevos)
      `);

    res.status(201).json({ success: true, customerId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getCustomer(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool.request()
      .input('id', id)
      .query('SELECT * FROM clientes WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ customer: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { listCustomers, createCustomer, getCustomer };
