const { getPool, evaluateAlerts } = require('../config/db');

async function generateAlerts(req, res) {
  try {
    evaluateAlerts(null, true);
    const pool = await getPool();
    const countResult = await pool.request().query(`SELECT COUNT(*) AS c FROM alertas_stock WHERE estado = 'PENDIENTE'`);
    const count = parseInt(countResult.recordset[0]?.c ?? countResult.recordset[0]?.pendingCount ?? 0, 10) || 0;
    res.json({ success: true, pendingCount: count, pendingAlerts: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function listAlerts(req, res) {
  try {
    const pool = await getPool();
    const { estado } = req.query;
    const request = pool.request();
    if (estado) request.input('estado', estado);

    const result = await request.query(`
      SELECT a.id, a.tipo_alerta, a.estado, a.mensaje, a.origen_disparador, a.fecha_creacion, a.fecha_actualizacion,
             p.id AS producto_id, p.nombre AS producto, p.codigo_barras,
             l.id AS lote_id, l.codigo_lote, l.fecha_vencimiento,
             u.nombre + ' ' + u.apellido AS resuelto_por
      FROM alertas_stock a
      LEFT JOIN productos p ON a.producto_id = p.id
      LEFT JOIN lotes l ON a.lote_id = l.id
      LEFT JOIN perfiles_usuario u ON a.resuelto_por_id = u.id
      ORDER BY a.fecha_creacion DESC
    `);

    let alerts = result.recordset;
    if (estado && estado !== 'ALL' && estado !== 'TODAS') {
      if (estado === 'RESUELTA' || estado === 'RESUELTO') {
        alerts = alerts.filter(a => a.estado === 'RESUELTA' || a.estado === 'RESUELTO');
      } else {
        alerts = alerts.filter(a => a.estado === estado);
      }
    }

    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function countAlerts(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`SELECT COUNT(*) AS c FROM alertas_stock WHERE estado = 'PENDIENTE'`);
    const count = parseInt(result.recordset[0]?.c ?? result.recordset[0]?.pendingCount ?? 0, 10) || 0;
    res.json({ pendingCount: count, pendingAlerts: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function resolveAlert(req, res) {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', id)
      .input('usuarioId', usuarioId)
      .query(`
        UPDATE alertas_stock
        SET estado = 'RESUELTA', resuelto_por_id = @usuarioId,
            fecha_resolucion = SYSDATETIME(), fecha_actualizacion = SYSDATETIME()
        OUTPUT INSERTED.id, INSERTED.estado
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }

    await pool.request()
      .input('usuarioId', usuarioId)
      .input('accion', 'RESOLVE_ALERT')
      .input('modulo', 'alerts')
      .input('tablaAfectada', 'alertas_stock')
      .input('registroId', id)
      .input('datosNuevos', JSON.stringify({ estado: 'RESUELTA' }))
      .query(`
        INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
        VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, @registroId, @datosNuevos)
      `);

    res.json({ success: true, alertId: id, estado: 'RESUELTA' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { generateAlerts, listAlerts, countAlerts, resolveAlert };
