const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { listCustomers, createCustomer, getCustomer } = require('../controllers/customersController');

router.get('/', authenticateToken, requirePermission('customers', 'view'), listCustomers);
router.post('/', authenticateToken, requirePermission('customers', 'create'), createCustomer);
router.get('/:id', authenticateToken, requirePermission('customers', 'view'), getCustomer);

module.exports = router;
