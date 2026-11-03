const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  listUsers,
  getUser,
  createUser,
  updateUser,
  toggleUserStatus
} = require('../controllers/usersController');

// Middleware para verificar que el usuario autenticado sea Administrador
function requireAdminRole(req, res, next) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  const isRootAdmin = user.esAdministradorRaiz === true || user.esAdministradorRaiz === 1 || user.isRootAdmin === true;
  const role = String(user.role || user.rol || '').toLowerCase();

  if (isRootAdmin || role === 'admin') {
    return next();
  }

  return res.status(403).json({
    error: 'Acceso restringido: Se requieren privilegios de Administrador General / Regente para gestionar usuarios y roles'
  });
}

// Todas las rutas de usuarios requieren autenticación y rol de Administrador
router.use(authenticateToken, requireAdminRole);

router.get('/', listUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/status', toggleUserStatus);

module.exports = router;

