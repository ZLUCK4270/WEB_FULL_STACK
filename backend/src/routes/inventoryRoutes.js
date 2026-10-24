const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { listProducts, listBatches, getProductStock } = require('../controllers/inventoryController');

router.get('/products', authenticateToken, requirePermission('inventory', 'view'), listProducts);
router.get('/batches', authenticateToken, requirePermission('inventory', 'view'), listBatches);
router.get('/products/:productId/stock', authenticateToken, requirePermission('inventory', 'view'), getProductStock);

module.exports = router;
