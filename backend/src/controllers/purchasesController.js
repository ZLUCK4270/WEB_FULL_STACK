const { getPool } = require('../config/db');

async function listPurchases(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT p.id, p.codigo_compra, p.estado, p.monto_total, p.fecha_creacion,
             pr.razon_social AS proveedor,
             u.nombre + ' ' + u.apellido AS comprador
      FROM compras p
      LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
      LEFT JOIN perfiles_usuario u ON p.comprador_id = u.id
      ORDER BY p.fecha_creacion DESC
    `);
    res.json({ purchases: result.recordset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createPurchase(req, res) {
  try {
    const { supplierId, items, invoiceNumber, invoiceDate, notes, totalAmount } = req.body;
    const buyerId = req.user.id;

    if (!supplierId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Proveedor e ítems requeridos' });
    }

    const pool = await getPool();
    const transaction = new (require('mssql')).Transaction(pool);
    await transaction.begin();

    try {
      // Generar código de compra
      const countResult = await transaction.request().query('SELECT COUNT(*) AS total FROM compras');
      const nextCorrelativo = String(countResult.recordset[0].total + 1).padStart(8, '0');
      const purchaseCode = `OC-2026-${nextCorrelativo}`;

      // Insertar compra
      const purchaseResult = await transaction.request()
        .input('purchaseCode', purchaseCode)
        .input('supplierId', supplierId)
        .input('buyerId', buyerId)
        .input('invoiceNumber', invoiceNumber || null)
        .input('invoiceDate', invoiceDate || null)
        .input('totalAmount', totalAmount || 0)
        .input('notes', notes || null)
        .query(`
          INSERT INTO compras (codigo_compra, proveedor_id, comprador_id, numero_factura, fecha_factura, monto_total, notas, estado)
          OUTPUT INSERTED.id
          VALUES (@purchaseCode, @supplierId, @buyerId, @invoiceNumber, @invoiceDate, @totalAmount, @notes, 'REGISTRADA')
        `);

      const purchaseId = purchaseResult.recordset[0].id;

      // Insertar ítems de compra
      for (const item of items) {
        await transaction.request()
          .input('purchaseId', purchaseId)
          .input('productId', item.productId)
          .input('quantityOrdered', item.quantity)
          .input('quantityReceived', 0)
          .input('unitCost', item.unitCost)
          .input('subtotal', item.subtotal)
          .query(`
            INSERT INTO items_compra (compra_id, producto_id, cantidad_ordenada, cantidad_recibida, costo_unitario, subtotal)
            VALUES (@purchaseId, @productId, @quantityOrdered, @quantityReceived, @unitCost, @subtotal)
          `);
      }

      await transaction.commit();

      // Registrar auditoría
      await pool.request()
        .input('usuarioId', buyerId)
        .input('accion', 'CREATE_PURCHASE')
        .input('modulo', 'purchases')
        .input('tablaAfectada', 'compras')
        .input('registroId', purchaseId.toString())
        .input('datosNuevos', JSON.stringify({ purchaseCode, supplierId, totalAmount }))
        .query(`
          INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
          VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, @registroId, @datosNuevos)
        `);

      res.status(201).json({ success: true, purchaseId, purchaseCode });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function receivePurchase(req, res) {
  try {
    const { purchaseId } = req.params;
    const pool = await getPool();

    const purchase = await pool.request()
      .input('purchaseId', purchaseId)
      .query('SELECT * FROM compras WHERE id = @purchaseId');

    if (purchase.recordset.length === 0) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    const items = await pool.request()
      .input('purchaseId', purchaseId)
      .query('SELECT * FROM items_compra WHERE compra_id = @purchaseId');

    const transaction = new (require('mssql')).Transaction(pool);
    await transaction.begin();

    try {
      // Marcar compra como recibida
      await transaction.request()
        .input('purchaseId', purchaseId)
        .query(`UPDATE compras SET estado = 'RECIBIDA', fecha_actualizacion = SYSDATETIME() WHERE id = @purchaseId`);

      // Crear lotes para cada ítem recibido
      for (const item of items.recordset) {
        const productResult = await transaction.request()
          .input('productId', item.producto_id)
          .query('SELECT nombre FROM productos WHERE id = @productId');

        const productName = productResult.recordset[0]?.nombre || 'Producto';

        // Generar código de lote
        const batchCode = `LOT-REC-${Date.now()}`;

        // Fecha de vencimiento: 1 año desde hoy por defecto
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);

        await transaction.request()
          .input('productId', item.producto_id)
          .input('batchCode', batchCode)
          .input('expirationDate', expirationDate)
          .input('stockActual', item.cantidad_recibida || item.cantidad_ordenada)
          .input('stockInitial', item.cantidad_ordenada)
          .input('supplierId', purchase.recordset[0].proveedor_id)
          .query(`
            INSERT INTO lotes (producto_id, codigo_lote, fecha_vencimiento, stock_actual, stock_inicial, proveedor_id, estado)
            VALUES (@productId, @batchCode, @expirationDate, @stockActual, @stockInitial, @supplierId, 'VIGENTE')
          `);

        // Registrar movimiento de stock
        await transaction.request()
          .input('productoId', item.producto_id)
          .input('usuarioId', req.user.id)
          .input('cantidad', item.cantidad_recibida || item.cantidad_ordenada)
          .input('stockAnterior', 0)
          .input('stockNuevo', item.cantidad_recibida || item.cantidad_ordenada)
          .input('motivo', 'Recepción de compra ' + purchase.recordset[0].codigo_compra)
          .query(`
            INSERT INTO movimientos_stock (producto_id, usuario_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, referencia_id)
            VALUES (@productoId, @usuarioId, 'ENTRADA_COMPRA', @cantidad, @stockAnterior, @stockNuevo, @motivo, @purchaseId)
          `);
      }

      await transaction.commit();

      // Registrar auditoría
      await pool.request()
        .input('usuarioId', req.user.id)
        .input('accion', 'RECEIVE_PURCHASE')
        .input('modulo', 'purchases')
        .input('tablaAfectada', 'compras')
        .input('registroId', purchaseId)
        .input('datosNuevos', JSON.stringify({ status: 'RECIBIDA' }))
        .query(`
          INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
          VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, @registroId, @datosNuevos)
        `);

      res.json({ success: true, message: 'Compra recibida y lotes creados' });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { listPurchases, createPurchase, receivePurchase };
