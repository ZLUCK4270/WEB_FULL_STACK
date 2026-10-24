const { getPool } = require('../config/db');

async function getValidBatchesForProduct(productId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('productId', productId)
    .query(`
      SELECT id, codigo_lote, fecha_vencimiento, stock_actual, estado
      FROM lotes
      WHERE producto_id = @productId
        AND fecha_vencimiento > SYSDATETIME()
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

async function processFEFOTransaction(items, cashierId) {
  // items: [{ productId, quantity }]
  const pool = await getPool();
  const transaction = new (require('mssql')).Transaction(pool);

  await transaction.begin();
  try {
    const saleItemsDetail = [];
    let totalAmount = 0;

    for (const item of items) {
      // Obtener precio del producto
      const prodResult = await transaction.request()
        .input('productId', item.productId)
        .query('SELECT nombre, precio_venta FROM productos WHERE id = @productId');

      if (prodResult.recordset.length === 0) {
        throw new Error(`Producto no encontrado: ${item.productId}`);
      }

      const product = prodResult.recordset[0];
      const totalAvailableStock = await getProductTotalStock(item.productId);

      if (totalAvailableStock < item.quantity) {
        throw new Error(`Stock insuficiente para "${product.nombre}". Disponible: ${totalAvailableStock}, Solicitado: ${item.quantity}`);
      }

      let needed = item.quantity;
      const validBatches = await getValidBatchesForProduct(item.productId);

      for (const batch of validBatches) {
        if (needed <= 0) break;
        const take = Math.min(batch.stock_actual, needed);
        needed -= take;

        const subtotal = take * parseFloat(product.precio_venta);
        totalAmount += subtotal;

        saleItemsDetail.push({
          productId: item.productId,
          productName: product.nombre,
          batchCode: batch.codigo_lote,
          expirationDate: batch.fecha_vencimiento,
          quantity: take,
          unitPrice: parseFloat(product.precio_venta),
          subtotal
        });

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

        // Registrar movimiento en kárdex
        await transaction.request()
          .input('productoId', item.productId)
          .input('loteId', batch.id)
          .input('usuarioId', cashierId)
          .input('cantidad', take)
          .input('stockAnterior', batch.stock_actual)
          .input('stockNuevo', batch.stock_actual - take)
          .query(`
            INSERT INTO movimientos_stock
              (producto_id, lote_id, usuario_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, referencia_id)
            VALUES
              (@productoId, @loteId, @usuarioId, 'SALIDA_VENTA', @cantidad, @stockAnterior, @stockNuevo, 'Despacho FEFO en mostrador POS', NULL)
          `);
      }
    }

    const subtotalBase = parseFloat((totalAmount / 1.18).toFixed(2));
    const igvBase = parseFloat((totalAmount - subtotalBase).toFixed(2));

    // Generar código de venta
    const countResult = await transaction.request().query('SELECT COUNT(*) AS total FROM ventas');
    const nextCorrelativo = String(countResult.recordset[0].total + 1).padStart(8, '0');
    const saleCode = `BOL-B001-${nextCorrelativo}`;

    // Insertar venta
    const saleResult = await transaction.request()
      .input('saleCode', saleCode)
      .input('cashierId', cashierId)
      .input('subtotal', subtotalBase)
      .input('taxAmount', igvBase)
      .input('totalAmount', parseFloat(totalAmount.toFixed(2)))
      .input('paymentMethod', 'efectivo')
      .query(`
        INSERT INTO ventas (codigo_venta, cajero_id, subtotal, monto_igv, monto_descuento, monto_total, metodo_pago, estado)
        OUTPUT INSERTED.id
        VALUES (@saleCode, @cashierId, @subtotal, @taxAmount, 0, @totalAmount, @paymentMethod, 'COMPLETADA')
      `);

    const saleId = saleResult.recordset[0].id;

    // Insertar ítems y lotes
    for (const item of saleItemsDetail) {
      await transaction.request()
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
    }

    await transaction.commit();

    return {
      success: true,
      sale: {
        id: saleId,
        saleCode,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        taxAmount: igvBase,
        subtotal: subtotalBase,
        items: saleItemsDetail
      }
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = { getValidBatchesForProduct, getProductTotalStock, processFEFOTransaction };
