const { getPool } = require('../config/db');
const sql = require('mssql');

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

/**
 * Procesa una venta con descuento de stock FEFO dentro de una transacción.
 *
 * items: [{ productId, quantity }]
 * options.customerId: UUID del cliente opcional (FK ventas.cliente_id)
 *
 * Reglas de control de inventario:
 *  - Valida existencia del producto y cantidad entera > 0.
 *  - Impide stock negativo: verifica disponibilidad total antes de descontar.
 *  - Bloqueo de filas (UPDLOCK/HOLDLOCK) para evitar sobreventa concurrente.
 *  - Registra kárdex (movimientos_stock) y trazabilidad lote->ítem (items_venta_lotes).
 *  - Cualquier fallo hace rollback de toda la venta (stock y contabilidad consistentes).
 */
async function processFEFOTransaction(items, cashierId, options = {}) {
  const { customerId = null } = options;

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

    for (const item of items) {
      // Precio y existencia del producto
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

      for (const batch of validBatches) {
        if (needed <= 0) break;
        const take = Math.min(batch.stock_actual, needed);
        needed -= take;

        const unitPrice = parseFloat(product.precio_venta);
        const subtotal = take * unitPrice;
        totalAmount += subtotal;

        saleItemsDetail.push({
          productId: item.productId,
          productName: product.nombre,
          batchCode: batch.codigo_lote,
          expirationDate: batch.fecha_vencimiento,
          quantity: take,
          unitPrice,
          subtotal
        });

        const stockNuevo = batch.stock_actual - take;

        // Descontar stock del lote
        await transaction.request()
          .input('loteId', batch.id)
          .input('cantidad', take)
          .query(`
            UPDATE lotes
            SET stock_actual = @cantidad * 0 + stock_actual - @cantidad,
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

      if (needed > 0) {
        // No debería ocurrir porque validamos el total antes, pero es red de seguridad.
        throw new Error(`No se pudo completar el despacho de "${product.nombre}" por inconsistencia de lotes.`);
      }
    }

    const subtotalBase = parseFloat((totalAmount / 1.18).toFixed(2));
    const igvBase = parseFloat((totalAmount - subtotalBase).toFixed(2));

    // Código de venta correlativo
    const countResult = await transaction.request().query('SELECT COUNT(*) AS total FROM ventas');
    const nextCorrelativo = String(countResult.recordset[0].total + 1).padStart(8, '0');
    const saleCode = `BOL-B001-${nextCorrelativo}`;

    // Insertar venta con cliente opcional
    const saleResult = await transaction.request()
      .input('saleCode', saleCode)
      .input('cashierId', cashierId)
      .input('customerId', customerId)
      .input('subtotal', subtotalBase)
      .input('taxAmount', igvBase)
      .input('totalAmount', parseFloat(totalAmount.toFixed(2)))
      .input('paymentMethod', 'efectivo')
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

      // Trazabilidad exacta: qué lote surtió este ítem de la venta
      const loteResult = await transaction.request()
        .input('productoId', item.productId)
        .input('codigoLote', item.batchCode)
        .query('SELECT id FROM lotes WHERE producto_id = @productoId AND codigo_lote = @codigoLote');

      if (loteResult.recordset.length > 0) {
        await transaction.request()
          .input('itemVentaId', itemVentaId)
          .input('loteId', loteResult.recordset[0].id)
          .input('cantidad', item.quantity)
          .query(`
            INSERT INTO items_venta_lotes (item_venta_id, lote_id, cantidad)
            VALUES (@itemVentaId, @loteId, @cantidad)
          `);
      }
    }

    await transaction.commit();

    return {
      success: true,
      sale: {
        id: saleId,
        saleCode,
        customerId,
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
