const { processFEFOTransaction } = require('../services/fefoService');
const { getPool } = require('../config/db');

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

async function createSale(req, res) {
  try {
    const { items, paymentMethod = 'efectivo', amountPaid, customerId, receiptType = 'boleta' } = req.body;
    const cashierId = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El carrito no puede estar vacío' });
    }

    // Validar cliente opcional antes de iniciar la transacción de venta
    if (customerId) {
      const pool = await getPool();
      const customerCheck = await pool.request()
        .input('customerId', customerId)
        .query('SELECT id FROM clientes WHERE id = @customerId');
      if (customerCheck.recordset.length === 0) {
        return res.status(400).json({ error: 'El cliente indicado no existe' });
      }
    }

    const result = await processFEFOTransaction(items, cashierId, { customerId: customerId || null });

    // Registrar auditoría
    const pool = await getPool();
    await pool.request()
      .input('usuarioId', cashierId)
      .input('accion', 'CREATE_SALE')
      .input('modulo', 'pos_sales')
      .input('tablaAfectada', 'ventas')
      .input('registroId', result.sale.id.toString())
      .input('datosNuevos', JSON.stringify({ saleId: result.sale.id, codigo: result.sale.saleCode, total: result.sale.totalAmount, cliente: customerId || null }))
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
    const { from, to, customer, search, page = 1, limit = DEFAULT_LIMIT } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(String(limit), 10) || DEFAULT_LIMIT), MAX_LIMIT);
    const offset = (pageNum - 1) * limitNum;

    const request = pool.request();

    if (from) request.input('from', from);
    if (to) request.input('to', to);
    if (customer) request.input('customer', customer);
    if (search) request.input('search', `%${search}%`);

    const whereClauses = [];
    if (from) whereClauses.push('CAST(v.fecha_creacion AS DATE) >= @from');
    if (to) whereClauses.push('CAST(v.fecha_creacion AS DATE) <= @to');
    if (customer) whereClauses.push('v.cliente_id = @customer');
    if (search) whereClauses.push("(v.codigo_venta LIKE @search)");

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countResult = await request.query(`
      SELECT COUNT(*) AS total FROM ventas v ${whereSql}
    `);
    const total = countResult.recordset[0].total;

    request.input('limit', limitNum);
    request.input('offset', offset);

    const result = await request.query(`
      SELECT v.id, v.codigo_venta, v.fecha_creacion, v.monto_total, v.metodo_pago, v.estado,
             u.nombre + ' ' + u.apellido AS cajero,
             c.nombre_completo AS cliente,
             c.numero_documento AS cliente_doc
      FROM ventas v
      LEFT JOIN perfiles_usuario u ON v.cajero_id = u.id
      LEFT JOIN clientes c ON v.cliente_id = c.id
      ${whereSql}
      ORDER BY v.fecha_creacion DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    res.json({ sales: result.recordset, page: pageNum, limit: limitNum, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getSale(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const saleResult = await pool.request()
      .input('id', id)
      .query(`
        SELECT v.id, v.codigo_venta, v.fecha_creacion, v.monto_total, v.metodo_pago, v.estado,
               u.nombre + ' ' + u.apellido AS cajero,
               c.nombre_completo AS cliente,
               c.numero_documento AS cliente_doc
        FROM ventas v
        LEFT JOIN perfiles_usuario u ON v.cajero_id = u.id
        LEFT JOIN clientes c ON v.cliente_id = c.id
        WHERE v.id = @id
      `);

    if (saleResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const itemsResult = await pool.request()
      .input('id', id)
      .query(`
        SELECT iv.id, iv.producto_id, p.nombre AS productName, p.codigo_barras AS codigo,
               iv.precio_unitario AS unitPrice, iv.cantidad, iv.subtotal
        FROM items_venta iv
        JOIN productos p ON iv.producto_id = p.id
        WHERE iv.venta_id = @id
      `);

    // Lotes despachados por ítem
    const enrichedItems = [];
    for (const it of itemsResult.recordset) {
      const lotesResult = await pool.request()
        .input('itemId', it.id)
        .query(`
          SELECT ivl.lote_id, l.codigo_lote AS batchCode, l.fecha_vencimiento AS expirationDate, ivl.cantidad
          FROM items_venta_lotes ivl
          JOIN lotes l ON ivl.lote_id = l.id
          WHERE ivl.item_venta_id = @itemId
        `);
      enrichedItems.push({
        id: it.id,
        productId: it.producto_id,
        productName: it.productName,
        codigo: it.codigo,
        unitPrice: parseFloat(it.unitPrice),
        quantity: it.cantidad,
        subtotal: parseFloat(it.subtotal),
        batches: lotesResult.recordset
      });
    }

    res.json({
      sale: {
        ...saleResult.recordset[0],
        monto_total: parseFloat(saleResult.recordset[0].monto_total),
        items: enrichedItems
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { createSale, listSales, getSale };
