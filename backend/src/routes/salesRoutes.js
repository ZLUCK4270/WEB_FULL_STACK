const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { createSale, listSales } = require('../controllers/salesController');

router.post('/', authenticateToken, requirePermission('pos_sales', 'create'), createSale);
router.get('/', authenticateToken, requirePermission('pos_sales', 'view'), listSales);

module.exports = router;
