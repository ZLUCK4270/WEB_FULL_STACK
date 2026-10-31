const { getPool, sql } = require('../config/db');

/**
 * Genera alertas de reposición y vencimiento basadas en el estado real del inventario.
 * Idempotente: no duplica alertas PENDIENTE para el mismo producto + tipo.
 * Tipos: STOCK_BAJO (total_stock <= stock_minimo), VENCIMIENTO_CERCA (lote vence en <= 30 días),
 * VENCIDO (lote ya vencido con stock).
 */
async function generateAlerts(req, res) {
  try {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const usuarioId = req.user ? req.user.id : null;

      // --- 1. STOCK BAJO: producto activo con stock total vigente <= stock_minimo ---
      const lowStock = await transaction.request().query(`
        SELECT p.id AS producto_id, p.nombre AS producto_nombre, p.stock_minimo,
               ISNULL((SELECT SUM(l.stock_actual) FROM lotes l WHERE l.producto_id = p.id AND l.estado = 'VIGENTE'), 0) AS total_stock
        FROM productos p
        WHERE p.esta_activo = 1
          AND ISNULL((SELECT SUM(l.stock_actual) FROM lotes l WHERE l.producto_id = p.id AND l.estado = 'VIGENTE'), 0) <= p.stock_minimo
      `);

      for (const row of lowStock.recordset) {
        const existe = await transaction.request()
          .input('productoId', row.producto_id)
          .input('tipo', 'STOCK_BAJO')
          .query(`SELECT id FROM alertas_stock WHERE producto_id = @productoId AND tipo_alerta = @tipo AND estado = 'PENDIENTE'`);
        if (existe.recordset.length > 0) continue;

        const mensaje = row.total_stock === 0
          ? `SIN STOCK: "${row.producto_nombre}" no tiene unidades disponibles para la venta.`
          : `STOCK BAJO: "${row.producto_nombre}" tiene ${row.total_stock} uds. (mínimo configurado: ${row.stock_minimo}).`;

        await transaction.request()
          .input('productoId', row.producto_id)
          .input('tipo', 'STOCK_BAJO')
          .input('estado', 'PENDIENTE')
          .input('mensaje', mensaje)
          .input('origen', 'VENTA_AJUSTE')
          .query(`
            INSERT INTO alertas_stock (producto_id, tipo_alerta, estado, mensaje, origen_disparador)
            VALUES (@productoId, @tipo, @estado, @mensaje, @origen)
          `);
      }

      // --- 2. VENCIMIENTO CERCA: lote vigente con stock que vence en <= 30 días ---
      const cerca = await transaction.request().query(`
        SELECT l.id AS lote_id, l.producto_id, p.nombre AS producto_nombre, l.codigo_lote,
               l.fecha_vencimiento, l.stock_actual,
               DATEDIFF(DAY, CAST(SYSDATETIME() AS DATE), l.fecha_vencimiento) AS dias_restantes
        FROM lotes l
        JOIN productos p ON p.id = l.producto_id
        WHERE l.estado = 'VIGENTE'
          AND l.stock_actual > 0
          AND p.esta_activo = 1
          AND l.fecha_vencimiento >= CAST(SYSDATETIME() AS DATE)
          AND l.fecha_vencimiento <= DATEADD(DAY, 30, CAST(SYSDATETIME() AS DATE))
      `);

      for (const row of cerca.recordset) {
        const existe = await transaction.request()
          .input('productoId', row.producto_id)
          .input('loteId', row.lote_id)
          .input('tipo', 'VENCIMIENTO_CERCA')
          .query(`SELECT id FROM alertas_stock WHERE producto_id = @productoId AND lote_id = @loteId AND tipo_alerta = @tipo AND estado = 'PENDIENTE'`);
        if (existe.recordset.length > 0) continue;

        await transaction.request()
          .input('productoId', row.producto_id)
          .input('loteId', row.lote_id)
          .input('tipo', 'VENCIMIENTO_CERCA')
          .input('estado', 'PENDIENTE')
          .input('mensaje', `VENCIMIENTO PRÓXIMO: lote ${row.codigo_lote} de "${row.producto_nombre}" vence en ${row.dias_restantes} día(s) (${row.fecha_vencimiento}). Stock: ${row.stock_actual} uds.`)
          .input('origen', 'VENTA_AJUSTE')
          .query(`
            INSERT INTO alertas_stock (producto_id, lote_id, tipo_alerta, estado, mensaje, origen_disparador)
            VALUES (@productoId, @loteId, @tipo, @estado, @mensaje, @origen)
          `);
      }

      // --- 3. VENCIDO: lote vencido con stock remanente ---
      const vencidos = await transaction.request().query(`
        SELECT l.id AS lote_id, l.producto_id, p.nombre AS producto_nombre, l.codigo_lote,
               l.fecha_vencimiento, l.stock_actual
        FROM lotes l
        JOIN productos p ON p.id = l.producto_id
        WHERE l.estado = 'VIGENTE'
          AND l.stock_actual > 0
          AND p.esta_activo = 1
          AND l.fecha_vencimiento < CAST(SYSDATETIME() AS DATE)
      `);

      for (const row of vencidos.recordset) {
        const existe = await transaction.request()
          .input('productoId', row.producto_id)
          .input('loteId', row.lote_id)
          .input('tipo', 'VENCIDO')
          .query(`SELECT id FROM alertas_stock WHERE producto_id = @productoId AND lote_id = @loteId AND tipo_alerta = @tipo AND estado = 'PENDIENTE'`);
        if (existe.recordset.length > 0) continue;

        await transaction.request()
          .input('productoId', row.producto_id)
          .input('loteId', row.lote_id)
          .input('tipo', 'VENCIDO')
          .input('estado', 'PENDIENTE')
          .input('mensaje', `LOTE VENCIDO: ${row.codigo_lote} de "${row.producto_nombre}" venció el ${row.fecha_vencimiento} con ${row.stock_actual} uds. en stock. No despachar.`)
          .input('origen', 'VENTA_AJUSTE')
          .query(`
            INSERT INTO alertas_stock (producto_id, lote_id, tipo_alerta, estado, mensaje, origen_disparador)
            VALUES (@productoId, @loteId, @tipo, @estado, @mensaje, @origen)
          `);
      }

      await transaction.commit();

      const countResult = await pool.request().query(`SELECT COUNT(*) AS c FROM alertas_stock WHERE estado = 'PENDIENTE'`);

      res.json({ success: true, pendingCount: countResult.recordset[0].c });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function listAlerts(req, res) {
  try {
    const pool = await getPool();
    const { estado = 'PENDIENTE' } = req.query;
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
      WHERE a.estado = @estado
      ORDER BY a.fecha_creacion DESC
    `);
    res.json({ alerts: result.recordset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function countAlerts(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`SELECT COUNT(*) AS c FROM alertas_stock WHERE estado = 'PENDIENTE'`);
    res.json({ pendingCount: parseInt(result.recordset[0].c, 10) });
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
        SET estado = 'RESUELTO', resuelto_por_id = @usuarioId,
            fecha_resolucion = SYSDATETIME(), fecha_actualizacion = SYSDATETIME()
        OUTPUT INSERTED.id, INSERTED.estado
        WHERE id = @id AND estado = 'PENDIENTE'
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Alerta no encontrada o ya resuelta' });
    }

    // Auditoría
    await pool.request()
      .input('usuarioId', usuarioId)
      .input('accion', 'RESOLVE_ALERT')
      .input('modulo', 'alerts')
      .input('tablaAfectada', 'alertas_stock')
      .input('registroId', id)
      .input('datosNuevos', JSON.stringify({ estado: 'RESUELTO' }))
      .query(`
        INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
        VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, @registroId, @datosNuevos)
      `);

    res.json({ success: true, alertId: id, estado: 'RESUELTO' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { generateAlerts, listAlerts, countAlerts, resolveAlert };
