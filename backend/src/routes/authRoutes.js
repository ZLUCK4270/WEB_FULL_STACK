const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { login, me } = require('../controllers/authController');

router.post('/login', login);
router.get('/me', authenticateToken, me);
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Sesión cerrada' });
});

module.exports = router;
