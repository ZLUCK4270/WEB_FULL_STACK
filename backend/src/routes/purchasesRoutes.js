const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { listPurchases, createPurchase, receivePurchase } = require('../controllers/purchasesController');

router.get('/', authenticateToken, requirePermission('purchases', 'view'), listPurchases);
router.post('/', authenticateToken, requirePermission('purchases', 'create'), createPurchase);
router.post('/:purchaseId/receive', authenticateToken, requirePermission('purchases', 'edit'), receivePurchase);

module.exports = router;
