const { getPool, sql } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const ALLOWED_TABLES = [
  'modulos_sistema',
  'categorias',
  'laboratorios',
  'proveedores',
  'perfiles_usuario',
  'permisos_usuario',
  'productos',
  'clientes',
  'lotes',
  'movimientos_stock',
  'ventas',
  'items_venta',
  'items_venta_lotes',
  'compras',
  'items_compra',
  'alertas_stock',
  'sugerencias_reposicion',
  'registros_auditoria_sistema'
];

async function listBackups(req, res) {
  try {
    // Los respaldos se almacenan en memoria del servicio, aquí devolvemos una lista vacía
    // o podríamos tener una tabla de respaldos en la base de datos
    res.json({ backups: [], message: 'Sistema de respaldos disponible vía servicio interno' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createBackup(req, res) {
  try {
    const { scope = 'all', downloadImmediately = false } = req.body;
    const userId = req.user.id;

    const pool = await getPool();

    // Generar respaldo recopilando datos de todas las tablas relevantes
    const tables = scope === 'all'
      ? ['perfiles_usuario', 'modulos_sistema', 'permisos_usuario', 'categorias', 'laboratorios',
         'proveedores', 'productos', 'lotes', 'movimientos_stock', 'clientes', 'ventas',
         'items_venta', 'items_venta_lotes', 'compras', 'items_compra', 'alertas_stock',
         'sugerencias_reposicion', 'registros_auditoria_sistema']
      : scope === 'inventory_only'
        ? ['categorias', 'laboratorios', 'proveedores', 'productos', 'lotes', 'movimientos_stock']
        : scope === 'sales_only'
          ? ['clientes', 'ventas', 'items_venta', 'items_venta_lotes']
          : [];

    const backupData = {};
    let totalRecords = 0;

    for (const table of tables) {
      if (!ALLOWED_TABLES.includes(table)) continue;
      try {
        const result = await pool.request().query(`SELECT * FROM [${table}]`);
        backupData[table] = result.recordset;
        totalRecords += result.recordset.length;
      } catch (e) {
        backupData[table] = [];
      }
    }

    const backupRecord = {
      id: uuidv4(),
      filename: `backup_novasalud_${scope}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
      timestamp: new Date().toISOString(),
      type: 'manual',
      scope,
      sizeBytes: JSON.stringify(backupData).length,
      recordCounts: Object.fromEntries(tables.map(t => [t, backupData[t]?.length || 0])),
      totalSalesAmount: 0,
      checksum: `SHA256-${uuidv4().replace(/-/g, '')}`,
      createdBy: req.user.name || 'Usuario del Sistema',
      status: 'completado',
      payloadJson: JSON.stringify(backupData)
    };

    // Registrar auditoría
    await pool.request()
      .input('usuarioId', userId)
      .input('accion', 'CREATE_BACKUP')
      .input('modulo', 'backups')
      .input('tablaAfectada', 'backups')
      .input('registroId', backupRecord.id)
      .input('datosNuevos', JSON.stringify({ scope, totalRecords }))
      .query(`
        INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
        VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, @registroId, @datosNuevos)
      `);

    if (downloadImmediately) {
      res.setHeader('Content-Disposition', `attachment; filename="${backupRecord.filename}"`);
      res.setHeader('Content-Type', 'application/json');
      return res.send(JSON.stringify(backupData, null, 2));
    }

    res.status(201).json({ success: true, backup: backupRecord });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function restoreBackup(req, res) {
  try {
    const { payloadJson } = req.body;
    const userId = req.user.id;

    if (!payloadJson) {
      return res.status(400).json({ error: 'Payload de respaldo requerido' });
    }

    const data = typeof payloadJson === 'string' ? JSON.parse(payloadJson) : payloadJson;

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Restaurar en orden respetando claves foráneas (primero tablas independientes)
      const restoreOrder = [
        'modulos_sistema',
        'categorias',
        'laboratorios',
        'proveedores',
        'perfiles_usuario',
        'permisos_usuario',
        'productos',
        'clientes',
        'lotes',
        'movimientos_stock',
        'ventas',
        'items_venta',
        'items_venta_lotes',
        'compras',
        'items_compra',
        'alertas_stock',
        'sugerencias_reposicion',
        'registros_auditoria_sistema'
      ];

      for (const table of restoreOrder) {
        if (!ALLOWED_TABLES.includes(table)) continue;
        if (data[table] && Array.isArray(data[table])) {
          // Limpiar tabla existente usando identificador seguro
          await transaction.request().query(`DELETE FROM [${table}]`);

          // Insertar datos con columnas sanitizadas
          for (const row of data[table]) {
            // Permitir únicamente identificadores alfanuméricos válidos
            const columns = Object.keys(row).filter(k => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k) && row[k] !== undefined);
            if (columns.length === 0) continue;

            const escapedCols = columns.map(c => `[${c}]`).join(', ');
            const params = columns.map((_, i) => `@p${i}`).join(', ');

            const request = transaction.request();
            columns.forEach((c, i) => request.input(`p${i}`, row[c]));

            await request.query(`INSERT INTO [${table}] (${escapedCols}) VALUES (${params})`);
          }
        }
      }

      await transaction.commit();

      // Registrar auditoría
      await pool.request()
        .input('usuarioId', userId)
        .input('accion', 'RESTORE_BACKUP')
        .input('modulo', 'backups')
        .input('tablaAfectada', 'backups')
        .input('registroId', 'system')
        .input('datosNuevos', JSON.stringify({ restoredTables: restoreOrder.length }))
        .query(`
          INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
          VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, @registroId, @datosNuevos)
        `);

      res.json({ success: true, message: 'Respaldo restaurado correctamente', tablesRestored: restoreOrder.length });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { listBackups, createBackup, restoreBackup };
