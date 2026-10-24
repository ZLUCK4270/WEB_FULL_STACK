const { getPool } = require('../config/db');

async function getBackupData() {
  const pool = await getPool();

  const tables = [
    'perfiles_usuario',
    'modulos_sistema',
    'permisos_usuario',
    'categorias',
    'laboratorios',
    'proveedores',
    'productos',
    'lotes',
    'movimientos_stock',
    'clientes',
    'ventas',
    'items_venta',
    'items_venta_lotes',
    'compras',
    'items_compra',
    'alertas_stock',
    'sugerencias_reposicion',
    'registros_auditoria_sistema'
  ];

  const backup = {};
  for (const table of tables) {
    const result = await pool.request().query(`SELECT * FROM [${table}]`);
    backup[table] = result.recordset;
  }

  return {
    timestamp: new Date().toISOString(),
    data: backup,
    recordCounts: Object.fromEntries(tables.map(t => [t, backup[t].length]))
  };
}

module.exports = { getBackupData };
