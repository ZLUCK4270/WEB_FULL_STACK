const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  listPurchases,
  getPurchase,
  createPurchase,
  receivePurchase,
  getReplenishmentSuggestions,
  generatePurchaseOrders
} = require('../controllers/purchasesController');

router.get('/replenishment/suggestions', authenticateToken, requirePermission('purchases', 'view'), getReplenishmentSuggestions);
router.post('/replenishment/generate-orders', authenticateToken, requirePermission('purchases', 'create'), generatePurchaseOrders);

router.get('/', authenticateToken, requirePermission('purchases', 'view'), listPurchases);
router.post('/', authenticateToken, requirePermission('purchases', 'create'), createPurchase);
router.get('/:id', authenticateToken, requirePermission('purchases', 'view'), getPurchase);
router.post('/:id/receive', authenticateToken, requirePermission('purchases', 'edit'), receivePurchase);

module.exports = router;

