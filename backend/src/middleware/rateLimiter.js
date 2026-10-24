/**
 * Rate limiter en memoria (sin dependencias externas).
 * Protege el endpoint de login contra fuerza bruta y enumeración de credenciales.
 *
 * Configuración: máximo 5 intentos por ventana de 15 minutos por identificador.
 * El identificador combina DNI enviado + IP del cliente.
 */
const windows = new Map();

const DEFAULT_MAX = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos

function cleanupOldWindows() {
  const now = Date.now();
  for (const [key, record] of windows.entries()) {
    if (now > record.resetAt + DEFAULT_WINDOW_MS) {
      windows.delete(key);
    }
  }
}
// Limpieza periódica para no crecer la memoria indefinidamente.
setInterval(cleanupOldWindows, 60 * 60 * 1000);

/**
 * Middleware de rate limiting para rutas de autenticación.
 */
function rateLimiter({ maxRequests = DEFAULT_MAX, windowMs = DEFAULT_WINDOW_MS } = {}) {
  return (req, res, next) => {
    const dni = req.body && req.body.dni ? String(req.body.dni).trim() : 'anonimo';
    const ip = req.ip || req.connection && req.connection.remoteAddress || 'desconocida';
    const key = `${dni}:${ip}`;
    const now = Date.now();

    let record = windows.get(key);
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
      windows.set(key, record);
    }

    record.count += 1;
    const remaining = Math.max(0, maxRequests - record.count);

    res.setHeader('RateLimit-Limit', maxRequests);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('Retry-After', Math.floor(windowMs / 1000));

    if (record.count > maxRequests) {
      return res.status(429).json({
        error: 'Demasiados intentos de acceso. Intente nuevamente en 15 minutos.',
        retryAfter: Math.ceil((record.resetAt - now) / 1000)
      });
    }

    next();
  };
}

module.exports = { rateLimiter };
