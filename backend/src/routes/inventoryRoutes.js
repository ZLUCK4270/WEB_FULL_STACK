const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { listProducts, listBatches, getProductStock, createProduct, updateProduct, deleteProduct, adjustStock } = require('../controllers/inventoryController');

router.get('/products', authenticateToken, requirePermission('inventory', 'view'), listProducts);
router.post('/products', authenticateToken, requirePermission('inventory', 'create'), createProduct);
router.put('/products/:id', authenticateToken, requirePermission('inventory', 'edit'), updateProduct);
router.delete('/products/:id', authenticateToken, requirePermission('inventory', 'delete'), deleteProduct);
router.get('/products/:productId/stock', authenticateToken, requirePermission('inventory', 'view'), getProductStock);
router.get('/batches', authenticateToken, requirePermission('inventory', 'view'), listBatches);
router.post('/adjust-stock', authenticateToken, requirePermission('inventory', 'edit'), adjustStock);

module.exports = router;
