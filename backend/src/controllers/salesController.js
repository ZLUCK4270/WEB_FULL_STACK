const { processFEFOTransaction, voidSaleTransaction } = require('../services/fefoService');
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

    const result = await processFEFOTransaction(items, cashierId, {
      customerId: customerId || null,
      paymentMethod,
      amountPaid,
      receiptType
    });

    // Registrar auditoría
    const pool = await getPool();
    await pool.request()
      .input('usuarioId', cashierId)
      .input('accion', 'CREATE_SALE')
      .input('modulo', 'pos_sales')
      .input('tablaAfectada', 'ventas')
      .input('registroId', result.sale.id.toString())
      .input('datosNuevos', JSON.stringify({
        saleId: result.sale.id,
        codigo: result.sale.saleCode,
        total: result.sale.totalAmount,
        cliente: customerId || null,
        metodoPago: paymentMethod
      }))
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

async function voidSale(req, res) {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const userId = req.user.id;

    if (!motivo || String(motivo).trim().length < 5) {
      return res.status(400).json({ error: 'Debe ingresar un motivo válido de anulación (mínimo 5 caracteres)' });
    }

    const result = await voidSaleTransaction(id, userId, String(motivo).trim());

    // Registrar auditoría
    const pool = await getPool();
    await pool.request()
      .input('usuarioId', userId)
      .input('accion', 'VOID_SALE')
      .input('modulo', 'pos_sales')
      .input('tablaAfectada', 'ventas')
      .input('registroId', id)
      .input('datosNuevos', JSON.stringify({ saleId: id, motivo }))
      .query(`
        INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
        VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, @registroId, @datosNuevos)
      `);

    res.json({ success: true, message: result.message });
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

    const result = await request.query(`
      SELECT v.id, v.codigo_venta, v.fecha_creacion, v.subtotal, v.monto_igv, v.monto_total,
             v.metodo_pago, v.tipo_comprobante, v.estado, v.motivo_anulacion, v.fecha_anulacion,
             u.nombre + ' ' + u.apellido AS cajero,
             c.nombre_completo AS cliente,
             c.numero_documento AS cliente_doc
      FROM ventas v
      LEFT JOIN perfiles_usuario u ON v.cajero_id = u.id
      LEFT JOIN clientes c ON v.cliente_id = c.id
      ORDER BY v.fecha_creacion DESC
    `);

    let sales = result.recordset;
    if (search) {
      const q = String(search).replace(/%/g, '').toLowerCase();
      sales = sales.filter(s =>
        s.codigo_venta.toLowerCase().includes(q) ||
        (s.cliente && s.cliente.toLowerCase().includes(q))
      );
    }

    const total = sales.length;
    const paginated = sales.slice(offset, offset + limitNum);

    res.json({ sales: paginated, page: pageNum, limit: limitNum, total });
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
        SELECT v.id, v.codigo_venta, v.fecha_creacion, v.subtotal, v.monto_igv, v.monto_total,
               v.metodo_pago, v.tipo_comprobante, v.estado, v.motivo_anulacion, v.fecha_anulacion,
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

    res.json({
      sale: {
        ...saleResult.recordset[0],
        monto_total: parseFloat(saleResult.recordset[0].monto_total),
        items: itemsResult.recordset
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { createSale, voidSale, listSales, getSale };
