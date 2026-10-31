const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  listProducts,
  listBatches,
  createBatch,
  getProductStock,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getKardex,
  getSubstitutes,
  listCategories,
  listLaboratories,
  listSuppliers
} = require('../controllers/inventoryController');

router.get('/products', authenticateToken, requirePermission('inventory', 'view'), listProducts);
router.post('/products', authenticateToken, requirePermission('inventory', 'create'), createProduct);
router.put('/products/:id', authenticateToken, requirePermission('inventory', 'edit'), updateProduct);
router.delete('/products/:id', authenticateToken, requirePermission('inventory', 'delete'), deleteProduct);
router.get('/products/:productId/stock', authenticateToken, requirePermission('inventory', 'view'), getProductStock);
router.get('/products/:id/substitutes', authenticateToken, requirePermission('pos_sales', 'view'), getSubstitutes);
router.get('/batches', authenticateToken, requirePermission('inventory', 'view'), listBatches);
router.post('/batches', authenticateToken, requirePermission('inventory', 'create'), createBatch);
router.post('/adjust-stock', authenticateToken, requirePermission('inventory', 'edit'), adjustStock);
router.get('/kardex', authenticateToken, requirePermission('inventory', 'view'), getKardex);
router.get('/categories', authenticateToken, listCategories);
router.get('/laboratories', authenticateToken, listLaboratories);
router.get('/suppliers', authenticateToken, listSuppliers);

module.exports = router;
