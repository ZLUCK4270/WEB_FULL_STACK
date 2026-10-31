const { getPool, sql, evaluateAlerts } = require('../config/db');

/**
 * Devuelve lotes válidos para la venta (FEFO): vigentes, sin vencer, con stock > 0.
 * Bloquea filas con UPDLOCK/HOLDLOCK cuando se ejecuta dentro de una transacción
 * para evitar sobreventa en ventas concurrentes (condición de carrera).
 */
async function getValidBatchesForProduct(productId, transaction = null) {
  const request = transaction ? transaction.request() : (await getPool()).request();
  const result = await request
    .input('productId', productId)
    .query(`
      SELECT id, codigo_lote, fecha_vencimiento, stock_actual, estado
      FROM lotes WITH (UPDLOCK, HOLDLOCK, ROWLOCK)
      WHERE producto_id = @productId
        AND fecha_vencimiento >= CAST(SYSDATETIME() AS DATE)
        AND stock_actual > 0
        AND estado = 'VIGENTE'
      ORDER BY fecha_vencimiento ASC
    `);
  return result.recordset;
}

async function getProductTotalStock(productId) {
  const batches = await getValidBatchesForProduct(productId);
  return batches.reduce((sum, b) => sum + b.stock_actual, 0);
}

/**
 * Procesa una venta con descuento de stock FEFO dentro de una transacción.
 *
 * items: [{ productId, quantity }]
 * options: { customerId, paymentMethod, amountPaid, receiptType }
 */
async function processFEFOTransaction(items, cashierId, options = {}) {
  const {
    customerId = null,
    paymentMethod = 'efectivo',
    amountPaid = 0,
    receiptType = 'boleta'
  } = options;

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('El carrito no puede estar vacío');
  }

  for (const item of items) {
    if (!item.productId || typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error(`Ítem inválido en el carrito: producto ${item.productId}, cantidad ${item.quantity}`);
    }
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();
  try {
    const saleItemsDetail = [];
    let totalAmount = 0;
    const affectedProductIds = [];

    for (const item of items) {
      affectedProductIds.push(item.productId);
      const prodResult = await transaction.request()
        .input('productId', item.productId)
        .query('SELECT id, nombre, precio_venta, esta_activo FROM productos WHERE id = @productId AND esta_activo = 1');

      if (prodResult.recordset.length === 0) {
        throw new Error(`Producto no encontrado o inactivo: ${item.productId}`);
      }

      const product = prodResult.recordset[0];
      const validBatches = await getValidBatchesForProduct(item.productId, transaction);
      const totalAvailableStock = validBatches.reduce((sum, b) => sum + b.stock_actual, 0);

      if (totalAvailableStock < item.quantity) {
        throw new Error(`Stock insuficiente para "${product.nombre}". Disponible: ${totalAvailableStock}, Solicitado: ${item.quantity}`);
      }

      let needed = item.quantity;
      const batchesUsed = [];

      for (const batch of validBatches) {
        if (needed <= 0) break;
        const take = Math.min(batch.stock_actual, needed);
        needed -= take;

        const unitPrice = parseFloat(product.precio_venta);
        const subtotal = take * unitPrice;
        totalAmount += subtotal;

        batchesUsed.push({
          loteId: batch.id,
          codigoLote: batch.codigo_lote,
          fechaVencimiento: batch.fecha_vencimiento,
          cantidad: take
        });

        const stockNuevo = batch.stock_actual - take;

        // Descontar stock del lote
        await transaction.request()
          .input('loteId', batch.id)
          .input('cantidad', take)
          .query(`
            UPDATE lotes
            SET stock_actual = stock_actual - @cantidad,
                fecha_actualizacion = SYSDATETIME(),
                estado = CASE WHEN stock_actual - @cantidad <= 0 THEN 'AGOTADO' ELSE estado END
            WHERE id = @loteId
          `);

        // Registrar movimiento en kárdex (trazabilidad de salida por venta)
        await transaction.request()
          .input('productoId', item.productId)
          .input('loteId', batch.id)
          .input('usuarioId', cashierId)
          .input('cantidad', take)
          .input('stockAnterior', batch.stock_actual)
          .input('stockNuevo', stockNuevo)
          .input('motivo', 'Despacho FEFO en punto de venta')
          .query(`
            INSERT INTO movimientos_stock
              (producto_id, lote_id, usuario_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, referencia_id)
            VALUES
              (@productoId, @loteId, @usuarioId, 'SALIDA_VENTA', @cantidad, @stockAnterior, @stockNuevo, @motivo, NULL)
          `);
      }

      saleItemsDetail.push({
        productId: item.productId,
        productName: product.nombre,
        quantity: item.quantity,
        unitPrice: parseFloat(product.precio_venta),
        subtotal: parseFloat((item.quantity * parseFloat(product.precio_venta)).toFixed(2)),
        batches: batchesUsed
      });
    }

    const subtotalBase = parseFloat((totalAmount / 1.18).toFixed(2));
    const igvBase = parseFloat((totalAmount - subtotalBase).toFixed(2));

    // Código de venta correlativo por tipo de comprobante
    const countResult = await transaction.request().query('SELECT COUNT(*) AS total FROM ventas');
    const nextCorrelativo = String(countResult.recordset[0].total + 1).padStart(8, '0');
    const prefix = receiptType === 'factura' ? 'FAC-F001' : receiptType === 'ticket' ? 'TK-T001' : 'BOL-B001';
    const saleCode = `${prefix}-${nextCorrelativo}`;

    // Insertar venta
    const saleResult = await transaction.request()
      .input('saleCode', saleCode)
      .input('cashierId', cashierId)
      .input('customerId', customerId)
      .input('subtotal', subtotalBase)
      .input('taxAmount', igvBase)
      .input('totalAmount', parseFloat(totalAmount.toFixed(2)))
      .input('paymentMethod', paymentMethod)
      .input('receiptType', receiptType)
      .input('amountPaid', parseFloat(amountPaid) || parseFloat(totalAmount.toFixed(2)))
      .query(`
        INSERT INTO ventas (codigo_venta, cajero_id, cliente_id, subtotal, monto_igv, monto_descuento, monto_total, metodo_pago, estado)
        OUTPUT INSERTED.id
        VALUES (@saleCode, @cashierId, @customerId, @subtotal, @taxAmount, 0, @totalAmount, @paymentMethod, 'COMPLETADA')
      `);

    const saleId = saleResult.recordset[0].id;

    // Insertar ítems de venta y trazabilidad por lote
    for (const item of saleItemsDetail) {
      const itemResult = await transaction.request()
        .input('saleId', saleId)
        .input('productId', item.productId)
        .input('precioUnitario', item.unitPrice)
        .input('cantidad', item.quantity)
        .input('subtotal', item.subtotal)
        .query(`
          INSERT INTO items_venta (venta_id, producto_id, precio_unitario, cantidad, descuento, subtotal)
          OUTPUT INSERTED.id
          VALUES (@saleId, @productId, @precioUnitario, @cantidad, 0, @subtotal)
        `);

      const itemVentaId = itemResult.recordset[0].id;

      for (const b of item.batches) {
        await transaction.request()
          .input('itemVentaId', itemVentaId)
          .input('loteId', b.loteId)
          .input('cantidad', b.cantidad)
          .query(`
            INSERT INTO items_venta_lotes (item_venta_id, lote_id, cantidad)
            VALUES (@itemVentaId, @loteId, @cantidad)
          `);
      }
    }

    await transaction.commit();

    // Auto-evaluar alertas tras la venta
    evaluateAlerts(affectedProductIds);

    const fullSale = {
      id: saleId,
      saleCode,
      codigo_venta: saleCode,
      codigoVenta: saleCode,
      fecha: new Date().toISOString(),
      fecha_creacion: new Date().toISOString(),
      cajeroId: cashierId,
      cajero_id: cashierId,
      customerId,
      cliente_id: customerId,
      metodoPago: paymentMethod,
      metodo_pago: paymentMethod,
      receiptType,
      tipo_comprobante: receiptType,
      subtotal: subtotalBase,
      igv: igvBase,
      monto_igv: igvBase,
      total: parseFloat(totalAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      monto_total: parseFloat(totalAmount.toFixed(2)),
      estado: 'COMPLETADA',
      items: saleItemsDetail
    };

    return {
      success: true,
      sale: fullSale
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Anula una venta previamente completada:
 * - Restaura el stock a los lotes exactos registrados en items_venta_lotes.
 * - Registra movimiento kárdex ENTRADA_ANULACION con referencia a la venta.
 * - Marca el estado de la venta como ANULADA con fecha, motivo y usuario.
 * - Re-evalúa alertas para los productos involucrados.
 */
async function voidSaleTransaction(saleId, userId, reason) {
  if (!reason || reason.trim().length < 5) {
    throw new Error('Debe proporcionar un motivo válido de anulación (mínimo 5 caracteres).');
  }

  const pool = await getPool();
  const saleCheck = await pool.request()
    .input('id', saleId)
    .query('SELECT id, codigo_venta, estado, monto_total, metodo_pago FROM ventas WHERE id = @id');

  if (saleCheck.recordset.length === 0) {
    throw new Error('Venta no encontrada.');
  }

  const sale = saleCheck.recordset[0];
  if (sale.estado === 'ANULADA') {
    throw new Error('La venta ya se encuentra anulada.');
  }

  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // Obtener los lotes y cantidades involucrados
    const lotesResult = await transaction.request()
      .input('saleId', saleId)
      .query(`
        SELECT iv.producto_id, ivl.lote_id, ivl.cantidad, p.nombre AS producto_nombre
        FROM items_venta_lotes ivl
        JOIN items_venta iv ON ivl.item_venta_id = iv.id
        JOIN productos p ON iv.producto_id = p.id
        WHERE iv.venta_id = @saleId
      `);

    const affectedProductIds = [];

    for (const row of lotesResult.recordset) {
      affectedProductIds.push(row.producto_id);

      // Reincorporar stock al lote
      await transaction.request()
        .input('loteId', row.lote_id)
        .input('cantidad', row.cantidad)
        .query(`
          UPDATE lotes
          SET stock_actual = stock_actual + @cantidad,
              estado = CASE WHEN estado = 'AGOTADO' THEN 'VIGENTE' ELSE estado END,
              fecha_actualizacion = SYSDATETIME()
          WHERE id = @loteId
        `);

      // Registrar kárdex de anulación
      await transaction.request()
        .input('productoId', row.producto_id)
        .input('loteId', row.lote_id)
        .input('usuarioId', userId)
        .input('cantidad', row.cantidad)
        .input('motivo', `Anulación de venta ${sale.codigo_venta}: ${reason}`)
        .input('referenciaId', saleId)
        .query(`
          INSERT INTO movimientos_stock
            (producto_id, lote_id, usuario_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, referencia_id)
          VALUES
            (@productoId, @loteId, @usuarioId, 'ENTRADA_ANULACION', @cantidad, 0, @cantidad, @motivo, @referenciaId)
        `);
    }

    // Actualizar estado de la venta a ANULADA
    const nowIso = new Date().toISOString();
    sale.estado = 'ANULADA';
    sale.motivo_anulacion = reason;
    sale.fecha_anulacion = nowIso;
    sale.anulado_por_id = userId;

    await transaction.commit();

    // Re-evaluar alertas
    evaluateAlerts(affectedProductIds);

    return {
      success: true,
      message: `Venta ${sale.codigo_venta} anulada correctamente y stock reincorporado.`,
      saleId
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  getValidBatchesForProduct,
  getProductTotalStock,
  processFEFOTransaction,
  voidSaleTransaction
};
