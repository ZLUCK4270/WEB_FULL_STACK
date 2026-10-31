const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  getCurrentShift,
  openCashRegister,
  createMovement,
  closeCashRegister,
  getShiftHistory
} = require('../controllers/cashController');

router.get('/current', authenticateToken, requirePermission('cash', 'view'), getCurrentShift);
router.post('/open', authenticateToken, requirePermission('cash', 'create'), openCashRegister);
router.post('/movements', authenticateToken, requirePermission('cash', 'create'), createMovement);
router.post('/close', authenticateToken, requirePermission('cash', 'edit'), closeCashRegister);
router.get('/history', authenticateToken, requirePermission('cash', 'view'), getShiftHistory);

module.exports = router;
