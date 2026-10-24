const { getPool } = require('../config/db');
const { getValidBatchesForProduct } = require('../services/fefoService');

/**
 * Listado de productos con stock calculado en tiempo real desde lotes.
 * Filtros opcionales: q (búsqueda nombre/código), solo_bajo_stock.
 */
async function listProducts(req, res) {
  try {
    const pool = await getPool();
    const { q, solo_bajo_stock } = req.query;
    const request = pool.request();

    let where = 'WHERE p.esta_activo = 1';
    if (q) {
      where += ` AND (p.nombre LIKE @q OR p.codigo_barras LIKE @q OR p.nombre_generico LIKE @q)`;
      request.input('q', `%${q}%`);
    }

    const result = await request.query(`
      SELECT p.id, p.codigo_barras, p.nombre, p.nombre_generico, p.concentracion, p.presentacion,
             p.precio_venta, p.costo, p.stock_minimo, p.requiere_receta, p.es_controlado,
             p.esta_activo, p.fecha_actualizacion,
             c.nombre AS categoria,
             ISNULL((SELECT SUM(l.stock_actual) FROM lotes l WHERE l.producto_id = p.id AND l.estado = 'VIGENTE'), 0) AS total_stock
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ${where}
      ORDER BY p.nombre
    `);

    const products = result.recordset.map(p => ({
      ...p,
      total_stock: parseInt(p.total_stock, 10) || 0,
      low_stock: (parseInt(p.total_stock, 10) || 0) <= parseInt(p.stock_minimo, 10),
      precio_venta: parseFloat(p.precio_venta),
      costo: parseFloat(p.costo)
    }));

    let data = products;
    if (solo_bajo_stock === '1') {
      data = products.filter(p => p.low_stock);
    }

    res.json({ products: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getProductStock(req, res) {
  try {
    const { productId } = req.params;
    const stock = await getValidBatchesForProduct(productId);
    const total = stock.reduce((sum, b) => sum + b.stock_actual, 0);
    res.json({ productId, totalStock: total, batches: stock });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Crear producto (solo admin / almacén).
 * Requiere: codigo_barras (único), nombre, precio_venta >= 0, stock_minimo >= 0, categoria_id.
 */
async function createProduct(req, res) {
  try {
    const {
      codigo_barras, nombre, nombre_generico, concentracion, presentacion = 'UNIDAD',
      categoria_id, laboratorio_id, precio_venta, costo = 0, stock_minimo = 0,
      stock_maximo, requiere_receta = 0, es_controlado = 0
    } = req.body;

    if (!codigo_barras || !nombre || !categoria_id) {
      return res.status(400).json({ error: 'codigo_barras, nombre y categoria_id son requeridos' });
    }
    const precio = parseFloat(precio_venta);
    const stockMin = parseInt(stock_minimo, 10);
    if (!Number.isFinite(precio) || precio < 0) {
      return res.status(400).json({ error: 'precio_venta debe ser un número >= 0' });
    }
    if (!Number.isFinite(stockMin) || stockMin < 0) {
      return res.status(400).json({ error: 'stock_minimo debe ser un entero >= 0' });
    }

    const pool = await getPool();

    const duplicate = await pool.request()
      .input('codigo_barras', codigo_barras)
      .query('SELECT id FROM productos WHERE codigo_barras = @codigo_barras');
    if (duplicate.recordset.length > 0) {
      return res.status(409).json({ error: 'Ya existe un producto con ese código de barras' });
    }

    const result = await pool.request()
      .input('codigo_barras', codigo_barras)
      .input('nombre', nombre)
      .input('nombre_generico', nombre_generico || null)
      .input('concentracion', concentracion || null)
      .input('presentacion', presentacion)
      .input('categoria_id', categoria_id)
      .input('laboratorio_id', laboratorio_id || null)
      .input('precio_venta', precio)
      .input('costo', parseFloat(costo) || 0)
      .input('stock_minimo', stockMin)
      .input('stock_maximo', stock_maximo ? parseInt(stock_maximo, 10) : null)
      .input('requiere_receta', requiere_receta ? 1 : 0)
      .input('es_controlado', es_controlado ? 1 : 0)
      .query(`
        INSERT INTO productos
          (codigo_barras, nombre, nombre_generico, concentracion, presentacion, categoria_id, laboratorio_id,
           precio_venta, costo, stock_minimo, stock_maximo, requiere_receta, es_controlado, esta_activo)
        OUTPUT INSERTED.id
        VALUES (@codigo_barras, @nombre, @nombre_generico, @concentracion, @presentacion, @categoria_id, @laboratorio_id,
                @precio_venta, @costo, @stock_minimo, @stock_maximo, @requiere_receta, @es_controlado, 1)
      `);

    // Auditoría
    await pool.request()
      .input('usuarioId', req.user.id)
      .input('accion', 'CREATE_PRODUCT')
      .input('modulo', 'inventory')
      .input('tablaAfectada', 'productos')
      .input('registroId', result.recordset[0].id.toString())
      .input('datosNuevos', JSON.stringify({ codigo_barras, nombre }))
      .query(`
        INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
        VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, @registroId, @datosNuevos)
      `);

    res.status(201).json({ success: true, productId: result.recordset[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Actualizar producto (solo admin / almacén).
 */
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const {
      codigo_barras, nombre, nombre_generico, concentracion, presentacion,
      categoria_id, laboratorio_id, precio_venta, costo, stock_minimo, stock_maximo,
      requiere_receta, es_controlado, esta_activo
    } = req.body;

    const pool = await getPool();
    const existing = await pool.request()
      .input('id', id)
      .query('SELECT id FROM productos WHERE id = @id');
    if (existing.recordset.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const updates = [];
    const request = pool.request();
    if (codigo_barras !== undefined) { request.input('codigo_barras', codigo_barras); updates.push('codigo_barras = @codigo_barras'); }
    if (nombre !== undefined) { request.input('nombre', nombre); updates.push('nombre = @nombre'); }
    if (nombre_generico !== undefined) { request.input('nombre_generico', nombre_generico); updates.push('nombre_generico = @nombre_generico'); }
    if (concentracion !== undefined) { request.input('concentracion', concentracion); updates.push('concentracion = @concentracion'); }
    if (presentacion !== undefined) { request.input('presentacion', presentacion); updates.push('presentacion = @presentacion'); }
    if (categoria_id !== undefined) { request.input('categoria_id', categoria_id); updates.push('categoria_id = @categoria_id'); }
    if (laboratorio_id !== undefined) { request.input('laboratorio_id', laboratorio_id); updates.push('laboratorio_id = @laboratorio_id'); }
    if (precio_venta !== undefined) {
      const p = parseFloat(precio_venta);
      if (!Number.isFinite(p) || p < 0) return res.status(400).json({ error: 'precio_venta inválido' });
      request.input('precio_venta', p); updates.push('precio_venta = @precio_venta');
    }
    if (costo !== undefined) { request.input('costo', parseFloat(costo) || 0); updates.push('costo = @costo'); }
    if (stock_minimo !== undefined) {
      const s = parseInt(stock_minimo, 10);
      if (!Number.isFinite(s) || s < 0) return res.status(400).json({ error: 'stock_minimo inválido' });
      request.input('stock_minimo', s); updates.push('stock_minimo = @stock_minimo');
    }
    if (stock_maximo !== undefined) { request.input('stock_maximo', stock_maximo ? parseInt(stock_maximo, 10) : null); updates.push('stock_maximo = @stock_maximo'); }
    if (requiere_receta !== undefined) { request.input('requiere_receta', requiere_receta ? 1 : 0); updates.push('requiere_receta = @requiere_receta'); }
    if (es_controlado !== undefined) { request.input('es_controlado', es_controlado ? 1 : 0); updates.push('es_controlado = @es_controlado'); }
    if (esta_activo !== undefined) { request.input('esta_activo', esta_activo ? 1 : 0); updates.push('esta_activo = @esta_activo'); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    request.input('id', id);
    updates.push('fecha_actualizacion = SYSDATETIME()');

    await request.query(`UPDATE productos SET ${updates.join(', ')} WHERE id = @id`);

    await pool.request()
      .input('usuarioId', req.user.id)
      .input('accion', 'UPDATE_PRODUCT')
      .input('modulo', 'inventory')
      .input('tablaAfectada', 'productos')
      .input('registroId', id)
      .input('datosNuevos', JSON.stringify(req.body))
      .query(`
        INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
        VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, @registroId, @datosNuevos)
      `);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Eliminación lógica de producto (esta_activo = 0).
 * No se borra físicamente para preservar trazabilidad de ventas y movimientos.
 */
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const existing = await pool.request()
      .input('id', id)
      .query('SELECT id, esta_activo, nombre FROM productos WHERE id = @id');
    if (existing.recordset.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await pool.request()
      .input('id', id)
      .query('UPDATE productos SET esta_activo = 0, fecha_actualizacion = SYSDATETIME() WHERE id = @id');

    await pool.request()
      .input('usuarioId', req.user.id)
      .input('accion', 'DELETE_PRODUCT')
      .input('modulo', 'inventory')
      .input('tablaAfectada', 'productos')
      .input('registroId', id)
      .input('datosNuevos', JSON.stringify({ nombre: existing.recordset[0].nombre }))
      .query(`
        INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
        VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, @registroId, @datosNuevos)
      `);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Ajuste de stock sobre un lote (entrada / salida / merma).
 * body: { productId, loteId, type: 'ENTRADA' | 'SALIDA' | 'AJUSTE', quantity: int > 0, reason }
 * Reglas: cantidad entera > 0; SALIDA no puede dejar stock negativo en el lote.
 * Registra movimiento en kárdex con trazabilidad.
 */
async function adjustStock(req, res) {
  try {
    const { productId, loteId, type, quantity, reason } = req.body;
    const usuarioId = req.user.id;

    if (!productId || !loteId) {
      return res.status(400).json({ error: 'productId y loteId son requeridos' });
    }
    const qty = parseInt(quantity, 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: 'quantity debe ser un entero mayor a 0' });
    }
    const tipo = type === 'ENTRADA' ? 'ENTRADA_AJUSTE' : type === 'SALIDA' ? 'SALIDA_AJUSTE' : type === 'AJUSTE' ? 'AJUSTE_MANUAL' : null;
    if (!tipo) {
      return res.status(400).json({ error: "type debe ser 'ENTRADA', 'SALIDA' o 'AJUSTE'" });
    }
    if (!reason || String(reason).trim().length < 3) {
      return res.status(400).json({ error: 'reason es requerido (motivo del ajuste, trazabilidad)' });
    }

    const pool = await getPool();
    const transaction = new (require('mssql')).Transaction(pool);
    await transaction.begin();

    try {
      // Validar producto y lote, bloquear filas del lote
      const productResult = await transaction.request()
        .input('productId', productId)
        .query('SELECT id, nombre, esta_activo FROM productos WHERE id = @productId');
      if (productResult.recordset.length === 0) {
        throw new Error('Producto no encontrado');
      }
      if (productResult.recordset[0].esta_activo !== 1) {
        throw new Error('El producto está inactivo');
      }

      const loteResult = await transaction.request()
        .input('loteId', loteId)
        .input('productId', productId)
        .query('SELECT id, stock_actual, estado FROM lotes WITH (UPDLOCK, ROWLOCK) WHERE id = @loteId AND producto_id = @productId');
      if (loteResult.recordset.length === 0) {
        throw new Error('Lote no encontrado para este producto');
      }

      const stockAnterior = loteResult.recordset[0].stock_actual;
      const stockNuevo = tipo === 'ENTRADA_AJUSTE' ? stockAnterior + qty : stockAnterior - qty;
      if (stockNuevo < 0) {
        throw new Error(`Stock insuficiente en el lote. Disponible: ${stockAnterior}, solicitado: ${qty}`);
      }

      await transaction.request()
        .input('loteId', loteId)
        .input('stockNuevo', stockNuevo)
        .query(`
          UPDATE lotes
          SET stock_actual = @stockNuevo,
              fecha_actualizacion = SYSDATETIME(),
              estado = CASE WHEN @stockNuevo <= 0 THEN 'AGOTADO' ELSE estado END
          WHERE id = @loteId
        `);

      await transaction.request()
        .input('productoId', productId)
        .input('loteId', loteId)
        .input('usuarioId', usuarioId)
        .input('tipo', tipo)
        .input('cantidad', qty)
        .input('stockAnterior', stockAnterior)
        .input('stockNuevo', stockNuevo)
        .input('motivo', String(reason).trim())
        .query(`
          INSERT INTO movimientos_stock
            (producto_id, lote_id, usuario_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, referencia_id)
          VALUES
            (@productoId, @loteId, @usuarioId, @tipo, @cantidad, @stockAnterior, @stockNuevo, @motivo, NULL)
        `);

      await transaction.commit();

      res.json({ success: true, productId, loteId, stockAnterior, stockNuevo, type: tipo });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}


/**
 * Listado de lotes con información de producto y proveedor.
 * Parámetros opcionales: estado (VIGENTE/AGOTADO/VENCIDO), productId.
 */
async function listBatches(req, res) {
  try {
    const pool = await getPool();
    const { estado, productId } = req.query;
    const request = pool.request();

    let where = 'WHERE 1=1';
    if (estado) {
      where += ' AND l.estado = @estado';
      request.input('estado', estado);
    }
    if (productId) {
      where += ' AND l.producto_id = @productId';
      request.input('productId', productId);
    }

    const result = await request.query(`
      SELECT l.id, l.producto_id, l.proveedor_id, l.codigo_lote,
             CONVERT(VARCHAR(10), l.fecha_vencimiento, 120) AS fecha_vencimiento,
             CONVERT(VARCHAR(10), l.fecha_fabricacion, 120) AS fecha_fabricacion,
             l.stock_inicial, l.stock_actual, l.costo_unitario, l.estado,
             p.nombre AS producto_nombre, p.codigo_barras AS producto_codigo,
             prov.razon_social AS proveedor_nombre
      FROM lotes l
      INNER JOIN productos p ON l.producto_id = p.id
      LEFT JOIN proveedores prov ON l.proveedor_id = prov.id
      ${where}
      ORDER BY l.fecha_vencimiento ASC
    `);

    res.json({
      batches: result.recordset.map(b => ({
        ...b,
        stock_actual: parseInt(b.stock_actual, 10) || 0,
        stock_inicial: parseInt(b.stock_inicial, 10) || 0,
        costo_unitario: parseFloat(b.costo_unitario) || 0
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listProducts,
  listBatches,
  getProductStock,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock
};
