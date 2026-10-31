const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { createSale, voidSale, listSales, getSale } = require('../controllers/salesController');

router.post('/', authenticateToken, requirePermission('pos_sales', 'create'), createSale);
router.post('/:id/void', authenticateToken, requirePermission('pos_sales', 'delete'), voidSale);
router.get('/', authenticateToken, requirePermission('pos_sales', 'view'), listSales);
router.get('/:id', authenticateToken, requirePermission('pos_sales', 'view'), getSale);

module.exports = router;
