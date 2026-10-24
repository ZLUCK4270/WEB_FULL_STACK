const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'nova_salud_secreto_curso_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Mapea el cargo almacenado en BD a los roles de negocio del caso.
 * admin: acceso total. vendedor: punto de venta, clientes, lecturas.
 * almacen: inventario y compras (rol existente de la aplicación).
 */
function mapRole(cargo, esAdministradorRaiz) {
  if (esAdministradorRaiz === 1 || esAdministradorRaiz === true) {
    return 'admin';
  }
  const c = String(cargo || '').toLowerCase();
  if (c.includes('cajero') || c.includes('vendedor') || c.includes('mostrador')) {
    return 'vendedor';
  }
  if (c.includes('almac')) {
    return 'almacen';
  }
  return 'vendedor';
}

async function login(req, res) {
  try {
    const dni = String(req.body.dni || '').trim();
    const password = req.body.password || '';

    if (!dni || !password) {
      return res.status(400).json({ error: 'DNI y contraseña requeridos' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('dni', dni)
      .query(`
        SELECT id, dni, nombre, apellido, correo, cargo, es_administrador_raiz,
               esta_activo, password_hash, debe_cambiar_clave
        FROM perfiles_usuario
        WHERE dni = @dni
      `);

    if (result.recordset.length === 0) {
      // Mensaje genérico: no revelar si el DNI existe o no.
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.recordset[0];

    if (!user.esta_activo) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    if (!user.password_hash) {
      return res.status(500).json({
        error: 'Cuenta sin contraseña configurada. Ejecutar database/03_migration.sql y 03_seed_auth.sql'
      });
    }

    // Comparación contra hash bcrypt (nunca texto plano).
    const passwordValida = await bcrypt.compare(password, user.password_hash);

    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const role = mapRole(user.cargo, user.es_administrador_raiz);
    const isRootAdmin = user.es_administrador_raiz === 1 || user.es_administrador_raiz === true;

    const token = jwt.sign(
      {
        id: user.id,
        dni: user.dni,
        nombre: user.nombre,
        apellido: user.apellido,
        cargo: user.cargo,
        role,
        esAdministradorRaiz: isRootAdmin
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Actualizar último acceso
    await pool.request()
      .input('id', user.id)
      .query(`
        UPDATE perfiles_usuario
        SET ultimo_acceso = SYSDATETIME(), fecha_actualizacion = SYSDATETIME()
        WHERE id = @id
      `);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        dni: user.dni,
        name: `${user.nombre} ${user.apellido}`,
        role,
        roleTitle: user.cargo,
        isRootAdmin,
        mustChangePassword: user.debe_cambiar_clave === 1
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

async function me(req, res) {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
}

module.exports = { login, me };
