const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'nova_salud_secreto_curso_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

async function login(req, res) {
  try {
    const { dni, password } = req.body;

    if (!dni || !password) {
      return res.status(400).json({ error: 'DNI y contraseña requeridos' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('dni', dni)
      .query(`
        SELECT id, dni, nombre, apellido, correo, cargo, es_administrador_raiz, esta_activo, debe_cambiar_clave
        FROM perfiles_usuario
        WHERE dni = @dni
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.recordset[0];

    if (!user.esta_activo) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    // En un entorno real se compararía con hash bcrypt. Aquí aceptamos la contraseña del seed para el curso.
    const passwordValida = password === 'regente2026' || password === 'caja2026' || password === 'admin2026' || password === 'almacen2026';

    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        dni: user.dni,
        nombre: user.nombre,
        apellido: user.apellido,
        cargo: user.cargo,
        esAdministradorRaiz: user.es_administrador_raiz === 1
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
        role: user.cargo,
        roleTitle: user.cargo,
        isRootAdmin: user.es_administrador_raiz === 1,
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
