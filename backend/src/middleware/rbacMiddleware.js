function requirePermission(moduleId, action) {
  return async (req, res, next) => {
    try {
      const { user } = req;
      if (!user || !user.id) {
        return res.status(403).json({ error: 'Usuario no autenticado' });
      }

      // Regla BR-SEC-01: administrador raíz tiene acceso irrestricto
      if (user.esAdministradorRaiz === true || user.esAdministradorRaiz === 1) {
        return next();
      }

      const { getPool } = require('../config/db');
      const pool = await getPool();
      const result = await pool.request()
        .input('usuarioId', user.id)
        .input('moduloId', moduleId)
        .query(`
          SELECT puede_ver, puede_crear, puede_editar, puede_eliminar
          FROM permisos_usuario
          WHERE usuario_id = @usuarioId AND modulo_id = @moduloId
        `);

      if (result.recordset.length === 0) {
        return res.status(403).json({ error: 'No tiene permisos para este módulo' });
      }

      const permiso = result.recordset[0];
      const permitido = {
        view: permiso.puede_ver === 1,
        create: permiso.puede_crear === 1,
        edit: permiso.puede_editar === 1,
        delete: permiso.puede_eliminar === 1
      }[action];

      if (!permitido) {
        return res.status(403).json({ error: `No tiene permiso de ${action} en el módulo ${moduleId}` });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al validar permisos' });
    }
  };
}

module.exports = { requirePermission };
