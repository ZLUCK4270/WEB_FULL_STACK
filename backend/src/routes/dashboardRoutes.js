const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { getStats } = require('../controllers/dashboardController');

router.get('/stats', authenticateToken, getStats);

module.exports = router;
