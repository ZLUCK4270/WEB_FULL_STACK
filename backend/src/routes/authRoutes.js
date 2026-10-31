const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { rateLimiter } = require('../middleware/rateLimiter');
const { login, me } = require('../controllers/authController');

// Login con rate limit (anti fuerza bruta).
router.post('/login', rateLimiter({ maxRequests: 100, windowMs: 15 * 60 * 1000 }), login);
router.get('/me', authenticateToken, me);
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Sesión cerrada' });
});

module.exports = router;
