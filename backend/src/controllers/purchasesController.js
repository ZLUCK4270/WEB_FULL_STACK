const { getPool, mockTables, evaluateAlerts } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function listPurchases(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT p.id, p.codigo_compra, p.estado, p.monto_total, p.fecha_creacion, p.numero_factura, p.fecha_factura,
             pr.razon_social AS proveedor, pr.id AS proveedor_id,
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

async function getPurchase(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool.request()
      .input('id', id)
      .query('SELECT * FROM compras WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }

    res.json({ purchase: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createPurchase(req, res) {
  try {
    const { supplierId, items, invoiceNumber, invoiceDate, notes } = req.body;
    const buyerId = req.user.id;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Proveedor e ítems requeridos para la orden de compra' });
    }

    const pool = await getPool();

    let calculatedTotal = 0;
    const sanitizedItems = [];

    for (const item of items) {
      const prod = mockTables.productos.find(p => p.id === item.productId);
      if (!prod) {
        return res.status(400).json({ error: `Producto no encontrado: ${item.productId}` });
      }
      const qty = parseInt(item.quantity, 10);
      const rawPrice = item.unitPrice !== undefined ? item.unitPrice : item.unitCost;
      const price = parseFloat(rawPrice !== undefined ? rawPrice : prod.costo);
      if (!Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({ error: `Cantidad inválida para producto ${prod.nombre}` });
      }
      const subtotal = parseFloat((qty * price).toFixed(2));
      calculatedTotal += subtotal;
      sanitizedItems.push({
        productId: prod.id,
        quantity: qty,
        unitPrice: price,
        subtotal
      });
    }

    calculatedTotal = parseFloat(calculatedTotal.toFixed(2));

    const count = mockTables.compras.length + 1;
    const purchaseCode = `OC-2026-${String(count).padStart(8, '0')}`;

    const purchaseResult = await pool.request()
      .input('purchaseCode', purchaseCode)
      .input('supplierId', supplierId)
      .input('buyerId', buyerId)
      .input('invoiceNumber', invoiceNumber || null)
      .input('invoiceDate', invoiceDate || null)
      .input('totalAmount', calculatedTotal)
      .input('notes', notes || null)
      .query(`
        INSERT INTO compras (codigo_compra, proveedor_id, comprador_id, numero_factura, fecha_factura, monto_total, notas, estado)
        OUTPUT INSERTED.id
        VALUES (@purchaseCode, @supplierId, @buyerId, @invoiceNumber, @invoiceDate, @totalAmount, @notes, 'REGISTRADA')
      `);

    const purchaseId = purchaseResult.recordset[0].id;

    for (const item of sanitizedItems) {
      await pool.request()
        .input('purchaseId', purchaseId)
        .input('productId', item.productId)
        .input('quantity', item.quantity)
        .input('unitPrice', item.unitPrice)
        .input('subtotal', item.subtotal)
        .query(`
          INSERT INTO items_compra (compra_id, producto_id, cantidad, cantidad_recibida, precio_unitario, subtotal)
          VALUES (@purchaseId, @productId, @quantity, 0, @unitPrice, @subtotal)
        `);
    }

    await pool.request()
      .input('usuarioId', buyerId)
      .input('accion', 'CREATE_PURCHASE')
      .input('modulo', 'purchases')
      .input('tablaAfectada', 'compras')
      .input('registroId', purchaseId)
      .input('datosNuevos', JSON.stringify({ purchaseCode, calculatedTotal }))
      .query(`
        INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
        VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, @registroId, @datosNuevos)
      `);

    res.status(201).json({
      success: true,
      purchaseId,
      purchaseCode,
      totalAmount: calculatedTotal,
      message: `Orden de compra ${purchaseCode} registrada con éxito`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function receivePurchase(req, res) {
  try {
    const purchaseId = req.params.id || req.params.purchaseId;
    const { receivedItems, invoiceNumber } = req.body;
    const pool = await getPool();

    const purchase = mockTables.compras.find(c => c.id === purchaseId);
    if (!purchase) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }

    if (purchase.estado === 'RECIBIDA') {
      return res.status(400).json({ error: 'Esta orden de compra ya fue recibida anteriormente y su stock fue ingresado' });
    }

    const items = mockTables.items_compra.filter(it => it.compra_id === purchaseId);
    if (items.length === 0) {
      return res.status(400).json({ error: 'La orden de compra no contiene ítems' });
    }

    const affectedProductIds = [];

    for (const item of items) {
      const prod = mockTables.productos.find(p => p.id === item.producto_id);
      if (!prod) continue;
      affectedProductIds.push(prod.id);

      const inputDetail = Array.isArray(receivedItems)
        ? receivedItems.find(r => r.productId === item.producto_id || r.itemId === item.id)
        : null;

      const batchCode = inputDetail?.codigoLote || inputDetail?.batchCode || `LOTE-${prod.codigo_barras ? prod.codigo_barras.slice(-4) : 'REC'}-${new Date().toISOString().slice(2, 7).replace('-', '')}`;
      const expDate = inputDetail?.fechaVencimiento || inputDetail?.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
      const rawQty = inputDetail?.cantidadRecibida ?? inputDetail?.quantityReceived;
      const qtyReceived = rawQty !== undefined ? parseInt(rawQty, 10) : item.cantidad;

      let lote = mockTables.lotes.find(l => l.producto_id === prod.id && l.codigo_lote === batchCode);
      if (lote) {
        lote.stock_actual += qtyReceived;
        lote.estado = 'VIGENTE';
        lote.fecha_actualizacion = new Date().toISOString();
      } else {
        lote = {
          id: uuidv4(),
          producto_id: prod.id,
          codigo_lote: batchCode,
          fecha_vencimiento: expDate,
          stock_actual: qtyReceived,
          stock_inicial: qtyReceived,
          ubicacion: inputDetail?.ubicacion || 'Almacén BPA',
          proveedor_id: purchase.proveedor_id,
          estado: 'VIGENTE'
        };
        mockTables.lotes.push(lote);
      }

      item.cantidad_recibida = (item.cantidad_recibida || 0) + qtyReceived;

      const mov = {
        id: uuidv4(),
        producto_id: prod.id,
        producto_nombre: prod.nombre,
        codigo_barras: prod.codigo_barras,
        lote_id: lote.id,
        codigo_lote: batchCode,
        usuario_id: req.user.id,
        usuario_nombre: req.user.name,
        tipo_movimiento: 'ENTRADA_COMPRA',
        cantidad: qtyReceived,
        stock_anterior: lote.stock_actual - qtyReceived,
        stock_nuevo: lote.stock_actual,
        motivo: `Recepción de orden ${purchase.codigo_compra}`,
        referencia_id: purchaseId,
        fecha: new Date().toISOString()
      };
      mockTables.movimientos_stock.push(mov);
    }

    if (invoiceNumber) {
      purchase.numero_factura = invoiceNumber;
    }
    purchase.estado = 'RECIBIDA';
    purchase.fecha_actualizacion = new Date().toISOString();

    evaluateAlerts(affectedProductIds);

    await pool.request()
      .input('usuarioId', req.user.id)
      .input('accion', 'RECEIVE_PURCHASE')
      .input('modulo', 'purchases')
      .input('tablaAfectada', 'compras')
      .input('registroId', purchaseId)
      .input('datosNuevos', JSON.stringify({ status: 'RECIBIDA', purchaseCode: purchase.codigo_compra }))
      .query(`
        INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
        VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, @registroId, @datosNuevos)
      `);

    res.json({
      success: true,
      message: `Orden ${purchase.codigo_compra} recibida correctamente. Stock ingresado al almacén y alertas actualizadas.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getReplenishmentSuggestions(req, res) {
  try {
    const todayIso = new Date().toISOString().split('T')[0];
    const suggestions = [];

    for (const p of mockTables.productos) {
      if (p.esta_activo !== 1) continue;

      const totalStock = mockTables.lotes
        .filter(l => l.producto_id === p.id && l.estado === 'VIGENTE' && l.fecha_vencimiento >= todayIso)
        .reduce((sum, l) => sum + (parseInt(l.stock_actual, 10) || 0), 0);

      if (totalStock <= p.stock_minimo) {
        const cat = mockTables.categorias.find(c => c.id === p.categoria_id);
        const prov = mockTables.proveedores[0];
        const maxStock = p.stock_maximo || p.stock_minimo * 2;
        const suggestedQty = Math.max(10, maxStock - totalStock);

        suggestions.push({
          id: p.id,
          productoId: p.id,
          producto_id: p.id,
          nombre: p.nombre,
          producto_nombre: p.nombre,
          codigoBarras: p.codigo_barras,
          codigo_barras: p.codigo_barras,
          categoria: cat ? cat.nombre : 'General',
          stockActual: totalStock,
          stock_actual: totalStock,
          stockMinimo: p.stock_minimo,
          stock_minimo: p.stock_minimo,
          stockMaximo: maxStock,
          stock_maximo: maxStock,
          cantidadSugerida: suggestedQty,
          cantidad_sugerida: suggestedQty,
          costoEstimado: parseFloat(p.costo) || 1.0,
          precio_costo: parseFloat(p.costo) || 1.0,
          proveedorId: prov ? prov.id : null,
          proveedor_sugerido_id: prov ? prov.id : null,
          proveedorNombre: prov ? prov.razon_social : 'Droguería Distribuidora Nova Farma S.A.C.',
          proveedor_sugerido_nombre: prov ? prov.razon_social : 'Droguería Distribuidora Nova Farma S.A.C.',
          proveedorRuc: prov ? prov.ruc : '20100123456'
        });
      }
    }

    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function generatePurchaseOrders(req, res) {
  try {
    const { supplierId, productOrders, items: bodyItems } = req.body;
    const rawList = Array.isArray(productOrders) ? productOrders : bodyItems;
    if (!supplierId || !Array.isArray(rawList) || rawList.length === 0) {
      return res.status(400).json({ error: 'Proveedor y lista de productos requeridos' });
    }

    const items = rawList.map(po => ({
      productId: po.productId || po.productoId,
      quantity: po.quantity || po.cantidad || po.cantidadSugerida || 20,
      unitPrice: po.unitCost || po.unitPrice
    }));

    req.body = {
      supplierId,
      items,
      notes: 'Generado automáticamente desde sugerencias de reposición'
    };

    return createPurchase(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listPurchases,
  getPurchase,
  createPurchase,
  receivePurchase,
  getReplenishmentSuggestions,
  generatePurchaseOrders
};
