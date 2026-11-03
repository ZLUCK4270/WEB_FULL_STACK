const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/db');

function mapRole(cargo, esAdministradorRaiz) {
  if (esAdministradorRaiz === 1 || esAdministradorRaiz === true) return 'admin';
  const c = String(cargo || '').toLowerCase();
  if (c.includes('admin') || c.includes('regente') || c.includes('quimico') || c.includes('químico')) return 'admin';
  if (c.includes('almac')) return 'almacen';
  if (c.includes('cajero') || c.includes('vendedor') || c.includes('mostrador')) return 'vendedor';
  return 'vendedor';
}

function buildDefaultPermissions(userId, role) {
  const perms = [];
  if (role === 'admin') {
    const modules = ['dashboard', 'pos_sales', 'inventory', 'cash', 'purchases', 'alerts', 'customers', 'staff', 'audit', 'backups'];
    modules.forEach((mod) => {
      perms.push({
        id: uuidv4(),
        usuario_id: userId,
        modulo_id: mod,
        puede_ver: 1,
        puede_crear: 1,
        puede_editar: 1,
        puede_eliminar: 1
      });
    });
  } else if (role === 'vendedor') {
    perms.push(
      { id: uuidv4(), usuario_id: userId, modulo_id: 'dashboard', puede_ver: 1, puede_crear: 0, puede_editar: 0, puede_eliminar: 0 },
      { id: uuidv4(), usuario_id: userId, modulo_id: 'pos_sales', puede_ver: 1, puede_crear: 1, puede_editar: 1, puede_eliminar: 1 },
      { id: uuidv4(), usuario_id: userId, modulo_id: 'customers', puede_ver: 1, puede_crear: 1, puede_editar: 1, puede_eliminar: 0 },
      { id: uuidv4(), usuario_id: userId, modulo_id: 'inventory', puede_ver: 1, puede_crear: 0, puede_editar: 0, puede_eliminar: 0 },
      { id: uuidv4(), usuario_id: userId, modulo_id: 'cash', puede_ver: 1, puede_crear: 1, puede_editar: 1, puede_eliminar: 0 },
      { id: uuidv4(), usuario_id: userId, modulo_id: 'alerts', puede_ver: 1, puede_crear: 1, puede_editar: 1, puede_eliminar: 0 }
    );
  } else if (role === 'almacen') {
    perms.push(
      { id: uuidv4(), usuario_id: userId, modulo_id: 'dashboard', puede_ver: 1, puede_crear: 0, puede_editar: 0, puede_eliminar: 0 },
      { id: uuidv4(), usuario_id: userId, modulo_id: 'inventory', puede_ver: 1, puede_crear: 1, puede_editar: 1, puede_eliminar: 1 },
      { id: uuidv4(), usuario_id: userId, modulo_id: 'purchases', puede_ver: 1, puede_crear: 1, puede_editar: 1, puede_eliminar: 1 },
      { id: uuidv4(), usuario_id: userId, modulo_id: 'alerts', puede_ver: 1, puede_crear: 1, puede_editar: 1, puede_eliminar: 1 }
    );
  }
  return perms;
}

async function listUsers(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM perfiles_usuario');
    const users = (result.recordset || []).map((u) => {
      const isRootAdmin = u.es_administrador_raiz === 1 || u.es_administrador_raiz === true;
      const role = mapRole(u.cargo, isRootAdmin);
      const { password_hash, ...safeUser } = u;
      return {
        ...safeUser,
        name: `${u.nombre} ${u.apellido}`.trim(),
        role,
        rol: role,
        roleTitle: u.cargo,
        isRootAdmin,
        esAdministradorRaiz: isRootAdmin,
        esta_activo: u.esta_activo === 1 || u.esta_activo === true
      };
    });

    res.json({ success: true, users });
  } catch (error) {
    console.error('Error listUsers:', error);
    res.status(500).json({ error: 'Error al listar usuarios del sistema' });
  }
}

async function getUser(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const userResult = await pool.request()
      .input('id', id)
      .query('SELECT * FROM perfiles_usuario WHERE id = @id');

    if (!userResult.recordset || userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const u = userResult.recordset[0];
    const isRootAdmin = u.es_administrador_raiz === 1 || u.es_administrador_raiz === true;
    const role = mapRole(u.cargo, isRootAdmin);
    const { password_hash, ...safeUser } = u;

    const permsResult = await pool.request()
      .input('usuarioId', id)
      .query('SELECT * FROM permisos_usuario WHERE usuario_id = @usuarioId');

    res.json({
      success: true,
      user: {
        ...safeUser,
        name: `${u.nombre} ${u.apellido}`.trim(),
        role,
        roleTitle: u.cargo,
        isRootAdmin,
        permissions: permsResult.recordset || []
      }
    });
  } catch (error) {
    console.error('Error getUser:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
}

async function createUser(req, res) {
  try {
    const { dni, nombre, apellido, correo, telefono, cargo, role, password, esta_activo } = req.body;

    if (!dni || !String(dni).trim()) {
      return res.status(400).json({ error: 'El DNI es obligatorio' });
    }
    const cleanDni = String(dni).trim();
    if (!/^\d{8}$/.test(cleanDni)) {
      return res.status(400).json({ error: 'El DNI debe contener exactamente 8 dígitos numéricos' });
    }

    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    if (!apellido || !String(apellido).trim()) {
      return res.status(400).json({ error: 'El apellido es obligatorio' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const pool = await getPool();

    // Validar si DNI ya existe
    const existing = await pool.request()
      .input('dni', cleanDni)
      .query('SELECT id FROM perfiles_usuario WHERE dni = @dni');

    if (existing.recordset && existing.recordset.length > 0) {
      return res.status(409).json({ error: `Ya existe un usuario registrado con el DNI ${cleanDni}` });
    }

    const normalizedRole = ['admin', 'vendedor', 'almacen'].includes(role) ? role : 'vendedor';
    const isRootAdmin = normalizedRole === 'admin';

    let resolvedCargo = (cargo && String(cargo).trim()) || '';
    if (!resolvedCargo) {
      if (normalizedRole === 'admin') resolvedCargo = 'Q.F. Regente / Administrador General';
      else if (normalizedRole === 'almacen') resolvedCargo = 'Encargado de Almacén y Control BPA';
      else resolvedCargo = 'Técnico en Farmacia / Cajero POS';
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const isActive = esta_activo !== undefined ? (esta_activo ? 1 : 0) : 1;

    await pool.request()
      .input('id', userId)
      .input('dni', cleanDni)
      .input('nombre', String(nombre).trim())
      .input('apellido', String(apellido).trim())
      .input('correo', correo ? String(correo).trim() : null)
      .input('telefono', telefono ? String(telefono).trim() : null)
      .input('cargo', resolvedCargo)
      .input('es_administrador_raiz', isRootAdmin ? 1 : 0)
      .input('esta_activo', isActive)
      .input('debe_cambiar_clave', 0)
      .input('password_hash', passwordHash)
      .query(`
        INSERT INTO perfiles_usuario (
          id, dni, nombre, apellido, correo, telefono, cargo,
          es_administrador_raiz, esta_activo, debe_cambiar_clave, password_hash
        ) VALUES (
          @id, @dni, @nombre, @apellido, @correo, @telefono, @cargo,
          @es_administrador_raiz, @esta_activo, @debe_cambiar_clave, @password_hash
        )
      `);

    // Asignar permisos según rango/rol
    const defaultPerms = buildDefaultPermissions(userId, normalizedRole);
    for (const p of defaultPerms) {
      await pool.request()
        .input('id', p.id)
        .input('usuarioId', p.usuario_id)
        .input('moduloId', p.modulo_id)
        .input('puede_ver', p.puede_ver)
        .input('puede_crear', p.puede_crear)
        .input('puede_editar', p.puede_editar)
        .input('puede_eliminar', p.puede_eliminar)
        .query(`
          INSERT INTO permisos_usuario (id, usuario_id, modulo_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
          VALUES (@id, @usuarioId, @moduloId, @puede_ver, @puede_crear, @puede_editar, @puede_eliminar)
        `);
    }

    // Auditoría
    try {
      await pool.request()
        .input('usuarioId', req.user?.id || userId)
        .input('accion', 'CREAR_USUARIO')
        .input('modulo', 'staff')
        .input('datosNuevos', JSON.stringify({ dni: cleanDni, nombre, apellido, cargo: resolvedCargo, role: normalizedRole }))
        .query(`
          INSERT INTO registros_auditoria_sistema (id, usuario_id, accion, modulo, datos_nuevos)
          VALUES (NEWID(), @usuarioId, @accion, @modulo, @datosNuevos)
        `);
    } catch (_auditErr) {
      // Ignorar si auditoría falla
    }

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: userId,
        dni: cleanDni,
        nombre: String(nombre).trim(),
        apellido: String(apellido).trim(),
        name: `${nombre} ${apellido}`.trim(),
        correo: correo || null,
        telefono: telefono || null,
        cargo: resolvedCargo,
        role: normalizedRole,
        rol: normalizedRole,
        roleTitle: resolvedCargo,
        isRootAdmin,
        esAdministradorRaiz: isRootAdmin,
        esta_activo: Boolean(isActive)
      }
    });
  } catch (error) {
    console.error('Error createUser:', error);
    res.status(500).json({ error: error.message || 'Error al registrar nuevo usuario' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { nombre, apellido, correo, telefono, cargo, role, password, esta_activo } = req.body;

    const pool = await getPool();
    const existingResult = await pool.request()
      .input('id', id)
      .query('SELECT * FROM perfiles_usuario WHERE id = @id');

    if (!existingResult.recordset || existingResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const current = existingResult.recordset[0];

    // Protección: no desactivar ni quitar rol de admin al último administrador activo
    if (current.es_administrador_raiz === 1 && (esta_activo === false || (role && role !== 'admin'))) {
      const allUsersResult = await pool.request().query('SELECT * FROM perfiles_usuario');
      const activeAdmins = (allUsersResult.recordset || []).filter(
        (u) => (u.es_administrador_raiz === 1 || u.es_administrador_raiz === true) && (u.esta_activo === 1 || u.esta_activo === true) && u.id !== id
      );
      if (activeAdmins.length === 0) {
        return res.status(400).json({
          error: 'No se puede desactivar ni revocar privilegios al único Administrador General activo del sistema'
        });
      }
    }

    const isCurrentAdmin = current.es_administrador_raiz === 1 || current.es_administrador_raiz === true;
    let newIsRootAdmin = isCurrentAdmin;
    let newRole = mapRole(current.cargo, isCurrentAdmin);

    if (role && ['admin', 'vendedor', 'almacen'].includes(role)) {
      newRole = role;
      newIsRootAdmin = role === 'admin';
    }

    let resolvedCargo = cargo !== undefined ? String(cargo).trim() : current.cargo;
    if (role && !cargo) {
      if (role === 'admin') resolvedCargo = 'Q.F. Regente / Administrador General';
      else if (role === 'almacen') resolvedCargo = 'Encargado de Almacén y Control BPA';
      else resolvedCargo = 'Técnico en Farmacia / Cajero POS';
    }

    const updateRequest = pool.request()
      .input('id', id)
      .input('nombre', nombre !== undefined ? String(nombre).trim() : current.nombre)
      .input('apellido', apellido !== undefined ? String(apellido).trim() : current.apellido)
      .input('correo', correo !== undefined ? (correo ? String(correo).trim() : null) : current.correo)
      .input('telefono', telefono !== undefined ? (telefono ? String(telefono).trim() : null) : current.telefono)
      .input('cargo', resolvedCargo)
      .input('es_administrador_raiz', newIsRootAdmin ? 1 : 0)
      .input('esta_activo', esta_activo !== undefined ? (esta_activo ? 1 : 0) : current.esta_activo);

    if (password && String(password).trim().length >= 6) {
      const newHash = await bcrypt.hash(String(password).trim(), 10);
      updateRequest.input('password_hash', newHash);
      await updateRequest.query(`
        UPDATE perfiles_usuario
        SET nombre = @nombre, apellido = @apellido, correo = @correo,
            telefono = @telefono, cargo = @cargo, es_administrador_raiz = @es_administrador_raiz,
            esta_activo = @esta_activo, password_hash = @password_hash, fecha_actualizacion = SYSDATETIME()
        WHERE id = @id
      `);
    } else {
      await updateRequest.query(`
        UPDATE perfiles_usuario
        SET nombre = @nombre, apellido = @apellido, correo = @correo,
            telefono = @telefono, cargo = @cargo, es_administrador_raiz = @es_administrador_raiz,
            esta_activo = @esta_activo, fecha_actualizacion = SYSDATETIME()
        WHERE id = @id
      `);
    }

    // Actualizar permisos si cambió de rol
    if (role && ['admin', 'vendedor', 'almacen'].includes(role)) {
      await pool.request()
        .input('usuarioId', id)
        .query('DELETE FROM permisos_usuario WHERE usuario_id = @usuarioId');

      const newPerms = buildDefaultPermissions(id, newRole);
      for (const p of newPerms) {
        await pool.request()
          .input('id', p.id)
          .input('usuarioId', p.usuario_id)
          .input('moduloId', p.modulo_id)
          .input('puede_ver', p.puede_ver)
          .input('puede_crear', p.puede_crear)
          .input('puede_editar', p.puede_editar)
          .input('puede_eliminar', p.puede_eliminar)
          .query(`
            INSERT INTO permisos_usuario (id, usuario_id, modulo_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
            VALUES (@id, @usuarioId, @moduloId, @puede_ver, @puede_crear, @puede_editar, @puede_eliminar)
          `);
      }
    }

    // Auditoría
    try {
      await pool.request()
        .input('usuarioId', req.user?.id || id)
        .input('accion', 'ACTUALIZAR_USUARIO')
        .input('modulo', 'staff')
        .input('datosNuevos', JSON.stringify({ id, cargo: resolvedCargo, role: newRole, esta_activo }))
        .query(`
          INSERT INTO registros_auditoria_sistema (id, usuario_id, accion, modulo, datos_nuevos)
          VALUES (NEWID(), @usuarioId, @accion, @modulo, @datosNuevos)
        `);
    } catch (_auditErr) {}

    res.json({
      success: true,
      message: 'Usuario actualizado correctamente',
      user: {
        id,
        dni: current.dni,
        nombre: nombre !== undefined ? String(nombre).trim() : current.nombre,
        apellido: apellido !== undefined ? String(apellido).trim() : current.apellido,
        name: `${nombre || current.nombre} ${apellido || current.apellido}`.trim(),
        correo: correo !== undefined ? correo : current.correo,
        telefono: telefono !== undefined ? telefono : current.telefono,
        cargo: resolvedCargo,
        role: newRole,
        rol: newRole,
        roleTitle: resolvedCargo,
        isRootAdmin: newIsRootAdmin,
        esAdministradorRaiz: newIsRootAdmin,
        esta_activo: esta_activo !== undefined ? Boolean(esta_activo) : Boolean(current.esta_activo)
      }
    });
  } catch (error) {
    console.error('Error updateUser:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar usuario' });
  }
}

async function toggleUserStatus(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const userResult = await pool.request()
      .input('id', id)
      .query('SELECT * FROM perfiles_usuario WHERE id = @id');

    if (!userResult.recordset || userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userResult.recordset[0];
    const newStatus = user.esta_activo === 1 ? 0 : 1;

    // Validación: si es admin y se va a desactivar
    if (newStatus === 0 && (user.es_administrador_raiz === 1 || user.es_administrador_raiz === true)) {
      const allUsersResult = await pool.request().query('SELECT * FROM perfiles_usuario');
      const activeAdmins = (allUsersResult.recordset || []).filter(
        (u) => (u.es_administrador_raiz === 1 || u.es_administrador_raiz === true) && (u.esta_activo === 1 || u.esta_activo === true) && u.id !== id
      );
      if (activeAdmins.length === 0) {
        return res.status(400).json({
          error: 'No se puede desactivar al único Administrador General activo'
        });
      }
    }

    await pool.request()
      .input('id', id)
      .input('esta_activo', newStatus)
      .query('UPDATE perfiles_usuario SET esta_activo = @esta_activo, fecha_actualizacion = SYSDATETIME() WHERE id = @id');

    try {
      await pool.request()
        .input('usuarioId', req.user?.id || id)
        .input('accion', newStatus === 1 ? 'ACTIVAR_USUARIO' : 'DESACTIVAR_USUARIO')
        .input('modulo', 'staff')
        .input('datosNuevos', JSON.stringify({ id, dni: user.dni, nuevo_estado: newStatus }))
        .query(`
          INSERT INTO registros_auditoria_sistema (id, usuario_id, accion, modulo, datos_nuevos)
          VALUES (NEWID(), @usuarioId, @accion, @modulo, @datosNuevos)
        `);
    } catch (_auditErr) {}

    res.json({
      success: true,
      message: newStatus === 1 ? 'Usuario activado' : 'Usuario desactivado',
      esta_activo: newStatus === 1
    });
  } catch (error) {
    console.error('Error toggleUserStatus:', error);
    res.status(500).json({ error: 'Error al cambiar estado del usuario' });
  }
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  toggleUserStatus,
  mapRole
};

