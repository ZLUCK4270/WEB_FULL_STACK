const { getPool } = require('../config/db');

async function listAuditLogs(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT TOP 100 a.id, a.accion, a.modulo, a.tabla_afectada, a.fecha_creacion,
             u.nombre + ' ' + u.apellido AS usuario
      FROM registros_auditoria_sistema a
      LEFT JOIN perfiles_usuario u ON a.usuario_id = u.id
      ORDER BY a.fecha_creacion DESC
    `);
    res.json({ auditLogs: result.recordset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { listAuditLogs };
