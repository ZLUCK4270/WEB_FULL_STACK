const { getPool, mockTables, evaluateAlerts } = require('../config/db');

async function listProducts(req, res) {
  try {
    const pool = await getPool();
    const { q, solo_bajo_stock } = req.query;
    const request = pool.request();

    if (q) request.input('q', `%${q}%`);

    const result = await request.query(`
      SELECT p.id, p.codigo_barras, p.nombre, p.nombre_generico, p.concentracion, p.presentacion,
             p.precio_venta, p.costo, p.stock_minimo, p.stock_maximo, p.requiere_receta, p.es_controlado,
             p.esta_activo, p.fecha_actualizacion, p.categoria_id, p.laboratorio_id,
             c.nombre AS categoria,
             ISNULL((SELECT SUM(l.stock_actual) FROM lotes l WHERE l.producto_id = p.id AND l.estado = 'VIGENTE'), 0) AS total_stock
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ORDER BY p.nombre
    `);

    let products = result.recordset.map(p => {
      const totalStock = parseInt(p.total_stock, 10) || 0;
      const minStock = parseInt(p.stock_minimo, 10) || 0;
      const isLow = totalStock <= minStock;
      return {
        ...p,
        total_stock: totalStock,
        stock_total: totalStock,
        stock_vigente: totalStock,
        low_stock: isLow,
        bajo_stock: isLow,
        precio_venta: parseFloat(p.precio_venta),
        costo: parseFloat(p.costo),
        precio_costo: parseFloat(p.costo),
        controlado: Boolean(p.es_controlado)
      };
    });

    if (q) {
      const term = String(q).replace(/%/g, '').toLowerCase().trim();
      products = products.filter(p =>
        (p.nombre && p.nombre.toLowerCase().includes(term)) ||
        (p.codigo_barras && p.codigo_barras.toLowerCase().includes(term)) ||
        (p.nombre_generico && p.nombre_generico.toLowerCase().includes(term)) ||
        (p.categoria && p.categoria.toLowerCase().includes(term))
      );
    }

    if (solo_bajo_stock === '1') {
      products = products.filter(p => p.low_stock);
    }

    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getProductStock(req, res) {
  try {
    const { productId } = req.params;
    const pool = await getPool();
    const result = await pool.request()
      .input('productId', productId)
      .query('SELECT * FROM lotes WHERE producto_id = @productId ORDER BY fecha_vencimiento ASC');
    const batches = result.recordset.map(b => ({
      ...b,
      stock_actual: parseInt(b.stock_actual, 10) || 0,
      stock_inicial: parseInt(b.stock_inicial, 10) || 0,
      ubicacion: b.ubicacion || 'Almacén General'
    }));
    const todayIso = new Date().toISOString().split('T')[0];
    const total = batches
      .filter(b => b.estado === 'VIGENTE' && b.fecha_vencimiento >= todayIso)
      .reduce((sum, b) => sum + b.stock_actual, 0);
    res.json({ productId, totalStock: total, batches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createProduct(req, res) {
  try {
    const {
      codigo_barras, nombre, nombre_generico, concentracion, presentacion = 'UNIDAD',
      categoria_id, laboratorio_id, precio_venta, costo = 0, stock_minimo = 0,
      stock_maximo = 200, requiere_receta = 0, es_controlado = 0
    } = req.body;

    if (!codigo_barras || !nombre) {
      return res.status(400).json({ error: 'codigo_barras y nombre son requeridos' });
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

    const catId = categoria_id || (mockTables.categorias[0] ? mockTables.categorias[0].id : null);
    const labId = laboratorio_id || (mockTables.laboratorios[0] ? mockTables.laboratorios[0].id : null);

    const result = await pool.request()
      .input('codigo_barras', String(codigo_barras).trim())
      .input('nombre', String(nombre).trim())
      .input('nombre_generico', (nombre_generico && String(nombre_generico).trim()) || String(nombre).trim())
      .input('concentracion', concentracion || null)
      .input('presentacion', presentacion)
      .input('categoria_id', catId)
      .input('laboratorio_id', labId)
      .input('precio_venta', precio)
      .input('costo', parseFloat(costo) || 0)
      .input('stock_minimo', stockMin)
      .input('stock_maximo', stock_maximo ? parseInt(stock_maximo, 10) : 200)
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

    const newProdId = result.recordset[0].id;

    await pool.request()
      .input('usuarioId', req.user.id)
      .input('accion', 'CREATE_PRODUCT')
      .input('modulo', 'inventory')
      .input('tablaAfectada', 'productos')
      .input('registroId', newProdId.toString())
      .input('datosNuevos', JSON.stringify({ codigo_barras, nombre }))
      .query(`
        INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
        VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, @registroId, @datosNuevos)
      `);

    res.status(201).json({ success: true, productId: newProdId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const {
      nombre, nombre_generico, concentracion, presentacion,
      categoria_id, laboratorio_id, precio_venta, costo, stock_minimo
    } = req.body;

    const pool = await getPool();
    const existing = await pool.request()
      .input('id', id)
      .query('SELECT * FROM productos WHERE id = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const current = existing.recordset[0];

    await pool.request()
      .input('id', id)
      .input('nombre', nombre !== undefined ? String(nombre).trim() : current.nombre)
      .input('nombre_generico', nombre_generico !== undefined ? String(nombre_generico).trim() : current.nombre_generico)
      .input('concentracion', concentracion !== undefined ? concentracion : current.concentracion)
      .input('presentacion', presentacion !== undefined ? presentacion : current.presentacion)
      .input('categoria_id', categoria_id !== undefined ? categoria_id : current.categoria_id)
      .input('laboratorio_id', laboratorio_id !== undefined ? laboratorio_id : current.laboratorio_id)
      .input('precio_venta', precio_venta !== undefined ? parseFloat(precio_venta) : current.precio_venta)
      .input('costo', costo !== undefined ? parseFloat(costo) : current.costo)
      .input('stock_minimo', stock_minimo !== undefined ? parseInt(stock_minimo, 10) : current.stock_minimo)
      .query(`
        UPDATE productos
        SET nombre = @nombre,
            nombre_generico = @nombre_generico,
            concentracion = @concentracion,
            presentacion = @presentacion,
            categoria_id = @categoria_id,
            laboratorio_id = @laboratorio_id,
            precio_venta = @precio_venta,
            costo = @costo,
            stock_minimo = @stock_minimo,
            fecha_actualizacion = SYSDATETIME()
        WHERE id = @id
      `);

    res.json({ success: true, message: 'Producto actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const product = mockTables.productos.find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    product.esta_activo = 0;
    product.fecha_actualizacion = new Date().toISOString();

    await pool.request()
      .input('usuarioId', req.user.id)
      .input('accion', 'DELETE_PRODUCT')
      .input('modulo', 'inventory')
      .input('tablaAfectada', 'productos')
      .input('registroId', id)
      .input('datosNuevos', JSON.stringify({ esta_activo: 0 }))
      .query(`
        INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
        VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, @registroId, @datosNuevos)
      `);

    res.json({ success: true, message: 'Producto desactivado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function adjustStock(req, res) {
  try {
    const { productId, loteId, type, quantity, reason } = req.body;
    const qty = parseInt(quantity, 10);

    if (!productId || !loteId || !type || !Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ error: 'productId, loteId, type y quantity (>0 entero) requeridos' });
    }

    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ error: 'reason es requerido (motivo del ajuste, trazabilidad)' });
    }

    const pool = await getPool();
    const product = mockTables.productos.find(p => p.id === productId);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    if (!product.esta_activo) return res.status(400).json({ error: 'El producto está inactivo' });

    const lote = mockTables.lotes.find(l => l.id === loteId && l.producto_id === productId);
    if (!lote) return res.status(404).json({ error: 'Lote no encontrado para este producto' });

    const stockAnterior = lote.stock_actual;
    let stockNuevo = stockAnterior;

    const tipoAjuste = type.toUpperCase();
    if (tipoAjuste === 'ENTRADA' || tipoAjuste === 'ENTRADA_AJUSTE') {
      stockNuevo = stockAnterior + qty;
    } else if (tipoAjuste === 'SALIDA' || tipoAjuste === 'SALIDA_AJUSTE') {
      stockNuevo = stockAnterior - qty;
    } else if (tipoAjuste === 'AJUSTE') {
      stockNuevo = qty;
    }

    if (stockNuevo < 0) {
      return res.status(400).json({ error: `Stock insuficiente en el lote. Disponible: ${stockAnterior}, solicitado: ${qty}` });
    }

    lote.stock_actual = stockNuevo;
    lote.estado = stockNuevo <= 0 ? 'AGOTADO' : 'VIGENTE';
    lote.fecha_actualizacion = new Date().toISOString();

    await pool.request()
      .input('productoId', productId)
      .input('loteId', loteId)
      .input('usuarioId', req.user.id)
      .input('tipo', tipoAjuste)
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

    evaluateAlerts([productId]);

    res.json({
      success: true,
      stockNuevo,
      message: `Stock ajustado correctamente. Nuevo saldo: ${stockNuevo} unidades.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function listBatches(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT l.id, l.producto_id, l.proveedor_id, l.codigo_lote,
             l.fecha_vencimiento, l.stock_inicial, l.stock_actual, l.estado,
             p.nombre AS producto_nombre, p.codigo_barras AS producto_codigo,
             prov.razon_social AS proveedor_nombre
      FROM lotes l
      INNER JOIN productos p ON l.producto_id = p.id
      LEFT JOIN proveedores prov ON l.proveedor_id = prov.id
      ORDER BY l.fecha_vencimiento ASC
    `);

    res.json({
      batches: result.recordset.map(b => ({
        ...b,
        stock_actual: parseInt(b.stock_actual, 10) || 0,
        stock_inicial: parseInt(b.stock_inicial, 10) || 0,
        ubicacion: b.ubicacion || 'Almacén General'
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createBatch(req, res) {
  try {
    const { productId, codigoLote, fechaVencimiento, stockInicial, proveedorId, ubicacion } = req.body;
    const qty = parseInt(stockInicial, 10);

    if (!productId || !codigoLote || !fechaVencimiento || !Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ error: 'productId, codigoLote, fechaVencimiento y stockInicial (>0) son requeridos' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('productoId', productId)
      .input('productId', productId)
      .input('codigoLote', String(codigoLote).trim())
      .input('fechaVencimiento', fechaVencimiento)
      .input('stockInicial', qty)
      .input('proveedorId', proveedorId || null)
      .input('ubicacion', ubicacion || 'Almacén General')
      .query(`
        INSERT INTO lotes (producto_id, codigo_lote, fecha_vencimiento, stock_actual, stock_inicial, proveedor_id, estado)
        OUTPUT INSERTED.id
        VALUES (@productoId, @codigoLote, @fechaVencimiento, @stockInicial, @stockInicial, @proveedorId, 'VIGENTE')
      `);

    const newLoteId = result.recordset[0].id;

    await pool.request()
      .input('productoId', productId)
      .input('loteId', newLoteId)
      .input('usuarioId', req.user.id)
      .input('tipo', 'ENTRADA_LOTE')
      .input('cantidad', qty)
      .input('stockAnterior', 0)
      .input('stockNuevo', qty)
      .input('motivo', `Ingreso de nuevo lote ${codigoLote}`)
      .query(`
        INSERT INTO movimientos_stock
          (producto_id, lote_id, usuario_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, referencia_id)
        VALUES
          (@productoId, @loteId, @usuarioId, @tipo, @cantidad, @stockAnterior, @stockNuevo, @motivo, NULL)
      `);

    evaluateAlerts([productId]);

    res.status(201).json({ success: true, loteId: newLoteId, message: 'Lote registrado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getKardex(req, res) {
  try {
    const { productId } = req.query;
    let movements = [...mockTables.movimientos_stock].reverse();

    if (productId) {
      movements = movements.filter(m => m.producto_id === productId);
    }

    const enriched = movements.slice(0, 100).map(m => {
      const p = mockTables.productos.find(prod => prod.id === m.producto_id);
      const l = mockTables.lotes.find(lot => lot.id === m.lote_id);
      const u = mockTables.perfiles_usuario.find(usr => usr.id === m.usuario_id);
      const prodNombre = p ? p.nombre : m.producto_nombre || 'Producto';
      const codBarras = p ? p.codigo_barras : m.codigo_barras || '';
      const codLote = l ? l.codigo_lote : m.codigo_lote || '';
      const usrNombre = u ? `${u.nombre} ${u.apellido}` : m.usuario_nombre || 'Sistema';
      return {
        id: m.id,
        // camelCase
        productoId: m.producto_id,
        productoNombre: prodNombre,
        codigoBarras: codBarras,
        loteId: m.lote_id,
        codigoLote: codLote,
        tipoMovimiento: m.tipo_movimiento,
        cantidad: m.cantidad,
        stockAnterior: m.stock_anterior,
        stockNuevo: m.stock_nuevo,
        motivo: m.motivo,
        usuarioId: m.usuario_id,
        usuarioNombre: usrNombre,
        fecha: m.fecha,
        referenciaId: m.referencia_id,
        // snake_case aliases for frontend mapper
        producto_id: m.producto_id,
        producto_nombre: prodNombre,
        codigo_barras: codBarras,
        lote_id: m.lote_id,
        codigo_lote: codLote,
        tipo_movimiento: m.tipo_movimiento,
        stock_anterior: m.stock_anterior,
        stock_nuevo: m.stock_nuevo,
        usuario_id: m.usuario_id,
        usuario_nombre: usrNombre,
        fecha_creacion: m.fecha,
        referencia_id: m.referencia_id
      };
    });

    res.json({ success: true, kardex: enriched, movements: enriched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getSubstitutes(req, res) {
  try {
    const { id } = req.params;
    const target = mockTables.productos.find(p => p.id === id);

    if (!target) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (!target.nombre_generico) {
      return res.json({ substitutes: [] });
    }

    const gen = target.nombre_generico.toLowerCase().trim();
    const todayIso = new Date().toISOString().split('T')[0];

    const alts = mockTables.productos.filter(p =>
      p.id !== target.id &&
      p.esta_activo === 1 &&
      p.nombre_generico &&
      p.nombre_generico.toLowerCase().trim() === gen
    ).map(p => {
      const cat = mockTables.categorias.find(c => c.id === p.categoria_id);
      const lab = mockTables.laboratorios.find(l => l.id === p.laboratorio_id);
      const stock = mockTables.lotes
        .filter(l => l.producto_id === p.id && l.estado === 'VIGENTE' && l.fecha_vencimiento >= todayIso)
        .reduce((sum, l) => sum + (parseInt(l.stock_actual, 10) || 0), 0);
      return {
        id: p.id,
        nombre: p.nombre,
        codigo: p.codigo_barras,
        codigo_barras: p.codigo_barras,
        generico: p.nombre_generico,
        nombre_generico: p.nombre_generico,
        concentracion: p.concentracion,
        presentacion: p.presentacion,
        laboratorio: lab ? lab.nombre : 'Genérico',
        precio: parseFloat(p.precio_venta),
        precio_venta: parseFloat(p.precio_venta),
        stockTotal: stock,
        stock_disponible: stock,
        requiere_receta: p.requiere_receta,
        categoria: cat ? cat.nombre : 'General'
      };
    }).filter(p => p.stockTotal > 0);

    res.json({ substitutes: alts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function listCategories(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM categorias ORDER BY nombre');
    res.json({ categories: result.recordset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function listLaboratories(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM laboratorios ORDER BY nombre');
    res.json({ laboratories: result.recordset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function listSuppliers(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM proveedores ORDER BY razon_social');
    res.json({
      suppliers: result.recordset.map(s => ({
        ...s,
        razonSocial: s.razon_social
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listProducts,
  listBatches,
  createBatch,
  getProductStock,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getKardex,
  getSubstitutes,
  listCategories,
  listLaboratories,
  listSuppliers
};
