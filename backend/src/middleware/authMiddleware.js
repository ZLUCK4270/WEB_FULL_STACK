const jwt = require('jsonwebtoken');

function getJwtSecret() {
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.warn('[SECURITY WARNING] JWT_SECRET no definido en entorno de producción.');
  }
  return process.env.JWT_SECRET || 'nova_salud_secreto_curso_2026';
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  const secret = getJwtSecret();

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken, getJwtSecret };
