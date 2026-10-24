const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { openCashRegister, closeCashRegister } = require('../controllers/cashController');

router.post('/open', authenticateToken, requirePermission('cash', 'create'), openCashRegister);
router.post('/close', authenticateToken, requirePermission('cash', 'edit'), closeCashRegister);

module.exports = router;
